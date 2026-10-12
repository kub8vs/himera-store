// Renders the Shopify theme into a static preview (dist/) for Vercel.
// The theme itself (layout/, sections/, snippets/, templates/, assets/, config/, locales/)
// is uploaded to Shopify unchanged; this script only mimics the Shopify objects and filters
// the theme uses, with mock store data from preview/data.json.
import { Liquid, Tag, Hash } from 'liquidjs';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const DIST = path.join(ROOT, 'dist');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const readJson = (p) => JSON.parse(read(p).replace(/^\s*\/\*[\s\S]*?\*\/\s*/, ''));

const data = readJson('preview/data.json');
const locale = readJson('locales/pl.default.json');

// ---------- settings from config ----------
const settings = {};
for (const group of readJson('config/settings_schema.json')) {
  for (const s of group.settings || []) if (s.id && 'default' in s) settings[s.id] = s.default;
}
Object.assign(settings, readJson('config/settings_data.json').current || {});

// ---------- money & helpers ----------
const money = (cents) => {
  const v = (Number(cents) || 0) / 100;
  return v.toFixed(2).replace('.', ',') + ' zł';
};
const kw = (args) => Object.fromEntries(args.filter(Array.isArray));
const lookup = (obj, key) => key.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);

// ---------- products / collections ----------
const products = data.products.map((p) => ({
  ...p,
  url: `/products/${p.handle}`,
  price: p.price,
  compare_at_price: p.compare_at_price || null,
  available: p.available !== false,
  featured_image: p.images[0],
  featured_media: p.images[0],
  media: p.images,
  first_available_variant: { id: p.id * 10 },
  selected_or_first_available_variant: { id: p.id * 10, available: p.available !== false },
  variants: [{ id: p.id * 10, title: 'Default Title', available: p.available !== false, price: p.price }],
  has_only_default_variant: true,
  metafields: { custom: { showcase_image: p.showcase ? { value: { src: p.showcase, alt: p.title, width: 1200, height: 1200 } } : null, code: { value: p.code }, short_title: p.short ? { value: p.short } : null } },
}));
const collections = {};
for (const c of data.collections) {
  const items = c.handles === '*' ? products : products.filter((p) => c.handles.includes(p.handle));
  collections[c.handle] = { ...c, url: `/collections/${c.handle}`, products: items, products_count: items.length, all_products_count: items.length };
}

const linklists = {};
for (const [handle, links] of Object.entries(data.menus)) linklists[handle] = { handle, links: links.map((l) => ({ ...l, active: false, links: [] })) };

const globals = {
  shop: { name: 'HIMERA', url: '/', currency: 'PLN', email: data.shop.email },
  settings,
  routes: { root_url: '/', cart_url: '/cart', cart_add_url: '/cart/add', collections_url: '/collections', all_products_collection_url: '/collections/all', search_url: '/search', account_url: '#', account_login_url: '#' },
  cart: { item_count: 0, items: [], total_price: 0 },
  collections,
  all_products: Object.fromEntries(products.map((p) => [p.handle, p])),
  linklists,
  localization: { language: { iso_code: 'pl' } },
  content_for_header: '',
  powered_by_link: '',
  preview: true,
};

// ---------- liquid engine ----------
const engine = new Liquid({ root: [path.join(ROOT, 'snippets')], partials: path.join(ROOT, 'snippets'), extname: '.liquid', strictFilters: false, strictVariables: false, outputEscape: undefined, jsTruthy: false });

const raw = (name, wrap) => engine.registerTag(name, class extends Tag {
  constructor(token, remain, liquid) {
    super(token, remain, liquid);
    this.body = [];
    let t;
    while ((t = remain.shift())) {
      if (t.name === 'end' + name) return;
      this.body.push(t.getText());
    }
    throw new Error(`tag ${name} not closed`);
  }
  * render() { return wrap(this.body.join('')); }
});
raw('schema', () => '');
raw('style', (b) => `<style>${b}</style>`);
raw('stylesheet', (b) => `<style>${b}</style>`);
raw('javascript', (b) => `<script>${b}</script>`);

