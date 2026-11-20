import { useCallback, useEffect, useState } from "react";
import { request } from "../api.js";
import { Empty, HowTo, PageHead, fmtDate, fmtTime, shortId } from "../components/ui.jsx";
import { NoteSheet } from "../components/NoteView.jsx";

const WRITE_ROLES = ["records_admin", "clinician"];
const EXAMPLE_NOTE = "Patient presents with hypertension. Denies chest pain. Started lisinopril 10mg daily. BP 150/95, HR 88.";

export default function Workspace({ token, user, setError }) {
  const canWrite = WRITE_ROLES.includes(user.role);
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [encounters, setEncounters] = useState([]);
  const [selectedEncounter, setSelectedEncounter] = useState(null);
  const [notes, setNotes] = useState([]);
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ full_name: "", birth_date: "", sex: "" });
  const [query, setQuery] = useState("");
  const [noteText, setNoteText] = useState("");

  const refreshPatients = useCallback(async () => {
    setLoadingPatients(true);
    try {
      setPatients(await request("/patients/?limit=100&offset=0", { token }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingPatients(false);
    }
  }, [token, setError]);

  useEffect(() => {
    refreshPatients();
  }, [refreshPatients]);

  async function choosePatient(patient) {
    setSelectedPatient(patient);
    setSelectedEncounter(null);
    setNotes([]);
    setError("");
    try {
      setEncounters(await request(`/patients/${patient.id}/encounters`, { token }));
    } catch (err) {
      setEncounters([]);
      setError(err.message);
    }
  }

  async function chooseEncounter(encounter) {
    setSelectedEncounter(encounter);
    setError("");
    try {
      const data = await request(`/encounters/${encounter.id}/structured-data`, { token });
      setNotes(data.notes || []);
    } catch (err) {
      setNotes([]);
      setError(err.message);
    }
  }

  async function createPatient(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const body = { ...form, birth_date: form.birth_date || null, sex: form.sex || null };
      const patient = await request("/patients/", { token, method: "POST", body });
      setPatients((items) => [...items, patient]);
      setForm({ full_name: "", birth_date: "", sex: "" });
      setShowForm(false);
      await choosePatient(patient);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function createEncounter() {
    if (!selectedPatient) return;
    setBusy(true);
    setError("");
    try {
      const encounter = await request(`/patients/${selectedPatient.id}/encounters`, { token, method: "POST", body: {} });
      setEncounters((items) => [encounter, ...items]);
      await chooseEncounter(encounter);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveNote(event) {
    event.preventDefault();
    if (!selectedEncounter || !noteText.trim()) return;
    setBusy(true);
    setError("");
    try {
      const note = await request(`/encounters/${selectedEncounter.id}/notes`, { token, method: "POST", body: { raw_text: noteText.trim() } });
      setNotes((items) => [...items, note]);
      setNoteText("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function extractNote(noteId) {
    setBusy(true);
    setError("");
    try {
      const updated = await request(`/encounters/${selectedEncounter.id}/notes/${noteId}/extract`, { token, method: "POST" });
      setNotes((items) => items.map((item) => (item.id === noteId ? updated : item)));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const steps = canWrite
    ? [
        { label: "Choose a patient", done: Boolean(selectedPatient) },
        { label: "Open an encounter", done: Boolean(selectedEncounter) },
        { label: "Write a note", done: notes.length > 0 },
        { label: "Extract fields", done: notes.some((note) => note.extracted) },
      ]
    : [
        { label: "Choose a patient", done: Boolean(selectedPatient) },
        { label: "Open an encounter", done: Boolean(selectedEncounter) },
        { label: "Read the results", done: notes.some((note) => note.extracted) },
      ];
  const current = steps.findIndex((step) => !step.done);
  const hints = {
    "Choose a patient":
      patients.length === 0 && !loadingPatients
        ? canWrite
          ? "There are no patients yet. Add one in the Patients panel, or load the Synthea demo data with the seed script."
          : "There are no patients to show yet."
        : "Pick a patient from the Patients list.",
    "Open an encounter":
      encounters.length === 0 ? (canWrite ? "This patient has no encounters yet. Start one to attach notes to it." : "This patient has no encounters yet.") : "Pick an encounter. Each one is a single visit.",
    "Write a note": "Type a note below, or choose Use an example note.",
    "Extract fields": "Choose Extract fields on the note to turn its text into structured data.",
    "Read the results": notes.length ? "Notes show their extracted fields once a clinician has run extraction." : "This encounter has no notes yet.",
  };

  const visiblePatients = patients.filter((patient) => patient.full_name.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <>
      <PageHead title="Clinical workspace">Choose a patient, open an encounter, write a note, then turn its text into structured fields.</PageHead>

      <ol className="stepper" aria-label="Your progress">
        {steps.map((step, i) => (
          <li key={step.label} className={step.done ? "is-done" : i === current ? "is-current" : ""} aria-current={i === current ? "step" : undefined}>
            <span className="stepper__n" aria-hidden="true">{step.done ? "✓" : i + 1}</span>
            <span>{step.label}</span>
            {step.done && <span className="sr">(done)</span>}
          </li>
        ))}
      </ol>
      <p className="nextup">
        {current === -1 ? (
          <>
            <strong>That's the whole flow.</strong> Write another note, or open Analytics to see counts for the whole clinic.
          </>
        ) : (
          <>
            <strong>Next:</strong> {hints[steps[current].label]}
          </>
        )}
      </p>
      {!canWrite && <p className="readonly">You have read-only access. A clinician or records admin can create patients, encounters and notes.</p>}

      <div className="ws">
        <aside className="ws__patients" aria-label="Patients">
          <div className="ws__patients-head">
            <h2>Patients</h2>
            {canWrite && (
              <button type="button" className="btn btn--ghost btn--small" onClick={() => setShowForm((value) => !value)} aria-expanded={showForm}>
                {showForm ? "Cancel" : "Add patient"}
              </button>
            )}
          </div>
          {showForm && (
            <form className="ws__form" onSubmit={createPatient}>
              <label>
                Full name
                <input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              </label>
              <label>
                Date of birth (optional)
                <input type="date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} />
              </label>
              <label>
                Sex (optional)
                <input list="sex-options" value={form.sex} onChange={(e) => setForm({ ...form, sex: e.target.value })} placeholder="F or M" />
                <datalist id="sex-options">
                  <option value="F" />
                  <option value="M" />
                </datalist>
              </label>
              <p className="form-note">Use made-up details only.</p>
              <button className="btn btn--small" disabled={busy}>{busy ? "Saving" : "Save patient"}</button>
            </form>
          )}
          <label className="ws__search">
            <span className="sr">Search patients by name</span>
            <input type="search" placeholder="Search by name" value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
          <ul className="ws__list">
            {visiblePatients.map((patient) => (
              <li key={patient.id}>
                <button type="button" className={selectedPatient?.id === patient.id ? "ws__patient is-selected" : "ws__patient"} aria-pressed={selectedPatient?.id === patient.id} onClick={() => choosePatient(patient)}>
                  <strong>{patient.full_name}</strong>
                  <small>{[patient.sex, patient.birth_date && `born ${patient.birth_date}`].filter(Boolean).join(", ") || "No details recorded"}</small>
                </button>
              </li>
            ))}
          </ul>
          {loadingPatients && <p className="ws__status">Loading patients</p>}
          {!loadingPatients && patients.length === 0 && <Empty title="No patients yet">{canWrite ? "Add a patient above, or load the Synthea demo data." : "There are no records for your clinic yet."}</Empty>}
          {patients.length > 0 && visiblePatients.length === 0 && <Empty title="No match">Try a different name.</Empty>}
          <p className="ws__foot">You only see patients from your own clinic.</p>
        </aside>

        <div className="ws__main">
          {!selectedPatient ? (
            <Empty title="Start with a patient">The Patients list shows your clinic's patients. Choose one to see their visits and notes.</Empty>
          ) : (
            <>
              <section className="ws__patient-head">
                <h2>{selectedPatient.full_name}</h2>
                <p>
                  {[selectedPatient.sex, selectedPatient.birth_date && `Born ${selectedPatient.birth_date}`].filter(Boolean).join(", ") || "No details recorded"}
                  <span className="ws__id">ID {shortId(selectedPatient.id)}</span>
                </p>
              </section>

              <section className="ws__block" aria-labelledby="enc-h">
                <div className="ws__block-head">
                  <h3 id="enc-h">Encounters</h3>
                  {canWrite && (
                    <button type="button" className="btn btn--ghost btn--small" onClick={createEncounter} disabled={busy}>
                      Start a new encounter
                    </button>
                  )}
                </div>
                {encounters.length === 0 ? (
                  <p className="muted">No encounters for this patient yet.</p>
                ) : (
                  <ul className="chips">
                    {encounters.map((encounter) => (
                      <li key={encounter.id}>
                        <button type="button" className={selectedEncounter?.id === encounter.id ? "chip is-selected" : "chip"} aria-pressed={selectedEncounter?.id === encounter.id} onClick={() => chooseEncounter(encounter)}>
                          <strong>{fmtDate(encounter.occurred_at)}</strong>
                          <small>{fmtTime(encounter.occurred_at)}</small>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {selectedEncounter && (
                <section className="ws__block" aria-labelledby="notes-h">
                  <div className="ws__block-head">
                    <h3 id="notes-h">Notes for this encounter</h3>
                    <span className="muted">{notes.length} {notes.length === 1 ? "note" : "notes"}</span>
                  </div>
                  {canWrite && (
                    <form className="composer" onSubmit={saveNote}>
                      <label htmlFor="note-text">New note</label>
                      <textarea id="note-text" className="paper" rows="4" value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Write the note the way a clinician would, in plain sentences." />
                      <div className="composer__foot">
                        <button type="button" className="link link--button" onClick={() => setNoteText(EXAMPLE_NOTE)}>
                          Use an example note
                        </button>
                        <button className="btn btn--small" disabled={busy || !noteText.trim()}>Save note</button>
                      </div>
                      <p className="form-note">Use made-up details only. Never enter real patient information.</p>
                    </form>
                  )}
                  {notes.length === 0 ? (
                    <Empty title="No notes yet">{canWrite ? "Write one above, then extract its fields." : "No notes have been added to this encounter."}</Empty>
                  ) : (
                    <div className="sheets">
                      {notes.map((note, index) => (
                        <NoteSheet key={note.id} note={note} number={index + 1} canWrite={canWrite} busy={busy} onExtract={extractNote} />
                      ))}
                    </div>
                  )}
                </section>
              )}
              {!selectedEncounter && encounters.length > 0 && <p className="muted">Choose an encounter above to see its notes.</p>}
            </>
          )}
        </div>
      </div>

      <HowTo>
        <p>Patients, encounters and notes always belong to your clinic. An encounter is one visit. A note is free text written about that visit.</p>
        <p>Extract fields reads a note and lists the diagnoses, medications and vital signs it recognises. The coloured highlights show where in the note each one was found. Choosing Run extraction again after the vocabulary changes updates the result.</p>
      </HowTo>
    </>
  );
}
