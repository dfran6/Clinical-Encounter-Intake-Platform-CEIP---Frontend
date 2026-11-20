import { useCallback, useEffect, useState } from "react";
import { request } from "../api.js";
import { Empty, HowTo, Notice, PageHead, shortId } from "../components/ui.jsx";

export default function TenantAdmin({ token }) {
  const [tenants, setTenants] = useState([]);
  const [tenantForm, setTenantForm] = useState({ name: "", email: "", address: "" });
  const [adminForm, setAdminForm] = useState({ email: "", password: "" });
  const [selectedTenant, setSelectedTenant] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadTenants = useCallback(async () => {
    try {
      setTenants(await request("/tenants/?limit=100&offset=0", { token }));
    } catch (err) {
      setError(err.message);
    }
  }, [token]);
  useEffect(() => {
    loadTenants();
  }, [loadTenants]);

  async function createTenant(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const tenant = await request("/tenants/", { token, method: "POST", body: tenantForm });
      setTenants((items) => [tenant, ...items]);
      setSelectedTenant(tenant.id);
      setTenantForm({ name: "", email: "", address: "" });
      setMessage(`Created ${tenant.name}. It is now selected in step 2, so you can add its records admin.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function createRecordsAdmin(event) {
    event.preventDefault();
    if (!selectedTenant) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const query = new URLSearchParams({ tenant_id: selectedTenant });
      const admin = await request(`/users/create_record_admin?${query}`, { token, method: "POST", body: adminForm });
      setAdminForm({ email: "", password: "" });
      setMessage(`Added ${admin.email} as records admin for ${tenants.find((tenant) => tenant.id === selectedTenant)?.name || "the clinic"}. They can now sign in and invite staff.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHead title="Clinic administration">Set up a clinic, then give it a records admin who can invite its staff. You manage clinics here, not patient data.</PageHead>
      <Notice>{error}</Notice>
      <Notice kind="success">{message}</Notice>
      <div className="split">
        <form className="stack" onSubmit={createTenant}>
          <h2>Step 1: Create a clinic</h2>
          <label>
            Clinic name
            <input required value={tenantForm.name} onChange={(e) => setTenantForm({ ...tenantForm, name: e.target.value })} />
          </label>
          <label>
            Contact email
            <input type="email" required value={tenantForm.email} onChange={(e) => setTenantForm({ ...tenantForm, email: e.target.value })} />
          </label>
          <label>
            Address
            <input required value={tenantForm.address} onChange={(e) => setTenantForm({ ...tenantForm, address: e.target.value })} />
          </label>
          <button className="btn" disabled={busy}>{busy ? "Working" : "Create clinic"}</button>
        </form>
        <form className="stack" onSubmit={createRecordsAdmin}>
          <h2>Step 2: Add its records admin</h2>
          <label>
            Clinic
            <select required value={selectedTenant} onChange={(e) => setSelectedTenant(e.target.value)}>
              <option value="">Choose a clinic</option>
              {tenants.map((tenant) => (
                <option value={tenant.id} key={tenant.id}>{tenant.name}</option>
              ))}
            </select>
          </label>
          <label>
            Admin email
            <input type="email" required autoComplete="off" value={adminForm.email} onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })} />
          </label>
          <label>
            Temporary password
            <input type="password" required minLength="8" autoComplete="new-password" value={adminForm.password} onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })} />
            <small>At least 8 characters. Ask them to change it after signing in.</small>
          </label>
          <button className="btn" disabled={busy || !selectedTenant}>{busy ? "Working" : "Create records admin"}</button>
        </form>
      </div>

      <section className="listing" aria-labelledby="clinics-h">
        <h2 id="clinics-h">Clinics ({tenants.length})</h2>
        {tenants.length ? (
          <ul>
            {tenants.map((tenant) => (
              <li key={tenant.id} className={selectedTenant === tenant.id ? "is-selected" : ""}>
                <div>
                  <strong>{tenant.name}</strong>
                  <small>{[tenant.email, tenant.address].filter(Boolean).join(", ")}</small>
                </div>
                <code>{shortId(tenant.id)}</code>
                <button type="button" className="btn btn--ghost btn--small" onClick={() => { setSelectedTenant(tenant.id); setMessage(`${tenant.name} is selected in step 2.`); }}>
                  Use in step 2
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <Empty title="No clinics yet">Create the first clinic in step 1.</Empty>
        )}
      </section>
      <HowTo>
        <p>Each clinic is a separate workspace. Its staff only ever see its own patients. As platform admin you can create clinics and records admins, and you can read the platform-wide audit trail, but you have no access to any clinic's patient records.</p>
      </HowTo>
    </>
  );
}
