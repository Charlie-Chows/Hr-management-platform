/* js/dashboard.js — shared logic for user.html & admin.html */
(() => {
  'use strict';
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  const body = document.body;
  const NOT_FOUND = '../404.html';
  const SVGNS = 'http://www.w3.org/2000/svg';
  const nums = (s) => (s || '').split(',').map(Number);
  const strs = (s) => (s || '').split(',');

  /* ---------- Stored Login Identity ---------- */
  try {
    let email = null;
    let username = null;

    // Primary: what login.html writes.
    const raw = localStorage.getItem('stackly_session');
    if (raw) {
      try {
        const s = JSON.parse(raw);
        if (s && typeof s === 'object') {
          email    = s.email    || null;
          username = s.username || null;
        }
      } catch (e) { /* stored value was not JSON — ignore */ }
    }

    // Fallback: older plain-string key.
    if (!email) {
      const legacy = localStorage.getItem('stackly_user_email');
      if (legacy) email = legacy;
    }

    if (email) {
      body.dataset.email = email;
      const local = (username || email.split('@')[0] || '').trim();
      if (local) body.dataset.name = local;
    }
  } catch (e) {}

  /* ---------- Identity ---------- */
  const name  = body.dataset.name  || '';
  const email = body.dataset.email || '';

  // Split on spaces, dots, underscores, dashes, plus signs — so "priya.raman" → ["priya","raman"]
  const nameParts = name.split(/[._\-+\s]+/).filter(Boolean);

  document.querySelectorAll('.js-name').forEach(el => (el.textContent = name));

  // "Hello yourmail" — the raw local part of the email, no prettifying.
  document.querySelectorAll('.js-first').forEach(el => {
    el.textContent = nameParts[0] || name || '';
  });

  document.querySelectorAll('.js-email').forEach(el => (el.textContent = email));

  document.querySelectorAll('.js-initial').forEach(el => {
    const initials = nameParts.length >= 2
      ? (nameParts[0][0] + nameParts[1][0]).toUpperCase()
      : (nameParts[0] ? nameParts[0].slice(0, 2) : 'U').toUpperCase();
    el.textContent = initials;
  });

  document.querySelectorAll('.header-profile').forEach(el => el.setAttribute('title', email));

  /* ---------- Build charts (static structure) ---------- */
  document.querySelectorAll('.spark').forEach(svg => {
    const v = nums(svg.dataset.values), max = Math.max(...v), min = Math.min(...v);
    const d = v.map((n, i) => `${i ? 'L' : 'M'}${(i / (v.length - 1)) * 84},${28 - ((n - min) / (max - min || 1)) * 26}`).join(' ');
    svg.setAttribute('viewBox', '0 0 84 30');
    svg.innerHTML = `<path d="${d}"/>`;
  });

  document.querySelectorAll('.bar-chart').forEach(chart => {
    const v = nums(chart.dataset.values), labels = strs(chart.dataset.labels), alt = nums(chart.dataset.alt || '');
    const max = Math.max(...v) * 1.1;
    chart.innerHTML = v.map((n, i) => `<div class="bar-col"><div class="bar${alt.includes(i) ? ' alt' : ''}" data-v="${n}${chart.dataset.unit || ''}" data-h="${(n / max) * 100}"></div></div>`).join('');
    const x = document.createElement('div');
    x.className = 'bar-x';
    x.innerHTML = labels.map(l => `<span>${l}</span>`).join('');
    chart.after(x);
  });

  document.querySelectorAll('svg.line-chart').forEach(svg => {
    const W = 600, H = 220, P = 24;
    const sets = [nums(svg.dataset.values)];
    if (svg.dataset.values2) sets.push(nums(svg.dataset.values2));
    const labels = strs(svg.dataset.labels);
    const all = sets.flat(), max = Math.max(...all) * 1.1, min = Math.min(...all) * .85;
    const pt = (n, i, len) => [P + (i / (len - 1)) * (W - P * 2), H - P - ((n - min) / (max - min)) * (H - P * 2)];
    let html = `<defs><linearGradient id="areaGrad" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#A0784A" stop-opacity=".35"/><stop offset="1" stop-color="#A0784A" stop-opacity="0"/></linearGradient></defs>`;
    for (let g = 0; g < 4; g++) { const y = P + g * ((H - P * 2) / 3); html += `<line class="grid-line" x1="${P}" x2="${W - P}" y1="${y}" y2="${y}"/>`; }
    sets.forEach((v, si) => {
      const pts = v.map((n, i) => pt(n, i, v.length));
      const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
      if (si === 0) html += `<path class="area" d="${d} L${W - P},${H - P} L${P},${H - P} Z"/>`;
      html += `<path class="line${si ? ' alt' : ''}" d="${d}"/>`;
      if (si === 0) pts.forEach(p => (html += `<circle class="dot" r="3.5" cx="${p[0]}" cy="${p[1]}"/>`));
    });
    labels.forEach((l, i) => { const x = P + (i / (labels.length - 1)) * (W - P * 2); html += `<text class="x-label" x="${x}" y="${H - 4}" text-anchor="middle">${l}</text>`; });
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.innerHTML = html;
  });

  document.querySelectorAll('.donut').forEach(d => {
    const v = nums(d.dataset.values), colors = strs(d.dataset.colors);
    const total = v.reduce((a, b) => a + b, 0), C = 2 * Math.PI * 52;
    let offset = 0, circles = '<circle class="track" cx="75" cy="75" r="52"/>';
    v.forEach((n, i) => {
      const len = (n / total) * C;
      circles += `<circle cx="75" cy="75" r="52" stroke="${colors[i]}" stroke-dasharray="0 ${C}" stroke-dashoffset="${-offset}" data-len="${len}" data-c="${C}"/>`;
      offset += len;
    });
    d.insertAdjacentHTML('afterbegin', `<svg viewBox="0 0 150 150">${circles}</svg>`);
  });

  document.querySelectorAll('.ring').forEach(r => {
    r.insertAdjacentHTML('afterbegin', `<svg viewBox="0 0 120 120"><circle class="track" cx="60" cy="60" r="50"/><circle class="val" cx="60" cy="60" r="50"/></svg>`);
  });

  document.querySelectorAll('.heatmap').forEach(h => {
    let seed = Number(h.dataset.seed || 7);
    const rand = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    h.innerHTML = Array.from({ length: 70 }, (_, i) => `<span data-l="${(i % 7 > 4) ? 0 : Math.floor(rand() * 4)}" style="transition-delay:${i * 8}ms"></span>`).join('');
  });

  /* ---------- Animate a section ---------- */
  function animate(section) {
    const reset = () => {
      section.querySelectorAll('.bar').forEach(b => (b.style.height = '0'));
      section.querySelectorAll('.fill').forEach(f => (f.style.width = '0'));
      section.querySelectorAll('.donut circle[data-len]').forEach(c => c.setAttribute('stroke-dasharray', `0 ${c.dataset.c}`));
      section.querySelectorAll('.ring .val').forEach(c => (c.style.strokeDasharray = '0 999'));
      section.querySelectorAll('.heatmap').forEach(h => h.classList.remove('on'));
      section.querySelectorAll('svg.line-chart').forEach(svg => {
        svg.classList.remove('drawn');
        svg.querySelectorAll('.line').forEach(p => { const L = p.getTotalLength(); p.style.transition = 'none'; p.style.strokeDasharray = `${L}`; p.style.strokeDashoffset = `${L}`; });
      });
    };
    reset();
    requestAnimationFrame(() => requestAnimationFrame(() => {
      section.querySelectorAll('.bar').forEach((b, i) => { b.style.transitionDelay = `${i * 50}ms`; b.style.height = b.dataset.h + '%'; });
      section.querySelectorAll('.fill').forEach(f => (f.style.width = f.dataset.w + '%'));
      section.querySelectorAll('.donut circle[data-len]').forEach(c => c.setAttribute('stroke-dasharray', `${c.dataset.len} ${c.dataset.c}`));
      section.querySelectorAll('.ring').forEach(r => { const C = 2 * Math.PI * 50; r.querySelector('.val').style.strokeDasharray = `${(r.dataset.v / 100) * C} ${C}`; });
      section.querySelectorAll('.heatmap').forEach(h => h.classList.add('on'));
      section.querySelectorAll('svg.line-chart').forEach(svg => {
        svg.classList.add('drawn');
        svg.querySelectorAll('.line').forEach(p => {
          p.style.transition = 'stroke-dashoffset 1.6s cubic-bezier(.2,.8,.2,1)';
          p.style.strokeDashoffset = '0';
          if (p.classList.contains('alt')) setTimeout(() => (p.style.strokeDasharray = '5 5'), 1650);
        });
      });
      section.querySelectorAll('[data-count]').forEach(el => {
        const target = Number(el.dataset.count), dec = (el.dataset.count.split('.')[1] || '').length;
        const pre = el.dataset.prefix || '', suf = el.dataset.suffix || '', start = performance.now();
        const tick = (t) => {
          const k = Math.min((t - start) / 1200, 1), e = 1 - Math.pow(1 - k, 3);
          el.textContent = pre + (target * e).toLocaleString('en-IN', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suf;
          if (k < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    }));
  }

  /* ---------- Navigation ---------- */
  const links = [...document.querySelectorAll('.side-link')];
  const sections = [...document.querySelectorAll('.data-section')];

  function show(id, push = true) {
    const target = sections.find(s => s.id === id) || sections[0];
    sections.forEach(s => s.classList.toggle('is-active', s === target));
    links.forEach(l => {
      const on = l.dataset.target === target.id;
      l.classList.toggle('is-active', on);
      if (on) l.setAttribute('aria-current', 'page'); else l.removeAttribute('aria-current');
    });
    if (push) history.replaceState(null, '', '#' + target.id);
    window.scrollTo({ top: 0, behavior: 'auto' });
    animate(target);
    closeNav();
  }

  links.forEach(l => l.addEventListener('click', () => show(l.dataset.target)));

  // Always open the first data-section on page load / logo reload
  history.replaceState(null, '', location.pathname);
  show(sections[0].id, false);

  /* ---------- Mobile nav ---------- */
  const burger = document.querySelector('.nav-burger');
  function closeNav() { body.classList.remove('nav-open'); burger && burger.setAttribute('aria-expanded', 'false'); }
  burger && burger.addEventListener('click', () => {
    const open = body.classList.toggle('nav-open');
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  document.querySelector('.nav-overlay')?.addEventListener('click', closeNav);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeNav(); });
  window.addEventListener('resize', () => { if (window.innerWidth > 1024) closeNav(); });

  /* ---------- All buttons inside data-sections → 404 ---------- */
  document.querySelectorAll('.data-section button, .data-section a').forEach(el => {
    el.addEventListener('click', e => { e.preventDefault(); window.location.href = NOT_FOUND; });
  });
})();