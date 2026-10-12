/* triArch: website and client portal preview.
   Plain JavaScript with no dependencies. Data is kept in this browser's localStorage so you can click through every flow.
   In the real build, the same screens read and write a Supabase database instead. */
(function () {
  const S = window.SEED;
  const $ = (s, el) => (el || document).querySelector(s);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const uid = () => "x" + Math.random().toString(36).slice(2, 9);
  const today = () => new Date().toISOString().slice(0, 10);
  const fmt = (d) => (d ? new Date(String(d).slice(0, 10) + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "");
  const fmtTime = (d) => (String(d).length > 10 ? fmt(d) + ", " + String(d).slice(11, 16) : fmt(d));

  /* ---------- state ---------- */
  const KEY = "triarch_preview_v1";
  const fresh = () => ({ v: 1, session: null, projects: clone(S.projects) });
  function load() {
    try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.v === 1) return s; } catch (e) {}
    return fresh();
  }
  let state = load();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} };
  let ui = {}; /* transient interface state: open forms, pin being placed */

  const user = () => S.users.find((u) => u.id === state.session) || null;
  const isStaff = () => { const u = user(); return !!u && u.role === "staff"; };
  const proj = (id) => state.projects.find((p) => p.id === id);
  const clientOf = (p) => S.users.find((u) => u.id === p.client);
  const touch = (p) => { p.lastUpdate = today(); };
  const note = (p, text) => p.messages.push({ id: uid(), from: "System", role: "system", text, at: new Date().toISOString().slice(0, 16) });

  function progress(p) {
    const n = S.phases.length;
    const inPhase = p.milestones.filter((m) => m.phase === p.phaseIndex);
    const frac = inPhase.length ? inPhase.filter((m) => m.status === "done").length / inPhase.length : 0;
    return Math.min(100, Math.round(((p.phaseIndex + frac) / n) * 100));
  }
  const awaiting = (p) => p.milestones.filter((m) => m.status === "awaiting");
  const changes = (p) => p.milestones.filter((m) => m.status === "changes");
  const openPins = (p) => p.gallery.reduce((n, g) => n + g.pins.filter((x) => !x.resolved).length, 0);

  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg; t.hidden = false;
    clearTimeout(toast.t); toast.t = setTimeout(() => (t.hidden = true), 3200);
  }
  const go = (path) => { location.hash = "#" + path; };

  /* ---------- shell ---------- */
  function headHTML(area) {
    const u = user();
    const home = u ? (u.role === "staff" ? "/admin" : "/portal") : "/login";
    const cur = (a) => (area === a ? ' aria-current="page"' : "");
    return `<div class="pill">
      <a class="brand" href="#/"><span class="brand-mark" aria-hidden="true"></span><span class="brand-text"><span class="brand-name">${esc(S.studio.name)}</span><span class="brand-slogan">${esc(S.studio.slogan)}</span></span></a>
      <button class="menu-btn" data-act="menu" aria-expanded="false" aria-controls="nav">Menu</button>
      <nav class="nav" id="nav" aria-label="Main">
        <a href="#/projects"${cur("projects")}>Projects</a>
        <a href="#/studio"${cur("studio")}>Studio</a>
        <a href="#/contact"${cur("contact")}>Contact</a>
        ${u ? `<a href="#${home}"${cur("portal")}>${u.role === "staff" ? "Admin" : "Your projects"}</a><button class="linklike" data-act="logout">Sign out</button>` : `<a class="cta" href="#/login"${cur("login")}>Client login</a>`}
      </nav></div>`;
  }
  function footHTML() {
    return `<div class="wrap">
      <div class="col"><strong>${esc(S.studio.name)}</strong><span class="muted">${esc(S.studio.address)}</span></div>
      <div class="col"><a class="link" href="mailto:${esc(S.studio.email)}">${esc(S.studio.email)}</a><span class="muted">${esc(S.studio.phone)}</span></div>
      <div class="col"><a class="link" href="#/login">Client login</a><a class="link" href="#/projects">Projects</a><span class="muted">Preview with sample data</span></div></div>`;
  }

  /* ---------- public pages ---------- */
  const sqm = () => S.portfolio.reduce((n, w) => n + (parseInt(String(w.size).replace(/[^0-9]/g, ""), 10) || 0), 0);
  function workCard(w) {
    return `<a class="work" href="#/projects/${w.slug}">
      <div class="work-img">${drawing(w.kind, w.seed, { label: w.name + ", elevation" })}</div>
      <div class="work-cap"><strong>${esc(w.name)}</strong><span class="muted small">${esc(w.type)}, ${w.year}</span><span class="link">View project</span></div></a>`;
  }
  function home() {
    const feat = S.portfolio[3];
    const stat = (i, cls) => `<div class="widget ${cls || ""}"><strong>${esc(S.successStats[i][0])}</strong><span>${esc(S.successStats[i][1])}</span></div>`;
    return { title: S.studio.slogan, area: "home", html: `
      <div class="wrap hero">
        <h1>${esc(S.studio.slogan)}</h1>
        <p class="lead">${esc(S.studio.short)} is a small architecture studio for houses, schools and workplaces. We stay with every project from the first sketch to handover.</p>
        <div class="hero-actions"><a class="btn" href="#/contact">Book a consultation</a><a class="btn ghost" href="#/projects">See our work</a></div>
        <dl class="hero-stats">${S.heroStats.map((x) => `<div><dt>${esc(x[0])}</dt><dd>${esc(x[1])}</dd></div>`).join("")}</dl>
        <div class="hero-drawing">${drawing("elevation", feat.seed, { trace: true, label: feat.name + ", elevation" })}</div>
        <div class="hero-caption"><span>${esc(feat.name)}, south elevation</span><a class="link" href="#/projects/${feat.slug}">See the project</a></div>
      </div>

      <section class="wrap section" aria-labelledby="about">
        <p class="idx">01 About us</p>
        <div class="section-intro"><h2 id="about">Design with purpose. Build with care.</h2>
          <p>${esc(S.studio.name)} is a studio of nine architects. We listen first, draw carefully, and make sure what gets built matches what we promised. Every client follows their building online and can tell us what they think at each stage.</p></div>
        <div class="duo">
          <figure class="shot"><div class="frame">${drawing("elevation", S.portfolio[0].seed, { label: "Ridge House, elevation" })}</div><figcaption>Ridge House, south elevation</figcaption></figure>
          <figure class="shot"><div class="frame">${drawing("plan", 8, { label: "House plan" })}</div><figcaption>Ground floor plan, private house</figcaption></figure>
        </div>
      </section>

      <section class="wrap section" aria-labelledby="success">
        <p class="idx">02 Our success</p>
        <div class="section-intro"><h2 id="success">Expert guidance at every stage of your project.</h2>
          <p>From the first idea to the keys in your hand, we keep the work clear and the decisions yours.</p></div>
        <div class="bento">
          ${stat(0, "t-blue")}${stat(1)}
          <div class="widget photo" role="img" aria-label="Exterior render">${drawing("render", 5, { label: "Exterior render, evening" })}</div>
          <div class="widget photo" role="img" aria-label="Site photo">${drawing("photo", 3, { label: "Site photo, concrete frame" })}</div>
          ${stat(2, "t-green")}${stat(3, "t-orange")}
        </div>
      </section>

      <section class="wrap section" aria-labelledby="proj">
        <p class="idx">03 Projects</p>
        <div class="section-intro"><div><h2 id="proj">Buildings we are proud of.</h2></div>
          <div><p>A selection of recent houses, schools and public buildings.</p><a class="btn" href="#/projects">View all projects</a></div></div>
        <div class="works">${S.portfolio.slice(0, 4).map(workCard).join("")}</div>
      </section>

      <section class="wrap section" aria-labelledby="news">
        <p class="idx">04 News</p>
        <div class="section-intro"><h2 id="news">Recent news from the studio.</h2><p>Openings, awards and what we are working on.</p></div>
        <div class="works">${S.news.map((n) => `<article class="work static"><div class="work-img">${drawing(n.kind, n.seed, { label: n.title })}</div><div class="work-cap"><strong>${esc(n.title)}</strong><span class="muted small">${fmt(n.date)}</span></div></article>`).join("")}</div>
      </section>

      <section class="wrap section" aria-labelledby="faq">
        <p class="idx">05 FAQs</p>
        <div class="section-intro"><h2 id="faq">Answers to common questions.</h2><p>Not here? Send us a message and we will reply within two working days.</p></div>
        <div class="faq">${S.faq.map((q, i) => `<details${i === 0 ? " open" : ""}><summary>${esc(q[0])}</summary><p>${esc(q[1])}</p></details>`).join("")}</div>
      </section>

      <section class="wrap section" aria-label="Get started">
        <div class="cta-pair">
          <div class="cta-card tint"><div><h2>Start a project</h2><p class="muted" style="margin-top:12px">Tell us about your site and what you would like to build.</p></div><div><a class="btn" href="#/contact">Get in touch</a></div></div>
          <div class="cta-card"><div><h2>Already a client?</h2><p class="muted" style="margin-top:12px">Follow progress, review drawings and send feedback.</p></div><div><a class="btn ghost" href="#/login">Client login</a></div></div>
        </div>
      </section>` };
  }
  function projectsPage() {
    return { title: "Projects", area: "projects", html: `<div class="wrap page"><div class="section-head"><h1>Projects</h1><p class="muted">${S.portfolio.length} completed buildings</p></div><div class="cards">${S.portfolio.map(workCard).join("")}</div></div>` };
  }
  function projectPage(slug) {
    const i = S.portfolio.findIndex((w) => w.slug === slug);
    if (i < 0) return notFound();
    const w = S.portfolio[i], next = S.portfolio[(i + 1) % S.portfolio.length];
    return { title: w.name, area: "projects", html: `
      <div class="wrap page">
        <p class="small"><a class="link" href="#/projects">Projects</a></p>
        <h1 style="margin-top:10px">${esc(w.name)}</h1>
        <dl class="facts"><div><dt>Type</dt><dd>${esc(w.type)}</dd></div><div><dt>Location</dt><dd>${esc(w.place)}</dd></div><div><dt>Completed</dt><dd>${w.year}</dd></div><div><dt>Floor area</dt><dd>${esc(w.size)}</dd></div></dl>
        <div class="big-img">${drawing(w.kind, w.seed, { label: w.name + ", elevation" })}</div>
        <div class="cols" style="margin-top:36px"><div></div><p>${esc(w.text)}</p></div>
        <div style="margin-top:56px"><p class="muted small">Next project</p><h2 style="margin-top:6px"><a href="#/projects/${next.slug}">${esc(next.name)}</a></h2></div>
      </div>` };
  }
  function studioPage() {
    return { title: "Studio", area: "studio", html: `
      <div class="wrap page">
        <h1 style="max-width:18ch">A small studio that stays involved until the building is finished.</h1>
        <div class="cols" style="margin-top:48px"><div><h2>Services</h2></div>
          <dl class="rows">${S.services.map((s) => `<div><dt>${esc(s[0])}</dt><dd>${esc(s[1])}</dd></div>`).join("")}</dl></div>
        <div class="cols" style="margin-top:64px"><div><h2>People</h2></div>
          <div class="rows">${S.team.map((t) => `<div><span class="k">${esc(t.name)}</span><span class="muted">${esc(t.role)}</span></div>`).join("")}</div></div>
      </div>` };
  }
  function contactPage() {
    return { title: "Contact", area: "contact", html: `
      <div class="wrap page"><div class="cols">
        <div><h1>Contact</h1><p class="muted" style="margin-top:14px">Tell us about the site and what you would like to build. We reply within two working days.</p><p style="margin-top:24px"><a class="link" href="mailto:${esc(S.studio.email)}">${esc(S.studio.email)}</a><br>${esc(S.studio.phone)}<br>${esc(S.studio.address)}</p></div>
        <form class="sheet" data-form="contact" novalidate>
          <div class="form-row"><div class="field"><label for="c-name">Your name</label><input id="c-name" name="name" autocomplete="name" required></div>
          <div class="field"><label for="c-email">Email</label><input id="c-email" name="email" type="email" autocomplete="email" required></div></div>
          <div class="field"><label for="c-type">What are you planning?</label><select id="c-type" name="type"><option>A new house</option><option>A renovation or extension</option><option>A workplace or shop</option><option>A public building</option><option>Something else</option></select></div>
          <div class="field"><label for="c-msg">Message</label><textarea id="c-msg" name="message" required></textarea></div>
          <div id="c-err"></div>
          <button class="btn" type="submit" style="width:100%">Send message</button>
        </form></div></div>` };
  }
  function notFound() {
    return { title: "Page not found", area: "", html: `<div class="wrap page"><h1>We can't find that page</h1><p class="muted" style="margin-top:14px">The link may be old. Go back to the <a href="#/">home page</a>.</p></div>` };
  }

  /* ---------- login ---------- */
  function loginPage() {
    const demos = S.users.map((u) => `<button class="demo" data-act="login" data-id="${u.id}"><span>${esc(u.name)}</span><span class="muted small">${u.role === "staff" ? "Studio staff" : "Client"}</span></button>`).join("");
    return { title: "Client login", area: "login", html: `
      <div class="wrap"><div class="auth">
        <h1>Client login</h1>
        <p class="muted lede">Sign in to see your projects, drawings and messages.</p>
        <form class="sheet" data-form="login" novalidate>
          ${ui.loginError ? `<p class="error" role="alert">${esc(ui.loginError)}</p>` : ""}
          <div class="field"><label for="l-email">Email</label><input id="l-email" name="email" type="email" autocomplete="username" required></div>
          <div class="field"><label for="l-pass">Password</label><input id="l-pass" name="password" type="password" autocomplete="current-password" required></div>
          <button class="btn" type="submit" style="width:100%">Sign in</button>
        </form>
        <h2 style="font-size:var(--step-1);margin:40px 0 4px">Try the preview</h2>
        <p class="hint" style="margin-bottom:12px">This preview has no real accounts. Pick one to sign in.</p>
        <div class="demo-list group">${demos}</div>
      </div></div>` };
  }

  /* ---------- portal and admin ---------- */
  function portalRoute(area, id, tab, sub) {
    const u = user();
    if (!u) { ui.next = location.hash; go("/login"); return { title: "Client login", area: "login", html: "" }; }
    if (area === "admin" && u.role !== "staff") { go("/portal"); return { title: "", area: "", html: "" }; }
    if (area === "portal" && u.role === "staff") { go("/admin"); return { title: "", area: "", html: "" }; }
    if (!id) return area === "admin" ? adminHome() : clientHome();
    const p = proj(id);
    if (!p || (u.role === "client" && !u.projects.includes(p.id))) return notFound();
    tab = ["overview", "gallery", "documents", "messages"].includes(tab) ? tab : "overview";
    const inner = { overview: overviewTab, gallery: galleryTab, documents: documentsTab, messages: messagesTab }[tab](area, p, sub);
    return { title: p.name, area: "portal", tabbar: true, html: shell(area, p, tab, inner) };
  }

  function projectRow(area, p) {
    const n = isStaff() ? changes(p).length : awaiting(p).length;
    const tagText = isStaff() ? (n ? `${n} change request${n > 1 ? "s" : ""}` : "") : (n ? `${n} need${n > 1 ? "" : "s"} your feedback` : "");
    return `<a class="prow" href="#/${area}/${p.id}">
      <div class="thumb">${drawing("elevation", p.seed, { label: p.name })}</div>
      <div><h3>${esc(p.name)}</h3><p class="muted small">${esc(S.phases[p.phaseIndex])}, ${progress(p)}% complete. Updated ${fmt(p.lastUpdate)}</p></div>
      ${tagText ? `<span class="tag ${isStaff() ? "hatch" : "alert"}">${tagText}</span>` : ""}</a>`;
  }
  function clientHome() {
    const u = user();
    const list = state.projects.filter((p) => u.projects.includes(p.id));
    return { title: "Your projects", area: "portal", html: `<div class="wrap portal-head"><h1 class="large-title">Your projects</h1><p class="muted" style="margin:8px 0 28px">Signed in as ${esc(u.name)}</p>
      <div class="plist">${list.map((p) => projectRow("portal", p)).join("") || '<p class="empty">No projects yet.</p>'}</div></div>` };
  }
  function adminHome() {
    const list = state.projects;
    const todo = [];
    list.forEach((p) => {
      changes(p).forEach((m) => todo.push({ p, tab: "overview", text: `${clientOf(p).name} asked for changes: ${m.title}` }));
      const o = openPins(p); if (o) todo.push({ p, tab: "gallery", text: `${o} open comment${o > 1 ? "s" : ""} on drawings` });
      awaiting(p).forEach((m) => todo.push({ p, tab: "overview", text: `Waiting for ${clientOf(p).name}: ${m.title}`, quiet: true }));
    });
    const stat = (n, l) => `<div><strong>${n}</strong><span class="muted small">${l}</span></div>`;
    return { title: "Admin", area: "portal", html: `<div class="wrap portal-head">
      <div class="section-head"><h1 class="large-title">Studio admin</h1><button class="btn ghost sm" data-act="reset">Reset sample data</button></div>
      <div class="stats">${stat(list.length, "active projects")}${stat(list.reduce((n, p) => n + awaiting(p).length, 0), "waiting for clients")}${stat(list.reduce((n, p) => n + changes(p).length, 0), "change requests")}${stat(list.reduce((n, p) => n + openPins(p), 0), "open drawing comments")}</div>
      <h2 style="font-size:var(--step-1);margin-bottom:14px">Needs attention</h2>
      <div class="rows" style="margin-bottom:48px">${todo.map((t) => `<div><a class="k" href="#/admin/${t.p.id}/${t.tab}">${esc(t.p.name)}</a><span class="${t.quiet ? "muted" : ""}">${esc(t.text)}</span></div>`).join("") || '<p class="empty">Nothing needs attention.</p>'}</div>
      <h2 style="font-size:var(--step-1);margin-bottom:14px">All projects</h2><div class="plist">${list.map((p) => projectRow("admin", p)).join("")}</div></div>` };
  }

  function shell(area, p, tab, inner) {
    const staff = area === "admin";
    const base = `#/${area}/${p.id}`;
    const nA = staff ? changes(p).length : awaiting(p).length, nP = openPins(p);
    const ICON = {
      overview: '<path d="M5 20V10M12 20V4M19 20v-7"/>',
      gallery: '<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="1.6"/><path d="M4 18l5-5 4 4 3-3 4 4"/>',
      documents: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/>',
      messages: '<path d="M4 5h16v11H9l-5 4z"/>',
    };
    const items = [["overview", "Progress", "Progress", nA], ["gallery", "Drawings and photos", "Drawings", nP], ["documents", "Documents", "Documents", 0], ["messages", "Messages", "Messages", 0]];
    const badge = (n) => (n ? `<span class="count" aria-label="${n} to look at">${n}</span>` : "");
    const t = (it) => `<a href="${base}/${it[0]}"${tab === it[0] ? ' aria-current="page"' : ""}>${it[1]}${badge(it[3])}</a>`;
    const tb = (it) => `<a href="${base}/${it[0]}"${tab === it[0] ? ' aria-current="page"' : ""}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[it[0]]}</svg>${it[2]}${badge(it[3])}</a>`;
    const c = clientOf(p);
    return `<div class="wrap portal-head">
      <p class="crumb"><a href="#/${area}">${staff ? "Admin" : "Your projects"}</a></p>
      <div class="title-block" role="group" aria-label="Project details">
        <div class="name"><span class="k">Project</span><h1 class="v">${esc(p.name)}</h1></div>
        <div${staff ? "" : ' class="hide-sm"'}><span class="k">Client</span><span class="v">${esc(c.name)}</span></div>
        <div class="hide-sm"><span class="k">Location</span><span class="v">${esc(p.place)}</span></div>
        <div class="hide-sm"><span class="k">Type</span><span class="v">${esc(p.type)}</span></div>
        <div><span class="k">Phase</span><span class="v">${esc(S.phases[p.phaseIndex])}</span></div>
        <div><span class="k">Progress</span><span class="v">${progress(p)}%</span></div>
        <div><span class="k">Drawing revision</span><span class="v">${esc(p.revision)}</span></div>
        <div><span class="k">Last update</span><span class="v">${fmt(p.lastUpdate)}</span></div>
      </div>
      <nav class="tabs" aria-label="Project sections">${items.map(t).join("")}</nav>
      ${inner}</div>
      <nav class="tabbar" aria-label="Project sections, phone">${items.map(tb).join("")}</nav>`;
  }

  function overviewTab(area, p) {
    const staff = area === "admin";
    const phases = S.phases.map((n, i) => {
      const cls = i < p.phaseIndex ? "done" : i === p.phaseIndex ? "current" : "upcoming";
      const inPh = p.milestones.filter((m) => m.phase === i), f = inPh.length ? Math.round((inPh.filter((m) => m.status === "done").length / inPh.length) * 100) : 0;
      return `<li class="phase ${cls}" style="--f:${f}%"${cls === "current" ? ' aria-current="step"' : ""}><b>${esc(n)}</b>${cls === "done" ? "Done" : cls === "current" ? "In progress" : "Upcoming"}</li>`;
    }).join("");
    const ms = p.milestones.slice().sort((a, b) => a.due.localeCompare(b.due)).map((m) => milestoneHTML(area, p, m)).join("");
    return `<section class="panel" aria-labelledby="prog">
        <div class="pct"><strong>${progress(p)}%</strong><span class="muted" id="prog">complete. Now in ${esc(S.phases[p.phaseIndex]).toLowerCase()}</span></div>
        <ol class="progress" aria-label="Project phases">${phases}</ol>
        <p class="muted" style="margin-top:8px">${esc(p.summary)}</p>
        ${staff ? `<form class="toolbar" data-form="phase" data-p="${p.id}" style="margin-top:20px"><label for="ph" class="small">Current phase</label><select class="inline" id="ph" name="phase">${S.phases.map((n, i) => `<option value="${i}"${i === p.phaseIndex ? " selected" : ""}>${esc(n)}</option>`).join("")}</select><label for="rv" class="small">Drawing revision</label><input class="inline" style="width:76px;padding:8px 12px" id="rv" name="revision" value="${esc(p.revision)}" maxlength="3"><button class="btn sm" type="submit">Save</button></form>` : ""}
      </section>
      <section class="panel" aria-labelledby="mst"><div class="section-head"><h2 id="mst" style="font-size:var(--step-1)">Milestones</h2></div>
        <ul class="ms-list">${ms}</ul>
        ${staff ? addMilestoneForm(p) : ""}
      </section>`;
  }
  function milestoneHTML(area, p, m) {
    const staff = area === "admin";
    const tag = { done: ['solid', "Done"], awaiting: ["alert", staff ? "Waiting for client" : "Needs your feedback"], changes: ["hatch", "Changes requested"], upcoming: ["quiet", "Upcoming"] }[m.status];
    let body = "";
    if (m.note) body += `<p>${esc(m.note)}</p>`;
    if (m.response) body += `<p class="quote"><strong>${esc(m.response.by)}</strong>, ${fmt(m.response.at)}: ${m.response.decision === "approved" ? "Approved." : "Asked for changes."} ${esc(m.response.text)}</p>`;
    if (!staff && m.status === "awaiting") {
      body += ui.changesFor === m.id
        ? `<form class="reply" data-form="changes" data-p="${p.id}" data-m="${m.id}"><div class="field" style="margin:0"><label for="ch-${m.id}">What should change?</label><textarea id="ch-${m.id}" name="text" required></textarea></div><div class="actions"><button class="btn sm" type="submit">Send to studio</button><button class="btn ghost sm" type="button" data-act="cancel-changes">Cancel</button></div></form>`
        : `<div class="actions"><button class="btn sm" data-act="approve" data-p="${p.id}" data-m="${m.id}">Approve</button><button class="btn ghost sm" data-act="open-changes" data-m="${m.id}">Request changes</button></div>`;
    }
    if (!staff && m.status === "changes") body += `<p class="muted small">The studio is working on your changes.</p>`;
    if (staff) body += `<form class="toolbar" data-form="ms-status" data-p="${p.id}" data-m="${m.id}"><label class="small" for="st-${m.id}">Status</label><select class="inline" id="st-${m.id}" name="status">${[["upcoming", "Upcoming"], ["awaiting", "Waiting for client"], ["changes", "Changes requested"], ["done", "Done"]].map((o) => `<option value="${o[0]}"${o[0] === m.status ? " selected" : ""}>${o[1]}</option>`).join("")}</select><button class="btn ghost sm" type="submit">Update</button></form>`;
    return `<li class="ms ${m.status}"><span class="dot" aria-hidden="true"></span>
      <div><h3>${esc(m.title)}</h3><div class="meta">${esc(S.phases[m.phase])}, due ${fmt(m.due)}</div></div>
      <span class="tag ${tag[0]}">${tag[1]}</span>${body ? `<div class="body">${body}</div>` : ""}</li>`;
  }
  function addMilestoneForm(p) {
    return `<form class="inline-form" data-form="add-ms" data-p="${p.id}"><h3 style="font-size:1.1rem">Add a milestone</h3>
      <div class="field" style="margin:0"><label for="nm-t">Title</label><input id="nm-t" name="title" required></div>
      <div class="form-row"><div class="field" style="margin:0"><label for="nm-p">Phase</label><select id="nm-p" name="phase">${S.phases.map((n, i) => `<option value="${i}"${i === p.phaseIndex ? " selected" : ""}>${esc(n)}</option>`).join("")}</select></div>
      <div class="field" style="margin:0"><label for="nm-d">Due date</label><input id="nm-d" name="due" type="date" required></div></div>
      <div class="field" style="margin:0"><label for="nm-n">Note for the client</label><input id="nm-n" name="note"></div>
      <div><button class="btn sm" type="submit">Add milestone</button></div></form>`;
  }

  function galleryTab(area, p, gid) {
    const staff = area === "admin";
    if (gid) {
      const g = p.gallery.find((x) => x.id === gid);
      if (!g) return `<div class="panel"><p class="empty">That image no longer exists.</p></div>`;
      return viewer(area, p, g);
    }
    const tiles = p.gallery.map((g) => {
      const n = g.pins.filter((x) => !x.resolved).length;
      return `<li style="list-style:none"><a class="tile" href="#/${area}/${p.id}/gallery/${g.id}"><div class="frame">${drawing(g.kind, g.seed, { label: g.title })}${n ? `<span class="tag alert pinbadge">${n} open</span>` : ""}</div><div class="cap"><span><strong style="font-weight:560">${esc(g.title)}</strong></span><span class="muted small">${fmt(g.date)}</span></div></a></li>`;
    }).join("");
    return `<section class="panel"><p class="muted" style="margin-bottom:24px">Open an image and click the exact spot you want to comment on.</p>
      <ul class="gallery" style="padding:0;margin:0">${tiles || '<li class="empty" style="list-style:none">No images yet.</li>'}</ul>
      ${staff ? `<form class="inline-form" data-form="add-img" data-p="${p.id}" style="margin-top:48px"><h3 style="font-size:1.1rem">Add an image</h3><p class="hint">The preview creates a sample image. The real site uploads your files.</p>
        <div class="form-row"><div class="field" style="margin:0"><label for="ai-t">Title</label><input id="ai-t" name="title" required></div><div class="field" style="margin:0"><label for="ai-k">Type</label><select id="ai-k" name="kind"><option value="elevation">Elevation</option><option value="plan">Plan</option><option value="render">Render</option><option value="photo">Site photo</option></select></div></div>
        <div><button class="btn sm" type="submit">Add image</button></div></form>` : ""}</section>`;
  }
  function viewer(area, p, g) {
    const me = user();
    const pins = g.pins.map((x, i) => `<button class="pin${x.resolved ? " resolved" : ""}${ui.activePin === x.id ? " active" : ""}" style="left:${x.x}%;top:${x.y}%" data-act="pin-select" data-id="${x.id}" aria-label="Comment ${i + 1}${x.resolved ? ", resolved" : ""}">${i + 1}</button>`).join("");
    const draft = ui.draft && ui.draft.gid === g.id ? `<span class="pin draft" style="left:${ui.draft.x}%;top:${ui.draft.y}%" aria-hidden="true">+</span>` : "";
    const thread = g.pins.map((x, i) => `<li class="${x.resolved ? "resolved " : ""}${ui.activePin === x.id ? "focus" : ""}" id="t-${x.id}"><span class="n">${i + 1}</span><div>
        <p><strong>${esc(x.author)}</strong> <span class="muted small">${fmt(x.at)}${x.resolved ? ", resolved" : ""}</span></p><p>${esc(x.text)}</p>
        ${(x.replies || []).map((r) => `<p class="quote" style="margin-top:8px"><strong>${esc(r.author)}</strong>: ${esc(r.text)}</p>`).join("")}
        <form class="toolbar" data-form="pin-reply" data-p="${p.id}" data-g="${g.id}" data-id="${x.id}" style="margin-top:10px"><label class="small" for="r-${x.id}" style="position:absolute;left:-999px">Reply to comment ${i + 1}</label><input id="r-${x.id}" name="text" placeholder="Reply" style="flex:1;min-width:120px" required><button class="btn ghost sm" type="submit">Reply</button><button class="btn ghost sm" type="button" data-act="pin-resolve" data-p="${p.id}" data-g="${g.id}" data-id="${x.id}">${x.resolved ? "Reopen" : "Mark resolved"}</button></form></div></li>`).join("");
    const form = ui.draft && ui.draft.gid === g.id
      ? `<form class="reply" data-form="pin-add" data-p="${p.id}" data-g="${g.id}" style="margin-bottom:24px"><div class="field" style="margin:0"><label for="np">Your comment</label><textarea id="np" name="text" required autofocus></textarea></div><div class="actions"><button class="btn sm" type="submit">Post comment</button><button class="btn ghost sm" type="button" data-act="pin-cancel">Cancel</button></div></form>`
      : `<p class="muted" style="margin-bottom:24px">Click the image to place a comment.</p>`;
    return `<section class="panel"><p class="small" style="margin-bottom:12px"><a href="#/${area}/${p.id}/gallery">All images</a></p><h2 style="font-size:var(--step-1);margin-bottom:20px">${esc(g.title)}</h2>
      <div class="viewer"><div><div class="stage" data-stage="${g.id}">${drawing(g.kind, g.seed, { label: g.title })}${pins}${draft}</div>
      <div class="toolbar" style="margin-top:12px"><button class="btn ghost sm" data-act="pin-centre" data-g="${g.id}">Add a comment without clicking</button><span class="hint">${esc(g.kind === "photo" ? "Site photo" : g.kind[0].toUpperCase() + g.kind.slice(1))}, ${fmt(g.date)}</span></div></div>
      <div>${form}<ul class="thread">${thread || ""}</ul>${thread ? "" : '<p class="empty" style="margin-top:0">No comments yet.</p>'}</div></div></section>`;
  }

  function documentsTab(area, p) {
    const staff = area === "admin";
    return `<section class="panel"><div class="docs">${p.documents.map((d) => `<div class="doc"><div><strong style="font-weight:560">${esc(d.name)}</strong><div class="meta muted small">Version ${esc(d.version)}, ${esc(d.size)}, added ${fmt(d.date)}</div></div><span class="type">${esc(d.type)}</span><button class="btn ghost sm" data-act="download" data-name="${esc(d.name)}">Download</button></div>`).join("") || '<p class="empty">No documents yet.</p>'}</div>
      ${staff ? `<form class="inline-form" data-form="add-doc" data-p="${p.id}" style="margin-top:40px"><h3 style="font-size:1.1rem">Add a document</h3><p class="hint">The preview records the name only. The real site stores the file securely.</p>
        <div class="field" style="margin:0"><label for="ad-n">Document name</label><input id="ad-n" name="name" required></div>
        <div class="form-row"><div class="field" style="margin:0"><label for="ad-t">File type</label><select id="ad-t" name="type"><option>PDF</option><option>DWG</option><option>IFC</option><option>XLSX</option><option>DOCX</option></select></div><div class="field" style="margin:0"><label for="ad-v">Version</label><input id="ad-v" name="version" value="v1"></div></div>
        <div><button class="btn sm" type="submit">Add document</button></div></form>` : ""}</section>`;
  }

  function messagesTab(area, p) {
    const me = user();
    const bubbles = p.messages.map((m) => m.role === "system"
      ? `<p class="muted small" style="justify-self:center;text-align:center">${esc(m.text)} ${fmtTime(m.at)}</p>`
      : `<div class="bubble${m.from === me.name ? " me" : ""}"><span class="who">${esc(m.from)}, ${fmtTime(m.at)}</span>${esc(m.text)}</div>`).join("");
    return `<section class="panel"><div class="chat">${bubbles || '<p class="empty">No messages yet. Write the first one below.</p>'}</div>
      <form class="reply" data-form="message" data-p="${p.id}"><div class="field" style="margin:0"><label for="msg">Message to ${area === "admin" ? esc(clientOf(p).name) : "the studio"}</label><textarea id="msg" name="text" required></textarea></div><div><button class="btn" type="submit">Send message</button></div></form></section>`;
  }

  /* ---------- actions ---------- */
  function act(name, el) {
    const u = user();
    const P = el.dataset.p && proj(el.dataset.p);
    if (name === "menu") { const n = $("#nav"); const o = n.classList.toggle("open"); el.setAttribute("aria-expanded", o); return; }
    if (name === "login") { signIn(el.dataset.id); return; }
    if (name === "logout") { state.session = null; save(); go("/"); toast("Signed out."); return; }
    if (name === "reset") { if (confirm("Reset all sample data to the starting state?")) { state = fresh(); state.session = u.id; save(); ui = {}; render(); toast("Sample data reset."); } return; }
    if (name === "download") { toast("Preview only. The real site downloads " + el.dataset.name + "."); return; }
    if (name === "open-changes") { ui.changesFor = el.dataset.m; render(true); return; }
    if (name === "cancel-changes") { ui.changesFor = null; render(true); return; }
    if (name === "approve") {
      const m = P.milestones.find((x) => x.id === el.dataset.m);
      m.status = "done"; m.response = { decision: "approved", text: "", by: u.name, at: today() };
      note(P, `${u.name} approved “${m.title}”.`); touch(P); save(); render(true); toast("Approved. The studio has been told."); return;
    }
    if (name === "pin-select") { ui.activePin = el.dataset.id; render(true); const t = document.getElementById("t-" + el.dataset.id); if (t) t.scrollIntoView({ block: "nearest" }); return; }
    if (name === "pin-cancel") { ui.draft = null; render(true); return; }
    if (name === "pin-centre") { ui.draft = { gid: el.dataset.g, x: 50, y: 50 }; render(true); const ta = $("#np"); if (ta) ta.focus(); return; }
    if (name === "pin-resolve") {
      const g = P.gallery.find((x) => x.id === el.dataset.g), x = g.pins.find((q) => q.id === el.dataset.id);
      x.resolved = !x.resolved; touch(P); save(); render(true); return;
    }
  }
  function signIn(id) {
    const u = S.users.find((x) => x.id === id);
    state.session = u.id; ui.loginError = null; save();
    const next = ui.next; ui.next = null;
    go(next ? next.slice(1) : u.role === "staff" ? "/admin" : "/portal");
  }

  function form(name, f, d) {
    const u = user(), P = f.dataset.p && proj(f.dataset.p), v = (k) => String(d.get(k) || "").trim();
    if (name === "login") {
      const found = S.users.find((x) => x.email.toLowerCase() === v("email").toLowerCase());
      if (!found || v("password") !== "preview") { ui.loginError = "That email and password don't match. In this preview the password is “preview”, or use one of the accounts below."; render(true); return; }
      signIn(found.id); return;
    }
    if (name === "contact") {
      if (!v("name") || !v("email") || !v("message")) { $("#c-err").innerHTML = '<p class="error" role="alert">Fill in your name, email and message.</p>'; return; }
      f.reset(); $("#c-err").innerHTML = ""; toast("Message sent. We'll reply within two working days."); return;
    }
    if (name === "changes") {
      const m = P.milestones.find((x) => x.id === f.dataset.m);
      m.status = "changes"; m.response = { decision: "changes", text: v("text"), by: u.name, at: today() };
      note(P, `${u.name} asked for changes to “${m.title}”.`); ui.changesFor = null; touch(P); save(); render(true); toast("Sent. The studio will review your changes."); return;
    }
    if (name === "pin-add") {
      const g = P.gallery.find((x) => x.id === f.dataset.g);
      g.pins.push({ id: uid(), x: Math.round(ui.draft.x), y: Math.round(ui.draft.y), text: v("text"), author: u.name, role: u.role, at: today(), resolved: false, replies: [] });
      ui.draft = null; touch(P); save(); render(true); toast("Comment added."); return;
    }
    if (name === "pin-reply") {
      const g = P.gallery.find((x) => x.id === f.dataset.g), x = g.pins.find((q) => q.id === f.dataset.id);
      (x.replies = x.replies || []).push({ author: u.name, role: u.role, text: v("text"), at: today() }); touch(P); save(); render(true); return;
    }
    if (name === "message") {
      P.messages.push({ id: uid(), from: u.name, role: u.role, text: v("text"), at: new Date().toISOString().slice(0, 16) }); touch(P); save(); render(true); toast("Message sent."); return;
    }
    if (u.role !== "staff") return;
    if (name === "phase") { P.phaseIndex = +v("phase"); P.revision = v("revision") || P.revision; touch(P); save(); render(true); toast("Progress updated."); return; }
    if (name === "ms-status") {
      const m = P.milestones.find((x) => x.id === f.dataset.m); m.status = v("status");
      if (m.status === "awaiting") note(P, `The studio asked for your feedback on “${m.title}”.`);
      touch(P); save(); render(true); toast("Milestone updated."); return;
    }
    if (name === "add-ms") { P.milestones.push({ id: uid(), phase: +v("phase"), title: v("title"), due: v("due"), status: "upcoming", note: v("note"), response: null }); touch(P); save(); render(true); toast("Milestone added."); return; }
    if (name === "add-img") { P.gallery.unshift({ id: uid(), title: v("title"), kind: v("kind"), seed: 100 + Math.floor(Math.random() * 900), date: today(), pins: [] }); touch(P); note(P, `The studio added “${v("title")}” to the gallery.`); save(); render(true); toast("Image added."); return; }
    if (name === "add-doc") { P.documents.unshift({ id: uid(), name: v("name"), type: v("type"), size: "n/a", date: today(), version: v("version") || "v1" }); touch(P); note(P, `The studio added the document “${v("name")}”.`); save(); render(true); toast("Document added."); return; }
  }

  /* ---------- router ---------- */
  let lastHash = null;
  function render(keepScroll) {
    const parts = location.hash.slice(1).split("?")[0].split("/").filter(Boolean).map(decodeURIComponent);
    const [a, b, c, d] = parts;
    let page;
    if (!a) page = home();
    else if (a === "projects") page = b ? projectPage(b) : projectsPage();
    else if (a === "studio") page = studioPage();
    else if (a === "contact") page = contactPage();
    else if (a === "login") { if (user()) { go(user().role === "staff" ? "/admin" : "/portal"); return; } page = loginPage(); }
    else if (a === "portal" || a === "admin") page = portalRoute(a, b, c, d);
    else page = notFound();
    if (!page.html) return;
    document.body.classList.toggle("has-tabbar", !!page.tabbar);
    const y = window.scrollY;
    document.title = page.title + " | " + S.studio.name;
    $("#head").innerHTML = headHTML(page.area || a);
    $("#app").innerHTML = page.html;
    $("#foot").innerHTML = footHTML();
    const changed = lastHash !== location.hash;
    lastHash = location.hash;
    document.body.classList.toggle("tabbed", !!page.tabbed);
    const appEl = $("#app"); appEl.classList.remove("enter");
    if (changed) { void appEl.offsetWidth; appEl.classList.add("enter"); }
    if (changed || keepScroll !== true) { window.scrollTo(0, 0); if (changed && !window.__first) $("#app").focus({ preventScroll: true }); }
    else window.scrollTo(0, y);
    window.__first = false;
  }
  window.__first = true;

  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-act]");
    if (t) { act(t.dataset.act, t); return; }
    const stage = e.target.closest("[data-stage]");
    if (stage) {
      const r = stage.getBoundingClientRect();
      ui.draft = { gid: stage.dataset.stage, x: Math.max(1, Math.min(99, ((e.clientX - r.left) / r.width) * 100)), y: Math.max(1, Math.min(99, ((e.clientY - r.top) / r.height) * 100)) };
      ui.activePin = null; render(true); const ta = $("#np"); if (ta) ta.focus();
    }
  });
  document.addEventListener("submit", (e) => {
    const f = e.target.closest("form[data-form]");
    if (!f) return;
    e.preventDefault();
    if (!f.checkValidity()) { f.reportValidity(); return; }
    form(f.dataset.form, f, new FormData(f));
  });
  window.addEventListener("hashchange", () => render());
  window.addEventListener("storage", (e) => { if (e.key === KEY) { state = load(); render(true); } });
  render();
})();
