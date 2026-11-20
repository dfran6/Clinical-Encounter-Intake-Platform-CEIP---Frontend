import { useMemo, useState } from "react";
import { ACCESS_KEY, REFRESH_KEY, request } from "../api.js";
import { Notice, Wordmark } from "../components/ui.jsx";

function readDemoAccounts() {
  try {
    const raw = import.meta.env.VITE_DEMO_ACCOUNTS;
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list.filter((item) => item && item.label && item.email && item.password) : [];
  } catch {
    return [];
  }
}

const WHICH_ACCOUNT = [
  ["Clinician", "Add patients, write notes and run extraction. Start here."],
  ["Auditor", "Read records and review who accessed what."],
  ["Records admin", "Invite staff to a clinic and review its audit trail."],
  ["Platform admin", "Create clinics. Has no access to patient records."],
];

export default function Login({ onLogin, onBack, notice }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const demoAccounts = useMemo(readDemoAccounts, []);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const tokens = await request("/auth/login", { method: "POST", body: { email, password } });
      sessionStorage.setItem(ACCESS_KEY, tokens.access_token);
      sessionStorage.setItem(REFRESH_KEY, tokens.refresh_token);
      await onLogin(tokens.access_token);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login">
      <div className="login__grid">
        <section className="login__intro">
          <button type="button" className="link link--button" onClick={onBack}>Back to the project overview</button>
          <Wordmark />
          <h1>Sign in to the demo</h1>
          <p className="login__lede">Every account belongs to one clinic and sees only that clinic's data. What you can do depends on the account's role.</p>
          <h2>Which account should I use?</h2>
          <dl className="roles">
            {WHICH_ACCOUNT.map(([name, text]) => (
              <div key={name}>
                <dt>{name}</dt>
                <dd>{text}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section className="login__form">
          <form onSubmit={submit}>
            <h2>Your account</h2>
            <Notice kind="info">{notice}</Notice>
            <Notice>{error}</Notice>
            {demoAccounts.length > 0 && (
              <div className="demo-fill">
                <p>No account yet? Fill in a demo login, then choose Sign in.</p>
                <div>
                  {demoAccounts.map((account) => (
                    <button type="button" className="btn btn--ghost btn--small" key={account.label} onClick={() => { setEmail(account.email); setPassword(account.password); setError(""); }}>
                      Fill in {account.label.toLowerCase()} login
                    </button>
                  ))}
                </div>
              </div>
            )}
            <label>
              Email address
              <input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label>
              Password
              <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>
            <button className="btn btn--wide" disabled={busy}>{busy ? "Signing in" : "Sign in"}</button>
            {demoAccounts.length === 0 && <p className="form-note">Demo logins are shared with the project link. If you don't have one, ask the project author.</p>}
          </form>
        </section>
      </div>
    </div>
  );
}
