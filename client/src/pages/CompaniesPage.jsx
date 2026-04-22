import React, { useEffect, useMemo, useState } from "react";

import { useAuth } from "../auth/useAuth";
import { createApi } from "../api/api";

export default function CompaniesPage() {
  const { getIdToken } = useAuth();
  const api = useMemo(() => createApi(getIdToken), [getIdToken]);

  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [createForm, setCreateForm] = useState({ name: "", website: "", hqLocation: "", notes: "" });
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", website: "", hqLocation: "", notes: "" });

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const data = await api.listCompanies();
      setCompanies(data);
    } catch (e) {
      setError("Failed to load companies.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="container">
      <div className="row">
        <h2>Companies</h2>
        <div className="spacer" />
        <button className="btn" onClick={refresh}>
          Refresh
        </button>
      </div>

      <div className="card">
        <h3>Add company</h3>
        <div className="row wrap">
          <input
            className="input"
            placeholder="Company name"
            value={createForm.name}
            onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
          />
          <input
            className="input"
            placeholder="Website (optional)"
            value={createForm.website}
            onChange={(e) => setCreateForm((f) => ({ ...f, website: e.target.value }))}
          />
          <input
            className="input"
            placeholder="HQ location (optional)"
            value={createForm.hqLocation}
            onChange={(e) => setCreateForm((f) => ({ ...f, hqLocation: e.target.value }))}
          />
          <input
            className="input"
            placeholder="Notes (optional)"
            value={createForm.notes}
            onChange={(e) => setCreateForm((f) => ({ ...f, notes: e.target.value }))}
          />
          <button
            className="btn btn-primary"
            onClick={async () => {
              setError("");
              try {
                await api.createCompany({
                  name: createForm.name,
                  website: createForm.website || undefined,
                  hqLocation: createForm.hqLocation || undefined,
                  notes: createForm.notes || undefined,
                });
                setCreateForm({ name: "", website: "", hqLocation: "", notes: "" });
                await refresh();
              } catch (e) {
                setError("Failed to create company. It may already exist.");
              }
            }}
          >
            Create
          </button>
        </div>
      </div>

      {error ? <div className="error">{error}</div> : null}
      {loading ? <div className="muted">Loading...</div> : null}

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Website</th>
              <th>HQ</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {companies.map((c) => (
              <tr key={c._id}>
                <td>
                  {editId === c._id ? (
                    <input
                      className="input"
                      value={editForm.name}
                      onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                    />
                  ) : (
                    c.name
                  )}
                </td>
                <td>
                  {editId === c._id ? (
                    <input
                      className="input"
                      value={editForm.website}
                      onChange={(e) => setEditForm((f) => ({ ...f, website: e.target.value }))}
                    />
                  ) : (
                    c.website || "-"
                  )}
                </td>
                <td>
                  {editId === c._id ? (
                    <input
                      className="input"
                      value={editForm.hqLocation}
                      onChange={(e) => setEditForm((f) => ({ ...f, hqLocation: e.target.value }))}
                    />
                  ) : (
                    c.hqLocation || "-"
                  )}
                </td>
                <td>
                  {editId === c._id ? (
                    <div className="row">
                      <button
                        className="btn btn-primary"
                        onClick={async () => {
                          setError("");
                          try {
                            await api.updateCompany(c._id, {
                              name: editForm.name,
                              website: editForm.website || "",
                              hqLocation: editForm.hqLocation || "",
                              notes: editForm.notes || "",
                            });
                            setEditId(null);
                            await refresh();
                          } catch (e) {
                            setError("Failed to update company.");
                          }
                        }}
                      >
                        Save
                      </button>
                      <button className="btn" onClick={() => setEditId(null)}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="row">
                      <button
                        className="btn"
                        onClick={() => {
                          setEditId(c._id);
                          setEditForm({
                            name: c.name || "",
                            website: c.website || "",
                            hqLocation: c.hqLocation || "",
                            notes: c.notes || "",
                          });
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="btn"
                        onClick={async () => {
                          const ok = window.confirm(
                            "Delete this company? You can only delete a company with no applications.",
                          );
                          if (!ok) return;
                          setError("");
                          try {
                            await api.deleteCompany(c._id);
                            await refresh();
                          } catch (e) {
                            setError("Failed to delete company. It may have applications.");
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {companies.length === 0 ? (
              <tr>
                <td colSpan={4} className="muted">
                  No companies yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

