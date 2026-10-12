/* Sample data for the preview. In the real build this lives in the Supabase database. */
window.SEED = {
  studio: {
    name: "triArch",
    short: "triArch",
    slogan: "Three points. One vision.",
    email: "hello@triarch.example",
    phone: "+00 000 000 000",
    address: "12 Studio Street, Your City",
  },

  heroStats: [["62", "Projects completed"], ["48", "Happy clients"], ["9", "People in the studio"]],

  successStats: [["62+", "Buildings completed since 2012"], ["48+", "Clients who came back for a second project"], ["300+", "Drawings reviewed online by clients last year"], ["98%", "Of milestones approved without a second round"]],

  news: [
    { title: "Kiln Primary School opens its doors", date: "2026-09-15", seed: 23, kind: "elevation", text: "The first pupils walked into the new classrooms this month." },
    { title: "Harbour Offices shortlisted for a regional award", date: "2026-08-02", seed: 37, kind: "render", text: "The converted warehouse made the final list in the workplace category." },
  ],

  faq: [
    ["How does the client portal work?", "Each client gets a private login. You can see the project timeline, look at the latest drawings and photos, approve milestones, and leave comments pinned to an exact spot on a drawing."],
    ["What does the process look like?", "Every project moves through five phases: concept, design development, permits, construction and handover. You approve a milestone at the end of each stage before we move on."],
    ["Do you work on projects remotely?", "Yes. Most design work can be done remotely, and the portal keeps everything in one place. We visit the site at key moments and at every stage of construction."],
    ["Do I need an architect for a small project?", "Often yes. Even a small extension needs drawings for a permit, and an architect usually saves more in avoided mistakes than the fee costs. We are happy to tell you honestly if you do not need us."],
  ],

  phases: ["Concept", "Design development", "Permits", "Construction", "Handover"],

  users: [
    { id: "c1", role: "client", name: "Maya Reyes", email: "maya@example.com", projects: ["p1", "p2"] },
    { id: "c2", role: "client", name: "Daniel Halden", email: "daniel@halden.example", projects: ["p3"] },
    { id: "s1", role: "staff", name: "Elena Marku", email: "elena@triarch.example", projects: [] },
  ],

  portfolio: [
    { slug: "ridge-house", name: "Ridge House", type: "Private house", place: "Ridge Road", year: 2025, size: "310 m²", seed: 11, kind: "elevation",
      text: "A family house stepped into a south-facing slope. Three concrete volumes share one long roof, so every room looks down the valley and none look at the neighbours." },
    { slug: "kiln-school", name: "Kiln Primary School", type: "School", place: "Old Brickworks site", year: 2024, size: "2,400 m²", seed: 23, kind: "elevation",
      text: "A school built from the clay of the former brickworks it replaces. Classrooms open onto a shared courtyard and are lit from two sides." },
    { slug: "harbour-offices", name: "Harbour Offices", type: "Workplace", place: "East Quay", year: 2024, size: "5,100 m²", seed: 37, kind: "elevation",
      text: "A converted warehouse with a new timber floor inserted inside the original steel frame. The old crane rails now carry the lighting." },
    { slug: "orchard-pavilion", name: "Orchard Pavilion", type: "Public building", place: "Municipal park", year: 2023, size: "140 m²", seed: 41, kind: "elevation",
      text: "A small covered market and meeting space under one folded roof, open on all four sides." },
    { slug: "stone-row", name: "Stone Row", type: "Housing", place: "Hill Street", year: 2023, size: "1,150 m²", seed: 53, kind: "elevation",
      text: "Eight terraced homes on a narrow plot. Each has its own garden wall, stair and roof terrace." },
    { slug: "lantern-library", name: "Lantern Library", type: "Public building", place: "Market Square", year: 2022, size: "1,800 m²", seed: 67, kind: "elevation",
      text: "A neighbourhood library with a tall reading hall that glows at dusk. The reading hall is entered through the old market arcade." },
  ],

  projects: [
    {
      id: "p1", name: "House on the Ridge", client: "c1", place: "Ridge Road, plot 14", type: "Private house",
      revision: "C", phaseIndex: 3, lastUpdate: "2026-10-09", seed: 5,
      summary: "A two-storey family house with a concrete frame and timber infill. Structure is complete up to the first floor slab.",
      milestones: [
        { id: "m1", phase: 0, title: "Concept design approved", due: "2026-02-12", status: "done", note: "Massing, orientation and room layout agreed.", response: { decision: "approved", text: "We love the courtyard idea.", by: "Maya Reyes", at: "2026-02-13" } },
        { id: "m2", phase: 1, title: "Final layouts and materials", due: "2026-04-30", status: "done", note: "Plans, sections and the material palette.", response: { decision: "approved", text: "", by: "Maya Reyes", at: "2026-05-02" } },
        { id: "m3", phase: 2, title: "Building permit granted", due: "2026-07-15", status: "done", note: "Permit received from the municipality.", response: null },
        { id: "m4", phase: 3, title: "Foundations and ground slab", due: "2026-08-28", status: "done", note: "Inspected and signed off by the engineer.", response: null },
        { id: "m5", phase: 3, title: "Choose kitchen and bathroom fittings", due: "2026-10-23", status: "awaiting", note: "Three fitting packages are in the documents. Please pick one or tell us what to change.", response: null },
        { id: "m6", phase: 3, title: "Roof structure complete", due: "2026-12-04", status: "upcoming", note: "", response: null },
        { id: "m7", phase: 4, title: "Handover and walk-through", due: "2027-03-19", status: "upcoming", note: "", response: null },
      ],
      gallery: [
        { id: "g1", title: "South elevation, revision C", kind: "elevation", seed: 5, date: "2026-09-18", pins: [
          { id: "pin1", x: 62, y: 38, text: "Can the upstairs windows be taller? We'd like to see the hills from the bed.", author: "Maya Reyes", role: "client", at: "2026-09-20", resolved: false },
        ] },
        { id: "g2", title: "Ground floor plan", kind: "plan", seed: 8, date: "2026-09-18", pins: [] },
        { id: "g3", title: "Exterior render, evening", kind: "render", seed: 5, date: "2026-09-02", pins: [] },
        { id: "g4", title: "Site photo: first floor frame", kind: "photo", seed: 3, date: "2026-10-07", pins: [] },
      ],
      documents: [
        { id: "d1", name: "Fittings options, three packages", type: "PDF", size: "4.2 MB", date: "2026-10-09", version: "v1" },
        { id: "d2", name: "Architectural drawings, revision C", type: "PDF", size: "11.8 MB", date: "2026-09-18", version: "C" },
        { id: "d3", name: "Structural engineer's report", type: "PDF", size: "2.1 MB", date: "2026-07-02", version: "v2" },
        { id: "d4", name: "Building permit", type: "PDF", size: "0.9 MB", date: "2026-07-15", version: "-" },
      ],
      messages: [
        { id: "ms1", from: "Elena Marku", role: "staff", text: "The first floor frame is up. Photos are in the gallery. The fittings packages are ready for your decision.", at: "2026-10-09T09:12:00" },
        { id: "ms2", from: "Maya Reyes", role: "client", text: "Looks great! We'll go through the fittings this weekend.", at: "2026-10-09T18:40:00" },
      ],
    },
    {
      id: "p2", name: "Garden Studio", client: "c1", place: "Rear garden, Ridge Road 14", type: "Outbuilding",
      revision: "A", phaseIndex: 1, lastUpdate: "2026-10-05", seed: 14,
      summary: "A small timber studio at the end of the garden, to be built after the main house is finished.",
      milestones: [
        { id: "m8", phase: 0, title: "Concept design approved", due: "2026-07-10", status: "done", note: "", response: { decision: "approved", text: "", by: "Maya Reyes", at: "2026-07-11" } },
        { id: "m9", phase: 1, title: "Review of layout options", due: "2026-10-30", status: "awaiting", note: "Two layouts: one with a loft, one without.", response: null },
        { id: "m10", phase: 2, title: "Permit application submitted", due: "2027-01-15", status: "upcoming", note: "", response: null },
      ],
      gallery: [
        { id: "g5", title: "Layout option A (with loft)", kind: "plan", seed: 21, date: "2026-10-05", pins: [] },
        { id: "g6", title: "Layout option B (single storey)", kind: "plan", seed: 22, date: "2026-10-05", pins: [] },
      ],
      documents: [{ id: "d5", name: "Design brief", type: "PDF", size: "0.6 MB", date: "2026-06-20", version: "v1" }],
      messages: [],
    },
    {
      id: "p3", name: "Halden Clinic Fit-out", client: "c2", place: "2nd floor, Market Square 3", type: "Interior",
      revision: "B", phaseIndex: 2, lastUpdate: "2026-10-08", seed: 30,
      summary: "A dental clinic fit-out on the second floor of a listed building. Services routing is the main design challenge.",
      milestones: [
        { id: "m11", phase: 0, title: "Concept design approved", due: "2026-03-05", status: "done", note: "", response: { decision: "approved", text: "", by: "Daniel Halden", at: "2026-03-06" } },
        { id: "m12", phase: 1, title: "Equipment layout confirmed", due: "2026-06-18", status: "done", note: "", response: { decision: "approved", text: "Chairs positioned to avoid the load-bearing wall.", by: "Daniel Halden", at: "2026-06-20" } },
        { id: "m13", phase: 2, title: "Heritage office approval", due: "2026-10-20", status: "changes", note: "The heritage office asked for the reception counter to be set back from the stair.", response: { decision: "changes", text: "Can we keep the counter at least 1.2 m wide?", by: "Daniel Halden", at: "2026-10-08" } },
        { id: "m14", phase: 2, title: "Fire safety sign-off", due: "2026-11-27", status: "upcoming", note: "", response: null },
        { id: "m15", phase: 3, title: "Start on site", due: "2027-01-11", status: "upcoming", note: "", response: null },
      ],
      gallery: [
        { id: "g7", title: "Floor plan, revision B", kind: "plan", seed: 33, date: "2026-10-01", pins: [] },
        { id: "g8", title: "Reception, render", kind: "render", seed: 34, date: "2026-10-01", pins: [] },
      ],
      documents: [{ id: "d6", name: "Heritage office feedback", type: "PDF", size: "0.4 MB", date: "2026-10-06", version: "-" }],
      messages: [{ id: "ms3", from: "Elena Marku", role: "staff", text: "The heritage office came back with one change. We've marked it as a milestone so you can respond.", at: "2026-10-07T14:00:00" }],
    },
  ],

  team: [
    { name: "Elena Marku", role: "Founding partner" },
    { name: "Arben Leka", role: "Partner, technical design" },
    { name: "Sofia Dervishi", role: "Architect, residential" },
    { name: "Nikola Petrov", role: "Architect, public buildings" },
    { name: "Ira Gjoka", role: "Project coordinator" },
  ],

  services: [
    ["Architecture", "Concept through construction drawings for houses, workplaces and public buildings."],
    ["Interiors", "Layouts, joinery and fittings for existing buildings."],
    ["Planning and permits", "We prepare and submit applications and deal with the authorities."],
    ["Site supervision", "Regular visits during construction, and sign-off at every stage."],
  ],

  news: [
    { title: "Ridge House: the frame reaches the first floor", date: "2026-10-09", text: "The concrete frame is now complete up to the first floor slab. Roof structure is next.", seed: 3, kind: "photo" },
    { title: "Follow your project from your phone", date: "2026-09-15", text: "Clients can now see progress, review drawings and send feedback in one private place.", seed: 41, kind: "render" },
  ],

  faq: [
    ["How does the client portal work?", "After we start your project you get a private login. You see a timeline from concept to handover, the latest drawings and photos, and all documents. Nobody else can see your project."],
    ["How do I give feedback on a drawing?", "Open the drawing and tap the exact spot you want to discuss. Write your comment and we are notified straight away. We reply in the same place."],
    ["What happens when I approve a milestone?", "The milestone is marked done and the studio is told. If you ask for changes instead, we revise the drawings and send them back for another look."],
    ["Can more than one person see our project?", "Yes. A couple, a family or a company team can each have their own login to the same project."],
  ],
};
