/* Chooses the backend, then starts the app. */
(async function () {
  const cfg = window.CONFIG || {};
  let backend = null;
  if (cfg.supabaseUrl && cfg.supabaseKey) {
    try {
      const [{ createClient }, { makeSupa }] = await Promise.all([
        import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm"),
        import("./supa.js"),
      ]);
      backend = makeSupa(createClient(cfg.supabaseUrl, cfg.supabaseKey, { auth: { persistSession: true, autoRefreshToken: true } }));
    } catch (e) {
      console.error("Could not load the database connection", e);
    }
  }
  window.TRIARCH_START(backend);
})();
