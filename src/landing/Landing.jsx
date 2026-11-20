import { useState } from "react";
import { Wordmark } from "../components/ui.jsx";

const NOTE = [
  ["Patient presents with ", null],
  ["hypertension", "dx"],
  [". Denies ", null],
  ["chest pain", "neg"],
  [". Started ", null],
  ["lisinopril 10mg daily", "rx"],
  [". ", null],
  ["BP 150/95", "vt"],
  [", ", null],
  ["HR 88", "vt"],
  [".", null],
];

const FACTS = [
  { id: "dx", label: "Diagnosis", value: "hypertension", detail: "with its SNOMED CT code" },
  { id: "neg", label: "Ruled out", value: "chest pain", detail: "the note says the patient denies it" },
  { id: "rx", label: "Medication", value: "lisinopril", detail: "10mg, daily" },
  { id: "vt", label: "Vital signs", value: "BP 150/95, HR 88", detail: "blood pressure and heart rate" },
];

function HeroNote() {
  const [hover, setHover] = useState(null);
  const [pinned, setPinned] = useState(null);
  const active = hover || pinned;
  let markIndex = 0;
  return (
    <div className="lp-demo">
      <p className="lp-demo__caption">An example note from a synthetic patient</p>
      <p className="paper paper--hero" data-focus={active || undefined}>
        {NOTE.map(([text, kind], i) =>
          kind ? (
            <mark key={i} className={`mk mk--${kind}`} style={{ "--i": markIndex++ }}>
              {text}
            </mark>
          ) : (
            <span key={i}>{text}</span>
          ),
        )}
      </p>
      <h2 className="lp-demo__title">What CEIP stores from it</h2>
      <ul className="lp-facts">
        {FACTS.map((fact) => (
          <li key={fact.id}>
            <button
              type="button"
              className="lp-fact"
              aria-pressed={pinned === fact.id}
              onMouseEnter={() => setHover(fact.id)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(fact.id)}
              onBlur={() => setHover(null)}
              onClick={() => setPinned((current) => (current === fact.id ? null : fact.id))}
            >
              <span className={`swatch mk--${fact.id}`} aria-hidden="true" />
              <span className="lp-fact__label">{fact.label}</span>
              <span className="lp-fact__value">{fact.value}</span>
              <span className="lp-fact__detail">{fact.detail}</span>
            </button>
          </li>
        ))}
      </ul>
      <p className="lp-demo__hint">Hover over or tap a row to see where it came from in the note.</p>
    </div>
  );
}

const PROBLEMS = [
  {
    problem: "The facts are buried in free text",
    detail: "A doctor writes what is natural. A database can't count it, filter it or compare it.",
    example: (
      <p className="lp-aka">
        <mark className="mk mk--dx">HTN</mark>, <mark className="mk mk--dx">high blood pressure</mark> and <mark className="mk mk--dx">hypertension</mark> all mean the same thing, but a search for one misses the others.
      </p>
    ),
    answer:
      "CEIP reads each note against an editable vocabulary and stores diagnoses (with SNOMED CT codes), medications with dose and frequency, and vital signs as separate fields. It also notices when a finding is ruled out, as in “denies chest pain”.",
    where: "Clinical workspace: open a note and choose Extract fields.",
  },
  {
    problem: "Clinics must not see each other's patients",
    detail: "Several clinics can share one system, but each clinic's records belong to that clinic alone.",
    example: (
      <p className="lp-exchange">
        <span>A user at Clinic A asks for a patient at Clinic B.</span>
        <strong>404 Not found</strong>
      </p>
    ),
    answer:
      "Your clinic comes from your login, never from the request. A record from another clinic returns “not found”, so you can't even learn that it exists.",
    where: "Sign in as users from two different clinics and compare their patient lists.",
  },
  {
    problem: "Nobody can say who looked at a record",
    detail: "In health data, knowing who read or changed a record matters as much as the record itself.",
    example: (
      <p className="lp-exchange">
        <span>A clinician opens a patient record.</span>
        <strong>read patient, logged with the time</strong>
      </p>
    ),
    answer:
      "Every create and read of patient data writes an audit entry in the same database transaction as the change. If the change fails, the log doesn't claim it happened.",
    where: "Audit trail, for records admins and auditors.",
  },
];

const STEPS = [
  ["Write or import a note", "The raw text is saved on the encounter exactly as it was written."],
  ["Match the vocabulary", "Terms from an editable list, built from Synthea, are found with spaCy phrase matching."],
  ["Read the details", "Patterns pick up doses, frequencies and labelled vital signs. Cues such as “denies” and “without” move a finding to ruled out."],
  ["Save and log", "The result is stored next to the note as JSON, and the action is written to the audit log."],
];

const ROADMAP = [
  { status: "Built", title: "A working baseline", text: "Extraction, clinic separation, role checks, audit trail and analytics all run end to end on synthetic data." },
  { status: "Next", title: "Measure how good it is", text: "Label a held-out set of synthetic notes, then report precision and recall for diagnoses, medications, vital signs and negation, along with the mistakes." },
  { status: "After that", title: "Widen and check the vocabulary", text: "Review SNOMED CT terms and synonyms, keep track of their source, and log every phrase the matcher could not place." },
  { status: "After that", title: "Test realistic wording", text: "Try abbreviations, ambiguity and different note formats. Synthea summaries are generated from structured data, so they are an easy test, not a realistic one." },
  { status: "Proposed", title: "Suggest terms the matcher missed", text: "An experiment, not a feature: retrieve candidate concepts for unmatched phrases and compare them with the current matcher on the same labelled set. Every suggestion keeps its source and is reviewed by a person." },
];

