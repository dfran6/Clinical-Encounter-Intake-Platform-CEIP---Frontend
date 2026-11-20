import { useMemo, useState } from "react";
import { fmtDateTime } from "./ui.jsx";

const MARK_TITLES = { dx: "Diagnosis", rx: "Medication", vt: "Vital sign", neg: "Ruled out" };
const escapeRe = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function doseRegex(dose) {
  const match = String(dose).match(/^([\d.]+)\s*([a-zA-Z%/]+)$/);
  return match ? `${escapeRe(match[1])}\\s*${escapeRe(match[2])}` : escapeRe(dose);
}

/**
 * Best-effort: find where each extracted item appears in the raw note so it can be
 * highlighted. Anything that cannot be located is simply not highlighted; the
 * structured list next to the note is always the source of truth.
 */
export function buildSegments(text, extracted) {
  const marks = [];
  const find = (pattern, kind) => {
    const match = new RegExp(pattern, "i").exec(text);
    if (match && match[0].length) marks.push({ start: match.index, end: match.index + match[0].length, kind });
  };
  if (extracted) {
    (extracted.diagnoses || []).forEach((item) => item?.term && find(`\\b${escapeRe(item.term)}\\b`, "dx"));
    (extracted.medications || []).forEach((item) => {
      if (!item?.name) return;
      const dose = item.dose ? `(?:\\s+${doseRegex(item.dose)})?` : "";
      const frequency = item.frequency ? `(?:\\s+${escapeRe(item.frequency)})?` : "";
      find(`\\b${escapeRe(item.name)}\\b${dose}${frequency}`, "rx");
    });
    (extracted.negated || []).forEach((term) => term && find(`\\b${escapeRe(term)}\\b`, "neg"));
    const vitals = extracted.vitals || {};
    if (vitals.bp_systolic != null && vitals.bp_diastolic != null) {
      find(`\\b(?:BP|blood pressure)\\b\\s*(?:of|:|is)?\\s*${escapeRe(vitals.bp_systolic)}\\s*/\\s*${escapeRe(vitals.bp_diastolic)}(?:\\s*mmHg)?`, "vt");
    }
    if (vitals.heart_rate != null) {
      find(`\\b(?:HR|heart rate|pulse)\\b\\s*(?:of|:|is)?\\s*${escapeRe(vitals.heart_rate)}(?:\\s*bpm)?`, "vt");
    }
  }
  marks.sort((a, b) => a.start - b.start);
  const kept = [];
  for (const mark of marks) if (!kept.length || mark.start >= kept[kept.length - 1].end) kept.push(mark);
  const segments = [];
  let cursor = 0;
  for (const mark of kept) {
    if (mark.start > cursor) segments.push({ text: text.slice(cursor, mark.start), kind: null });
    segments.push({ text: text.slice(mark.start, mark.end), kind: mark.kind });
    cursor = mark.end;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor), kind: null });
  return segments;
}

function vitalLines(vitals) {
  const rest = { ...vitals };
  const lines = [];
  if (rest.bp_systolic != null && rest.bp_diastolic != null) {
    lines.push(["Blood pressure", `${rest.bp_systolic}/${rest.bp_diastolic}`, "mmHg"]);
    delete rest.bp_systolic;
    delete rest.bp_diastolic;
  }
  if (rest.heart_rate != null) {
    lines.push(["Heart rate", String(rest.heart_rate), "beats per minute"]);
    delete rest.heart_rate;
  }
  Object.entries(rest).forEach(([key, value]) => {
    const label = key.replace(/_/g, " ");
    lines.push([label.charAt(0).toUpperCase() + label.slice(1), String(value), ""]);
  });
  return lines;
}

export function ExtractionResult({ data, onFocus }) {
  const diagnoses = data.diagnoses || [];
  const medications = data.medications || [];
  const negated = data.negated || [];
  const vitals = vitalLines(data.vitals || {});
  const hover = (kind) => ({ onMouseEnter: () => onFocus(kind), onMouseLeave: () => onFocus(null), onFocus: () => onFocus(kind), onBlur: () => onFocus(null) });
  return (
    <div className="result">
      <h4 className="result__title">Extracted from this note</h4>
      <section className="result__group" tabIndex={0} {...hover("dx")}>
        <h5><span className="swatch mk--dx" aria-hidden="true" />Diagnoses</h5>
        {diagnoses.length ? (
          <ul>
            {diagnoses.map((item, i) => (
              <li key={`${item.code}-${i}`}>
                {item.term} {item.code && <span className="result__code">SNOMED CT {item.code}</span>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="result__none">None found</p>
        )}
      </section>
      <section className="result__group" tabIndex={0} {...hover("rx")}>
        <h5><span className="swatch mk--rx" aria-hidden="true" />Medications</h5>
        {medications.length ? (
          <ul>
            {medications.map((item, i) => (
              <li key={`${item.name}-${i}`}>
                {item.name}
                {(item.dose || item.frequency) && <span className="result__detail">{[item.dose, item.frequency].filter(Boolean).join(", ")}</span>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="result__none">None found</p>
        )}
      </section>
      <section className="result__group" tabIndex={0} {...hover("vt")}>
        <h5><span className="swatch mk--vt" aria-hidden="true" />Vital signs</h5>
        {vitals.length ? (
          <ul>
            {vitals.map(([label, value, unit]) => (
              <li key={label}>
                {label} {value}
                {unit && <span className="result__detail">{unit}</span>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="result__none">None found</p>
        )}
      </section>
      {negated.length > 0 && (
        <section className="result__group" tabIndex={0} {...hover("neg")}>
          <h5><span className="swatch mk--neg" aria-hidden="true" />Ruled out</h5>
          <ul>
            {negated.map((term, i) => (
              <li key={`${term}-${i}`}>
                {term} <span className="result__detail">the note says this is absent</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      <p className="result__caution">These are candidates for a person to review, not clinical conclusions.</p>
    </div>
  );
}

export function NoteSheet({ note, number, canWrite, busy, onExtract }) {
  const [focus, setFocus] = useState(null);
  const segments = useMemo(() => buildSegments(note.raw_text || "", note.extracted), [note.raw_text, note.extracted]);
  return (
    <article className="sheet">
      <header className="sheet__head">
        <div>
          <h3>Note {number}</h3>
          <small>Saved {fmtDateTime(note.created_at)}</small>
        </div>
        {canWrite && (
          <button type="button" className={note.extracted ? "btn btn--ghost btn--small" : "btn btn--small"} onClick={() => onExtract(note.id)} disabled={busy}>
            {note.extracted ? "Run extraction again" : "Extract fields"}
          </button>
        )}
      </header>
      <div className="sheet__body">
        <p className="paper" data-focus={focus || undefined}>
          {segments.map((segment, i) =>
            segment.kind ? (
              <mark key={i} className={`mk mk--${segment.kind}`} title={MARK_TITLES[segment.kind]}>
                {segment.text}
              </mark>
            ) : (
              <span key={i}>{segment.text}</span>
            ),
          )}
        </p>
        {note.extracted ? (
          <ExtractionResult data={note.extracted} onFocus={setFocus} />
        ) : (
          <div className="pending">
            <strong>Not extracted yet</strong>
            <p>{canWrite ? "Choose Extract fields to turn this text into diagnoses, medications and vital signs." : "A clinician needs to run extraction before structured fields appear here."}</p>
          </div>
        )}
      </div>
    </article>
  );
}
