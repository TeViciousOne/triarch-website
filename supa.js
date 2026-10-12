/* The live backend: the same screens as the preview, but reading and writing the Supabase database.
   Row-level security in the database decides who may see or change what; nothing here is trusted for that. */
export function makeSupa(sb) {
  const BUCKET = "project-files";
  let me = null;
  let projects = [];
  let clientList = [];

  const today = () => new Date().toISOString().slice(0, 10);
  const localStamp = (iso) => {
    const d = new Date(iso);
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  };
  const bytes = (n) => (n == null ? "" : n < 1e6 ? Math.max(1, Math.round(n / 1e3)) + " KB" : (n / 1e6).toFixed(1) + " MB");
  const ext = (name) => (String(name).split(".").pop() || "").toUpperCase().slice(0, 6) || "FILE";
  const safe = (name) => String(name).replace(/[^A-Za-z0-9._-]+/g, "_").slice(-80);
  const must = (r) => { if (r.error) throw r.error; return r.data; };

  async function loadMe() {
    const { data } = await sb.auth.getSession();
    const session = data && data.session;
    if (!session) { me = null; return; }
    const prof = must(await sb.from("profiles").select("id, full_name, role").eq("id", session.user.id).maybeSingle());
    me = prof ? { id: prof.id, role: prof.role, name: prof.full_name, email: session.user.email, projects: [] } : null;
  }

  async function loadProjects() {
    if (!me) { projects = []; clientList = []; return; }
    const q = (t, o) => { let r = sb.from(t).select("*"); if (o) r = r.order(o.col, { ascending: !!o.asc }); return r; };
    const [pr, ms, gi, pn, rp, dc, mg, mem, pf] = await Promise.all([
      q("projects", { col: "last_update" }), q("milestones"), q("gallery_items", { col: "created_at" }), q("pins", { col: "created_at", asc: true }),
      q("pin_replies", { col: "created_at", asc: true }), q("documents", { col: "created_at" }), q("messages", { col: "created_at", asc: true }),
      q("project_members"), sb.from("profiles").select("id, full_name, role"),
    ]);
    const [P, M, G, PN, RP, D, MG, MEM, PF] = [pr, ms, gi, pn, rp, dc, mg, mem, pf].map(must);
    const person = {};
    PF.forEach((x) => (person[x.id] = x));
    const nm = (id) => (person[id] ? person[id].full_name : "Studio");
    const rl = (id) => (person[id] ? person[id].role : "staff");
    clientList = PF.filter((x) => x.role === "client").map((x) => ({ id: x.id, name: x.full_name }));

    /* Private images: ask Storage for short-lived links. */
    const paths = G.filter((g) => g.storage_path).map((g) => g.storage_path);
    const urls = {};
    if (paths.length) {
      const r = await sb.storage.from(BUCKET).createSignedUrls(paths, 3600);
      (r.data || []).forEach((x) => { if (x.signedUrl) urls[x.path] = x.signedUrl; });
    }

    const by = (rows, key) => rows.reduce((o, r) => ((o[r[key]] = o[r[key]] || []).push(r), o), {});
    const mBy = by(M, "project_id"), gBy = by(G, "project_id"), dBy = by(D, "project_id"), msgBy = by(MG, "project_id"), memBy = by(MEM, "project_id");
    const pinBy = by(PN, "item_id"), repBy = by(RP, "pin_id");

    projects = P.map((p) => {
      const owners = (memBy[p.id] || []).map((x) => x.user_id).filter((id) => rl(id) === "client");
      const owner = owners[0];
      return {
        id: p.id, name: p.name, place: p.location || "", type: p.type || "", revision: p.revision, phaseIndex: p.phase_index,
        lastUpdate: p.last_update, seed: p.seed, summary: p.summary || "", client: owner || null,
        clientName: owners.map(nm).join(", ") || "No client yet",
        milestones: (mBy[p.id] || []).map((m) => ({
          id: m.id, phase: m.phase_index, title: m.title, due: m.due_date, status: m.status, note: m.note || "",
          response: m.response_decision ? { decision: m.response_decision, text: m.response_text || "", by: nm(m.responded_by), at: String(m.responded_at || "").slice(0, 10) } : null,
        })),
        gallery: (gBy[p.id] || []).map((g) => ({
          id: g.id, title: g.title, kind: g.kind, seed: g.seed, date: String(g.created_at).slice(0, 10), url: g.storage_path ? urls[g.storage_path] || null : null,
          pins: (pinBy[g.id] || []).map((x) => ({
            id: x.id, x: Number(x.x), y: Number(x.y), text: x.body, author: nm(x.author_id), role: rl(x.author_id), at: String(x.created_at).slice(0, 10), resolved: x.resolved,
            replies: (repBy[x.id] || []).map((r) => ({ author: nm(r.author_id), role: rl(r.author_id), text: r.body, at: String(r.created_at).slice(0, 10) })),
          })),
        })),
        documents: (dBy[p.id] || []).map((d) => ({ id: d.id, name: d.name, type: d.file_type, size: bytes(d.size_bytes) || "n/a", date: String(d.created_at).slice(0, 10), version: d.version, path: d.storage_path })),
        messages: (msgBy[p.id] || []).map((m) => (m.is_system
          ? { id: m.id, from: "System", role: "system", text: m.body, at: localStamp(m.created_at) }
          : { id: m.id, from: nm(m.author_id), role: rl(m.author_id), text: m.body, at: localStamp(m.created_at), mine: m.author_id === me.id })),
      };
    });
    me.projects = projects.map((p) => p.id);
  }

  async function touch(pid) {
    if (me && me.role === "staff") must(await sb.from("projects").update({ last_update: today() }).eq("id", pid));
  }
  async function systemNote(pid, text) {
    must(await sb.from("messages").insert({ project_id: pid, body: text, is_system: true, author_id: null }));
  }
  async function upload(pid, file) {
    const path = `${pid}/${crypto.randomUUID()}-${safe(file.name)}`;
    must(await sb.storage.from(BUCKET).upload(path, file, { contentType: file.type || undefined, upsert: false }));
    return path;
  }

  return {
    demo: false,
    async init() { await loadMe(); await loadProjects(); },
    async refresh() { await loadMe(); await loadProjects(); },
    user: () => me,
    projects: () => projects,
    clients: () => clientList,

    async signIn(email, password) {
      const r = await sb.auth.signInWithPassword({ email, password });
      if (r.error) throw new Error(/invalid login/i.test(r.error.message) ? "That email and password don't match." : r.error.message);
      await loadMe();
      if (!me) throw new Error("This account has no profile yet. Please contact the studio.");
      await loadProjects();
    },
    async signOut() { await sb.auth.signOut(); me = null; projects = []; },

    async approve(pid, mid) { must(await sb.rpc("respond_to_milestone", { mid, decision: "approved", reply: "" })); await loadProjects(); },
    async requestChanges(pid, mid, text) { must(await sb.rpc("respond_to_milestone", { mid, decision: "changes", reply: text })); await loadProjects(); },

    async addPin(pid, gid, x, y, text) {
      must(await sb.from("pins").insert({ item_id: gid, x: Math.round(x), y: Math.round(y), body: text }));
      await touch(pid); await loadProjects();
    },
    async replyPin(pid, gid, id, text) { must(await sb.from("pin_replies").insert({ pin_id: id, body: text })); await touch(pid); await loadProjects(); },
    async toggleResolve(pid, gid, id) {
      const pin = projects.find((p) => p.id === pid).gallery.find((g) => g.id === gid).pins.find((x) => x.id === id);
      must(await sb.from("pins").update({ resolved: !pin.resolved }).eq("id", id));
      await touch(pid); await loadProjects();
    },
    async sendMessage(pid, text) { must(await sb.from("messages").insert({ project_id: pid, body: text })); await touch(pid); await loadProjects(); },
    async sendContact(f) { must(await sb.from("contact_requests").insert({ name: f.name, email: f.email, kind: f.type, message: f.message })); },

    async setPhase(pid, phase, revision) {
      must(await sb.from("projects").update({ phase_index: phase, revision: revision || "A", last_update: today() }).eq("id", pid)); await loadProjects();
    },
    async setMilestoneStatus(pid, mid, status) {
      must(await sb.from("milestones").update({ status }).eq("id", mid));
      if (status === "awaiting") {
        const m = projects.find((p) => p.id === pid).milestones.find((x) => x.id === mid);
        await systemNote(pid, `The studio asked for your feedback on “${m.title}”.`);
      }
      await touch(pid); await loadProjects();
    },
    async addMilestone(pid, m) {
      must(await sb.from("milestones").insert({ project_id: pid, phase_index: m.phase, title: m.title, due_date: m.due, note: m.note || null, status: "upcoming" }));
      await touch(pid); await loadProjects();
    },
    async addImage(pid, g) {
      const row = { project_id: pid, title: g.title, kind: g.kind };
      if (g.file) row.storage_path = await upload(pid, g.file);
      must(await sb.from("gallery_items").insert(row));
      await systemNote(pid, `The studio added “${g.title}” to the gallery.`);
      await touch(pid); await loadProjects();
    },
    async addDoc(pid, d) {
      const row = { project_id: pid, name: d.name, file_type: d.file ? ext(d.file.name) : d.type, version: d.version || "v1" };
      if (d.file) { row.storage_path = await upload(pid, d.file); row.size_bytes = d.file.size; }
      must(await sb.from("documents").insert(row));
      await systemNote(pid, `The studio added the document “${d.name}”.`);
      await touch(pid); await loadProjects();
    },
    async docUrl(d) {
      if (!d.path) return null;
      const r = await sb.storage.from(BUCKET).createSignedUrl(d.path, 300, { download: d.name });
      return r.data ? r.data.signedUrl : null;
    },
    async addProject(f) {
      const p = must(await sb.from("projects").insert({ name: f.name, location: f.place || null, type: f.type || null, summary: f.summary || null }).select("id").single());
      if (f.client) must(await sb.from("project_members").insert({ project_id: p.id, user_id: f.client }));
      await loadProjects();
      return p.id;
    },
  };
}
