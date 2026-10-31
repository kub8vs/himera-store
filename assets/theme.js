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

  /* ---------- intro: the whole HIMERA word follows the cursor; Himera stands in front ---------- */
  const ph = $('[data-ph]');
  if (ph) {
    const word = $('[data-ph-word]', ph);
    const heroImg = $('[data-ph-hero]', ph);
    const floats = $$('[data-ph-float]', ph).map((el) => ({ el, d: parseFloat(el.dataset.depth) || 0 }));

    // phones (portrait): photo sized by the screen height, the word stretched to fill the space above the head
    const fitPhone = () => {
      const ext = heroImg ? parseFloat(getComputedStyle(heroImg).bottom) || 0 : 0;
      const w = ph.clientWidth, h = ph.clientHeight - ext;
      if (w > 860 || w > h) { ['--wtop', '--hw', '--sy'].forEach((v) => ph.style.removeProperty(v)); return; }
      const imgH = Math.min(h * 0.6, (w * 1.3) / 0.805);
      const headTop = h - imgH * 0.91;
      const top = Math.max(h * 0.1, 64);
      const bottom = headTop + h * 0.045;
      const base = word ? word.offsetHeight : w * 0.287;
      const sy = Math.min(Math.max((bottom - top) / base, 1.25), 2.4);
      ph.style.setProperty('--hw', (imgH * 0.805).toFixed(0) + 'px');
      ph.style.setProperty('--wtop', top.toFixed(0) + 'px');
      ph.style.setProperty('--sy', sy.toFixed(3));
    };
    fitPhone();
    window.addEventListener('resize', fitPhone);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitPhone);
    requestAnimationFrame(() => requestAnimationFrame(() => ph.classList.add('is-in')));
    if (reduced) ph.classList.add('is-lit');

    // glitch: the word breaks into red and white for a split second, at random every few seconds
    if (!reduced && word) {
      const glitch = () => {
        if (!document.hidden && ph.getBoundingClientRect().bottom > 0) {
          word.classList.remove('is-glitch');
          void word.offsetWidth;
          word.classList.add('is-glitch');
          setTimeout(() => word.classList.remove('is-glitch'), 460);
        }
        setTimeout(glitch, 4200 + Math.random() * 4200);
      };
      // once the last letter is lit, hand over to the gradient fill with one glitch
      const litAt = 350 + (word.querySelectorAll('.ph__nl').length - 1) * 170 + 650;
      setTimeout(() => { ph.classList.add('is-lit'); glitch(); }, litAt);
    }

    // smoke: soft puffs rising over the whole width; the cursor pushes them aside
    const smokePush = { x: -1, y: -1 };
    const cv = $('[data-ph-smoke]', ph);
    if (cv && cv.getContext) {
      const ctx = cv.getContext('2d');
      const SCALE = 0.5; // smoke is blurry anyway, half resolution keeps it light
      const sprite = document.createElement('canvas');
      sprite.width = sprite.height = 256;
      const sc = sprite.getContext('2d');
      let seed = 7;
      const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
      for (let i = 0; i < 46; i++) {
        const r = 22 + rnd() * 56, a = rnd() * Math.PI * 2, d = rnd() * 64;
        const cx = 128 + Math.cos(a) * d, cy = 128 + Math.sin(a) * d * 0.8;
        const g = sc.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, 'rgba(236, 226, 222, 0.11)');
        g.addColorStop(1, 'rgba(236, 226, 222, 0)');
        sc.fillStyle = g;
        sc.beginPath(); sc.arc(cx, cy, r, 0, Math.PI * 2); sc.fill();
      }
      let W = 0, H = 0, puffs = [];
      const spawn = (p, fresh) => {
        p.s = (0.45 + Math.random() * 0.9) * Math.max(W, H) * 0.42;
        p.x = Math.random() * W;
        p.y = fresh ? Math.random() * H * 1.1 : H + p.s * 0.4;
        p.vy = -(0.12 + Math.random() * 0.22) * H / 600;
        p.vx = (Math.random() - 0.5) * 0.12;
        p.r = Math.random() * Math.PI * 2;
        p.vr = (Math.random() - 0.5) * 0.0016;
        p.a = 0.1 + Math.random() * 0.14;
        p.ph = Math.random() * 6.28;
        p.ox = 0;
        return p;
      };
      const size = () => {
        W = Math.round(ph.clientWidth * SCALE); H = Math.round(ph.clientHeight * SCALE);
        cv.width = W; cv.height = H;
        const n = W < 300 ? 12 : 22;
        puffs = Array.from({ length: n }, () => spawn({}, true));
      };
      size();
      window.addEventListener('resize', size);
      let seen = true, last = performance.now();
      new IntersectionObserver(([en]) => { seen = en.isIntersecting; }).observe(ph);
      const draw = (t) => {
        const dt = Math.min(t - last, 50) / 16.7; last = t;
        ctx.clearRect(0, 0, W, H);
        for (const p of puffs) {
          if (!reduced) {
            p.y += p.vy * dt; p.x += (p.vx + Math.sin(t / 2600 + p.ph) * 0.08) * dt; p.r += p.vr * dt;
            if (smokePush.x >= 0) {
              const dx = p.x - smokePush.x * W, dy = p.y - smokePush.y * H, dd = Math.hypot(dx, dy);
              const reach = p.s * 0.6;
              if (dd < reach) p.ox += (dx / (dd || 1)) * (1 - dd / reach) * 0.6 * dt;
            }
            p.ox *= 0.985;
            if (p.y < -p.s * 0.6) spawn(p, false);
          }
          // fade in at the bottom, thin out towards the top
          const life = Math.min(Math.max(p.y / H, 0), 1);
          ctx.globalAlpha = p.a * Math.min(1, (1 - life) * 4 + 0.15) * (0.25 + life * 0.75);
          ctx.save();
          ctx.translate(p.x + p.ox, p.y); ctx.rotate(p.r);
          ctx.drawImage(sprite, -p.s / 2, -p.s / 2, p.s, p.s);
          ctx.restore();
        }
        if (!reduced) requestAnimationFrame(loopSmoke);
      };
      const loopSmoke = (t) => { if (seen && !document.hidden) draw(t); else { last = t; requestAnimationFrame(loopSmoke); } };
      requestAnimationFrame(reduced ? draw : loopSmoke);
    }

    // clock in the corner; after 22:00 the glow gets stronger
    const clock = $('[data-ph-clock]', ph);
    if (clock) {
      const tick = () => {
        const d = new Date();
        const h = d.getHours();
        const night = h >= 22 || h < 4;
        clock.textContent = d.toLocaleTimeString('pl-PL', { hour12: false }) + (night ? ' · NOC' : '');
        document.body.classList.toggle('is-night', night);
      };
      tick();
      setInterval(tick, 1000);
    }

    if (!reduced && word) {
      const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
      let tx = 0.5, ty = 0.5, x = 0.5, y = 0.5, moved = false, visible = true, touched = 0, idle = 0, flickered = false;
      new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(ph);
      const aim = (cx, cy) => {
        const r = ph.getBoundingClientRect();
        tx = Math.min(Math.max((cx - r.left) / r.width, 0), 1);
        ty = Math.min(Math.max((cy - r.top) / r.height, 0), 1);
        idle = performance.now();
        moved = true;
      };
      ph.addEventListener('pointermove', (e) => { aim(e.clientX, e.clientY); if (e.pointerType !== 'mouse') touched = performance.now(); }, { passive: true });
      ph.addEventListener('touchmove', (e) => { const t = e.touches[0]; if (t) { aim(t.clientX, t.clientY); touched = performance.now(); } }, { passive: true });
      ph.addEventListener('pointerleave', () => { if (fine) { tx = 0.5; ty = 0.5; } });
      const t0 = idle = performance.now();
      const loop = (t) => {
        if (visible) {
          // phones: a slow drift unless the finger is moving
          if (!fine && t - touched > 2500) { const s = (t - t0) / 1000; tx = 0.5 + Math.sin(s * 0.42) * 0.5; ty = 0.5 + Math.cos(s * 0.33) * 0.25; }
          x += (tx - x) * 0.075; y += (ty - y) * 0.075;
          const dx = x - 0.5, dy = y - 0.5;
          const w = ph.clientWidth, h = ph.clientHeight;
          // the word is wider than the screen: following the cursor reveals its ends
          const travel = fine && w > 700 ? Math.max(w * 0.16, (word.offsetWidth - w) / 2 + 28) : Math.min(24, Math.max(0, (w - word.offsetWidth) / 2 - 12));
          word.style.setProperty('--tx', (dx * 2 * travel).toFixed(1) + 'px');
          word.style.setProperty('--ty', (dy * h * 0.14).toFixed(1) + 'px');
          word.style.setProperty('--ry', (dx * (fine && ph.clientWidth > 700 ? 16 : 3)).toFixed(2) + 'deg');
          word.style.setProperty('--rx', (-dy * 12).toFixed(2) + 'deg');
          word.style.setProperty('--lx', (x * 100).toFixed(1) + '%');
          word.style.setProperty('--ly', (y * 100).toFixed(1) + '%');
          ph.style.setProperty('--cx', (x * 100).toFixed(1) + '%');
          ph.style.setProperty('--cy', (y * 100).toFixed(1) + '%');
          if (heroImg) heroImg.style.setProperty('--hx', (-dx * w * 0.025).toFixed(1) + 'px');
          for (const f of floats) {
            f.el.style.setProperty('--px', (-dx * f.d * 70).toFixed(1) + 'px');
            f.el.style.setProperty('--py', (-dy * f.d * 50).toFixed(1) + 'px');
          }
          smokePush.x = x; smokePush.y = y;
          // leave the mouse still for 6 s and the neon flickers once
          if (fine && !flickered && t - idle > 6000) {
            flickered = true;
            word.classList.add('is-flicker');
            setTimeout(() => word.classList.remove('is-flicker'), 1000);
          }
          if (t - idle < 100) flickered = false;
        }
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }
  }

  /* ---------- the top bar slides in once you scroll past the intro ---------- */
  const top = $('.top--intro');
  if (top) {
    const onScroll = () => top.classList.toggle('is-shown', window.scrollY > window.innerHeight * 0.6 || document.body.classList.contains('is-locked'));
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
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
      io.observe($('.part__stage', hero) || hero);
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

  /* ---------- statement ticker: drifts on its own, scrolling pushes it faster ---------- */
  $$('[data-tick]').forEach((tk) => {
    const rows = $$('[data-tick-row]', tk).map((row) => ({ track: row.firstElementChild, dir: Number(row.dataset.dir) || -1, x: 0 }));
    if (reduced || !rows.length) return;
    let seen = false, boost = 0, lastY = window.scrollY, last = performance.now();
    new IntersectionObserver(([en]) => { seen = en.isIntersecting; }).observe(tk);
    // phones scroll in big flicks, so the push is much gentler there
    const phone = () => window.innerWidth <= 860;
    window.addEventListener('scroll', () => { boost += Math.abs(window.scrollY - lastY) * (phone() ? 0.04 : 0.2); lastY = window.scrollY; }, { passive: true });
    const step = (t) => {
      const dt = Math.min(t - last, 50) / 16.7; last = t;
      if (seen) {
        boost *= 0.92;
        for (const r of rows) {
          const half = r.track.scrollWidth / 2;
          r.x += r.dir * (0.6 + Math.min(boost, phone() ? 2.4 : 14)) * dt;
          if (r.x <= -half) r.x += half;
          if (r.x > 0) r.x -= half;
          r.track.style.setProperty('--tk', r.x.toFixed(1) + 'px');
        }
      }
      requestAnimationFrame(step);
    };
    rows.forEach((r) => { if (r.dir > 0) r.x = -r.track.scrollWidth / 4; });
    requestAnimationFrame(step);
  });

  /* ---------- CTA cards tilt toward the pointer ---------- */
  if (!reduced && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    $$('[data-tilt]').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        card.style.setProperty('--try', ((px - 0.5) * 8).toFixed(2) + 'deg');
        card.style.setProperty('--trx', ((0.5 - py) * 8).toFixed(2) + 'deg');
        card.style.setProperty('--gx', (px * 100).toFixed(1) + '%');
        card.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
      });
      card.addEventListener('pointerleave', () => { card.style.setProperty('--trx', '0deg'); card.style.setProperty('--try', '0deg'); });
    });
  }

  /* ---------- latest episode: YouTube loads only after a click ---------- */
  $$('[data-ep-player]').forEach((player) => {
    const tc = $('[data-ep-tc]', player);
    if (tc && !reduced) {
      const t0 = performance.now();
      const pad = (n) => String(n).padStart(2, '0');
      const tickTc = () => {
        if (!player.isConnected || player.classList.contains('is-playing')) return;
        const ms = performance.now() - t0, s = Math.floor(ms / 1000);
        tc.textContent = `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}:${pad(Math.floor((ms % 1000) / 40))}`;
        requestAnimationFrame(tickTc);
      };
      requestAnimationFrame(tickTc);
    }
    const id = player.dataset.yt;
    const btn = $('[data-ep-play]', player);
    if (!id || !btn) return;
    const play = () => {
      if (player.classList.contains('is-playing')) return;
      player.classList.add('is-playing');
      const f = document.createElement('iframe');
      f.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0`;
      f.title = btn.getAttribute('aria-label') || 'YouTube';
      f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      f.allowFullscreen = true;
      player.appendChild(f);
    };
    btn.addEventListener('click', (e) => { e.stopPropagation(); play(); });
    player.addEventListener('click', play);
  });

  /* ---------- reveal on scroll ---------- */
  const reveals = $$('[data-reveal]');
  if ('IntersectionObserver' in window && !reduced) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -12% 0px' });
    reveals.forEach((el) => io.observe(el));
    // jumping past an element (anchor link, fast fling) must not leave it invisible
    let sweepT;
    window.addEventListener('scroll', () => {
      clearTimeout(sweepT);
      sweepT = setTimeout(() => reveals.forEach((el) => { if (!el.classList.contains('is-in') && el.getBoundingClientRect().top < window.innerHeight) { el.classList.add('is-in'); io.unobserve(el); } }), 120);
    }, { passive: true });
  } else {
    reveals.forEach((el) => el.classList.add('is-in'));
  }

  /* ---------- showroom (collection): arc of glass panels, platform title swap, click a product to pick it ---------- */
  const sr = $('[data-sr]');
  if (sr) {
    const pinEl = $('.sr__pin', sr);
    const items = $$('[data-sr-item]', sr);
    const N = items.length;
    const ring = $('[data-sr-ring]', sr);
    const scene = $('[data-sr-scene]', sr);
    const titles = $('[data-sr-titles]', sr);
    const C = N < 3 ? N * 3 : N * Math.ceil(9 / N);
    const cards = [];
    const titleEls = [];
    let cur = 0, pos = 0, open = false;

    for (let c = 0; c < C; c++) {
      const k = c % N;
      const card = document.createElement('div');
      card.className = 'sr__card';
      card.dataset.k = k;
      card.innerHTML = `<div class="sr__glass"><span class="sr__float" style="--d:${(c * -1.1).toFixed(1)}s"><img src="${items[k].dataset.img}" alt="" draggable="false"></span></div>`;
      ring.appendChild(card);
      cards.push(card);
    }
    items.forEach((it, k) => {
      const t = document.createElement('div');
      t.className = 'sr__title';
      t.innerHTML = `<span>${it.dataset.heading}</span>`;
      titles.appendChild(t);
      titleEls.push(t);
      // split the detail title into letters for the reveal
      const h = $('[data-sr-split]', it);
      if (h) { let i = 0; h.innerHTML = h.textContent.trim().split(/\s+/).map((w) => `<span class="w">${[...w].map((ch) => `<span class="ch" style="--i:${i++}">${ch}</span>`).join('')}</span>`).join(' '); }
    });
    $('[data-sr-total]', sr).textContent = String(N).padStart(2, '0');

    // concave arc tilted up to the right, like the reference: front panel square on, sides angled and pushed back
    let G = 300;
    const size = () => { G = window.innerWidth < 760 ? window.innerWidth * 0.5 : Math.min(window.innerWidth * 0.25, 420); place(false); };
    const prevD = [];
    const place = (anim = true) => {
      cards.forEach((card, c) => {
        let d = ((c - pos) % C + C) % C;
        if (d > C / 2) d -= C;
        const a = Math.abs(d), sg = Math.sign(d);
        const x = sg * (a <= 1 ? a * G : G + (a - 1) * G * 0.7);
        const jump = prevD[c] !== undefined && Math.abs(prevD[c] - d) > C / 2;
        prevD[c] = d;
        card.style.transition = anim && !jump ? '' : 'none';
        card.style.setProperty('--x', x.toFixed(1) + 'px');
        card.style.setProperty('--y', (-d * 2.6).toFixed(2) + 'vh');
        card.style.setProperty('--z', (-Math.min(a, 3) * 170).toFixed(1) + 'px');
        card.style.setProperty('--ry', (Math.max(-2, Math.min(2, d)) * -24).toFixed(2) + 'deg');
        card.style.setProperty('--rz', (Math.max(-2, Math.min(2, d)) * -1.6).toFixed(2) + 'deg');
        card.style.setProperty('--a', Math.min(a, 3).toFixed(2));
        card.style.zIndex = String(10 - Math.round(a * 2));
        card.classList.toggle('is-front', a < 0.5);
        card.classList.toggle('is-back', a > 2.6);
        if (jump) requestAnimationFrame(() => { card.style.transition = ''; });
      });
    };
    // white variant: the ring light turns white
    const setTone = (light) => sr.classList.toggle('is-white', !!light);
    const toneOf = (k) => { const on = $('[data-sr-var][aria-checked="true"]', items[k]); return on && on.dataset.tone === 'light'; };
    let swapT;
    const go = (k, dir) => {
      k = (k + N) % N;
      if (k === cur && dir === undefined) return;
      // turn the ring the short way to the nearest panel of that product
      let best = pos, bd = Infinity;
      for (let c = Math.floor(pos) - C; c <= Math.ceil(pos) + C; c++) {
        if (((c % N) + N) % N !== k) continue;
        if (dir && Math.sign(c - pos) !== dir) continue;
        const dd = Math.abs(c - pos);
        if (dd < bd) { bd = dd; best = c; }
      }
      pos = best;
      sr.style.setProperty('--dir', dir || (k > cur ? 1 : -1));
      const prev = cur;
      cur = k;
      place();
      if (open) cards.forEach((c) => c.classList.toggle('is-in', c.classList.contains('is-front')));
      sync(prev);
    };
    const sync = (prev) => {
      $('[data-sr-now]', sr).textContent = String(cur + 1).padStart(2, '0');
      $('[data-sr-code]', sr).textContent = items[cur].dataset.code;
      items.forEach((it, i) => it.classList.toggle('is-on', i === cur));
      $$('[data-sr-story]', sr).forEach((st) => st.classList.toggle('is-on', +st.dataset.srStory === cur));
      if (open) window.scrollTo({ top: sr.getBoundingClientRect().top + window.scrollY, behavior: 'auto' });
      setTone(toneOf(cur));
      if (prev === undefined || prev === cur) { titleEls.forEach((t, i) => t.classList.toggle('is-on', i === cur)); return; }
      // the platform rises, the old title sinks into it, the new one climbs out
      clearTimeout(swapT);
      sr.classList.add('is-swap');
      titleEls.forEach((t, i) => { t.classList.toggle('is-out', i === prev); t.classList.remove('is-on'); });
      setTimeout(() => { titleEls[cur].classList.add('is-on'); titleEls[prev].classList.remove('is-out'); }, 380);
      swapT = setTimeout(() => sr.classList.remove('is-swap'), 1100);
    };

    // picking a product: it slides under the light, details open; scrolling runs through its story and "Dołącz", never to another product
    const backBtn = $('[data-sr-back]', sr);
    let settleT;
    const setOpen = (o) => {
      if (o === open) return;
      open = o;
      clearTimeout(settleT);
      if (!o) { sr.classList.remove('is-settled'); cards.forEach((c) => c.classList.remove('is-in')); }
      else settleT = setTimeout(() => sr.classList.add('is-settled'), 1050);
      sr.classList.toggle('is-open', o);
      document.documentElement.classList.toggle('sr-on', o);
      backBtn.tabIndex = o ? 0 : -1;
      window.scrollTo({ top: sr.getBoundingClientRect().top + window.scrollY, behavior: 'auto' });
      if (o) setTimeout(() => backBtn.focus({ preventScroll: true }), 50);
    };
    const down = () => setOpen(true);
    // past the first screen the back button drops to the bottom centre, clear of the story and "Dołącz"
    window.addEventListener('scroll', () => { if (open) sr.classList.toggle('is-deep', window.scrollY > sr.offsetTop + window.innerHeight * 0.5); }, { passive: true });
    $('[data-sr-down]', sr).addEventListener('click', down);
    backBtn.addEventListener('click', () => setOpen(false));
    $('[data-sr-prev]', sr).addEventListener('click', () => go(cur - 1, -1));
    $('[data-sr-next]', sr).addEventListener('click', () => go(cur + 1, 1));
    document.addEventListener('keydown', (e) => {
      if (e.target.closest('input, textarea, select')) return;
      if (open && e.key === 'Escape') { setOpen(false); return; }
      const r = sr.getBoundingClientRect();
      if (r.top > window.innerHeight * 0.5 || r.bottom < window.innerHeight * 0.5) return;
      if (e.key === 'ArrowRight') go(cur + 1, 1);
      if (e.key === 'ArrowLeft') go(cur - 1, -1);
    });

    // drag / swipe turns the ring with the finger; a tap on the front panel opens the details
    let sx = null, sy = 0, sp = 0, moved = false, horiz = null;
    scene.addEventListener('pointerdown', (e) => { if (open) return; sx = e.clientX; sy = e.clientY; sp = pos; moved = false; horiz = null; });
    window.addEventListener('pointermove', (e) => {
      if (sx == null) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (horiz == null && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) horiz = Math.abs(dx) > Math.abs(dy);
      if (!horiz) return;
      moved = true;
      sr.classList.add('is-drag');
      pos = sp - dx / G;
      place(false);
    }, { passive: true });
    const end = (e) => {
      if (sx == null) return;
      sx = null;
      sr.classList.remove('is-drag');
      if (moved) {
        const target = Math.round(pos);
        pos = target;
        const prev = cur;
        cur = ((target % N) + N) % N;
        place();
        sync(prev);
        return;
      }
      const card = e.target.closest && e.target.closest('.sr__card');
      if (!card || open) return;
      if (card.classList.contains('is-front')) down();
      else go(+card.dataset.k);
    };
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', () => { sx = null; sr.classList.remove('is-drag'); });
    let wheelLock = 0;
    scene.addEventListener('wheel', (e) => {
      if (open) return;
      if (Math.abs(e.deltaX) < Math.abs(e.deltaY) || Math.abs(e.deltaX) < 25) return;
      e.preventDefault();
      if (Date.now() < wheelLock) return;
      wheelLock = Date.now() + 700;
      go(cur + (e.deltaX > 0 ? 1 : -1), e.deltaX > 0 ? 1 : -1);
    }, { passive: false });

    const swapImg = (k, src) => cards.forEach((card) => {
      if (+card.dataset.k !== k) return;
      const img = $('img', card);
      if (img.getAttribute('src') === src) return;
      card.classList.add('is-swapimg');
      setTimeout(() => { img.src = src; card.classList.remove('is-swapimg'); }, 260);
    });
    // colour options: swap the photo, price and stock; white turns the ring light white
    items.forEach((it, k) => {
      const sws = $$('[data-sr-var]', it);
      const idIn = $('[data-sr-id]', it);
      const add = $('[data-sr-add]', it);
      const addLab = $('[data-sr-addlab]', it);
      const buyNow = $('[data-sr-now-buy]', it);
      const notify = $('[data-sr-notify]', it);
      sws.forEach((sw) => sw.addEventListener('click', () => {
        sws.forEach((x) => x.setAttribute('aria-checked', x === sw ? 'true' : 'false'));
        idIn.value = sw.dataset.srVar;
        $('[data-sr-optname]', it).textContent = sw.dataset.name;
        $('[data-sr-price]', it).textContent = sw.dataset.price;
        const ok = sw.dataset.available === 'true';
        add.disabled = !ok; buyNow.disabled = !ok;
        addLab.textContent = ok ? addLab.dataset.on : addLab.dataset.off;
        notify.hidden = ok;
        swapImg(k, sw.dataset.img);
        setTone(sw.dataset.tone === 'light');
      }));
      // "Kup teraz": add, then straight to checkout
      buyNow.addEventListener('click', (e) => {
        e.preventDefault();
        const form = buyNow.form;
        form.requestSubmit(add);
        setTimeout(() => { location.href = PREVIEW ? '/cart' : '/checkout'; }, 700);
      });
    });

    size();
    sync();
    window.addEventListener('resize', () => { size(); sync(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => sync());
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

  /* ---------- account: login / forgotten password panes; in the preview the forms only explain ---------- */
  $$('[data-acc-show]').forEach((b) => b.addEventListener('click', () => {
    $$('[data-acc-pane]').forEach((p) => { p.hidden = p.dataset.accPane !== b.dataset.accShow; });
  }));
  if (PREVIEW) $$('form[data-type="account"]').forEach((f) => f.addEventListener('submit', (e) => { e.preventDefault(); toast('To przykład. Konto zadziała po wgraniu do Shopify.'); }));

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
        const sw = $('[data-sr-var][aria-checked="true"]', form);
        const sel = $('select[name="id"]', form);
        const variant = sw ? sw.dataset.name : sel ? sel.selectedOptions[0].textContent.split('·')[0].trim() : '';
        const price = sw ? Math.round(parseFloat(sw.dataset.price.replace(/[^\d,]/g, '').replace(',', '.')) * 100) : +btn.dataset.price;
        if (!hit) items.push({ id, qty, title: btn.dataset.title, variant, price, url: btn.dataset.url, img: (sw && sw.dataset.img) || btn.dataset.img });
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
          <div class="cartp__meta"><a href="${i.url}">${i.title}</a>${i.variant && i.variant !== 'Default Title' ? `<span class="mono">Kolor: ${i.variant}</span>` : ''}<span class="mono">${money(i.price)} × ${i.qty}</span></div>
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
