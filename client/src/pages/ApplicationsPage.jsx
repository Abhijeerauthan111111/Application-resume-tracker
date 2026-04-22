import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../auth/useAuth";
import { createApi } from "../api/api";
import StatusPill from "../components/StatusPill";

const STATUSES = ["Saved", "Applied", "Interview", "Offer", "Accepted", "Rejected", "Withdrawn"];

function groupByStatus(applications) {
  const map = {};
  for (const s of STATUSES) map[s] = [];
  for (const a of applications) map[a.status]?.push(a);
  return map;
}

export default function ApplicationsPage() {
  const { getIdToken } = useAuth();
  const api = useMemo(() => createApi(getIdToken), [getIdToken]);

  const [view, setView] = useState("kanban");
  const [applications, setApplications] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo, setAppliedTo] = useState("");
  const [sort, setSort] = useState("appliedDate_desc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    companyMode: "existing",
    companyId: "",
    companyName: "",
    role: "",
    status: "Applied",
    appliedDate: new Date().toISOString().slice(0, 10),
  });

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const [apps, comps, summary] = await Promise.all([
        api.listApplications({
          q: q || undefined,
          status: statusFilter || undefined,
          companyId: companyFilter || undefined,
          appliedFrom: appliedFrom || undefined,
          appliedTo: appliedTo || undefined,
          sort: sort || undefined,
        }),
        api.listCompanies(),
        api.analyticsSummary(),
      ]);
      setApplications(apps);
      setCompanies(comps);
      setAnalytics(summary);
    } catch (e) {
      setError("Failed to load applications.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const grouped = useMemo(() => groupByStatus(applications), [applications]);

  return (
    <div className="container">
      <div className="row">
        <h2>Applications</h2>
        <div className="spacer" />
        <button className={`btn ${view === "kanban" ? "btn-primary" : ""}`} onClick={() => setView("kanban")}>
          Kanban
        </button>
        <button className={`btn ${view === "table" ? "btn-primary" : ""}`} onClick={() => setView("table")}>
          Table
        </button>
      </div>

      <div className="card">
        <div className="row wrap">
          <input className="input" placeholder="Search role/notes..." value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select className="input" value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)}>
            <option value="">All companies</option>
            {companies.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
          <input className="input" type="date" value={appliedFrom} onChange={(e) => setAppliedFrom(e.target.value)} />
          <input className="input" type="date" value={appliedTo} onChange={(e) => setAppliedTo(e.target.value)} />
          <select className="input" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="appliedDate_desc">Applied (newest)</option>
            <option value="appliedDate_asc">Applied (oldest)</option>
            <option value="updatedAt_desc">Updated (newest)</option>
            <option value="updatedAt_asc">Updated (oldest)</option>
          </select>
          <button className="btn" onClick={refresh}>
            Apply filters
          </button>
        </div>
        {error ? <p className="error">{error}</p> : null}
        {analytics ? (
          <div className="row wrap" style={{ marginTop: 10 }}>
            <span className="muted small">Counts:</span>
            {Object.entries(analytics.countsByStatus || {}).map(([k, v]) => (
              <span key={k} className="pill" style={{ marginRight: 6 }}>
                {k}: {v}
              </span>
            ))}
          </div>
        ) : null}
        {analytics?.applicationsLast28Days ? (
          <div style={{ marginTop: 12 }}>
            <div className="muted small">Applications (last 28 days)</div>
            <div className="spark">
              {analytics.applicationsLast28Days.map((p) => (
                <div
                  key={p.date}
                  className="spark-bar"
                  title={`${p.date}: ${p.count}`}
                  style={{ height: `${Math.min(40, 6 + p.count * 6)}px` }}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="card">
        <h3>Add application</h3>
        <div className="row wrap">
          <select
            className="input"
            value={form.companyMode}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                companyMode: e.target.value,
                companyId: "",
                companyName: "",
              }))
            }
          >
            <option value="existing">Pick company</option>
            <option value="new">New company</option>
          </select>
          {form.companyMode === "existing" ? (
            <select
              className="input"
              value={form.companyId}
              onChange={(e) => setForm((f) => ({ ...f, companyId: e.target.value }))}
            >
              <option value="">Select company...</option>
              {companies.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              className="input"
              placeholder="Company name"
              value={form.companyName}
              onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
            />
          )}
          <input
            className="input"
            placeholder="Role"
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
          />
          <select className="input" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <input
            className="input"
            type="date"
            value={form.appliedDate}
            onChange={(e) => setForm((f) => ({ ...f, appliedDate: e.target.value }))}
          />
          <button
            className="btn btn-primary"
            onClick={async () => {
              setError("");
              try {
                await api.createApplication({
                  companyId: form.companyMode === "existing" ? form.companyId : undefined,
                  companyName: form.companyMode === "new" ? form.companyName : undefined,
                  role: form.role,
                  status: form.status,
                  appliedDate: form.appliedDate,
                });
                setForm((f) => ({ ...f, companyId: "", companyName: "", role: "" }));
                await refresh();
              } catch (e) {
                setError("Failed to create application. Ensure company and role are filled.");
              }
            }}
          >
            Create
          </button>
        </div>
      </div>

      {loading ? <div className="muted">Loading...</div> : null}

      {view === "kanban" ? (
        <div className="kanban">
          {STATUSES.map((status) => (
            <div
              key={status}
              className="kanban-col"
              onDragOver={(e) => e.preventDefault()}
              onDrop={async (e) => {
                e.preventDefault();
                const appId = e.dataTransfer.getData("text/appId");
                if (!appId) return;
                const next = status;
                try {
                  const updated = await api.updateApplicationStatus(appId, next);
                  setApplications((prev) => prev.map((a) => (a._id === updated._id ? updated : a)));
                } catch (err) {
                  setError("Failed to update status.");
                }
              }}
            >
              <div className="kanban-col-header">
                <strong>{status}</strong>
                <span className="muted">{grouped[status]?.length || 0}</span>
              </div>
              <div className="kanban-cards">
                {grouped[status]?.map((a) => (
                  <div
                    key={a._id}
                    className="card kanban-card"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/appId", a._id);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                  >
                    <div className="row">
                      <div>
                        <div className="title">{a.role}</div>
                        <div className="muted">{a.companyId?.name || "Company"}</div>
                      </div>
                      <div className="spacer" />
                      <StatusPill status={a.status} />
                    </div>
                    <div className="row">
                      <span className="muted">{new Date(a.appliedDate).toLocaleDateString()}</span>
                      <div className="spacer" />
                      <Link className="link" to={`/applications/${a._id}`}>
                        Open
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Role</th>
                <th>Status</th>
                <th>Applied</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {applications.map((a) => (
                <tr key={a._id}>
                  <td>{a.companyId?.name || "-"}</td>
                  <td>{a.role}</td>
                  <td>
                    <StatusPill status={a.status} />
                  </td>
                  <td>{new Date(a.appliedDate).toLocaleDateString()}</td>
                  <td>
                    <Link className="link" to={`/applications/${a._id}`}>
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
              {applications.length === 0 ? (
                <tr>
                  <td colSpan={5} className="muted">
                    No applications yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