// {% form 'product', product, id: 'x', class: 'y' %} ... {% endform %}
engine.registerTag('form', class extends Tag {
  constructor(token, remain, liquid) {
    super(token, remain, liquid);
    this.args = token.args;
    this.tpls = [];
    const stream = liquid.parser.parseStream(remain)
      .on('tag:endform', () => stream.stop())
      .on('template', (tpl) => this.tpls.push(tpl))
      .on('end', () => { throw new Error('form not closed'); });
    stream.start();
    this.hash = new Hash(this.args.replace(/^['"][^'"]+['"]\s*,?\s*(?:[\w.]+(?=\s*,|\s*$))?\s*,?/, ''));
    this.type = (this.args.match(/^['"]([^'"]+)['"]/) || [])[1];
  }
  * render(ctx, emitter) {
    const h = yield this.hash.render(ctx);
    const action = { product: '/cart/add', customer: '/contact#newsletter', contact: '/contact' }[this.type] || '#';
    emitter.write(`<form method="post" action="${action}" accept-charset="UTF-8"${h.id ? ` id="${h.id}"` : ''}${h.class ? ` class="${h.class}"` : ''}${h['data-type'] ? ` data-type="${h['data-type']}"` : ''}>`);
    emitter.write(`<input type="hidden" name="form_type" value="${this.type}">`);
    yield this.liquid.renderer.renderTemplates(this.tpls, ctx, emitter);
    emitter.write('</form>');
  }
});

// {% paginate x by n %} ... {% endpaginate %}
engine.registerTag('paginate', class extends Tag {
  constructor(token, remain, liquid) {
    super(token, remain, liquid);
    this.tpls = [];
    const stream = liquid.parser.parseStream(remain)
      .on('tag:endpaginate', () => stream.stop())
      .on('template', (tpl) => this.tpls.push(tpl))
      .on('end', () => { throw new Error('paginate not closed'); });
    stream.start();
  }
  * render(ctx, emitter) {
    ctx.push({ paginate: { pages: 1, current_page: 1, parts: [] } });
    yield this.liquid.renderer.renderTemplates(this.tpls, ctx, emitter);
    ctx.pop();
  }
});

const sectionDefaults = (name) => {
  const src = read(`sections/${name}.liquid`);
  const m = src.match(/{%-?\s*schema\s*-?%}([\s\S]*?){%-?\s*endschema\s*-?%}/);
  const schema = m ? JSON.parse(m[1]) : {};
  const s = {};
  for (const st of schema.settings || []) if (st.id && 'default' in st) s[st.id] = st.default;
  return { src, schema, settings: s };
};

let sectionSeq = 0;
async function renderSection(name, ctx, json = {}) {
  const { src, schema, settings: defs } = sectionDefaults(name);
  const id = json.id || `${name}-${++sectionSeq}`;
  const blocksOrder = json.block_order || Object.keys(json.blocks || {});
  const blocks = blocksOrder.map((bid) => {
    const b = json.blocks[bid];
    const bdef = (schema.blocks || []).find((x) => x.type === b.type) || {};
    const bs = {};
    for (const st of bdef.settings || []) if (st.id && 'default' in st) bs[st.id] = st.default;
    return { id: bid, type: b.type, settings: { ...bs, ...(b.settings || {}) }, shopify_attributes: '' };
  });
  const section = { id, settings: { ...defs, ...(json.settings || {}) }, blocks };
  // resolve collection/product settings to objects like Shopify does
  for (const st of schema.settings || []) {
    if (st.type === 'collection' && typeof section.settings[st.id] === 'string') section.settings[st.id] = collections[section.settings[st.id]] || collections.all;
    if (st.type === 'collection' && section.settings[st.id] == null) section.settings[st.id] = collections[(json.settings || {})[st.id]] || null;
  }
  const html = await engine.parseAndRender(src, { ...ctx, section });
  return `<div id="shopify-section-${id}" class="shopify-section section-${name}">${html}</div>`;
}

