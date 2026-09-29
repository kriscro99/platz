/* PLATZ FOOD & DRINK — interakcije */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const root = document.documentElement;

  /* ---------- radno vrijeme (Europe/Zagreb) ---------- */
  // 0 = nedjelja … 6 = subota; [otvara, zatvara] u satima
  const HOURS = { 0: null, 1: [11, 18], 2: [11, 18], 3: [11, 18], 4: [11, 18], 5: [11, 18], 6: [11, 18] };
  const DAYS_ACC = ['u nedjelju', 'u ponedjeljak', 'u utorak', 'u srijedu', 'u četvrtak', 'u petak', 'u subotu'];

  function zagrebNow() {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Zagreb', weekday: 'short', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', hourCycle: 'h23'
    }).formatToParts(new Date());
    const get = t => (parts.find(p => p.type === t) || {}).value;
    const wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
    return { day: wd, h: +get('hour'), m: +get('minute'), dd: get('day'), mm: get('month') };
  }

  function status() {
    const n = zagrebNow();
    const t = n.h + n.m / 60;
    const today = HOURS[n.day];
    if (today && t >= today[0] && t < today[1]) {
      const soon = today[1] - t <= 1;
      return { open: true, long: soon ? `Otvoreno · zatvaramo u ${today[1]}:00` : `Otvoreno danas · do ${today[1]}:00`, short: 'otvoreno' };
    }
    if (today && t < today[0]) return { open: false, long: `Zatvoreno · otvaramo u ${today[0]}:00`, short: `od ${today[0]} h` };
    for (let i = 1; i <= 7; i++) {
      const d = (n.day + i) % 7;
      if (HOURS[d]) {
        const when = i === 1 ? 'sutra' : DAYS_ACC[d];
        return { open: false, long: `Zatvoreno · otvaramo ${when} u ${HOURS[d][0]}:00`, short: 'zatvoreno' };
      }
    }
    return { open: false, long: 'Zatvoreno', short: 'zatvoreno' };
  }

  function paintStatus() {
    const s = status();
    $$('[data-status]').forEach(el => (el.textContent = s.long));
    $$('[data-status-short]').forEach(el => (el.textContent = s.short));
    $$('[data-dot]').forEach(el => { el.classList.toggle('is-open', s.open); el.classList.toggle('is-closed', !s.open); });
    const n = zagrebNow();
    $$('[data-hours] tr').forEach(tr => tr.classList.toggle('is-today', +tr.dataset.d === n.day));

    // dnevna ponuda — datum kao na njihovim plakatima
    const chip = $('[data-today]');
    if (chip) {
      if (n.day === 0) {
        const d = new Date(Date.now() + 864e5);
        const dd = String(d.getDate()).padStart(2, '0'), mm = String(d.getMonth() + 1).padStart(2, '0');
        chip.textContent = `${dd}.${mm}.`;
        const txt = $('[data-daily-text]');
        if (txt) txt.textContent = 'Nedjeljom se odmaramo — nova dnevna ponuda stiže već u ponedjeljak ujutro na našoj Facebook stranici. Vidimo se od 11 h!';
      } else {
        chip.textContent = `${n.dd}.${n.mm}.`;
      }
    }
  }
  paintStatus();
  setInterval(paintStatus, 60000);
  $$('[data-year]').forEach(el => (el.textContent = new Date().getFullYear()));

  /* ---------- split naslova u riječi ---------- */
  $$('[data-split]').forEach(el => {
    let i = 0;
    const build = (src, target) => {
      src.childNodes.forEach(node => {
        if (node.nodeType === 3) {
          node.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { target.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span'); w.className = 'w';
            const inner = document.createElement('span'); inner.textContent = part; inner.style.setProperty('--i', i++);
            w.appendChild(inner); target.appendChild(w);
          });
        } else if (node.nodeType === 1) {
          const clone = node.cloneNode(false);
          build(node, clone); target.appendChild(clone);
        }
      });
    };
    const frag = document.createElement('div');
    build(el, frag);
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    el.innerHTML = '';
    [...frag.childNodes].forEach(n => el.appendChild(n));
    el.querySelectorAll('.w').forEach(w => w.setAttribute('aria-hidden', 'true'));
  });

  /* ---------- reveal na skrol ---------- */
  const io = new IntersectionObserver(entries => {
    let k = 0;
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      if (el.classList.contains('reveal') && !el.style.getPropertyValue('--d')) el.style.setProperty('--d', `${Math.min(k++, 5) * 0.09}s`);
      el.classList.add('is-in');
      io.unobserve(el);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  $$('.reveal, .reveal-img, [data-split]').forEach(el => io.observe(el));

  /* ---------- hero: iscrtavanje logotipa + izmjena fotografija ---------- */
  const logo = $('.logo-draw');
  if (logo) {
    $$('.ld-stroke path', logo).forEach(p => p.style.setProperty('--len', Math.ceil(p.getTotalLength()) + 1));
    requestAnimationFrame(() => requestAnimationFrame(() => logo.classList.add('is-drawn')));
  }
  const heroImgs = $$('.hero__img');
  if (heroImgs.length) {
    const first = heroImgs[0];
    if (!reduce) {
      first.classList.remove('is-on');
      void first.offsetWidth;
      requestAnimationFrame(() => first.classList.add('is-on'));
    }
    let hi = 0;
    if (!reduce && heroImgs.length > 1) {
      setInterval(() => {
        if (document.hidden || scrollY > innerHeight) return;
        heroImgs[hi].classList.remove('is-on');
        hi = (hi + 1) % heroImgs.length;
        heroImgs[hi].classList.add('is-on');
      }, 6500);
    }
  }

  /* ---------- navigacija ---------- */
  const nav = $('#nav');
  const burger = $('#burger');
  const menu = $('#menu');
  const setMenu = open => {
    document.body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Zatvori izbornik' : 'Otvori izbornik');
    menu.setAttribute('aria-hidden', !open);
  };
  burger.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
  $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') { setMenu(false); closeLb(); } });

  const navLinks = $$('.nav__links a');
  const secIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      navLinks.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach(s => secIO.observe(s));

  /* ---------- tabovi jelovnika ---------- */
  const tabs = $$('[data-tab]');
  const ink = $('.tabs__ink');
  const tabBar = $('.tabs');
  const moveInk = btn => {
    if (!ink || !btn) return;
    ink.style.width = btn.offsetWidth + 'px';
    ink.style.transform = `translateX(${btn.offsetLeft}px)`;
  };
  const stagger = panel => $$('.dishes li', panel).forEach((li, i) => {
    li.style.animation = 'none'; void li.offsetWidth; li.style.animation = ''; li.style.setProperty('--i', i);
  });
  const activate = (id, focus) => {
    tabs.forEach(t => {
      const on = t.dataset.tab === id;
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
      if (on) { moveInk(t); if (focus) t.focus(); }
    });
    $$('.panel').forEach(p => {
      const on = p.id === 'p-' + id;
      p.hidden = !on;
      p.classList.toggle('is-on', on);
      if (on) { stagger(p); const cap = $('[data-photo-cap]'); if (cap) cap.textContent = p.dataset.cap; }
    });
    $$('.menu__photo img').forEach(img => img.classList.toggle('is-on', img.dataset.for === id));
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => activate(t.dataset.tab));
    t.addEventListener('keydown', e => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (d) { e.preventDefault(); activate(tabs[(i + d + tabs.length) % tabs.length].dataset.tab, true); }
    });
  });
  $$('[data-tab-link]').forEach(a => a.addEventListener('click', () => activate(a.dataset.tabLink)));
  stagger($('.panel.is-on'));
  const syncInk = () => moveInk(tabs.find(t => t.getAttribute('aria-selected') === 'true'));
  addEventListener('resize', syncInk);
  if (document.fonts) document.fonts.ready.then(syncInk);
  syncInk();
  if (tabBar) tabBar.addEventListener('scroll', syncInk, { passive: true });

  /* ---------- citati ---------- */
  const qWrap = $('[data-quotes]');
  if (qWrap) {
    const qs = $$('blockquote', qWrap), dots = $$('.quotes__dots button', qWrap);
    let qi = 0, qt;
    const showQ = i => {
      qi = i;
      qs.forEach((q, k) => q.classList.toggle('is-on', k === i));
      dots.forEach((d, k) => d.classList.toggle('is-on', k === i));
    };
    const loop = () => { clearInterval(qt); qt = setInterval(() => showQ((qi + 1) % qs.length), 6500); };
    dots.forEach((d, k) => d.addEventListener('click', () => { showQ(k); loop(); }));
    if (!reduce) loop();
  }

  /* ---------- brojači ---------- */
  const cIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      cIO.unobserve(e.target);
      const el = e.target, to = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0), from = parseFloat(el.dataset.from || 0);
      const fmt = v => v.toFixed(dec).replace('.', ',');
      if (reduce) { el.textContent = fmt(to); return; }
      const t0 = performance.now(), dur = 1800;
      const step = now => {
        const p = clamp((now - t0) / dur), eased = 1 - Math.pow(1 - p, 4);
        el.textContent = fmt(from + (to - from) * eased);
        if (p < 1) requestAnimationFrame(step);
      };
      el.textContent = fmt(from);
      requestAnimationFrame(step);
    });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach(el => cIO.observe(el));

  /* ---------- blueprint ---------- */
  const bp = $('#blueprint');
  const bpSec = $('#filozofija');
  if (bp) $$('.bp-stroke path', bp).forEach(p => p.style.setProperty('--len', Math.ceil(p.getTotalLength()) + 1));
  const wide = matchMedia('(min-width: 960px)');
  function drawBlueprint() {
    if (!bp) return;
    const vh = innerHeight;
    let p;
    if (wide.matches) {
      const r = bpSec.getBoundingClientRect();
      p = (vh * 0.75 - r.top) / (r.height * 0.55);
    } else {
      const r = bp.getBoundingClientRect();
      p = (vh * 0.92 - r.top) / (r.height * 0.95);
    }
    p = reduce ? 1 : clamp(p);
    bp.style.setProperty('--bp-s', clamp(p / 0.7).toFixed(4));
    bp.style.setProperty('--bp-d', clamp((p - 0.35) / 0.55).toFixed(4));
    bp.style.setProperty('--bp-f', clamp((p - 0.72) / 0.25).toFixed(4));
  }

  /* ---------- paralaksa ---------- */
  const para = $$('[data-speed]');
  function parallax() {
    if (reduce) return;
    const vh = innerHeight;
    para.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      const c = r.top + r.height / 2 - vh / 2;
      el.style.translate = `0 ${(c * parseFloat(el.dataset.speed)).toFixed(1)}px`;
    });
  }

  /* ---------- marquee ---------- */
  const mq = $('[data-marquee]');
  let mqX = 0, mqW = 0, vel = 0;
  if (mq) {
    const html = mq.innerHTML;
    mq.innerHTML = html + html + html;
    const measure = () => { mqW = mq.scrollWidth / 3; };
    measure();
    addEventListener('resize', measure);
    if (document.fonts) document.fonts.ready.then(measure);
  }

  /* ---------- galerija ---------- */
  const gal = $('#galerija');
  const track = $('[data-gallery]');
  const gbar = $('[data-gbar]');
  const galWide = matchMedia('(min-width: 900px)');
  let galMax = 0;
  function setupGallery() {
    if (!gal || !track) return;
    if (galWide.matches && !reduce) {
      gal.classList.add('is-pinned');
      track.style.transform = '';
      const pad = parseFloat(getComputedStyle(track).paddingLeft) || 0;
      galMax = Math.max(0, track.scrollWidth - innerWidth + pad);
      gal.style.setProperty('--gh', `${galMax + innerHeight}px`);
    } else {
      gal.classList.remove('is-pinned');
      gal.style.removeProperty('--gh');
      track.style.transform = '';
    }
    galleryScroll();
  }
  function galleryScroll() {
    if (!gal) return;
    let p;
    if (gal.classList.contains('is-pinned')) {
      const r = gal.getBoundingClientRect();
      p = clamp(-r.top / (r.height - innerHeight || 1));
      track.style.transform = `translate3d(${(-p * galMax).toFixed(1)}px,0,0)`;
    } else {
      const max = track.scrollWidth - track.clientWidth;
      p = max > 0 ? track.scrollLeft / max : 0;
    }
    if (gbar) gbar.style.setProperty('--gp', (0.08 + p * 0.92).toFixed(3));
  }
  if (track) {
    track.addEventListener('scroll', galleryScroll, { passive: true });
    // slike u galeriji učitaj malo prije nego što sekcija dođe na ekran
    const gIO = new IntersectionObserver(es => {
      if (es.some(e => e.isIntersecting)) { $$('img', track).forEach(img => (img.loading = 'eager')); gIO.disconnect(); }
    }, { rootMargin: '900px 0px' });
    gIO.observe(gal);
    $$('img', track).forEach(img => img.addEventListener('load', setupGallery, { once: true }));
  }
  setupGallery();
  addEventListener('resize', setupGallery);
  galWide.addEventListener?.('change', setupGallery);

  /* ---------- lightbox ---------- */
  const lb = $('#lb');
  const lbImg = $('.lb__fig img', lb);
  const lbCap = $('.lb__fig figcaption', lb);
  const lbCount = $('.lb__count', lb);
  const items = $$('[data-lb]').map(b => ({ src: $('img', b).currentSrc || $('img', b).src, alt: $('img', b).alt, cap: b.parentElement.querySelector('figcaption')?.textContent || '' }));
  let li = 0;
  const showLb = i => {
    li = (i + items.length) % items.length;
    const it = items[li];
    lbImg.classList.remove('is-loaded');
    lbImg.onload = () => lbImg.classList.add('is-loaded');
    lbImg.src = it.src; lbImg.alt = it.alt;
    if (lbImg.complete) lbImg.classList.add('is-loaded');
    lbCap.textContent = it.cap;
    lbCount.textContent = `${li + 1} / ${items.length}`;
  };
  function openLb(i) { showLb(i); lb.classList.add('is-open'); lb.setAttribute('aria-hidden', 'false'); root.style.overflow = 'hidden'; document.body.classList.add('lb-open'); $('.lb__close', lb).focus({ preventScroll: true }); }
  function closeLb() { if (!lb.classList.contains('is-open')) return; lb.classList.remove('is-open'); lb.setAttribute('aria-hidden', 'true'); root.style.overflow = ''; document.body.classList.remove('lb-open'); }
  $$('[data-lb]').forEach(b => b.addEventListener('click', () => openLb(+b.dataset.lb)));
  $('.lb__close', lb).addEventListener('click', closeLb);
  $('.lb__nav--prev', lb).addEventListener('click', () => showLb(li - 1));
  $('.lb__nav--next', lb).addEventListener('click', () => showLb(li + 1));
  lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
  addEventListener('keydown', e => {
    if (!lb.classList.contains('is-open')) return;
    if (e.key === 'ArrowLeft') showLb(li - 1);
    if (e.key === 'ArrowRight') showLb(li + 1);
  });
  let tx = 0, ty = 0;
  lb.addEventListener('touchstart', e => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
  lb.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) showLb(li + (dx < 0 ? 1 : -1));
    else if (dy > 90) closeLb();
  }, { passive: true });

  /* ---------- dock (mobitel) ---------- */
  const dock = $('#dock');

  /* ---------- glavna petlja skrola ---------- */
  let lastY = scrollY, ticking = false, navHideAt = 0;
  function onFrame() {
    ticking = false;
    const y = scrollY;
    const dy = y - lastY;
    vel = vel * 0.85 + dy * 0.15;
    lastY = y;
    nav.classList.toggle('is-solid', y > 40);
    if (!document.body.classList.contains('menu-open')) {
      if (y > innerHeight * 0.9 && dy > 6 && y > navHideAt + 60) nav.classList.add('is-hidden');
      if (dy < -6 || y < innerHeight * 0.9) { nav.classList.remove('is-hidden'); navHideAt = y; }
    }
    if (dock) dock.classList.toggle('is-on', y > innerHeight * 0.55);
    drawBlueprint();
    parallax();
    galleryScroll();
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onFrame); } }, { passive: true });
  addEventListener('resize', () => requestAnimationFrame(onFrame));
  onFrame();

  // stalna petlja samo za marquee (lagano)
  if (mq && !reduce) {
    let last = performance.now();
    const tick = now => {
      const dt = Math.min(64, now - last); last = now;
      vel *= 0.92;
      const speed = 0.045 + Math.min(1.6, Math.abs(vel) * 0.02);
      mqX -= speed * dt;
      if (mqW && mqX <= -mqW) mqX += mqW;
      mq.style.transform = `translate3d(${mqX.toFixed(2)}px,0,0)`;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ---------- desktop: tilt, magnet, kursor ---------- */
  if (fine && !reduce) {
    $$('[data-tilt]').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(1100px) rotateY(${(x * 7).toFixed(2)}deg) rotateX(${(-y * 7).toFixed(2)}deg)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transition = 'transform .8s cubic-bezier(.22,.8,.2,1)'; el.style.transform = ''; setTimeout(() => (el.style.transition = ''), 800); });
    });
    $$('[data-magnet]').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        el.style.translate = `${((e.clientX - r.left - r.width / 2) * 0.18).toFixed(1)}px ${((e.clientY - r.top - r.height / 2) * 0.25).toFixed(1)}px`;
      });
      el.addEventListener('pointerleave', () => (el.style.translate = ''));
    });
    const cur = $('.cursor');
    let cx = innerWidth / 2, cy = innerHeight / 2, px = cx, py = cy;
    addEventListener('pointermove', e => { px = e.clientX; py = e.clientY; cur.classList.add('is-on'); cur.classList.toggle('is-hover', !!e.target.closest('a, button')); }, { passive: true });
    document.addEventListener('pointerleave', () => cur.classList.remove('is-on'));
    const follow = () => { cx += (px - cx) * 0.2; cy += (py - cy) * 0.2; cur.style.transform = `translate3d(${cx}px,${cy}px,0)`; requestAnimationFrame(follow); };
    requestAnimationFrame(follow);
  }
})();
