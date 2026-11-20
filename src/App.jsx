import { useCallback, useEffect, useState } from "react";
import { ACCESS_KEY, REFRESH_KEY, request } from "./api.js";
import { Notice, Wordmark, roleLabel } from "./components/ui.jsx";
import Landing from "./landing/Landing.jsx";
import Login from "./pages/Login.jsx";
import Workspace from "./pages/Workspace.jsx";
import Analytics from "./pages/Analytics.jsx";
import Audit from "./pages/Audit.jsx";
import TenantAdmin from "./pages/TenantAdmin.jsx";
import StaffAdmin from "./pages/StaffAdmin.jsx";

const CLINIC_READERS = ["records_admin", "clinician", "auditor"];

function clearStoredSession() {
  sessionStorage.removeItem(ACCESS_KEY);
  sessionStorage.removeItem(REFRESH_KEY);
}

export default function App() {
  const [token, setToken] = useState(() => sessionStorage.getItem(ACCESS_KEY));
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("workspace");
  const [showLogin, setShowLogin] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loadingUser, setLoadingUser] = useState(Boolean(token));

  const endSession = useCallback((message = "") => {
    clearStoredSession();
    setToken(null);
    setUser(null);
    setPage("workspace");
    setError("");
    setNotice(message);
    setShowLogin(Boolean(message));
  }, []);

  const signOut = useCallback(async () => {
    const refresh = sessionStorage.getItem(REFRESH_KEY);
    try {
      if (token && refresh) await request("/auth/logout", { token, method: "POST", body: { refresh_token: refresh } });
    } catch {
      /* Clear the local session even if the API is unavailable. */
    }
    endSession();
  }, [token, endSession]);

  const loadUser = useCallback(async (accessToken) => {
    try {
      const profile = await request("/users/me", { token: accessToken });
      setUser(profile);
      setToken(accessToken);
      setError("");
      setNotice("");
    } catch (err) {
      clearStoredSession();
      setToken(null);
      setUser(null);
      setNotice(err.message);
      setShowLogin(true);
    } finally {
      setLoadingUser(false);
    }
  }, []);

  useEffect(() => {
    if (token) loadUser(token);
    else setLoadingUser(false);
    // Restore the session once on first load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onExpired = () => endSession("Your session ended. Sign in again to continue.");
    window.addEventListener("ceip:unauthorized", onExpired);
    return () => window.removeEventListener("ceip:unauthorized", onExpired);
  }, [endSession]);

  if (loadingUser) {
    return (
      <div className="boot" role="status">
        <Wordmark />
        <p>Restoring your session</p>
      </div>
    );
  }

  if (!token || !user) {
    return showLogin ? <Login onLogin={loadUser} onBack={() => { setShowLogin(false); setNotice(""); }} notice={notice} /> : <Landing onSignIn={() => setShowLogin(true)} />;
  }

  const canReadClinic = CLINIC_READERS.includes(user.role);
  const links = [
    ...(canReadClinic ? [{ id: "workspace", label: "Clinical workspace" }, { id: "analytics", label: "Analytics" }] : []),
    ...(user.role === "super_admin" ? [{ id: "admin", label: "Clinics" }] : []),
    ...(user.role === "records_admin" ? [{ id: "team", label: "Staff" }] : []),
    ...(["records_admin", "auditor", "super_admin"].includes(user.role) ? [{ id: "audit", label: "Audit trail" }] : []),
  ];
  const currentPage = links.some((link) => link.id === page) ? page : links[0]?.id || "audit";

  return (
    <div className="app">
      <a className="skip" href="#content">Skip to content</a>
      <header className="app__bar">
        <div className="app__bar-inner">
          <Wordmark />
          <nav aria-label="Main">
            {links.map((link) => (
              <button key={link.id} type="button" className={currentPage === link.id ? "tab is-current" : "tab"} aria-current={currentPage === link.id ? "page" : undefined} onClick={() => { setPage(link.id); setError(""); }}>
                {link.label}
              </button>
            ))}
          </nav>
          <div className="app__user">
            <span><strong>{user.email}</strong><small>{roleLabel(user.role)}</small></span>
            <button type="button" className="btn btn--ghost btn--small" onClick={signOut}>Sign out</button>
          </div>
        </div>
      </header>
      <main id="content" className="app__content">
        <Notice onClose={() => setError("")}>{error}</Notice>
        {currentPage === "workspace" && <Workspace token={token} user={user} setError={setError} />}
        {currentPage === "analytics" && <Analytics token={token} />}
        {currentPage === "admin" && <TenantAdmin token={token} />}
        {currentPage === "team" && <StaffAdmin token={token} />}
        {currentPage === "audit" && <Audit token={token} user={user} />}
      </main>
      <footer className="app__foot">CEIP, a portfolio prototype by Awulor Chukwudi Francis. Synthetic data only. Extracted fields are for review, not for patient care.</footer>
    </div>
  );
}
