// Renders the Shopify theme into a static preview (dist/) for Vercel.
// The theme itself (layout/, sections/, snippets/, templates/, assets/, config/, locales/)
// is uploaded to Shopify unchanged; this script only mimics the Shopify objects and filters
// the theme uses, with mock store data from preview/data.json.
import { Liquid, Tag, Hash } from 'liquidjs';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

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
const img = (src, alt) => (src ? { src, alt, width: 1200, height: 1200 } : null);
const products = data.products.map((p) => {
  const vlist = p.variants && p.variants.length
    ? p.variants.map((v, k) => ({
      id: p.id * 10 + k, title: v.title, option1: v.title, available: v.available !== false, price: v.price || p.price,
      compare_at_price: p.compare_at_price || null,
      featured_image: img(v.image || p.images[0].src, `${p.title} ${v.title}`),
      metafields: { custom: { showcase_image: v.showcase || p.showcase ? { value: img(v.showcase || p.showcase, p.title) } : null } },
    }))
    : [{ id: p.id * 10, title: 'Default Title', option1: 'Default Title', available: p.available !== false, price: p.price, compare_at_price: p.compare_at_price || null, featured_image: p.images[0], metafields: { custom: {} } }];
  // a real colour option (even with one colour, like the black-only shirt) vs Shopify's single default variant
  const multi = vlist[0].title !== 'Default Title';
  const first = vlist.find((v) => v.available) || vlist[0];
  return {
    ...p,
    url: `/products/${p.handle}`,
    price: p.price,
    compare_at_price: p.compare_at_price || null,
    available: vlist.some((v) => v.available),
    featured_image: p.images[0],
    featured_media: p.images[0],
    media: p.images,
    first_available_variant: first,
    selected_or_first_available_variant: first,
    variants: vlist,
    has_only_default_variant: !multi,
    options: multi ? ['Kolor'] : ['Title'],
    options_with_values: multi ? [{ name: 'Kolor', values: vlist.map((v) => v.title), position: 1 }] : [],
    metafields: { custom: {
      showcase_image: p.showcase ? { value: img(p.showcase, p.title) } : null,
      code: { value: p.code }, short_title: p.short ? { value: p.short } : null,
      material: p.material ? { value: p.material } : null, size: p.size ? { value: p.size } : null,
    } },
  };
});
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
  routes: { root_url: '/', cart_url: '/cart', cart_add_url: '/cart/add', collections_url: '/collections', all_products_collection_url: '/collections/all', search_url: '/search', account_url: '/account/login', account_login_url: '/account/login', account_register_url: '/account/register', account_logout_url: '/account/login', account_addresses_url: '/account' },
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
    const action = { product: '/cart/add', customer: '/contact#newsletter', contact: '/contact', customer_login: '/account/login', create_customer: '/account', recover_customer_password: '/account/recover' }[this.type] || '#';
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
    const settings = { ...bs, ...(b.settings || {}) };
    for (const st of bdef.settings || []) if (st.type === 'product' && typeof settings[st.id] === 'string') settings[st.id] = products.find((p) => p.handle === settings[st.id]) || null;
    return { id: bid, type: b.type, settings, shopify_attributes: '' };
  });
  const section = { id, settings: { ...defs, ...(json.settings || {}) }, blocks };
  // resolve collection/product settings to objects like Shopify does
  for (const st of schema.settings || []) {
    if (st.type === 'collection' && typeof section.settings[st.id] === 'string') section.settings[st.id] = collections[section.settings[st.id]] || collections.all;
    if (st.type === 'collection' && section.settings[st.id] == null) section.settings[st.id] = collections[(json.settings || {})[st.id]] || null;
    if (st.type === 'video_url' && typeof section.settings[st.id] === 'string') {
      const m = section.settings[st.id].match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);
      section.settings[st.id] = m ? { type: 'youtube', id: m[1] } : null;
    }
  }
  const html = await engine.parseAndRender(src, { ...ctx, section });
  return `<div id="shopify-section-${id}" class="shopify-section section-${name}">${html}</div>`;
}

engine.registerTag('section', class extends Tag {
  constructor(token, remain, liquid) { super(token, remain, liquid); this.name = token.args.replace(/['"]/g, '').trim(); }
  * render(ctx, emitter) { emitter.write(yield renderSection(this.name, ctx.getAll())); }
});

// ---------- filters ----------
// version every asset by its content, so a new deploy never shows a stale cached theme.css / theme.js
const assetVer = {};
engine.registerFilter('asset_url', (n) => {
  if (!(n in assetVer)) {
    const f = path.join(ROOT, 'assets', n);
    assetVer[n] = fs.existsSync(f) ? crypto.createHash('sha1').update(fs.readFileSync(f)).digest('hex').slice(0, 10) : '';
  }
  return `/assets/${n}${assetVer[n] ? '?v=' + assetVer[n] : ''}`;
});
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
engine.registerFilter('default_errors', () => '');
engine.registerFilter('format_address', (a) => (a ? [a.name, a.address1, `${a.zip} ${a.city}`, a.country].filter(Boolean).join('<br>') : ''));

// ---------- pages ----------
const layoutSrc = read('layout/theme.liquid');
async function renderPage(outFile, templateName, extra) {
  const [tplName, tplSuffix = null] = templateName.split('.');
  const ctx = { ...globals, ...extra, template: { name: tplName, suffix: tplSuffix }, request: { page_type: tplName, path: extra.path || '/' } };
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
for (const pg of data.pages || []) await renderPage(pg.out || `pages/${pg.handle}.html`, pg.template ? `page.${pg.template}` : 'page', { page: { ...pg, url: `/pages/${pg.handle}` }, page_title: pg.title, path: `/pages/${pg.handle}` });
await renderPage('cart.html', 'cart', { page_title: 'Koszyk', path: '/cart' });
// account pages (classic customer accounts); the account page uses a sample customer
await renderPage('account/login.html', 'customers/login', { page_title: 'Zaloguj się', path: '/account/login' });
await renderPage('account/register.html', 'customers/register', { page_title: 'Załóż konto', path: '/account/register' });
await renderPage('account.html', 'customers/account', { page_title: 'Konto', path: '/account', customer: data.sample_customer });
await renderPage('404.html', '404', { page_title: 'Nie znaleziono', path: '/404' });
fs.writeFileSync(path.join(DIST, 'sklep.html'), '<!doctype html><meta http-equiv="refresh" content="0;url=/collections/all"><link rel="canonical" href="/collections/all">');
