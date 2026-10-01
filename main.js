/* Hista Digital — Konzept „Die Wabe" · main.js
   Ein Takt (rAF ODER setTimeout), Reveal additiv, Grundzustand immer lesbar. */
(function () {
  const doc = document.documentElement;
  doc.classList.add('js');
  const reduziert = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const istMobil = () => innerWidth < 960;

  /* ---------- Intro ---------- */
  const intro = document.getElementById('intro');
  if (intro) {
    if (sessionStorage.getItem('hista-intro') || reduziert) {
      intro.classList.add('zu');
    } else {
      requestAnimationFrame(() => intro.classList.add('los'));
      setTimeout(() => { intro.classList.add('zu'); sessionStorage.setItem('hista-intro', '1'); }, 1900);
    }
  }

  /* ---------- Kopf ---------- */
  const kopf = document.querySelector('.kopf');
  const setzKopf = () => kopf && kopf.classList.toggle('fest', scrollY > 24 || document.body.classList.contains('menu-offen'));
  setzKopf();
  addEventListener('scroll', setzKopf, { passive: true });

  const burger = document.querySelector('.burger');
  const menu = document.getElementById('mobilmenu');
  if (burger && menu) {
    const schliessen = () => { menu.classList.remove('offen'); document.body.classList.remove('menu-offen'); burger.setAttribute('aria-expanded', 'false'); setzKopf(); };
    burger.addEventListener('click', () => {
      const offen = !menu.classList.contains('offen');
      menu.classList.toggle('offen', offen); document.body.classList.toggle('menu-offen', offen);
      burger.setAttribute('aria-expanded', String(offen)); setzKopf();
    });
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', schliessen));
    addEventListener('keydown', e => { if (e.key === 'Escape') schliessen(); });
  }

  /* ---------- Hero-Video: Pause-Knopf ---------- */
  document.querySelectorAll('.hero').forEach(hero => {
    const v = hero.querySelector('video'), p = hero.querySelector('.pause');
    if (!v || !p) return;
    if (reduziert) { v.pause(); } else { const pl = v.play(); if (pl && pl.catch) pl.catch(() => {}); }
    p.addEventListener('click', () => {
      if (v.paused) { v.play(); p.setAttribute('aria-pressed', 'false'); p.innerHTML = ICON_PAUSE; }
      else { v.pause(); p.setAttribute('aria-pressed', 'true'); p.innerHTML = ICON_PLAY; }
    });
  });
  const ICON_PAUSE = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>';
  const ICON_PLAY = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l12-7.5z"/></svg>';

  /* ---------- Reveal (additiv, Sicherheitsnetz) ---------- */
  const rv = [...document.querySelectorAll('.rv')];
  if ('IntersectionObserver' in window && !reduziert) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('an'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    rv.forEach(el => io.observe(el));
    setTimeout(() => rv.forEach(el => { const r = el.getBoundingClientRect(); if (r.top < innerHeight) el.classList.add('an'); }), 1200);
  } else rv.forEach(el => el.classList.add('an'));

  /* ---------- Die Wabe im Hero: Kandidat rastet ein ---------- */
  const wabe = document.querySelector('.wabe');
  if (wabe) {
    const zellen = [...wabe.querySelectorAll('.zelle')];
    const kand = wabe.querySelector('.kandidat');
    const pruef = wabe.querySelector('.prueft');
    const schild = wabe.querySelector('.schild.kand');
    const motive = JSON.parse(wabe.dataset.motive || '[]');
    const start = { x: +kand.dataset.x, y: +kand.dataset.y };
    let leere = zellen.filter(z => z.classList.contains('luecke'));
    let runde = 0, timer = null;
    const setzLuecke = () => {
      zellen.forEach(z => z.classList.remove('luecke'));
      const frei = zellen.filter(z => !z.classList.contains('voll'));
      if (!frei.length) { zellen.forEach(z => z.classList.remove('voll')); return setzLuecke(); }
      const z = frei[Math.floor(Math.random() * frei.length)];
      z.classList.add('luecke'); return z;
    };
    let ziel = leere[0] || setzLuecke();
    const takt = () => {
      if (document.hidden) { timer = setTimeout(takt, 800); return; }
      // 1 · Kandidat erscheint rechts oben, wird geprüft
      kand.classList.remove('weg', 'hinein'); kand.classList.add('warten');
      if (schild) schild.textContent = motive[runde % motive.length] || '';
      setTimeout(() => { kand.classList.remove('warten'); pruef.classList.add('an'); }, 60);
      // 2 · Passung: fährt in die Lücke
      setTimeout(() => {
        pruef.classList.remove('an');
        const dx = (+ziel.dataset.x) - start.x, dy = (+ziel.dataset.y) - start.y;
        kand.style.setProperty('--dx', dx + 'px'); kand.style.setProperty('--dy', dy + 'px');
        kand.classList.add('hinein');
      }, 1500);
      // 3 · Zelle wird voll, Kandidat verschwindet, neue Lücke
      setTimeout(() => {
        ziel.classList.remove('luecke'); ziel.classList.add('voll');
        kand.classList.add('weg');
        ziel = setzLuecke(); runde++;
      }, 2700);
      timer = setTimeout(takt, 4600);
    };
    if (!reduziert) takt(); else { kand.classList.add('warten'); }
  }


  /* ---------- Scroll-Leiste (Gold) ---------- */
  const leiste = document.querySelector('.scroll-leiste');
  if (leiste) {
    const setzLeiste = () => { const d = document.documentElement.scrollHeight - innerHeight; doc.style.setProperty('--scroll', (d > 0 ? scrollY / d : 0).toFixed(4)); };
    addEventListener('scroll', setzLeiste, { passive: true }); addEventListener('resize', setzLeiste); setzLeiste();
  }

  /* ---------- Bühne: öffnet sich beim Scrollen (clip-path) ---------- */
  document.querySelectorAll('.buehne').forEach(b => {
    if (reduziert || istMobil()) { b.style.clipPath = 'none'; return; }
    let warte = false;
    const mess = () => {
      warte = false;
      const r = b.getBoundingClientRect(), h = innerHeight;
      const k = Math.max(0, Math.min(1, (h * .9 - r.top) / (h * .65)));
      b.style.clipPath = `inset(0 ${(6 * (1 - k)).toFixed(2)}% round 24px)`;
    };
    addEventListener('scroll', () => { if (!warte) { warte = true; requestAnimationFrame(mess); } }, { passive: true });
    addEventListener('resize', mess); mess();
  });

  /* ---------- Der Regler: 5 % (Jobportal) → 100 % (Motiv), ziehbar, Tastatur ---------- */
  document.querySelectorAll('.regler').forEach(regler => {
    const buehne = regler.closest('.buehne');
    const bahnR = regler.querySelector('.bahn'); if (bahnR) regler.style.setProperty('--bahn-l', bahnR.getTotalLength().toFixed(1));
    const wert = regler.querySelector('.wert'), label = regler.querySelector('.wert-label');
    const stufen = JSON.parse(regler.dataset.stufen || '[]');
    let p = .05, hand = false;
    const setz = (n) => {
      p = Math.max(.05, Math.min(1, n));
      regler.style.setProperty('--p', p.toFixed(3));
      const g = Math.round(p * 100);
      wert.textContent = g + '%'; regler.setAttribute('aria-valuenow', g);
      label.textContent = p < .34 ? stufen[0] : p < .67 ? stufen[1] : stufen[2];
      if (buehne) buehne.classList.toggle('reg-links', p < .34);
    };
    const winkel = (ev) => {
      const r = regler.getBoundingClientRect();
      const x = ev.clientX - (r.left + r.width / 2), y = ev.clientY - (r.top + r.height / 2);
      let a = Math.atan2(y, x) * 180 / Math.PI; a = (a + 90 + 360) % 360; if (a > 180) a -= 360;
      return Math.max(0, Math.min(1, (a + 135) / 270));
    };
    regler.addEventListener('pointerdown', ev => { hand = true; regler.setPointerCapture(ev.pointerId); setz(winkel(ev)); });
    regler.addEventListener('pointermove', ev => { if (hand) setz(winkel(ev)); });
    const los = () => { hand = false; };
    regler.addEventListener('pointerup', los); regler.addEventListener('pointercancel', los);
    regler.addEventListener('keydown', ev => {
      if (['ArrowRight', 'ArrowUp'].includes(ev.key)) { setz(p + .05); ev.preventDefault(); }
      if (['ArrowLeft', 'ArrowDown'].includes(ev.key)) { setz(p - .05); ev.preventDefault(); }
    });
    setz(.05);
    // Dreht sich von selbst auf, sobald er im Bild ist — danach ruht er, bis man ihn anfasst
    let los2 = false;
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (los2 || !(e.isIntersecting || e.boundingClientRect.bottom < 0)) return; los2 = true;
      const t0 = performance.now(), dauer = reduziert ? 1 : 2600, von = p, bis = 1;
      const tick = (t) => { if (hand) return; const k = Math.min(1, (t - t0) / dauer); setz(von + (bis - von) * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(tick); };
      setTimeout(() => requestAnimationFrame(tick), 500);
    }), { threshold: [0, .4] });
    io.observe(regler);
  });

  /* ---------- Tickets: erscheinen nacheinander, danach kommt alle 5 s ein neuer oben an ---------- */
  document.querySelectorAll('.tickets').forEach(tk => {
    const box = tk.closest('.ankunft, .zelle') || tk;
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return; io.disconnect(); box.classList.add('sichtbar');
      if (reduziert) return;
      const neu = () => { if (document.hidden) return; const l = tk.lastElementChild; l.classList.remove('neu'); tk.prepend(l); void l.offsetWidth; l.classList.add('neu'); };
      setTimeout(() => setInterval(neu, 5000), 2600);
    }), { threshold: .3 });
    io.observe(box);
  });

  /* ---------- Fünf Wege: Striche beim Erscheinen ---------- */
  const wege = document.querySelectorAll('.weg');
  if (wege.length && 'IntersectionObserver' in window) {
    const echte = [...wege].filter(w => !w.classList.contains('ende'));
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { const k = echte.indexOf(e.target); setTimeout(() => e.target.classList.add('gestrichen'), 200 + 160 * k); if (k === echte.length - 1) setTimeout(() => e.target.closest('.wege').classList.add('fertig'), 200 + 160 * k + 500); io.unobserve(e.target); } }), { threshold: .4 });
    echte.forEach(w => io.observe(w));
  }

  /* ---------- System-Bühne: Reiter mit Selbstlauf ---------- */
  const reiter = [...document.querySelectorAll('.system-reiter button')];
  const tafeln = [...document.querySelectorAll('.system-tafel')];
  if (reiter.length && tafeln.length) {
    let i = 0, auto = null, hand = false;
    const zeig = (n) => {
      i = n;
      reiter.forEach((r, k) => { r.classList.toggle('aktiv', k === n); r.setAttribute('aria-selected', String(k === n)); const l = r.querySelector('.lauf'); if (l) { l.style.animation = 'none'; void l.offsetWidth; l.style.animation = ''; } });
      tafeln.forEach((t, k) => t.classList.toggle('aktiv', k === n));
      const url = new URL(location.href); if (hand) history.replaceState(null, '', '#' + tafeln[n].id);
    };
    const weiter = () => { if (!document.hidden && !hand) zeig((i + 1) % reiter.length); auto = setTimeout(weiter, 6000); };
    reiter.forEach((r, k) => r.addEventListener('click', () => { hand = true; zeig(k); clearTimeout(auto); }));
    const h = location.hash.slice(1); const k0 = tafeln.findIndex(t => t.id === h);
    zeig(k0 >= 0 ? k0 : 0);
    if (k0 >= 0) hand = true; else if (!reduziert) auto = setTimeout(weiter, 6000);
    addEventListener('hashchange', () => { const k = tafeln.findIndex(t => t.id === location.hash.slice(1)); if (k >= 0) { hand = true; zeig(k); } });
    document.querySelectorAll('[data-tafel]').forEach(a => a.addEventListener('click', e => { const k = tafeln.findIndex(t => t.id === a.dataset.tafel); if (k < 0) return; e.preventDefault(); hand = true; zeig(k); clearTimeout(auto); history.replaceState(null, '', '#' + a.dataset.tafel); document.getElementById('system').scrollIntoView({ behavior: reduziert ? 'auto' : 'smooth', block: 'start' }); }));
  }

  /* ---------- Motiv-Wähler ---------- */
  const motiv = document.querySelector('.motiv');
  if (motiv) {
    const chips = [...motiv.querySelectorAll('.motiv-chips button')];
    const T = JSON.parse(motiv.dataset.texte);
    const titel = motiv.querySelector('.anzeige .titel'), text = motiv.querySelector('.anzeige .text p'), leer = motiv.querySelector('.anzeige .leer');
    const mQuote = motiv.querySelector('[data-mess="relevanz"]'), mMotive = motiv.querySelector('[data-mess="motive"]');
    const zeichne = () => {
      const an = chips.filter(c => c.classList.contains('an')).map(c => c.dataset.motiv);
      if (!an.length) { leer.hidden = false; titel.innerHTML = T.beruf; text.textContent = ''; mQuote.textContent = '–'; mMotive.textContent = '0'; return; }
      leer.hidden = true;
      const erste = T.motive[an[0]], zweite = an[1] ? T.motive[an[1]] : null;
      titel.innerHTML = T.beruf + ': <em>' + erste.titel + '</em>' + (zweite ? ' · ' + zweite.titel : '');
      text.textContent = an.slice(0, 3).map(m => T.motive[m].satz).join(' ');
      const rel = Math.min(96, 38 + an.length * 14);
      mQuote.textContent = rel + ' %'; mMotive.textContent = String(an.length);
    };
    chips.forEach(c => c.addEventListener('click', () => { c.classList.toggle('an'); c.setAttribute('aria-pressed', c.classList.contains('an')); zeichne(); }));
    zeichne();
  }

  /* ---------- Zahlen zählen hoch ---------- */
  const zahlen = document.querySelectorAll('.zahl b[data-ziel]');
  if (zahlen.length && 'IntersectionObserver' in window && !reduziert) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return; io.unobserve(e.target);
      const el = e.target, ziel = +el.dataset.ziel, nach = el.dataset.nach || '', vor = el.dataset.vor || '';
      const t0 = performance.now(), dauer = 1400;
      const tick = (t) => { const p = Math.min(1, (t - t0) / dauer), w = Math.round(ziel * (1 - Math.pow(1 - p, 3))); el.innerHTML = vor + w + '<small>' + nach + '</small>'; if (p < 1) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    }), { threshold: .5 });
    zahlen.forEach(z => io.observe(z));
  }

  /* ---------- Ablauf-Bahn: Fortschritt aus dem Scrollweg ---------- */
  const bahn = document.querySelector('.bahn');
  if (bahn) {
    const stationen = [...bahn.querySelectorAll('.station')];
    const mess = () => {
      const r = bahn.getBoundingClientRect(); const h = innerHeight;
      const p = Math.max(0, Math.min(1, (h * .82 - r.top) / (h * .55)));
      bahn.style.setProperty('--p', p.toFixed(3));
      bahn.classList.toggle('laeuft', p >= .985);
      stationen.forEach((s, k) => s.classList.toggle('erreicht', p >= (k + .5) / stationen.length));
    };
    let warte = false;
    const plan = () => { if (warte) return; warte = true; requestAnimationFrame(() => { mess(); warte = false; }); };
    addEventListener('scroll', plan, { passive: true }); addEventListener('resize', plan); mess();
    if (reduziert) { bahn.style.setProperty('--p', '1'); bahn.classList.add('laeuft'); stationen.forEach(s => s.classList.add('erreicht')); }
  }

  /* ---------- Parallaxe: Anzeigen driften gegeneinander ---------- */
  const par = [...document.querySelectorAll('.par')];
  if (par.length && !reduziert) {
    let warte2 = false;
    const lauf = () => { if (warte2) return; warte2 = true; requestAnimationFrame(() => { par.forEach(el => { const r = el.parentElement.getBoundingClientRect(); const p = (innerHeight / 2 - (r.top + r.height / 2)) / innerHeight; el.style.setProperty('--py', (p * +el.dataset.par).toFixed(1) + 'px'); }); warte2 = false; }); };
    addEventListener('scroll', lauf, { passive: true }); lauf();
  }

  /* ---------- Statement: wortweise Füllung (scroll-text: Messung am Element, Bildmitte) ---------- */
  const st = document.querySelector('.statement');
  if (st) {
    const worte = [...st.querySelectorAll('.w')];
    const mess = () => {
      const r = st.getBoundingClientRect(); const mitte = innerHeight * .5;
      // fertig, sobald der Block ganz im Bild steht; nur vorwärts
      let p = (mitte - r.top) / Math.max(1, r.height); p = Math.max(0, Math.min(1, p * 1.15));
      if (r.bottom <= innerHeight && r.top >= 0) p = 1;
      const n = Math.round(p * worte.length);
      worte.forEach((w, k) => { if (k < n) w.classList.add('an'); });
    };
    addEventListener('scroll', mess, { passive: true }); mess();
    if (reduziert) worte.forEach(w => w.classList.add('an'));
  }

  /* ---------- Formular (Attrappe) + Chips ---------- */
  document.querySelectorAll('.formular').forEach(f => {
    f.querySelectorAll('.chips button').forEach(b => b.addEventListener('click', () => { b.classList.toggle('an'); b.setAttribute('aria-pressed', b.classList.contains('an')); }));
    const senden = f.querySelector('[data-senden]');
    if (senden) senden.addEventListener('click', () => { f.classList.add('gesendet'); f.querySelector('.danke').scrollIntoView({ block: 'center', behavior: reduziert ? 'auto' : 'smooth' }); });
  });

  /* ---------- Jahr ---------- */
  document.querySelectorAll('[data-jahr]').forEach(e => e.textContent = new Date().getFullYear());
})();