engine.registerTag('section', class extends Tag {
  constructor(token, remain, liquid) { super(token, remain, liquid); this.name = token.args.replace(/['"]/g, '').trim(); }
  * render(ctx, emitter) { emitter.write(yield renderSection(this.name, ctx.getAll())); }
});

// ---------- filters ----------
engine.registerFilter('asset_url', (n) => `/assets/${n}`);
engine.registerFilter('image_url', (img) => (img && typeof img === 'object' ? img.src : img) || '');
engine.registerFilter('img_url', (img) => (img && typeof img === 'object' ? img.src : img) || '');
engine.registerFilter('image_tag', (url, ...args) => {
  const o = kw(args);
  const attrs = Object.entries(o).filter(([k]) => !['widths', 'preload'].includes(k)).map(([k, v]) => `${k}="${String(v).replace(/"/g, '&quot;')}"`).join(' ');
  return `<img src="${url}" ${attrs}>`;
});
engine.registerFilter('money', money);
engine.registerFilter('money_with_currency', (c) => money(c) + ' PLN');
engine.registerFilter('money_without_trailing_zeros', (c) => money(c).replace(',00', ''));
engine.registerFilter('t', (key, ...args) => {
  const o = kw(args);
  let v = lookup(locale, key);
  if (v == null) return key;
  if (typeof v === 'object') v = o.count === 1 ? v.one : v.other;
  return String(v).replace(/{{\s*(\w+)\s*}}/g, (m, k) => (k in o ? o[k] : m));
});
engine.registerFilter('stylesheet_tag', (u) => `<link rel="stylesheet" href="${u}">`);
engine.registerFilter('script_tag', (u) => `<script src="${u}"></script>`);
engine.registerFilter('json', (v) => JSON.stringify(v));
engine.registerFilter('handleize', (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
engine.registerFilter('handle', (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-'));
engine.registerFilter('placeholder_svg_tag', () => '<svg viewBox="0 0 100 100" aria-hidden="true"><rect width="100" height="100" fill="#111"/></svg>');
engine.registerFilter('link_to', (t, u) => `<a href="${u}">${t}</a>`);
engine.registerFilter('within', (u) => u);
engine.registerFilter('preload_tag', () => '');
engine.registerFilter('font_url', () => '');
engine.registerFilter('payment_type_svg_tag', () => '');

// ---------- pages ----------
const layoutSrc = read('layout/theme.liquid');
async function renderPage(outFile, templateName, extra) {
  const ctx = { ...globals, ...extra, template: { name: templateName, suffix: null }, request: { page_type: templateName, path: extra.path || '/' } };
  const tpl = readJson(`templates/${templateName}.json`);
  let content = '';
  for (const key of tpl.order) {
    const s = tpl.sections[key];
    if (s.disabled) continue;
    content += await renderSection(s.type, ctx, { ...s, id: `template--${templateName}__${key}` });
  }
  const html = await engine.parseAndRender(layoutSrc, { ...ctx, content_for_layout: content });
  const file = path.join(DIST, outFile);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
  console.log('  ✓', outFile);
}

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });
fs.cpSync(path.join(ROOT, 'assets'), path.join(DIST, 'assets'), { recursive: true });
fs.cpSync(path.join(ROOT, 'preview/media'), path.join(DIST, 'media'), { recursive: true });

console.log('HIMERA preview →', DIST);
await renderPage('index.html', 'index', { page_title: 'HIMERA', path: '/' });
for (const c of Object.values(collections)) await renderPage(`collections/${c.handle}.html`, 'collection', { collection: c, page_title: c.title, path: c.url });
for (const p of products) await renderPage(`products/${p.handle}.html`, 'product', { product: p, page_title: p.title, path: p.url });
await renderPage('cart.html', 'cart', { page_title: 'Koszyk', path: '/cart' });
await renderPage('404.html', '404', { page_title: 'Nie znaleziono', path: '/404' });
fs.writeFileSync(path.join(DIST, 'sklep.html'), '<!doctype html><meta http-equiv="refresh" content="0;url=/collections/all"><link rel="canonical" href="/collections/all">');