export default function Landing({ onSignIn }) {
  return (
    <div className="lp">
    <header className="lp-nav">
        <div className="lp-wrap lp-nav__inner">
          <a href="#top" className="lp-nav__brand" aria-label="CEIP, back to top"><Wordmark /></a>
          <nav aria-label="Sections">
            <a href="#problem">The problem</a>
            <a href="#how">How it works</a>
            <a href="#next">What's next</a>
            <a href="#try">Try it</a>
          </nav>
          <button type="button" className="btn btn--small" onClick={onSignIn}>Open demo</button>
        </div>
      </header>

      <main id="top">
        <section className="lp-hero">
          <div className="lp-wrap lp-hero__grid">
            <div className="lp-hero__copy">
              <h1>Clinical notes are full of facts that software can't search.</h1>
              <p className="lp-lede">
                CEIP is a prototype that reads a clinician's note, pulls out the diagnoses, medications and vital signs, and stores them as structured data. Every clinic's records stay separate, and every access is on record.
              </p>
              <div className="lp-actions">
                <button type="button" className="btn" onClick={onSignIn}>Try the demo</button>
                <a className="link" href="#problem">See the problem it tackles</a>
              </div>
              <p className="lp-byline">Built by Awulor Chukwudi Francis as a research-oriented portfolio project in clinical data infrastructure.</p>
            </div>
            <HeroNote />
          </div>
        </section>

        <section className="lp-section" id="problem">
          <div className="lp-wrap">
            <h2>Three problems, and what CEIP does about each</h2>
            <p className="lp-section__lede">Each row says what goes wrong, what the prototype does, and where you can see it for yourself.</p>
            <div className="ledger">
              <div className="ledger__head" aria-hidden="true">
                <span>What goes wrong</span>
                <span>What CEIP does</span>
                <span>See it in the demo</span>
              </div>
              {PROBLEMS.map((row) => (
                <article className="ledger__row" key={row.problem}>
                  <div>
                    <h3>{row.problem}</h3>
                    <p>{row.detail}</p>
                    {row.example}
                  </div>
                  <p data-label="What CEIP does">{row.answer}</p>
                  <p data-label="See it in the demo">{row.where}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-section" id="how">
          <div className="lp-wrap lp-how">
            <div>
              <h2>How a note becomes data</h2>
              <p className="lp-section__lede">The pipeline is deliberately small, so every result can be traced to a rule.</p>
              <ol className="steps">
                {STEPS.map(([title, text]) => (
                  <li key={title}>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </li>
                ))}
              </ol>
            </div>
            <aside className="lp-aside">
              <h3>What it is built with</h3>
              <p>
                A React interface talks to a FastAPI service. Each request is checked for a valid login and role, then handled by a service that only ever queries your clinic's rows. Data lives in PostgreSQL, extraction uses spaCy and regular expressions, and Redis remembers which sign-ins have been revoked.
              </p>
              <h3>What it does not claim</h3>
              <ul>
                <li>It only finds terms that are in its vocabulary.</li>
                <li>Negation handling covers a few nearby cue words.</li>
                <li>The demo notes are generated from Synthea data, not written by clinicians.</li>
                <li>It is not clinically validated and has no hospital system integration.</li>
              </ul>
            </aside>
          </div>
        </section>

        <section className="lp-section" id="next">
          <div className="lp-wrap">
            <h2>How I plan to improve it</h2>
            <p className="lp-section__lede">The order matters: measure the baseline first, then decide which improvements are worth making.</p>
            <ol className="timeline">
              {ROADMAP.map((item) => (
                <li key={item.title} className={`timeline__item timeline__item--${item.status === "Built" ? "built" : item.status === "Next" ? "next" : "later"}`}>
                  <span className="timeline__status">{item.status}</span>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="lp-section lp-try" id="try">
          <div className="lp-wrap lp-try__grid">
            <div>
              <h2>Take three minutes in the demo</h2>
              <p className="lp-section__lede">You don't need any medical knowledge. Sign in with a demo account, then follow these steps.</p>
              <div className="lp-actions">
                <button type="button" className="btn" onClick={onSignIn}>Open the demo</button>
              </div>
            </div>
            <ol className="steps steps--compact">
              <li>
                <h3>Sign in as a clinician</h3>
                <p>The sign-in page explains which account to use.</p>
              </li>
              <li>
                <h3>Choose a patient and open an encounter</h3>
                <p>An encounter is one visit. A prompt in the workspace always tells you what to do next.</p>
              </li>
              <li>
                <h3>Add a note and choose Extract fields</h3>
                <p>The example note button fills in a note for you. Watch the matching words light up.</p>
              </li>
              <li>
                <h3>Then sign in as an auditor</h3>
                <p>Open the audit trail to see your own activity recorded.</p>
              </li>
            </ol>
          </div>
        </section>
      </main>

      <footer className="lp-footer">
        <div className="lp-wrap">
          <Wordmark />
          <p>Created by Awulor Chukwudi Francis. Synthetic data only. Extracted fields are candidates for human review and must not guide patient care.</p>
        </div>
      </footer>
    </div>
  );
}
