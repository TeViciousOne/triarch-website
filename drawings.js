/* Generates architectural line drawings, renders and "site photos" as SVG, so the preview needs no image files.
   Each image is deterministic: the same seed always gives the same building. */
(function () {
  function rng(seed) {
    let a = (seed * 2654435761) >>> 0;
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const pick = (r, n) => Math.floor(r() * n);

  /* Builds the volumes of a building from a seed. Shared by elevation and render. */
  function volumes(seed) {
    const r = rng(seed);
    const count = 2 + pick(r, 2);
    const out = [];
    let x = 135 + pick(r, 50);
    for (let i = 0; i < count; i++) {
      const w = 150 + pick(r, 120);
      const h = 80 + pick(r, 130);
      out.push({ x, w, h, roof: pick(r, 3), cols: Math.max(2, Math.floor(w / 62)), rows: Math.max(1, Math.floor(h / 76)), ribbon: r() > 0.55, door: i === 0 || r() > 0.7 });
      x += w - 10 + pick(r, 50) * (i % 2 ? -0.3 : 1);
    }
    const start = out[0].x, end = out[out.length - 1].x + out[out.length - 1].w;
    if (end > 735) {
      const k = (735 - start) / (end - start);
      out.forEach((v) => { v.x = start + (v.x - start) * k; v.w *= k; v.cols = Math.max(2, Math.floor(v.w / 62)); });
    }
    return out;
  }

  const GROUND = 410;

  function elevation(seed, trace) {
    const t = trace ? ' pathLength="1" class="tr"' : "";
    const fl = trace ? ' class="fl"' : "";
    const TINTS = ["#d9c9a6", "#c9a77c", "#c98f70", "#b9c29b"];
    const r = rng(seed + 99);
    let s = "", fills = "";
    const vols = volumes(seed);
    s += `<line x1="40" y1="${GROUND}" x2="760" y2="${GROUND}" stroke-width="2"${t}/>`;
    for (let x = 50; x < 750; x += 22) s += `<line x1="${x}" y1="${GROUND + 4}" x2="${x - 10}" y2="${GROUND + 14}" stroke-width=".8" opacity=".5"/>`;
    let maxTop = GROUND;
    vols.forEach((v, i) => {
      const top = GROUND - v.h;
      maxTop = Math.min(maxTop, top);
      const right = v.x + v.w;
      const tint = TINTS[(i + seed) % TINTS.length];
      const paint = `fill="${tint}" fill-opacity=".6" stroke="none"${fl}`;
      if (v.roof === 0) {
        fills += `<rect x="${v.x}" y="${top}" width="${v.w}" height="${v.h}" ${paint}/>`;
        s += `<rect x="${v.x}" y="${top}" width="${v.w}" height="${v.h}"${t}/>`;
        s += `<line x1="${v.x - 8}" y1="${top}" x2="${right + 8}" y2="${top}" stroke-width="3"${t}/>`;
      } else {
        const rise = v.roof === 1 ? 30 + pick(r, 30) : 40 + pick(r, 30);
        const pts = v.roof === 1
          ? `${v.x},${GROUND} ${v.x},${top} ${right},${top - rise} ${right},${GROUND}`
          : `${v.x},${GROUND} ${v.x},${top} ${v.x + v.w / 2},${top - rise} ${right},${top} ${right},${GROUND}`;
        fills += `<polygon points="${pts}" ${paint}/>`;
        s += `<polygon points="${pts}"${t}/>`;
        maxTop = Math.min(maxTop, top - rise);
      }
      if (v.ribbon) {
        const y = top + 22;
        s += `<rect x="${v.x + 14}" y="${y}" width="${v.w - 28}" height="26"${t}/>`;
        for (let m = 1; m < v.cols; m++) s += `<line x1="${v.x + 14 + (m * (v.w - 28)) / v.cols}" y1="${y}" x2="${v.x + 14 + (m * (v.w - 28)) / v.cols}" y2="${y + 26}" stroke-width=".8"/>`;
      }
      for (let row = v.ribbon ? 1 : 0; row < v.rows; row++) {
        for (let c = 0; c < v.cols; c++) {
          if (r() < 0.18) continue;
          const wx = v.x + (c + 0.5) * (v.w / v.cols) - 12;
          const wy = top + 18 + row * 70;
          if (wy + 38 > GROUND - 14) continue;
          fills += `<rect x="${wx}" y="${wy}" width="24" height="38" fill="#f6f3e6" stroke="none"${fl}/>`;
          s += `<rect x="${wx}" y="${wy}" width="24" height="38" stroke-width="1.2"${t}/>`;
          s += `<line x1="${wx + 12}" y1="${wy}" x2="${wx + 12}" y2="${wy + 38}" stroke-width=".7"/>`;
        }
      }
      if (v.door) {
        const dx = v.x + 24 + pick(r, Math.max(10, v.w - 80));
        s += `<rect x="${dx}" y="${GROUND - 62}" width="32" height="62" stroke-width="1.6"${t}/>`;
      }
      for (let k = 0; k < 6; k++) s += `<line x1="${right - 4 - k * 7}" y1="${top + 4}" x2="${right - 4 - k * 7}" y2="${GROUND - 2}" stroke-width=".5" opacity=".25"/>`;
    });
    /* tree */
    const tc = [[50, GROUND - 98, 34], [30, GROUND - 70, 22], [70, GROUND - 74, 24]];
    s += `<line x1="50" y1="${GROUND}" x2="50" y2="${GROUND - 66}" stroke-width="2"${t}/>`;
    tc.forEach((c) => { fills += `<circle cx="${c[0]}" cy="${c[1]}" r="${c[2]}" fill="#8f9c67" fill-opacity=".5" stroke="none"${fl}/>`; s += `<circle cx="${c[0]}" cy="${c[1]}" r="${c[2]}" stroke-width="1"${t}/>`; });
    fills += `<rect x="40" y="${GROUND}" width="720" height="12" fill="#b08a5b" fill-opacity=".3" stroke="none"${fl}/>`;
    /* scale figure */
    const fx = 108 + pick(r, 6);
    s += `<circle cx="${fx}" cy="${GROUND - 56}" r="5" stroke-width="1.2"/><line x1="${fx}" y1="${GROUND - 51}" x2="${fx}" y2="${GROUND - 26}" stroke-width="1.2"/><line x1="${fx}" y1="${GROUND - 26}" x2="${fx - 6}" y2="${GROUND}" stroke-width="1.2"/><line x1="${fx}" y1="${GROUND - 26}" x2="${fx + 6}" y2="${GROUND}" stroke-width="1.2"/><line x1="${fx - 7}" y1="${GROUND - 44}" x2="${fx + 7}" y2="${GROUND - 44}" stroke-width="1.2"/>`;
    /* dimension line */
    const dx = 775, h = ((GROUND - maxTop) / 28).toFixed(2);
    s += `<line x1="${dx}" y1="${maxTop}" x2="${dx}" y2="${GROUND}" stroke-width=".9"/><line x1="${dx - 6}" y1="${maxTop}" x2="${dx + 6}" y2="${maxTop}" stroke-width=".9"/><line x1="${dx - 6}" y1="${GROUND}" x2="${dx + 6}" y2="${GROUND}" stroke-width=".9"/>`;
    s += `<text x="${dx - 8}" y="${(maxTop + GROUND) / 2}" font-size="12" text-anchor="middle" transform="rotate(-90 ${dx - 8} ${(maxTop + GROUND) / 2})" fill="currentColor" stroke="none">${h} m</text>`;
    return { s: fills + s, top: maxTop };
  }

  function plan(seed) {
    const r = rng(seed + 7);
    const names = ["Living", "Kitchen", "Bedroom", "Study", "Bath", "Hall", "Store", "Studio", "Dining", "Utility"];
    const X0 = 120, Y0 = 70, W = 560, H = 340;
    const rooms = [];
    (function split(x, y, w, h, depth) {
      if (depth === 0 || (w < 150 && h < 130)) { rooms.push({ x, y, w, h }); return; }
      const vertical = w > h * 1.1 ? true : h > w * 1.1 ? false : r() > 0.5;
      const cut = 0.38 + r() * 0.24;
      if (vertical && w > 150) { const a = w * cut; split(x, y, a, h, depth - 1); split(x + a, y, w - a, h, depth - 1); }
      else if (h > 130) { const a = h * cut; split(x, y, w, a, depth - 1); split(x, y + a, w, h - a, depth - 1); }
      else rooms.push({ x, y, w, h });
    })(X0, Y0, W, H, 3);
    let s = "";
    rooms.forEach((m, i) => {
      s += `<rect x="${m.x.toFixed(1)}" y="${m.y.toFixed(1)}" width="${m.w.toFixed(1)}" height="${m.h.toFixed(1)}" stroke-width="1.6"/>`;
      s += `<text x="${(m.x + 10).toFixed(1)}" y="${(m.y + 20).toFixed(1)}" font-size="12" fill="currentColor" stroke="none">${names[(i + pick(r, 3)) % names.length]}</text>`;
      /* door gap and swing */
      const dx = m.x + m.w * 0.55, dy = m.y + m.h;
      if (dy < Y0 + H - 1) s += `<line x1="${dx}" y1="${dy}" x2="${dx + 30}" y2="${dy}" style="stroke:var(--wash)" stroke-width="4"/><path d="M${dx} ${dy} A30 30 0 0 0 ${dx + 30} ${dy - 30}" stroke-width=".9"/><line x1="${dx + 30}" y1="${dy}" x2="${dx + 30}" y2="${dy - 30}" stroke-width=".9"/>`;
    });
    s += `<rect x="${X0}" y="${Y0}" width="${W}" height="${H}" stroke-width="4"/>`;
    for (let k = 0; k < 3; k++) { const wx = X0 + 90 + k * 160; s += `<line x1="${wx}" y1="${Y0}" x2="${wx + 60}" y2="${Y0}" style="stroke:var(--wash)" stroke-width="6"/><line x1="${wx}" y1="${Y0 - 3}" x2="${wx + 60}" y2="${Y0 - 3}" stroke-width=".9"/><line x1="${wx}" y1="${Y0 + 3}" x2="${wx + 60}" y2="${Y0 + 3}" stroke-width=".9"/>`; }
    s += `<line x1="${X0}" y1="${Y0 + H + 26}" x2="${X0 + W}" y2="${Y0 + H + 26}" stroke-width=".9"/><line x1="${X0}" y1="${Y0 + H + 20}" x2="${X0}" y2="${Y0 + H + 32}" stroke-width=".9"/><line x1="${X0 + W}" y1="${Y0 + H + 20}" x2="${X0 + W}" y2="${Y0 + H + 32}" stroke-width=".9"/>`;
    s += `<text x="${X0 + W / 2}" y="${Y0 + H + 44}" font-size="12" text-anchor="middle" fill="currentColor" stroke="none">${(W / 40).toFixed(1)} m</text>`;
    return s;
  }

  function render(seed, uid) {
    const vols = volumes(seed);
    let s = `<defs><linearGradient id="sky${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a3b32"/><stop offset="1" stop-color="#ecd0aa"/></linearGradient></defs>`;
    s += `<rect width="800" height="480" fill="url(#sky${uid})" stroke="none"/><rect y="${GROUND}" width="800" height="70" fill="#3a3329" stroke="none"/>`;
    const r = rng(seed + 5);
    vols.forEach((v, i) => {
      const top = GROUND - v.h;
      const fill = ["#efe5cf", "#d9c3a0", "#f6eddc"][i % 3];
      if (v.roof === 0) s += `<rect x="${v.x}" y="${top}" width="${v.w}" height="${v.h}" fill="${fill}" stroke="none"/>`;
      else if (v.roof === 1) s += `<polygon points="${v.x},${GROUND} ${v.x},${top} ${v.x + v.w},${top - 40} ${v.x + v.w},${GROUND}" fill="${fill}" stroke="none"/>`;
      else s += `<polygon points="${v.x},${GROUND} ${v.x},${top} ${v.x + v.w / 2},${top - 50} ${v.x + v.w},${top} ${v.x + v.w},${GROUND}" fill="${fill}" stroke="none"/>`;
      for (let row = 0; row < v.rows; row++) for (let c = 0; c < v.cols; c++) {
        if (r() < 0.2) continue;
        const wx = v.x + (c + 0.5) * (v.w / v.cols) - 12, wy = top + 18 + row * 70;
        if (wy + 38 > GROUND - 14) continue;
        s += `<rect x="${wx}" y="${wy}" width="24" height="38" fill="${r() > 0.5 ? "#f7d98e" : "#4a4034"}" stroke="none"/>`;
      }
      s += `<rect x="${v.x + v.w - 14}" y="${top}" width="14" height="${v.h}" fill="#000" opacity=".12" stroke="none"/>`;
    });
    return s;
  }

  function photo(seed, uid) {
    const r = rng(seed + 3);
    let s = `<defs><linearGradient id="ph${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e6dfcd"/><stop offset="1" stop-color="#bfb49b"/></linearGradient>
      <filter id="no${uid}"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="${seed}"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .22 0"/></filter></defs>`;
    s += `<rect width="800" height="480" fill="url(#ph${uid})" stroke="none"/><rect y="370" width="800" height="110" fill="#7d6c56" stroke="none"/>`;
    s += `<rect x="90" y="330" width="560" height="26" fill="#a89f8a" stroke="none"/><rect x="90" y="356" width="560" height="14" fill="#6e604d" stroke="none"/>`;
    for (let i = 0; i < 4; i++) { const x = 120 + i * 150; s += `<rect x="${x}" y="130" width="24" height="200" fill="#a79d86" stroke="none"/><rect x="${x + 20}" y="130" width="4" height="200" fill="#000" opacity=".15" stroke="none"/>`; }
    s += `<rect x="90" y="120" width="560" height="20" fill="#9f9580" stroke="none"/>`;
    for (let i = 0; i < 9; i++) { const x = 100 + i * 62 + pick(r, 8); s += `<line x1="${x}" y1="120" x2="${x + 20}" y2="330" stroke="#5b4e3c" stroke-width="2" opacity=".45"/>`; }
    s += `<line x1="690" y1="60" x2="690" y2="370" stroke="#4a3f31" stroke-width="6"/><line x1="560" y1="70" x2="780" y2="70" stroke="#4a3f31" stroke-width="5"/><line x1="560" y1="70" x2="560" y2="120" stroke="#4a3f31" stroke-width="1"/>`;
    s += `<rect width="800" height="480" filter="url(#no${uid})" stroke="none"/>`;
    return s;
  }

  let counter = 0;
  /* kind: elevation | plan | render | photo. Returns a complete <svg> string. */
  window.drawing = function (kind, seed, opts) {
    opts = opts || {};
    const uid = ++counter;
    const label = opts.label || kind;
    let inner, line = "", vb = "0 0 800 480";
    if (kind === "elevation") {
      const e = elevation(seed, opts.trace); inner = e.s; line = "drawing";
      const y0 = Math.max(0, e.top - 44);
      vb = `0 ${y0} 800 ${GROUND + 34 - y0}`;
    }
    else if (kind === "plan") { inner = plan(seed); line = "drawing"; }
    else if (kind === "render") inner = render(seed, uid);
    else inner = photo(seed, uid);
    const cls = line ? "dwg" : "img";
    return `<svg class="${cls}" viewBox="${vb}" preserveAspectRatio="xMidYMid ${line ? "meet" : "slice"}" role="img" aria-label="${String(label).replace(/"/g, "&quot;")}" fill="none" stroke="currentColor" stroke-linecap="square" stroke-width="1.6">${inner}</svg>`;
  };
})();
