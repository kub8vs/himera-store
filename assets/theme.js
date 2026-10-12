/* HIMERA — theme.js
   Small modules keyed on data attributes. No dependencies. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const T = Object.assign({ added: 'Dodano do koszyka', error: 'Coś poszło nie tak. Spróbuj ponownie.', success: 'Zapisano.', remove: 'Usuń', subtotal: 'Suma', checkout: 'Przejdź do kasy' }, window.HIMERA_T || {});
  const PREVIEW = !!window.HIMERA_PREVIEW;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const money = (c) => ((Number(c) || 0) / 100).toFixed(2).replace('.', ',') + ' zł';

  /* ---------- toast ---------- */
  let toastTimer;
  const toast = (msg) => {
    const el = $('[data-toast]');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('is-on'), 2600);
  };

  /* ---------- header ---------- */
  const hdr = $('[data-header]');
  if (hdr) {
    const onScroll = () => hdr.classList.toggle('is-scrolled', window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- menu drawer ---------- */
  const drawer = $('[data-menu]');
  const openBtn = $('[data-menu-open]');
  if (drawer && openBtn) {
    const close = () => {
      drawer.hidden = true;
      openBtn.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('is-locked');
      openBtn.focus();
    };
    openBtn.addEventListener('click', () => {
      drawer.hidden = false;
      openBtn.setAttribute('aria-expanded', 'true');
      document.body.classList.add('is-locked');
      $('[data-menu-close]', drawer).focus();
    });
    $('[data-menu-close]', drawer).addEventListener('click', close);
    drawer.addEventListener('click', (e) => { if (e.target === drawer || e.target.closest('a')) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !drawer.hidden) close(); });
  }

  /* ---------- entrance: mouse parallax, slow "breathing" drift on touch screens ---------- */
  const ph = $('[data-ph]');
  if (ph) {
    $$('[data-depth]', ph).forEach((el) => el.style.setProperty('--d', el.dataset.depth));
    requestAnimationFrame(() => requestAnimationFrame(() => ph.classList.add('is-in')));
    if (!reduced) {
      const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
      let tx = 0, ty = 0, x = 0, y = 0, visible = true;
      new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(ph);
      if (fine) {
        window.addEventListener('pointermove', (e) => {
          tx = (e.clientX / window.innerWidth) * 2 - 1;
          ty = (e.clientY / window.innerHeight) * 2 - 1;
        }, { passive: true });
      }
      const t0 = performance.now();
      const loop = (t) => {
        if (visible) {
          if (!fine) { const s = (t - t0) / 1000; tx = Math.sin(s * 0.55) * 0.8; ty = Math.cos(s * 0.4) * 0.6; }
          x += (tx - x) * 0.06; y += (ty - y) * 0.06;
          ph.style.setProperty('--mx', x.toFixed(4));
          ph.style.setProperty('--my', y.toFixed(4));
        }
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }
  }

  /* ---------- the car rolls in when its section comes into view ---------- */
  const hero = $('[data-hero]');
  if (hero) {
    const tail = $('[data-tail]', hero);
    const drive = $('[data-drive]', hero);
    const body = $('[data-body]', hero);
    const wheels = $$('[data-wheel]', hero);
    const blur = $('[data-blur]', hero);
    if (reduced || !('IntersectionObserver' in window)) {
      hero.classList.add('is-static', 'is-parked');
    } else {
      hero.classList.add('is-waiting');
      const run = () => {
        const carW = drive.offsetWidth;
        const r = (carW * 0.122) / 2;
        const X0 = window.innerWidth * 1.15;
        const D = 2700;
        const ease = (p) => 1 - Math.pow(1 - p, 3.4);
        hero.classList.remove('is-waiting');
        hero.classList.add('is-driving');
        let start = null, lastX = X0, lastV = 0;
        const step = (t) => {
          if (start == null) start = t;
          const p = Math.min(1, (t - start) / D);
          const x = X0 * (1 - ease(p));
          const v = lastX - x;                 // px per frame, leftwards
          const a = v - lastV;                 // negative while braking
          lastX = x; lastV = v;
          drive.style.setProperty('--x', x.toFixed(1) + 'px');
          const spin = -((X0 - x) / r) * (180 / Math.PI);
          wheels.forEach((w) => w.style.setProperty('--spin', spin.toFixed(1) + 'deg'));
          if (blur) blur.setAttribute('stdDeviation', `${Math.min(16, v * 0.55).toFixed(1)} 0`);
          body.style.setProperty('--pitch', Math.max(-0.9, Math.min(0, a * 0.35)).toFixed(3) + 'deg');
          if (tail) tail.classList.toggle('is-on', p > 0.35);
          if (p < 1) return requestAnimationFrame(step);
          // stopped: the body settles on its springs
          hero.classList.remove('is-driving');
          if (blur) blur.setAttribute('stdDeviation', '0 0');
          const s0 = performance.now();
          const settle = (tt) => {
            const k = tt - s0;
            body.style.setProperty('--pitch', (-0.7 * Math.exp(-k / 170) * Math.cos(k / 70)).toFixed(3) + 'deg');
            if (k < 900) return requestAnimationFrame(settle);
            body.style.setProperty('--pitch', '0deg');
          };
          requestAnimationFrame(settle);
          hero.classList.add('is-parked');
          setTimeout(() => tail && tail.classList.remove('is-on'), 700);
        };
        requestAnimationFrame(step);
      };
      const io = new IntersectionObserver(([en]) => {
        if (en.isIntersecting) { io.disconnect(); run(); }
      }, { threshold: 0.35 });
      io.observe($('.hero__stage', hero) || hero);
    }
    // tail light blinks "HMR" in Morse every ~25 s: .... -- .-.
    if (tail && !reduced) {
      const U = 170;
      const morse = '.... -- .-.';
      const blink = async () => {
        if (document.hidden || !hero.classList.contains('is-parked')) return;
        for (const ch of morse) {
          if (ch === ' ') { await wait(U * 3); continue; }
          tail.classList.add('is-on');
          await wait(ch === '.' ? U : U * 3);
          tail.classList.remove('is-on');
          await wait(U);
        }
      };
      setInterval(blink, 25000);
    }
  }

  /* ---------- reveal on scroll ---------- */
  const reveals = $$('[data-reveal]');
  if ('IntersectionObserver' in window && !reduced) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -12% 0px' });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('is-in'));
  }

  /* ---------- showroom carousel (collection): arrows, tabs, drag or swipe; never tied to page scroll ---------- */
  const show = $('[data-show]');
  if (show) {
    const items = $$('[data-show-item]', show);
    const panels = $$('[data-show-panel]', show);
    const tabs = $$('[data-show-tab]', show);
    const mirrors = $$('[data-show-mirror]', show);
    const nowEl = $('[data-show-now]', show);
    const codeEl = $('[data-show-code]', show);
    const pin = $('.show__pin', show);
    const n = items.length;
    let cur = 0, drag = 0;

    const gap = () => (window.innerWidth < 860 ? window.innerWidth * 0.62 : Math.min(window.innerWidth * 0.3, 500));
    const layout = () => {
      const g = gap();
      items.forEach((el, k) => {
        const d = k - cur - drag;
        const a = Math.abs(d);
        el.style.setProperty('--x', (d * g).toFixed(1) + 'px');
        el.style.setProperty('--z', (-a * 240).toFixed(1) + 'px');
        el.style.setProperty('--ry', (Math.max(-2, Math.min(2, d)) * -20).toFixed(2) + 'deg');
        el.style.setProperty('--s', Math.max(0.42, 1 - a * 0.4).toFixed(3));
        el.style.setProperty('--o', a > 2.4 ? '0' : Math.max(0, 1 - a * 0.42).toFixed(3));
        el.style.setProperty('--b', (Math.min(a, 2) * 2.4).toFixed(2) + 'px');
        el.style.setProperty('--br', (1 - Math.min(a, 1) * 0.55).toFixed(3));
      });
    };
    const set = (i) => {
      cur = (i + n) % n;
      drag = 0;
      items.forEach((el, k) => {
        const on = k === cur;
        el.classList.toggle('is-on', on);
        el.tabIndex = on ? 0 : -1;
        el.setAttribute('aria-hidden', on ? 'false' : 'true');
      });
      panels.forEach((el, k) => { el.classList.toggle('is-on', k === cur); el.setAttribute('aria-hidden', k === cur ? 'false' : 'true'); });
      tabs.forEach((el, k) => el.setAttribute('aria-selected', k === cur ? 'true' : 'false'));
      mirrors.forEach((el, k) => el.classList.toggle('is-on', k === cur));
      if (nowEl) nowEl.textContent = String(cur + 1).padStart(2, '0');
      if (codeEl && mirrors[cur]) codeEl.textContent = mirrors[cur].textContent;
      layout();
    };
    set(0);
    window.addEventListener('resize', layout);
    tabs.forEach((t) => t.addEventListener('click', () => set(+t.dataset.showTab)));
    $('[data-show-prev]', show).addEventListener('click', () => set(cur - 1));
    $('[data-show-next]', show).addEventListener('click', () => set(cur + 1));
    document.addEventListener('keydown', (e) => {
      if (e.target.closest('input, textarea, select')) return;
      const r = show.getBoundingClientRect();
      if (r.bottom < window.innerHeight * 0.4 || r.top > window.innerHeight * 0.6) return;
      if (e.key === 'ArrowRight') set(cur + 1);
      if (e.key === 'ArrowLeft') set(cur - 1);
    });

    // drag / swipe with the product following the finger
    let sx = null, sy = 0, moved = false, horiz = null;
    pin.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button, form, .show__panel a, .show__hint')) return;
      sx = e.clientX; sy = e.clientY; moved = false; horiz = null;
    });
    window.addEventListener('pointermove', (e) => {
      if (sx == null) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (horiz == null && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) horiz = Math.abs(dx) > Math.abs(dy);
      if (!horiz) return;
      moved = true;
      show.classList.add('is-drag');
      drag = Math.max(-1.2, Math.min(1.2, -dx / gap()));
      layout();
    }, { passive: true });
    const end = () => {
      if (sx == null) return;
      sx = null;
      show.classList.remove('is-drag');
      if (moved) set(Math.abs(drag) > 0.18 ? cur + Math.sign(drag) : cur);
    };
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
    items.forEach((el, k) => el.addEventListener('click', (e) => {
      if (moved) { e.preventDefault(); moved = false; return; }
      if (k !== cur) { e.preventDefault(); set(k); }
    }));
    // trackpad side-swipe
    let wheelLock = 0;
    pin.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaX) < Math.abs(e.deltaY) || Math.abs(e.deltaX) < 25) return;
      e.preventDefault();
      const now = Date.now();
      if (now < wheelLock) return;
      wheelLock = now + 650;
      set(cur + (e.deltaX > 0 ? 1 : -1));
    }, { passive: false });
  }

  /* ---------- filter chips ---------- */
  $$('[data-chips]').forEach((wrap) => {
    const grid = wrap.parentElement.querySelector('[data-grid]');
    wrap.addEventListener('click', (e) => {
      const b = e.target.closest('[data-chip]');
      if (!b || !grid) return;
      $$('[data-chip]', wrap).forEach((x) => x.classList.toggle('is-on', x === b));
      const v = b.dataset.chip;
      $$('.card', grid).forEach((c) => { c.hidden = v !== 'all' && c.dataset.type !== v; });
    });
  });

  /* ---------- quantity ---------- */
  $$('[data-qty]').forEach((q) => {
    const input = $('input', q);
    const step = (d) => { input.value = Math.max(+input.min || 1, Math.min(+input.max || 99, (+input.value || 1) + d)); };
    $('[data-qty-minus]', q).addEventListener('click', () => step(-1));
    $('[data-qty-plus]', q).addEventListener('click', () => step(1));
  });

  /* ---------- cart ---------- */
  const KEY = 'himera:preview-cart';
  const readPreview = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } };
  const writePreview = (items) => { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) { /* storage off */ } };
  const setCount = (c) => $$('[data-cart-count]').forEach((el) => { el.textContent = c > 0 ? c : ''; });
  if (PREVIEW) setCount(readPreview().reduce((s, i) => s + i.qty, 0));

  $$('form[data-type="add"]').forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = $('[data-add]', form);
      const fd = new FormData(form);
      const qty = Math.max(1, +fd.get('quantity') || 1);
      if (PREVIEW) {
        const items = readPreview();
        const id = String(fd.get('id'));
        const hit = items.find((i) => i.id === id);
        if (hit) hit.qty += qty;
        else items.push({ id, qty, title: btn.dataset.title, price: +btn.dataset.price, url: btn.dataset.url, img: btn.dataset.img });
        writePreview(items);
        setCount(items.reduce((s, i) => s + i.qty, 0));
        return toast(T.added);
      }
      btn.disabled = true;
      try {
        const res = await fetch((window.Shopify && window.Shopify.routes ? window.Shopify.routes.root : '/') + 'cart/add.js', { method: 'POST', body: fd, headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error((await res.json()).description || T.error);
        const cart = await (await fetch('/cart.js')).json();
        setCount(cart.item_count);
        toast(T.added);
      } catch (err) {
        toast(err.message || T.error);
      } finally {
        btn.disabled = false;
      }
    });
  });

  // preview only: cart page drawn from localStorage
  const cartPreview = $('[data-cart-preview]');
  if (PREVIEW && cartPreview) {
    const draw = () => {
      const items = readPreview();
      const empty = $('[data-cart-empty]');
      cartPreview.hidden = !items.length;
      if (empty) empty.hidden = !!items.length;
      if (!items.length) return;
      const total = items.reduce((s, i) => s + i.price * i.qty, 0);
      cartPreview.innerHTML = `<ul class="cartp__list">${items.map((i, k) => `
        <li class="cartp__item">
          <a class="cartp__img" href="${i.url}"><img src="${i.img}" alt="" width="96" height="96"></a>
          <div class="cartp__meta"><a href="${i.url}">${i.title}</a><span class="mono">${money(i.price)} × ${i.qty}</span></div>
          <span class="mono">${money(i.price * i.qty)}</span>
          <button class="cartp__rm mono" type="button" data-rm="${k}">${T.remove}</button>
        </li>`).join('')}</ul>
        <div class="cartp__sum"><div><span class="mono">${T.subtotal}</span><strong>${money(total)}</strong></div>
        <button class="btn btn--bone" type="button" data-fake-checkout>${T.checkout}</button></div>`;
    };
    cartPreview.addEventListener('click', (e) => {
      const rm = e.target.closest('[data-rm]');
      if (rm) {
        const items = readPreview();
        items.splice(+rm.dataset.rm, 1);
        writePreview(items);
        setCount(items.reduce((s, i) => s + i.qty, 0));
        draw();
      }
      if (e.target.closest('[data-fake-checkout]')) toast('Kasa działa po wgraniu motywu do Shopify');
    });
    draw();
  }

  // preview only: newsletter form answers without a server
  if (PREVIEW) {
    $$('form').forEach((f) => {
      const type = f.querySelector('input[name="form_type"]');
      if (!type || type.value !== 'customer') return;
      f.addEventListener('submit', (e) => {
        e.preventDefault();
        f.innerHTML = `<p class="join__ok mono" role="status">${T.success}</p>`;
      });
    });
  }

  /* ---------- hidden details ---------- */
  if (document.body.dataset.eggs !== 'false') {
    // 1. type "himera" anywhere: the whole screen says RUCH
    const ruch = $('[data-ruch]');
    let buf = '';
    document.addEventListener('keydown', (e) => {
      if (e.target.closest('input, textarea, select') || e.key.length !== 1) return;
      buf = (buf + e.key.toLowerCase()).slice(-6);
      if (buf === 'himera' && ruch) {
        buf = '';
        ruch.classList.remove('is-on');
        void ruch.offsetWidth;
        ruch.classList.add('is-on');
        setTimeout(() => ruch.classList.remove('is-on'), 1900);
        console.log('%cJESTEŚ W RUCHU.', 'font: 700 20px sans-serif; color: #c4161c');
      }
    });

    // 2. leave the tab and the title calls you back
    const title = document.title;
    const away = document.body.dataset.awayTitle;
    if (away) document.addEventListener('visibilitychange', () => { document.title = document.hidden ? away : title; });

    // 3. the logo's eyes catch light every ~40 s
    const logo = $('.hdr__logo');
    if (logo && !reduced) {
      setInterval(() => {
        if (document.hidden) return;
        logo.classList.remove('is-glint');
        void logo.offsetWidth;
        logo.classList.add('is-glint');
      }, 40000);
    }

    // 4. stare at the portrait for 3 s and the mark wakes up
    $$('[data-stare]').forEach((mark) => {
      const fig = mark.parentElement;
      let t;
      const on = () => { clearTimeout(t); t = setTimeout(() => mark.classList.add('is-awake'), 3000); };
      const off = () => { clearTimeout(t); mark.classList.remove('is-awake'); };
      fig.addEventListener('pointerenter', on);
      fig.addEventListener('pointerleave', off);
      fig.addEventListener('touchstart', on, { passive: true });
      fig.addEventListener('touchend', off);
    });

    // 5. for the ones who open the console
    console.log(
      '%c\n  ██╗  ██╗███╗   ███╗██████╗\n  ██║  ██║████╗ ████║██╔══██╗\n  ███████║██╔████╔██║██████╔╝\n  ██╔══██║██║╚██╔╝██║██╔══██╗\n  ██║  ██║██║ ╚═╝ ██║██║  ██║\n  ╚═╝  ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝\n',
      'color: #c4161c; font-family: monospace'
    );
    console.log('%cSkoro tu zajrzałeś, jesteś jednym z nas. Napisz na IG słowo „RUCH”.', 'color: #ece6e0; background: #070606; padding: 6px 10px; font-family: monospace');
  }
})();
