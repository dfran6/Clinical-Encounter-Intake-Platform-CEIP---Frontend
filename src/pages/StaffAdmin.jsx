import { useCallback, useEffect, useState } from "react";
import { request } from "../api.js";
import { Empty, HowTo, Notice, PageHead, fmtDate, roleLabel } from "../components/ui.jsx";

export default function StaffAdmin({ token }) {
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState({ email: "", password: "", role: "clinician" });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadStaff = useCallback(async () => {
    try {
      setStaff(await request("/users/?limit=100&offset=0", { token }));
    } catch (err) {
      setError(err.message);
    }
  }, [token]);
  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  async function invite(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const created = await request("/users/", { token, method: "POST", body: form });
      setStaff((items) => [created, ...items]);
      setForm({ email: "", password: "", role: "clinician" });
      setMessage(`Added ${created.email} as ${roleLabel(created.role).toLowerCase()}. They can sign in now.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHead title="Clinic staff">Add clinicians and auditors to your clinic. New accounts join your clinic automatically.</PageHead>
      <Notice>{error}</Notice>
      <Notice kind="success">{message}</Notice>
      <div className="split split--wide-right">
        <form className="stack" onSubmit={invite}>
          <h2>Add a team member</h2>
          <label>
            Email address
            <input type="email" required autoComplete="off" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </label>
          <label>
            Temporary password
            <input type="password" required minLength="8" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <small>At least 8 characters. Ask them to change it after signing in.</small>
          </label>
          <label>
            Role
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="clinician">Clinician: writes notes and runs extraction</option>
              <option value="auditor">Auditor: reads records and the audit trail</option>
            </select>
          </label>
          <button className="btn" disabled={busy}>{busy ? "Adding" : "Add team member"}</button>
        </form>
        <section className="listing" aria-labelledby="team-h">
          <h2 id="team-h">Your team ({staff.length})</h2>
          {staff.length ? (
            <ul>
              {staff.map((member) => (
                <li key={member.uid || member.id || member.email}>
                  <div>
                    <strong>{member.email}</strong>
                    <small>{member.created_at ? `Added ${fmtDate(member.created_at)}` : "Account active"}</small>
                  </div>
                  <span className="tag">{roleLabel(member.role)}</span>
                  <span className={member.is_active === false ? "muted" : "status-ok"}>{member.is_active === false ? "Inactive" : "Active"}</span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty title="No staff accounts yet">Add a clinician or auditor to start building the team.</Empty>
          )}
        </section>
      </div>
      <HowTo>
        <p>You never choose a clinic here. The server adds new accounts to your clinic, so you can't create accounts for any other clinic.</p>
      </HowTo>
    </>
  );
}
