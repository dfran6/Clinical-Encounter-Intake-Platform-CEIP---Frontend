export const ROLE_LABELS = {
  super_admin: "Platform admin",
  records_admin: "Records admin",
  clinician: "Clinician",
  auditor: "Auditor",
};
export const roleLabel = (role) => ROLE_LABELS[role] || String(role || "").replace(/_/g, " ");

export const shortId = (id, length = 8) => (id ? String(id).slice(0, length) : "");

export function fmtDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function fmtTime(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleTimeString(undefined, { timeStyle: "short" });
}

export function fmtDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function Wordmark() {
  return (
    <span className="wordmark">
      <span className="wordmark__name">CEIP</span>
      <span className="wordmark__sub">Clinical Encounter Intake Platform</span>
    </span>
  );
}

export function Notice({ kind = "error", children, onClose }) {
  if (!children) return null;
  return (
    <div className={`notice notice--${kind}`} role={kind === "error" ? "alert" : "status"}>
      <span>{children}</span>
      {onClose && (
        <button type="button" className="notice__close" onClick={onClose}>
          Dismiss
        </button>
      )}
    </div>
  );
}

export function Empty({ title, children }) {
  return (
    <div className="empty">
      <strong>{title}</strong>
      {children && <p>{children}</p>}
    </div>
  );
}

export function PageHead({ title, children, action }) {
  return (
    <header className="pagehead">
      <div>
        <h1>{title}</h1>
        {children && <p>{children}</p>}
      </div>
      {action}
    </header>
  );
}

export function HowTo({ label = "How this page works", children }) {
  return (
    <details className="howto">
      <summary>{label}</summary>
      <div className="howto__body">{children}</div>
    </details>
  );
}
