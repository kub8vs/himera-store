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

  /* ---------- intro: HIMERA filled with the photo, camera flies through the I ---------- */
  let introResolve;
  const introDone = new Promise((r) => { introResolve = r; });
  const intro = $('[data-intro]');
  (() => {
    if (!intro) return introResolve();
    const every = intro.dataset.everyVisit === 'true';
    let seen = false;
    try { seen = sessionStorage.getItem('himera:intro') === '1'; } catch (e) { /* storage off */ }
    if (reduced || (seen && !every)) { intro.remove(); return introResolve(); }
    try { sessionStorage.setItem('himera:intro', '1'); } catch (e) { /* storage off */ }

    const word = $('[data-intro-word]', intro);
    const bar = $('[data-intro-bar]', intro);
    const count = $('[data-intro-count]', intro);
    const skipBtn = $('[data-intro-skip]', intro);
    const timers = [];
    let finished = false;
    let raf;

    intro.classList.add('is-on');
    document.body.classList.add('is-locked');

    const finish = () => {
      if (finished) return;
      finished = true;
      timers.forEach(clearTimeout);
      cancelAnimationFrame(raf);
      intro.classList.add('is-out');
      document.body.classList.remove('is-locked');
      document.removeEventListener('keydown', onKey);
      introResolve();
      setTimeout(() => intro.remove(), 800);
    };
    const onKey = (e) => { if (['Escape', 'Enter', ' '].includes(e.key)) finish(); };
    skipBtn.addEventListener('click', finish);
    intro.addEventListener('click', finish);
    document.addEventListener('keydown', onKey);

    // zoom origin: the middle of the second letter (the "I" in HIMERA)
    const aim = () => {
      const letters = $$('.intro__l', word);
      const l = letters[Math.min(1, letters.length - 1)];
      if (l) word.style.transformOrigin = `${l.offsetLeft + l.offsetWidth / 2}px ${l.offsetTop + l.offsetHeight * 0.52}px`;
    };

    const TOTAL = 3900;
    const start = () => {
      aim();
      const t0 = performance.now();
      const tick = (t) => {
        const p = Math.min(1, (t - t0) / TOTAL);
        bar.style.transform = `scaleX(${p})`;
        count.textContent = String(Math.round(p * 100)).padStart(2, '0');
        if (p < 1 && !finished) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      intro.classList.add('is-in');
      timers.push(setTimeout(() => { aim(); intro.classList.add('is-zoom'); }, 2150));
      timers.push(setTimeout(() => intro.classList.add('is-photo'), 2850));
      timers.push(setTimeout(finish, TOTAL));
    };

    // wait for the photo and the display font, but never longer than 1.4 s
    const img = new Image();
    const src = (getComputedStyle(intro).getPropertyValue('--photo').match(/url\(['"]?([^'")]+)/) || [])[1];
    const ready = [new Promise((r) => { img.onload = img.onerror = r; img.src = src || ''; if (!src) r(); })];
    if (document.fonts && document.fonts.load) ready.push(document.fonts.load('100px Anton').catch(() => {}));
    Promise.race([Promise.all(ready), wait(1400)]).then(() => requestAnimationFrame(() => requestAnimationFrame(start)));
  })();

  /* ---------- hero: the car drives in after the intro ---------- */
  const hero = $('[data-hero]');
  if (hero) {
    const tail = $('[data-tail]', hero);
    if (reduced) {
      hero.classList.add('is-static', 'is-parked');
    } else {
      hero.classList.add('is-waiting');
      introDone.then(async () => {
        await wait(intro ? 250 : 120);
        hero.classList.remove('is-waiting');
        void hero.offsetWidth;
        hero.classList.add('is-driving');
        await wait(2500);
        hero.classList.add('is-parked');
        if (tail) {
          tail.classList.add('is-on');
          setTimeout(() => tail.classList.remove('is-on'), 900);
        }
      });
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

  /* ---------- showroom carousel (collection) ---------- */
  const show = $('[data-show]');
  if (show) {
    const items = $$('[data-show-item]', show);
    const panels = $$('[data-show-panel]', show);
    const tabs = $$('[data-show-tab]', show);
    const mirrors = $$('[data-show-mirror]', show);
    const nowEl = $('[data-show-now]', show);
    const codeEl = $('[data-show-code]', show);
    const n = items.length;
    let cur = -1;

    const set = (i) => {
      i = Math.max(0, Math.min(n - 1, i));
      if (i === cur) return;
      cur = i;
      items.forEach((el, k) => {
        const d = k - i;
        el.classList.toggle('is-on', d === 0);
        el.classList.toggle('is-prev', d === -1);
        el.classList.toggle('is-next', d === 1);
        el.classList.toggle('is-far-prev', d < -1);
        el.classList.toggle('is-far-next', d > 1);
        el.tabIndex = d === 0 ? 0 : -1;
        el.setAttribute('aria-hidden', d === 0 ? 'false' : 'true');
      });
      panels.forEach((el, k) => { el.classList.toggle('is-on', k === i); el.setAttribute('aria-hidden', k === i ? 'false' : 'true'); });
      tabs.forEach((el, k) => el.setAttribute('aria-selected', k === i ? 'true' : 'false'));
      mirrors.forEach((el, k) => el.classList.toggle('is-on', k === i));
      if (nowEl) nowEl.textContent = String(i + 1).padStart(2, '0');
      if (codeEl && mirrors[i]) codeEl.textContent = mirrors[i].textContent;
    };

    // the section is tall and the stage is pinned: scroll position picks the product
    const span = () => Math.max(1, show.offsetHeight - window.innerHeight);
    const fromScroll = () => {
      const p = Math.min(1, Math.max(0, -show.getBoundingClientRect().top / span()));
      set(Math.round(p * (n - 1)));
    };
    const go = (i) => {
      i = Math.max(0, Math.min(n - 1, i));
      const top = show.getBoundingClientRect().top + window.scrollY;
      const y = n > 1 ? top + (i / (n - 1)) * span() : top;
      window.scrollTo({ top: Math.round(y) + 1, behavior: reduced ? 'auto' : 'smooth' });
      set(i);
    };

    set(0);
    fromScroll();
    window.addEventListener('scroll', () => requestAnimationFrame(fromScroll), { passive: true });
    window.addEventListener('resize', fromScroll);
    tabs.forEach((t) => t.addEventListener('click', () => go(+t.dataset.showTab)));
    $('[data-show-prev]', show).addEventListener('click', () => go(cur - 1));
    $('[data-show-next]', show).addEventListener('click', () => go(cur + 1));
    items.forEach((el, k) => el.addEventListener('click', (e) => { if (k !== cur) { e.preventDefault(); go(k); } }));
    document.addEventListener('keydown', (e) => {
      if (e.target.closest('input, textarea, select')) return;
      const r = show.getBoundingClientRect();
      if (r.top > 1 || r.bottom < window.innerHeight) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); go(cur + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(cur - 1); }
    });
    // horizontal swipe / drag
    let sx = null, sy = 0;
    const stage = $('.show__pin', show);
    stage.addEventListener('pointerdown', (e) => { sx = e.clientX; sy = e.clientY; }, { passive: true });
    stage.addEventListener('pointerup', (e) => {
      if (sx == null) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      sx = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) go(cur + (dx < 0 ? 1 : -1));
    }, { passive: true });
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
