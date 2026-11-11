import { useCallback, useEffect, useMemo, useState } from "react";

const API_ROOT = `${(import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "")}/api/v1`;
const writableRoles = ["records_admin", "clinician"];
const readableRoles = [...writableRoles, "auditor"];

async function request(path, { token, body, method = "GET" } = {}) {
  const response = await fetch(`${API_ROOT}${path}`, {
    method,
    headers: {
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : null;
  if (!response.ok) {
    const detail = payload?.detail;
    throw new Error(typeof detail === "string" ? detail : Array.isArray(detail) ? detail.map((item) => item.msg).join("; ") : `Request failed (${response.status})`);
  }
  return payload;
}

function Icon({ name, size = 18 }) {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
    patients: <><circle cx="9" cy="8" r="3.2"/><path d="M3.5 20c.5-3.4 2.4-5.2 5.5-5.2s5 1.8 5.5 5.2"/><path d="M16 5.2a3.1 3.1 0 0 1 0 5.9M17 15c2.2.6 3.4 2.2 3.7 4.6"/></>,
    users: <><circle cx="9" cy="8" r="3"/><path d="M3 20c.4-3.3 2.3-5 6-5s5.6 1.7 6 5"/><path d="M16 5.5a3 3 0 0 1 0 5.5M17 15c2 .5 3.2 1.8 3.7 4"/></>,
    building: <><path d="M3 21h18M5 21V5l7-3 7 3v16M9 9h.01M15 9h.01M9 13h.01M15 13h.01M10 21v-4h4v4"/></>,
    chart: <><path d="M4 20V11M10 20V5M16 20v-8M22 20H2"/></>,
    shield: <><path d="M12 3 20 6v5c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6l8-3Z"/><path d="m9 12 2 2 4-4"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3"/><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"/></>,
    spark: <><path d="m12 3 1.5 6.5L20 11l-6.5 1.5L12 19l-1.5-6.5L4 11l6.5-1.5L12 3Z"/><path d="m19 16 .6 2.4L22 19l-2.4.6L19 22l-.6-2.4L16 19l2.4-.6L19 16Z"/></>,
    chevron: <path d="m9 18 6-6-6-6"/>,
    close: <><path d="m18 6-12 12M6 6l12 12"/></>,
  };
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function Brand({ compact = false }) {
  return <div className={`brand ${compact ? "brand-compact" : ""}`}><div className="brand-mark"><span>+</span></div><div><strong>CEIP</strong><small>Clinical intake platform</small></div></div>;
}

function ErrorNotice({ children, onClose }) {
  if (!children) return null;
  return <div className="notice notice-error" role="alert"><span>{children}</span>{onClose && <button className="icon-button" onClick={onClose} aria-label="Dismiss"><Icon name="close" size={16}/></button>}</div>;
}

function Landing({ onSignIn, error }) {
  const tools = [
    ["API", "FastAPI", "Async service and role-aware endpoints", "mint"],
    ["DATA", "PostgreSQL", "Tenant-scoped records and JSONB notes", "blue"],
    ["TEXT", "spaCy + regex", "Explainable phrase and pattern matching", "lilac"],
    ["SECURITY", "JWT + Redis", "Access tokens and session revocation", "sand"],
  ];
  return <main className="landing-shell">
    <header className="landing-nav"><a className="landing-brand" href="#top" aria-label="CEIP overview"><Brand/></a><nav><a href="#overview">Overview</a><a href="#architecture">Architecture</a><a href="#decisions">Design choices</a><a href="#roadmap">Next steps</a></nav><button className="button button-primary landing-signin" onClick={onSignIn}>Open demo <Icon name="arrow" size={16}/></button></header>
    {error && <div className="landing-error"><ErrorNotice>{error}</ErrorNotice></div>}
    <section className="landing-hero" id="top"><div className="hero-copy"><div className="hero-kicker"><i/> PORTFOLIO PROJECT <span/> SYNTHETIC DATA</div><h1>Making clinical<br/>notes <em>more structured.</em></h1><p className="hero-lede">A research-oriented prototype for clinic-scoped encounter data, explainable note extraction, and auditable access.</p><div className="hero-actions"><button className="button button-primary" onClick={onSignIn}>Explore the demo <Icon name="arrow" size={17}/></button><a className="text-link" href="#architecture">See how it works <Icon name="chevron" size={15}/></a></div><div className="hero-proof"><span><Icon name="shield" size={15}/> Tenant-scoped access</span><span><Icon name="spark" size={15}/> Explainable extraction</span></div></div>
      <div className="hero-visual"><div className="visual-orbit orbit-a"/><div className="visual-orbit orbit-b"/><div className="visual-topline"><span>NOTE PROCESSING</span><span className="live-status"><i/> DEMO FLOW</span></div><div className="flow-step"><span className="flow-step-icon source-icon"><Icon name="patients" size={18}/></span><div><small>01 · SOURCE</small><strong>Patient encounter</strong><p>Clinic-scoped record</p></div><span className="step-check">✓</span></div><div className="flow-connector"><i/></div><div className="flow-step"><span className="flow-step-icon note-icon"><Icon name="grid" size={18}/></span><div><small>02 · INPUT</small><strong>Clinical note</strong><p>Raw text saved to encounter</p></div><span className="step-check">✓</span></div><div className="flow-connector"><i/></div><div className="flow-step active-flow"><span className="flow-step-icon extract-icon"><Icon name="spark" size={18}/></span><div><small>03 · EXTRACT</small><strong>Structured fields</strong><p>Vocabulary matches + patterns</p></div><span className="flow-pulse"/></div><div className="mini-result"><span>RESULT PREVIEW</span><div><i/> Diagnoses <b>SNOMED CT</b></div><div><i/> Medications <b>dose + frequency</b></div><div><i/> Vitals <b>BP · HR</b></div></div><div className="visual-caption"><Icon name="shield" size={14}/> Read and write activity is audit logged</div></div>
    </section>
    <section className="landing-strip"><div><strong>4</strong><span>role types</span></div><i/><div><strong>1</strong><span>tenant-safe data model</span></div><i/><div><strong>5</strong><span>Synthea source CSVs</span></div><i/><div><strong>JSONB</strong><span>structured note output</span></div></section>
    <section className="landing-section overview-section" id="overview"><div className="section-intro"><span className="eyebrow">THE PROJECT</span><h2>Built to explore<br/>clinical data infrastructure.</h2><p>Clinical data workflows need to connect patient and encounter information while controlling which clinic can access each record. Details in free-text notes can also be difficult to query consistently. CEIP explores these challenges through a working, reviewable software prototype.</p><p>Built as a portfolio project for graduate research opportunities in clinical data pipelines and hospital data systems, CEIP combines tenant-scoped records, role-based access, audit logging, and a transparent baseline extractor.</p><p>Synthea supplies synthetic structured events for repeatable demos. The loader turns linked events into generated summary notes; a separate workflow accepts raw note text. Synthea summaries are not clinician-authored notes.</p><button className="underlined-link" onClick={onSignIn}>Enter the workspace <Icon name="arrow" size={15}/></button></div><div className="overview-cards"><article className="overview-card"><div className="overview-card-icon icon-green"><Icon name="building"/></div><span className="eyebrow">MULTI-TENANT</span><h3>Clinic boundaries first</h3><p>The active user's clinic determines data access. Tenant filters live in service queries, and foreign record IDs return 404.</p></article><article className="overview-card"><div className="overview-card-icon icon-blue"><Icon name="shield"/></div><span className="eyebrow">ACCOUNTABILITY</span><h3>Auditable operations</h3><p>Patient, encounter, note, and analytics activity creates an audit record alongside the related operation.</p></article><article className="overview-card"><div className="overview-card-icon icon-lilac"><Icon name="spark"/></div><span className="eyebrow">STRUCTURED OUTPUT</span><h3>Explainable baseline</h3><p>Phrase matching, regular expressions, and simple negation cues produce candidate diagnoses, medication details, and vitals stored as JSONB.</p></article></div></section>
    <section className="architecture-section" id="architecture"><div className="architecture-heading"><div><span className="eyebrow">HOW IT FITS TOGETHER</span><h2>A small, traceable data pipeline.</h2></div><p>Each step has a clear responsibility, from the API boundary to persisted structured output.</p></div><div className="architecture-flow"><div className="architecture-node"><span className="node-icon"><Icon name="users"/></span><small>CLIENT</small><strong>React UI</strong></div><span className="architecture-arrow">→</span><div className="architecture-node"><span className="node-icon"><Icon name="grid"/></span><small>API</small><strong>FastAPI</strong></div><span className="architecture-arrow">→</span><div className="architecture-node"><span className="node-icon"><Icon name="shield"/></span><small>ACCESS</small><strong>JWT + roles</strong></div><span className="architecture-arrow">→</span><div className="architecture-node"><span className="node-icon"><Icon name="building"/></span><small>LOGIC</small><strong>Tenant services</strong></div><span className="architecture-arrow">→</span><div className="architecture-node"><span className="node-icon"><Icon name="spark"/></span><small>EXTRACTION</small><strong>spaCy + regex</strong></div><span className="architecture-arrow">→</span><div className="architecture-node"><span className="node-icon"><Icon name="grid"/></span><small>STORAGE</small><strong>PostgreSQL</strong></div></div><div className="architecture-support"><span><i className="support-dot audit-dot"/> Audit service writes alongside operations</span><span><i className="support-dot redis-dot"/> Redis stores revoked token/session IDs</span><span><i className="support-dot synthea-dot"/> Synthea loader imports synthetic event data</span></div></section>
    <section className="tools-section"><div className="tools-heading"><span className="eyebrow">TOOLS USED</span><h2>Practical tools for a focused prototype.</h2><p>Chosen to keep the service understandable, testable, and easy to run locally.</p></div><div className="tool-grid">{tools.map(([tag, name, description, tone]) => <article className="tool-card" key={name}><span className={`tool-tag ${tone}`}>{tag}</span><h3>{name}</h3><p>{description}</p></article>)}</div><div className="tool-footer"><span><b>Also used</b> Alembic · Pytest · HTTPX · Vite · Synthea · Python 3.11 <b>·</b> React</span></div></section>
    <section className="decisions-section" id="decisions"><div className="decisions-heading"><span className="eyebrow">SCOPE & TRADE-OFFS</span><h2>What the prototype can and cannot claim.</h2><p>The project demonstrates backend patterns and an explainable starter pipeline. It is not a production clinical system.</p></div><div className="constraint-grid"><article className="constraint-card"><span className="constraint-mark">01</span><h3>Synthetic records only</h3><p>Synthea data protects privacy and makes demos repeatable. It does not represent a real clinic's workflow or patient population.</p></article><article className="constraint-card"><span className="constraint-mark">02</span><h3>Starter NLP rules</h3><p>Phrase matching and regex are transparent, but miss unseen terms and complex negation. Results are not clinically validated.</p></article><article className="constraint-card"><span className="constraint-mark">03</span><h3>Focused integration scope</h3><p>No hospital EHR connection, terminology service, distributed extraction queue, or production hosting configuration is included.</p></article></div></section>
    <section className="roadmap-section" id="roadmap"><div className="roadmap-heading"><span className="eyebrow">NEXT ITERATIONS</span><h2>A clear path from prototype to stronger evidence.</h2><p>Measure the current extraction baseline before testing more advanced research methods. Retrieval is a proposed experiment, not a feature in this demo.</p></div><div className="roadmap-list"><div><span>01</span><section><strong>Measure the current baseline</strong><p>Evaluate held-out, labeled synthetic notes; report precision, recall, and errors for diagnoses, medication details, vitals, and negation.</p></section><b>Evaluation</b></div><div><span>02</span><section><strong>Improve terminology coverage</strong><p>Review SNOMED CT concepts and synonyms, preserve their source and provenance, and track which terms remain unmatched.</p></section><b>Vocabulary</b></div><div><span>03</span><section><strong>Test realistic limits</strong><p>Evaluate wording variation, negation, ambiguity, and note formats. Synthea summaries are generated from structured events, not clinician-authored notes.</p></section><b>Validation</b></div><div><span>04</span><section><strong>Evaluate terminology retrieval</strong><p>As a future research experiment, compare retrieved candidates for unfamiliar phrases with the current matcher. Measure coverage and incorrect suggestions, preserve sources, and require human review.</p></section><b>Research</b></div></div></section>
    <section className="landing-cta"><div><span className="eyebrow">TAKE A LOOK</span><h2>Follow one encounter<br/>from note to structure.</h2><p>Sign in with a demo clinic account to explore the current workflow.</p></div><button className="button button-light" onClick={onSignIn}>Open the demo workspace <Icon name="arrow" size={17}/></button><div className="cta-orb"/></section>
    <footer className="landing-footer"><Brand/><span>Clinical Encounter Intake Platform</span><span>Portfolio project · synthetic data · not for clinical use</span><span>Created by Awulor Chukwudi Francis</span></footer>
  </main>;
}

function Login({ onLogin, onBack }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const tokens = await request("/auth/login", { method: "POST", body: { email, password } });
      sessionStorage.setItem("ceip_access", tokens.access_token);
      sessionStorage.setItem("ceip_refresh", tokens.refresh_token);
      await onLogin(tokens.access_token);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  return <main className="login-page">
    <div className="login-art"><div className="art-orbit orbit-one"/><div className="art-orbit orbit-two"/><div className="art-cross">+</div><div className="art-copy"><span className="eyebrow">SECURE  |  CLINIC-SCOPED  |  AUDITABLE</span><h1>Clinical records,<br/><em>made clearer.</em></h1><p>A focused workspace for patient encounters and structured clinical notes.</p><div className="art-caption"><span className="status-dot"/> Synthetic-data demonstration environment</div></div><div className="art-card"><div className="art-card-top"><span className="tiny-avatar">JD</span><div><b>Encounter summary</b><small>Structured note  |  just now</small></div><span className="check-dot">OK</span></div><div className="art-pills"><span>Diagnosis captured</span><span>Vitals recognized</span></div><div className="art-skeleton"><i/><i/><i/></div></div></div>
    <div className="login-side"><div className="login-top"><Brand/><button type="button" className="back-to-overview" onClick={onBack}>← Project overview</button></div><form className="login-form" onSubmit={submit}><div className="form-kicker">WELCOME BACK</div><h2>Sign in to your workspace</h2><p className="muted">Use your clinic account to continue.</p><ErrorNotice>{error}</ErrorNotice><label>Email address<input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@clinic.org"/></label><label>Password<input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password"/></label><button className="button button-primary button-wide" disabled={busy}>{busy ? "Signing in..." : <>Sign in <Icon name="arrow" size={17}/></>}</button><p className="login-note"><Icon name="shield" size={15}/> Access is scoped to your assigned clinic.</p></form><footer className="login-footer">CEIP  |  Portfolio demonstration  |  Synthetic data only</footer></div>
  </main>;
}

function App() {
  const [token, setToken] = useState(() => sessionStorage.getItem("ceip_access"));
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("workspace");
  const [showLogin, setShowLogin] = useState(false);
  const [error, setError] = useState("");
  const [loadingUser, setLoadingUser] = useState(Boolean(token));

  const signOut = useCallback(async () => {
    const refresh = sessionStorage.getItem("ceip_refresh");
    try { if (token && refresh) await request("/auth/logout", { token, method: "POST", body: { refresh_token: refresh } }); } catch { /* Clear local session even if the API is unavailable. */ }
    sessionStorage.removeItem("ceip_access"); sessionStorage.removeItem("ceip_refresh");
    setToken(null); setUser(null); setPage("workspace");
  }, [token]);

  const loadUser = useCallback(async (accessToken) => {
    try {
      const profile = await request("/users/me", { token: accessToken });
      setUser(profile); setToken(accessToken); setError("");
    } catch (err) {
      sessionStorage.removeItem("ceip_access"); sessionStorage.removeItem("ceip_refresh");
      setToken(null); setUser(null); setError(err.message);
    } finally { setLoadingUser(false); }
  }, []);

  useEffect(() => { if (token) loadUser(token); else setLoadingUser(false); }, []);

  if (loadingUser) return <div className="app-loading"><Brand/><span className="spinner"/>Restoring your secure session...</div>;
  if (!token || !user) return showLogin ? <Login onLogin={loadUser} onBack={() => setShowLogin(false)}/> : <Landing onSignIn={() => setShowLogin(true)} error={error}/>;

  const canReadClinic = readableRoles.includes(user.role);
  const canWrite = writableRoles.includes(user.role);
  const links = [
    ...(canReadClinic ? [{ id: "workspace", label: "Clinical workspace", icon: "patients" }] : []),
    ...(canReadClinic ? [{ id: "analytics", label: "Analytics", icon: "chart" }] : []),
    ...(user.role === "super_admin" ? [{ id: "admin", label: "Clinic administration", icon: "building" }] : []),
    ...(user.role === "records_admin" ? [{ id: "team", label: "Clinic staff", icon: "users" }] : []),
    ...(["records_admin", "auditor", "super_admin"].includes(user.role) ? [{ id: "audit", label: "Audit trail", icon: "shield" }] : []),
  ];
  const currentPage = links.some((link) => link.id === page) ? page : links[0]?.id || "audit";

  return <div className="shell">
    <aside className="sidebar"><div className="sidebar-brand"><Brand/></div><div className="workspace-switch"><div className="clinic-avatar">{user.role === "super_admin" ? "SA" : "CL"}</div><div className="workspace-name"><strong>{user.role === "super_admin" ? "Platform admin" : "Clinic workspace"}</strong><small>{user.tenant_id ? `Clinic  |  ${user.tenant_id.slice(0, 8)}` : "Global administration"}</small></div><span className="workspace-menu">...</span></div><div className="nav-label">WORKSPACE</div><nav className="main-nav">{links.map((link) => <button key={link.id} className={`nav-item ${currentPage === link.id ? "active" : ""}`} onClick={() => { setPage(link.id); setError(""); }}><Icon name={link.icon}/><span>{link.label}</span>{currentPage === link.id && <span className="nav-active-mark"/>}</button>)}</nav><div className="sidebar-bottom"><div className="privacy-card"><div className="privacy-icon"><Icon name="shield" size={17}/></div><div><strong>Privacy by design</strong><p>Your clinic data stays scoped to your account.</p></div></div><div className="user-chip"><div className="user-avatar">{user.email?.slice(0, 1).toUpperCase()}</div><div className="user-info"><strong>{user.email}</strong><small>{user.role.replace("_", " ")}</small></div><button className="icon-button logout-button" title="Sign out" onClick={signOut}><Icon name="logout" size={17}/></button></div></div></aside>
    <main className="main-area"><header className="topbar"><div className="breadcrumb"><span>CEIP</span><Icon name="chevron" size={14}/><strong>{links.find((link) => link.id === currentPage)?.label || "Audit trail"}</strong></div><div className="topbar-right"><span className="environment-pill"><i/> SYNTHETIC DATA</span><span className="topbar-divider"/><div className="top-user"><span className="user-avatar small">{user.email?.slice(0, 1).toUpperCase()}</span><span>{user.email}</span></div></div></header><div className="content-area"><ErrorNotice>{error}</ErrorNotice>{currentPage === "workspace" && <Workspace token={token} user={user} setError={setError}/>}{currentPage === "analytics" && <Analytics token={token}/>}{currentPage === "admin" && <TenantAdmin token={token}/>}{currentPage === "team" && <StaffAdmin token={token} user={user}/>}{currentPage === "audit" && <Audit token={token} user={user}/>}</div><footer className="app-footer"><span>CEIP  |  Clinical Encounter Intake Platform</span><span>Portfolio demonstration <b> | </b> Not for clinical use</span></footer></main>
  </div>;
}

function Workspace({ token, user, setError }) {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [encounters, setEncounters] = useState([]);
  const [selectedEncounter, setSelectedEncounter] = useState(null);
  const [notes, setNotes] = useState([]);
  const [busy, setBusy] = useState(false);
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [patientForm, setPatientForm] = useState({ full_name: "", birth_date: "", sex: "" });
  const [patientQuery, setPatientQuery] = useState("");
  const [noteText, setNoteText] = useState("");
  const canWrite = writableRoles.includes(user.role);

  const refreshPatients = useCallback(async () => {
    try { setPatients(await request("/patients/?limit=100&offset=0", { token })); }
    catch (err) { setError(err.message); }
  }, [token, setError]);

  useEffect(() => { refreshPatients(); }, [refreshPatients]);

  async function choosePatient(patient) {
    setSelectedPatient(patient); setSelectedEncounter(null); setNotes([]); setError("");
    try { setEncounters(await request(`/patients/${patient.id}/encounters`, { token })); }
    catch (err) { setEncounters([]); setError(err.message); }
  }

  async function chooseEncounter(encounter) {
    setSelectedEncounter(encounter); setError("");
    try {
      const data = await request(`/encounters/${encounter.id}/structured-data`, { token });
      setNotes(data.notes || []);
    } catch (err) { setNotes([]); setError(err.message); }
  }

  async function createPatient(event) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const body = { ...patientForm, birth_date: patientForm.birth_date || null, sex: patientForm.sex || null };
      const patient = await request("/patients/", { token, method: "POST", body });
      setPatients((items) => [...items, patient]); setPatientForm({ full_name: "", birth_date: "", sex: "" });
      setShowPatientForm(false); await choosePatient(patient);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  async function createEncounter() {
    if (!selectedPatient) return;
    setBusy(true); setError("");
    try {
      const encounter = await request(`/patients/${selectedPatient.id}/encounters`, { token, method: "POST", body: {} });
      setEncounters((items) => [encounter, ...items]); await chooseEncounter(encounter);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  async function saveNote(event) {
    event.preventDefault(); if (!selectedEncounter || !noteText.trim()) return;
    setBusy(true); setError("");
    try {
      const note = await request(`/encounters/${selectedEncounter.id}/notes`, { token, method: "POST", body: { raw_text: noteText.trim() } });
      setNotes((items) => [...items, note]); setNoteText("");
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  async function extractNote(noteId) {
    setBusy(true); setError("");
    try {
      const updated = await request(`/encounters/${selectedEncounter.id}/notes/${noteId}/extract`, { token, method: "POST" });
      setNotes((items) => items.map((item) => item.id === noteId ? updated : item));
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  const diagnosisTotal = notes.reduce((sum, note) => sum + (note.extracted?.diagnoses?.length || 0), 0);
  const noteTotal = notes.length;
  const visiblePatients = patients.filter((patient) => patient.full_name.toLowerCase().includes(patientQuery.trim().toLowerCase()));
  return <>
    <PageHeading eyebrow="PATIENT RECORDS" title="Clinical workspace" subtitle="Move from patient context to encounter notes and structured results." action={canWrite && <button className="button button-primary" onClick={() => setShowPatientForm((value) => !value)}><Icon name="plus" size={17}/> Add patient</button>}/>
    <div className="metrics-row"><Metric icon="patients" label="Patients in clinic" value={patients.length} tone="mint"/><Metric icon="grid" label="Selected encounter" value={selectedEncounter ? "Active" : " - "} tone="blue"/><Metric icon="spark" label="Structured diagnoses" value={diagnosisTotal} tone="lilac"/><Metric icon="chart" label="Notes in encounter" value={noteTotal} tone="sand"/></div>
    {showPatientForm && <form className="inline-create-card" onSubmit={createPatient}><div className="section-title"><div><span className="eyebrow">NEW RECORD</span><h3>Add a synthetic patient</h3></div><button type="button" className="icon-button" onClick={() => setShowPatientForm(false)}><Icon name="close"/></button></div><div className="form-grid"><label>Full name<input required value={patientForm.full_name} onChange={(e) => setPatientForm({ ...patientForm, full_name: e.target.value })} placeholder="Demo Patient"/></label><label>Date of birth<input type="date" value={patientForm.birth_date} onChange={(e) => setPatientForm({ ...patientForm, birth_date: e.target.value })}/></label><label>Sex<input value={patientForm.sex} onChange={(e) => setPatientForm({ ...patientForm, sex: e.target.value })} placeholder="Optional"/></label></div><div className="form-actions"><button className="button button-primary" disabled={busy}>{busy ? "Saving..." : "Create patient"}</button></div></form>}
    {!canWrite && <div className="notice notice-info">You have read-only access. A clinician or records admin can create patients, encounters, and notes.</div>}
    <div className="workspace-grid"><section className="panel patient-panel"><div className="panel-heading"><div><h3>Patients</h3><p>{patients.length} records  |  clinic scoped</p></div><span className="panel-count">{patients.length}</span></div><div className="patient-search"><span className="search-glyph"></span><input aria-label="Search patients" placeholder="Search patients" value={patientQuery} onChange={(event) => setPatientQuery(event.target.value)}/></div><div className="patient-list">{visiblePatients.map((patient, index) => <button key={patient.id} className={`patient-row ${selectedPatient?.id === patient.id ? "selected" : ""}`} onClick={() => choosePatient(patient)}><span className={`patient-avatar avatar-${index % 5}`}>{patient.full_name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase()}</span><span className="patient-main"><strong>{patient.full_name}</strong><small>{patient.sex || "Patient"}{patient.birth_date ? `  |  DOB ${patient.birth_date}` : ""}</small></span><Icon name="chevron" size={16}/></button>)}{patients.length === 0 && <EmptyState title="No patients yet" body={canWrite ? "Create a synthetic patient or import your Synthea demo data." : "There are no clinic patient records to show."}/>}{patients.length > 0 && visiblePatients.length === 0 && <EmptyState title="No matching patients" body="Try a different name."/>}</div><div className="panel-foot">Patient data is isolated to your clinic.</div></section>
      <section className="panel encounter-panel"><div className="panel-heading"><div><h3>{selectedPatient ? selectedPatient.full_name : "Patient details"}</h3><p>{selectedPatient ? "Encounters and clinical notes" : "Select a patient to get started"}</p></div>{selectedPatient && canWrite && <button className="button button-soft button-small" onClick={createEncounter} disabled={busy}><Icon name="plus" size={15}/> New encounter</button>}</div>
        {!selectedPatient ? <div className="empty-workspace"><div className="empty-illustration"><Icon name="patients" size={27}/></div><h3>Your patient workspace</h3><p>Select a patient from the list to view encounters, add notes, and see structured results.</p><div className="step-hint"><span>01</span> Choose a patient <Icon name="chevron" size={14}/><span>02</span> Open an encounter</div></div> : <>
          <div className="patient-summary"><div className="summary-item"><small>PATIENT ID</small><code>{selectedPatient.id.slice(0, 13)}...</code></div><div className="summary-item"><small>DATE OF BIRTH</small><strong>{selectedPatient.birth_date || "Not provided"}</strong></div><div className="summary-item"><small>SEX</small><strong>{selectedPatient.sex || "Not provided"}</strong></div></div>
          <div className="encounter-area"><div className="subsection-heading"><span>ENCOUNTERS</span><span>{encounters.length} total</span></div><div className="encounter-strip">{encounters.map((encounter, index) => <button key={encounter.id} className={`encounter-card ${selectedEncounter?.id === encounter.id ? "active" : ""}`} onClick={() => chooseEncounter(encounter)}><span className="encounter-icon"><Icon name="grid" size={16}/></span><span><strong>Encounter {encounters.length - index}</strong><small>{new Date(encounter.occurred_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</small></span><i className="encounter-state"/></button>)}{encounters.length === 0 && <p className="empty-inline">No encounters for this patient yet.</p>}</div></div>
          {selectedEncounter && <div className="notes-area"><div className="subsection-heading"><span>CLINICAL NOTES <b className="live-pill">LIVE</b></span><span>{notes.length} notes</span></div>{canWrite && <form className="note-composer" onSubmit={saveNote}><label htmlFor="note-text">Write a clinical note</label><textarea id="note-text" rows="4" value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Example: Patient presents with hypertension. Started lisinopril 10mg daily. BP 150/95, HR 88."/><div className="composer-foot"><span><Icon name="shield" size={14}/> Saved securely to this encounter</span><button className="button button-primary button-small" disabled={busy || !noteText.trim()}><Icon name="plus" size={15}/> Save note</button></div></form>}
            <div className="note-list">{notes.map((note, index) => <article className="note-card" key={note.id}><div className="note-card-heading"><div className="note-title"><span className="note-number">{String(index + 1).padStart(2, "0")}</span><div><strong>Clinical note</strong><small>{new Date(note.created_at).toLocaleString()}</small></div></div>{canWrite && <button className="button button-extract button-small" onClick={() => extractNote(note.id)} disabled={busy}><Icon name="spark" size={15}/>{note.extracted ? "Re-run extraction" : "Extract fields"}</button>}</div><p className="raw-note">{note.raw_text}</p>{note.extracted ? <ExtractionResult data={note.extracted}/> : <div className="not-extracted"><Icon name="spark" size={15}/> Structured fields have not been extracted yet.</div>}</article>)}{notes.length === 0 && <EmptyState title="No notes in this encounter" body={canWrite ? "Add note text above, then extract diagnoses, medications, and vitals." : "No clinical notes are available for this encounter."}/>}</div>
          </div>}
          {!selectedEncounter && encounters.length > 0 && <div className="select-encounter-hint"><Icon name="arrow" size={16}/> Select an encounter above to view its notes and structured data.</div>}
        </>}
      </section></div>
  </>;
}

function TenantAdmin({ token }) {
  const [tenants, setTenants] = useState([]);
  const [tenantForm, setTenantForm] = useState({ name: "", email: "", address: "" });
  const [adminForm, setAdminForm] = useState({ email: "", password: "" });
  const [selectedTenant, setSelectedTenant] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadTenants = useCallback(async () => {
    try { setTenants(await request("/tenants/?limit=100&offset=0", { token })); }
    catch (err) { setError(err.message); }
  }, [token]);
  useEffect(() => { loadTenants(); }, [loadTenants]);

  async function createTenant(event) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      const tenant = await request("/tenants/", { token, method: "POST", body: tenantForm });
      setTenants((items) => [tenant, ...items]); setSelectedTenant(tenant.id);
      setTenantForm({ name: "", email: "", address: "" }); setMessage(`Clinic ${tenant.name} was created.`);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  async function createRecordsAdmin(event) {
    event.preventDefault(); if (!selectedTenant) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const query = new URLSearchParams({ tenant_id: selectedTenant });
      const admin = await request(`/users/create_record_admin?${query}`, { token, method: "POST", body: adminForm });
      setAdminForm({ email: "", password: "" });
      setMessage(`Records Admin ${admin.email} was added to ${tenants.find((tenant) => tenant.id === selectedTenant)?.name || "the clinic"}.`);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  return <>
    <PageHeading eyebrow="PLATFORM ADMINISTRATION" title="Clinic administration" subtitle="Create tenant workspaces and assign a Records Admin to each clinic."/>
    {error && <ErrorNotice>{error}</ErrorNotice>}{message && <div className="notice notice-success" role="status">{message}</div>}
    <div className="admin-summary"><div className="admin-summary-mark"><Icon name="building" size={22}/></div><div><strong>Tenant boundaries start here</strong><p>Each clinic is a separate workspace. Records Admins and clinical staff belong to one clinic; Super Admin has no patient-data context.</p></div><span className="admin-summary-count"><b>{tenants.length}</b><small>CLINICS</small></span></div>
    <div className="admin-grid">
      <section className="panel admin-panel"><div className="panel-heading"><div><span className="eyebrow">STEP 01</span><h3>Create a clinic</h3><p>Set up a tenant workspace for a care organization.</p></div></div><form className="admin-form" onSubmit={createTenant}><label>Clinic name<input required value={tenantForm.name} onChange={(e) => setTenantForm({ ...tenantForm, name: e.target.value })} placeholder="Northside Demo Clinic"/></label><label>Contact email<input type="email" required value={tenantForm.email} onChange={(e) => setTenantForm({ ...tenantForm, email: e.target.value })} placeholder="admin@clinic.org"/></label><label>Clinic address<input required value={tenantForm.address} onChange={(e) => setTenantForm({ ...tenantForm, address: e.target.value })} placeholder="Street, city, country"/></label><button className="button button-primary" disabled={busy}><Icon name="plus" size={16}/>{busy ? "Working…" : "Create clinic"}</button></form></section>
      <section className="panel admin-panel"><div className="panel-heading"><div><span className="eyebrow">STEP 02</span><h3>Assign Records Admin</h3><p>Create the clinic's first administrator account.</p></div></div><form className="admin-form" onSubmit={createRecordsAdmin}><label>Clinic<select required value={selectedTenant} onChange={(e) => setSelectedTenant(e.target.value)}><option value="">Choose a clinic</option>{tenants.map((tenant) => <option value={tenant.id} key={tenant.id}>{tenant.name}</option>)}</select></label><label>Admin email<input type="email" required value={adminForm.email} onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })} placeholder="records@clinic.org"/></label><label>Temporary password<input type="password" required minLength="8" value={adminForm.password} onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })} placeholder="At least 8 characters"/></label><button className="button button-primary" disabled={busy || !selectedTenant}><Icon name="users" size={16}/>{busy ? "Working…" : "Create Records Admin"}</button></form></section>
    </div>
    <section className="panel tenant-list-panel"><div className="panel-heading"><div><h3>Clinic workspaces</h3><p>Select a clinic above when adding its Records Admin.</p></div><span className="panel-count">{tenants.length}</span></div>{tenants.length ? <div className="tenant-list">{tenants.map((tenant) => <div className={`tenant-row ${selectedTenant === tenant.id ? "selected" : ""}`} key={tenant.id}><div className="tenant-emblem"><Icon name="building" size={17}/></div><div className="tenant-main"><strong>{tenant.name}</strong><small>{tenant.email} · {tenant.address}</small></div><code>{tenant.id.slice(0, 8)}…</code><button className="button button-soft button-small" onClick={() => { setSelectedTenant(tenant.id); setMessage(`${tenant.name} selected for Records Admin setup.`); }}>Select clinic</button></div>)}</div> : <EmptyState title="No clinic workspaces yet" body="Create the first clinic above to begin tenant setup."/>}</section>
  </>;
}

function StaffAdmin({ token, user }) {
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState({ email: "", password: "", role: "clinician" });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadStaff = useCallback(async () => {
    try { setStaff(await request("/users/?limit=100&offset=0", { token })); }
    catch (err) { setError(err.message); }
  }, [token]);
  useEffect(() => { loadStaff(); }, [loadStaff]);

  async function invite(event) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      const created = await request("/users/", { token, method: "POST", body: form });
      setStaff((items) => [created, ...items]); setForm({ email: "", password: "", role: "clinician" });
      setMessage(`${created.role.replace("_", " ")} account created for ${created.email}.`);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  return <>
    <PageHeading eyebrow="CLINIC ADMINISTRATION" title="Clinic staff" subtitle="Invite clinicians and auditors to your clinic and review current accounts."/>
    {error && <ErrorNotice>{error}</ErrorNotice>}{message && <div className="notice notice-success" role="status">{message}</div>}
    <div className="admin-summary"><div className="admin-summary-mark"><Icon name="users" size={22}/></div><div><strong>One clinic, one team</strong><p>New staff inherit your clinic assignment. You can invite clinicians and auditors; tenant assignment is never entered here.</p></div><span className="admin-summary-count"><b>{staff.length}</b><small>ACCOUNTS</small></span></div>
    <div className="staff-grid"><section className="panel admin-panel"><div className="panel-heading"><div><span className="eyebrow">INVITE TEAM MEMBER</span><h3>Add clinic staff</h3><p>Accounts are active immediately after creation.</p></div></div><form className="admin-form" onSubmit={invite}><label>Email address<input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="clinician@clinic.org"/></label><label>Temporary password<input type="password" minLength="8" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 8 characters"/></label><label>Role<select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}><option value="clinician">Clinician</option><option value="auditor">Auditor</option></select></label><button className="button button-primary" disabled={busy}>{busy ? "Creating account…" : "Create staff account"}<Icon name="arrow" size={16}/></button></form></section>
      <section className="panel staff-list-panel"><div className="panel-heading"><div><span className="eyebrow">YOUR CLINIC</span><h3>Team directory</h3><p>Accounts assigned to this tenant.</p></div><span className="panel-count">{staff.length}</span></div>{staff.length ? <div className="staff-list">{staff.map((member) => <div className="staff-row" key={member.uid}><span className="user-avatar">{member.email.slice(0, 1).toUpperCase()}</span><span className="staff-main"><strong>{member.email}</strong><small>Added {new Date(member.created_at).toLocaleDateString()}</small></span><span className={`role-pill role-${member.role}`}>{member.role.replace("_", " ")}</span><span className={`account-status ${member.is_active ? "is-active" : ""}`}>{member.is_active ? "Active" : "Inactive"}</span></div>)}</div> : <EmptyState title="No staff accounts found" body="Invite a clinician or auditor to start building the clinic team."/>}</section></div>
    <p className="data-footnote"><Icon name="shield" size={15}/> Staff invitations are restricted to this authenticated clinic by the API.</p>
    <small className="admin-context">Signed in as {user.email}</small>
  </>;
}

function ExtractionResult({ data }) {
  const diagnoses = data.diagnoses || []; const medications = data.medications || []; const vitals = data.vitals || {}; const negated = data.negated || [];
  return <div className="extraction-result"><div className="extraction-heading"><span><Icon name="spark" size={15}/> STRUCTURED RESULT</span><span className="result-badge">Extracted</span></div><div className="result-groups"><div className="result-group"><small>DIAGNOSES <b>{diagnoses.length}</b></small>{diagnoses.length ? diagnoses.map((item, i) => <div className="result-line" key={`${item.code}-${i}`}><span className="result-marker diagnosis-marker"/><span>{item.term}</span><code>{item.code}</code></div>) : <span className="result-empty">None identified</span>}</div><div className="result-group"><small>MEDICATIONS <b>{medications.length}</b></small>{medications.length ? medications.map((item, i) => <div className="result-line" key={`${item.name}-${i}`}><span className="result-marker medication-marker"/><span>{item.name}{item.dose ? `  |  ${item.dose}` : ""}{item.frequency ? `  |  ${item.frequency}` : ""}</span></div>) : <span className="result-empty">None identified</span>}</div><div className="result-group"><small>VITALS</small>{Object.keys(vitals).length ? <div className="vital-chips">{Object.entries(vitals).map(([key, value]) => <span key={key}>{key.replaceAll("_", " ")} <b>{value}</b></span>)}</div> : <span className="result-empty">None identified</span>}</div>{negated.length > 0 && <div className="negated-line"><span className="result-marker negated-marker"/>Negated: {negated.join(", ")}</div>}</div></div>;
}

function Analytics({ token }) {
  const today = new Date().toISOString().slice(0, 10);
  const [start, setStart] = useState(""); const [end, setEnd] = useState("");
  const [diagnoses, setDiagnoses] = useState([]); const [volume, setVolume] = useState([]);
  const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  const query = useMemo(() => { const params = new URLSearchParams(); if (start) params.set("start_date", start); if (end) params.set("end_date", end); const value = params.toString(); return value ? `?${value}` : ""; }, [start, end]);
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { const [d, v] = await Promise.all([request(`/analytics/diagnosis-frequency${query}`, { token }), request(`/analytics/encounter-volume${query}`, { token })]); setDiagnoses(d); setVolume(v); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [query, token]);
  useEffect(() => { load(); }, []);
  const maxVolume = Math.max(1, ...volume.map((row) => row.count));
  return <><PageHeading eyebrow="CLINIC INSIGHTS" title="Analytics" subtitle="A tenant-scoped view of extracted diagnoses and encounter activity."/><div className="analytics-filter panel"><div className="filter-copy"><span className="eyebrow">DATE RANGE</span><strong>Choose a reporting window</strong><small>Inclusive UTC dates  |  up to 365 days</small></div><label>From<input type="date" max={end || today} value={start} onChange={(e) => setStart(e.target.value)}/></label><label>To<input type="date" min={start} max={today} value={end} onChange={(e) => setEnd(e.target.value)}/></label><button className="button button-primary" onClick={load} disabled={loading}>{loading ? "Loading..." : "Apply range"}</button></div><ErrorNotice>{error}</ErrorNotice><div className="analytics-grid"><section className="panel analytics-panel"><div className="panel-heading"><div><span className="eyebrow">CLINICAL VOCABULARY</span><h3>Diagnosis frequency</h3><p>Counts of extracted SNOMED CT codes</p></div><div className="analytics-icon mint"><Icon name="spark"/></div></div>{diagnoses.length ? <div className="diagnosis-table"><div className="table-head"><span>SNOMED CT CODE</span><span>COUNT</span></div>{diagnoses.map((row) => <div className="table-row" key={row.diagnosis_code}><span><i className="table-dot"/><code>{row.diagnosis_code}</code></span><strong>{row.count}</strong></div>)}</div> : <EmptyState title={loading ? "Loading diagnoses..." : "No diagnosis data yet"} body="Extracted diagnosis codes will appear here for the selected period."/>}</section><section className="panel analytics-panel"><div className="panel-heading"><div><span className="eyebrow">CARE ACTIVITY</span><h3>Encounter volume</h3><p>Daily encounters recorded by the clinic</p></div><div className="analytics-icon blue"><Icon name="chart"/></div></div>{volume.length ? <div className="volume-chart"><div className="chart-y-labels"><span>{maxVolume}</span><span>{Math.ceil(maxVolume / 2)}</span><span>0</span></div><div className="chart-content"><div className="chart-gridlines"><i/><i/><i/></div><div className="bar-list">{volume.slice(-14).map((row) => <div className="bar-column" key={row.date} title={`${row.date}: ${row.count}`}><span className="bar-value">{row.count}</span><div className="bar" style={{ height: `${Math.max(5, (row.count / maxVolume) * 100)}%` }}/><small>{new Date(`${row.date}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</small></div>)}</div></div></div> : <EmptyState title={loading ? "Loading activity..." : "No encounters in this range"} body="Daily counts will appear when the clinic has recorded encounters."/>}</section></div><p className="data-footnote"><Icon name="shield" size={15}/> These aggregates are calculated for the signed-in clinic only.</p></>;
}

function Audit({ token, user }) {
  const [rows, setRows] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  useEffect(() => { request("/audit-logs/?limit=100&offset=0", { token }).then(setRows).catch((err) => setError(err.message)).finally(() => setLoading(false)); }, [token]);
  return <><PageHeading eyebrow="GOVERNANCE" title="Audit trail" subtitle={user.role === "super_admin" ? "Platform-wide activity across tenant and administrative records." : "A chronological record of activity within your clinic."}/><ErrorNotice>{error}</ErrorNotice><section className="panel audit-panel"><div className="panel-heading"><div><h3>Recent activity</h3><p>Access and changes are recorded with an actor, action, and resource.</p></div><span className="panel-count">{rows.length}</span></div>{loading ? <div className="loading-row"><span className="spinner small-spinner"/>Loading audit events...</div> : rows.length ? <div className="audit-table"><div className="audit-table-head"><span>ACTIVITY</span><span>RESOURCE</span><span>CLINIC</span><span>TIME</span></div>{rows.map((row) => <div className="audit-row" key={row.id}><span className="audit-action"><i className={`action-dot action-${row.action}`}/><strong>{row.action}</strong><small>{row.resource_type.replaceAll("_", " ")}</small></span><code>{String(row.resource_id).slice(0, 12)}...</code><span className="tenant-label">{row.tenant_id ? `${row.tenant_id.slice(0, 8)}...` : "Global"}</span><time>{new Date(row.at).toLocaleString()}</time></div>)}</div> : <EmptyState title="No audit events yet" body="Events will appear here as users read and update patient data."/>}</section><div className="audit-note"><Icon name="shield" size={17}/><span><strong>Auditability built in</strong><small>Data operations and their audit records are committed together.</small></span></div></>;
}

function PageHeading({ eyebrow, title, subtitle, action }) { return <div className="page-heading"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{subtitle}</p></div>{action}</div>; }
function Metric({ icon, label, value, tone }) { return <div className="metric-card"><div className={`metric-icon ${tone}`}><Icon name={icon}/></div><div><span>{label}</span><strong>{value}</strong></div><div className="metric-sparkline"><i/><i/><i/><i/><i/><i/><i/></div></div>; }
function EmptyState({ title, body }) { return <div className="empty-state"><div className="empty-state-icon"><Icon name="grid" size={19}/></div><strong>{title}</strong><p>{body}</p></div>; }

export default App;
