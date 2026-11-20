import { useEffect, useState } from "react";
import { request } from "../api.js";
import { Empty, HowTo, Notice, PageHead, fmtDateTime, shortId } from "../components/ui.jsx";

export default function Audit({ token, user }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    request("/audit-logs/?limit=100&offset=0", { token })
      .then(setRows)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const global = user.role === "super_admin";
  const showActor = rows.some((row) => row.user_id);

  return (
    <>
      <PageHead title="Audit trail">{global ? "Activity across every clinic and the platform." : "A record of who did what in your clinic."}</PageHead>
      <Notice>{error}</Notice>
      {loading ? (
        <p className="muted">Loading the latest 100 events</p>
      ) : rows.length ? (
        <div className="tablewrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">When</th>
                <th scope="col">What happened</th>
                <th scope="col">Record</th>
                {showActor && <th scope="col">Done by</th>}
                {global && <th scope="col">Clinic</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{fmtDateTime(row.at)}</td>
                  <td>
                    <strong>{row.action}</strong> {String(row.resource_type).replace(/_/g, " ")}
                  </td>
                  <td><code>{shortId(row.resource_id, 12)}</code></td>
                  {showActor && <td><code>{shortId(row.user_id)}</code></td>}
                  {global && <td>{row.tenant_id ? <code>{shortId(row.tenant_id)}</code> : "Platform"}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty title="No activity yet">Events appear here as people read and change patient data.</Empty>
      )}
      <HowTo>
        <p>Each entry is saved in the same database transaction as the change it describes. If the change fails, no entry is written, so the trail never claims something that did not happen.</p>
        <p>Showing the 100 most recent events. IDs are shortened; the full values are in the database.</p>
      </HowTo>
    </>
  );
}
