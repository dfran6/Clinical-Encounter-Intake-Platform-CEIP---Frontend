import { useCallback, useEffect, useMemo, useState } from "react";
import { request } from "../api.js";
import { Empty, HowTo, Notice, PageHead } from "../components/ui.jsx";

export default function Analytics({ token }) {
  const today = new Date().toISOString().slice(0, 10);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [diagnoses, setDiagnoses] = useState([]);
  const [volume, setVolume] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (start) params.set("start_date", start);
    if (end) params.set("end_date", end);
    const value = params.toString();
    return value ? `?${value}` : "";
  }, [start, end]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [d, v] = await Promise.all([request(`/analytics/diagnosis-frequency${query}`, { token }), request(`/analytics/encounter-volume${query}`, { token })]);
      setDiagnoses(d);
      setVolume(v);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [query, token]);

  useEffect(() => {
    load();
    // Load once on arrival; later changes apply when the person chooses Update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const maxDiagnosis = Math.max(1, ...diagnoses.map((row) => row.count));
  const maxVolume = Math.max(1, ...volume.map((row) => row.count));
  const recent = volume.slice(-14);

  return (
    <>
      <PageHead title="Analytics">Counts for your clinic only. Diagnoses are counted from notes that have been extracted, so extract a few notes first.</PageHead>
      <form className="range" onSubmit={(e) => { e.preventDefault(); load(); }}>
        <label>
          From
          <input type="date" max={end || today} value={start} onChange={(e) => setStart(e.target.value)} />
        </label>
        <label>
          To
          <input type="date" min={start} max={today} value={end} onChange={(e) => setEnd(e.target.value)} />
        </label>
        <button className="btn btn--small" disabled={loading}>{loading ? "Loading" : "Update"}</button>
        <p className="form-note">Leave both blank for the last 30 days. The longest range is 365 days.</p>
      </form>
      <Notice>{error}</Notice>

      <div className="split">
        <section aria-labelledby="dx-h">
          <h2 id="dx-h">Diagnoses found in notes</h2>
          <p className="muted">How often each SNOMED CT code was extracted.</p>
          {diagnoses.length ? (
            <ul className="bars">
              {diagnoses.map((row) => (
                <li key={row.diagnosis_code}>
                  <span className="bars__label">{row.diagnosis_code}</span>
                  <span className="bars__track"><span className="bars__fill" style={{ width: `${(row.count / maxDiagnosis) * 100}%` }} /></span>
                  <span className="bars__value">{row.count}</span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty title={loading ? "Loading" : "No diagnoses in this range"}>Extract fields on a note in the Clinical workspace and its diagnoses will be counted here.</Empty>
          )}
        </section>
        <section aria-labelledby="vol-h">
          <h2 id="vol-h">Encounters per day</h2>
          <p className="muted">{volume.length > 14 ? "The latest 14 days that had encounters." : "Days with at least one encounter."}</p>
          {recent.length ? (
            <ul className="columns">
              {recent.map((row) => (
                <li key={row.date} title={`${row.date}: ${row.count}`}>
                  <span className="columns__value">{row.count}</span>
                  <span className="columns__bar" style={{ height: `${Math.max(6, (row.count / maxVolume) * 100)}%` }} />
                  <span className="columns__label">{new Date(`${row.date}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty title={loading ? "Loading" : "No encounters in this range"}>Days appear here once your clinic has recorded encounters.</Empty>
          )}
        </section>
      </div>
      <HowTo>
        <p>Both charts are calculated on the server for the clinic you are signed in to. Dates are UTC and both ends are included.</p>
      </HowTo>
    </>
  );
}
