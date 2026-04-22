import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { useAuth } from "../auth/useAuth";
import { createApi } from "../api/api";
import StatusPill from "../components/StatusPill";

export default function ApplicationDetailPage() {
  const { id } = useParams();
  const { getIdToken } = useAuth();
  const api = useMemo(() => createApi(getIdToken), [getIdToken]);

  const [app, setApp] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    companyId: "",
    role: "",
    status: "Applied",
    appliedDate: "",
    jobLink: "",
    location: "",
    salaryRange: "",
    source: "",
    notes: "",
  });
  const [roundEditId, setRoundEditId] = useState(null);
  const [roundEditForm, setRoundEditForm] = useState({
    roundType: "Technical",
    scheduledAt: "",
    status: "Scheduled",
    notes: "",
  });
  const [taskEditId, setTaskEditId] = useState(null);
  const [taskEditForm, setTaskEditForm] = useState({ title: "", dueAt: "" });

  const [roundForm, setRoundForm] = useState({
    roundType: "Technical",
    scheduledAt: "",
    status: "Scheduled",
    notes: "",
  });

  const [taskForm, setTaskForm] = useState({
    title: "",
    dueAt: new Date().toISOString().slice(0, 10),
  });

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const [data, t, comps] = await Promise.all([
        api.getApplication(id),
        api.listTasks({ applicationId: id, status: "open" }),
        api.listCompanies(),
      ]);
      setApp(data);
      setTasks(t);
      setCompanies(comps);
      if (!editing) {
        setEditForm({
          companyId: data.companyId?._id || data.companyId || "",
          role: data.role || "",
          status: data.status || "Applied",
          appliedDate: data.appliedDate ? new Date(data.appliedDate).toISOString().slice(0, 10) : "",
          jobLink: data.jobLink || "",
          location: data.location || "",
          salaryRange: data.salaryRange || "",
          source: data.source || "",
          notes: data.notes || "",
        });
      }
    } catch (e) {
      setError("Failed to load application.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) return <div className="container muted">Loading...</div>;
  if (error) return <div className="container error">{error}</div>;
  if (!app) return <div className="container muted">Not found.</div>;

  return (
    <div className="container">
      <div className="row">
        <Link className="link" to="/applications">
          ← Back
        </Link>
        <div className="spacer" />
        <StatusPill status={app.status} />
      </div>

      <div className="card">
        <div className="row">
          <div>
            <h2 style={{ margin: 0 }}>{app.role}</h2>
            <p className="muted" style={{ margin: "6px 0 0" }}>
              {app.companyId?.name}
            </p>
          </div>
          <div className="spacer" />
          {editing ? (
            <div className="row">
              <button
                className="btn btn-primary"
                onClick={async () => {
                  setError("");
                  try {
                    const updated = await api.updateApplication(id, {
                      companyId: editForm.companyId,
                      role: editForm.role,
                      status: editForm.status,
                      appliedDate: editForm.appliedDate,
                      jobLink: editForm.jobLink,
                      location: editForm.location,
                      salaryRange: editForm.salaryRange,
                      source: editForm.source,
                      notes: editForm.notes,
                    });
                    setApp(updated);
                    setEditing(false);
                    await refresh();
                  } catch (e) {
                    setError("Failed to save changes.");
                  }
                }}
              >
                Save
              </button>
              <button
                className="btn"
                onClick={() => {
                  setEditing(false);
                  setEditForm({
                    companyId: app.companyId?._id || app.companyId || "",
                    role: app.role || "",
                    status: app.status || "Applied",
                    appliedDate: app.appliedDate ? new Date(app.appliedDate).toISOString().slice(0, 10) : "",
                    jobLink: app.jobLink || "",
                    location: app.location || "",
                    salaryRange: app.salaryRange || "",
                    source: app.source || "",
                    notes: app.notes || "",
                  });
                }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="row">
              <button className="btn" onClick={() => setEditing(true)}>
                Edit
              </button>
              <button
                className="btn"
                onClick={async () => {
                  const ok = window.confirm("Delete this application? Tasks for it will also be deleted.");
                  if (!ok) return;
                  setError("");
                  try {
                    await api.deleteApplication(id);
                    window.location.href = "/applications";
                  } catch (e) {
                    setError("Failed to delete application.");
                  }
                }}
              >
                Delete
              </button>
            </div>
          )}
        </div>

        {editing ? (
          <div className="grid2" style={{ marginTop: 12 }}>
            <div className="card">
              <h3 style={{ marginTop: 0 }}>Details</h3>
              <div className="row wrap">
                <select
                  className="input"
                  value={editForm.companyId}
                  onChange={(e) => setEditForm((f) => ({ ...f, companyId: e.target.value }))}
                >
                  <option value="">Select company...</option>
                  {companies.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <input
                  className="input"
                  placeholder="Role"
                  value={editForm.role}
                  onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}
                />
                <select
                  className="input"
                  value={editForm.status}
                  onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                >
                  {["Saved", "Applied", "Interview", "Offer", "Accepted", "Rejected", "Withdrawn"].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <input
                  className="input"
                  type="date"
                  value={editForm.appliedDate}
                  onChange={(e) => setEditForm((f) => ({ ...f, appliedDate: e.target.value }))}
                />
                <input
                  className="input"
                  placeholder="Job link"
                  value={editForm.jobLink}
                  onChange={(e) => setEditForm((f) => ({ ...f, jobLink: e.target.value }))}
                />
                <input
                  className="input"
                  placeholder="Location"
                  value={editForm.location}
                  onChange={(e) => setEditForm((f) => ({ ...f, location: e.target.value }))}
                />
                <input
                  className="input"
                  placeholder="Salary range"
                  value={editForm.salaryRange}
                  onChange={(e) => setEditForm((f) => ({ ...f, salaryRange: e.target.value }))}
                />
                <input
                  className="input"
                  placeholder="Source"
                  value={editForm.source}
                  onChange={(e) => setEditForm((f) => ({ ...f, source: e.target.value }))}
                />
              </div>
              <div style={{ marginTop: 10 }}>
                <div className="muted small">Notes</div>
                <textarea
                  className="input"
                  style={{ width: "100%", minHeight: 110 }}
                  value={editForm.notes}
                  onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>
            </div>

            <div className="card">
              <h3 style={{ marginTop: 0 }}>Quick view</h3>
              <div className="row wrap">
                <div className="kv">
                  <div className="muted">Applied</div>
                  <div>{editForm.appliedDate ? new Date(editForm.appliedDate).toLocaleDateString() : "-"}</div>
                </div>
                <div className="kv">
                  <div className="muted">Location</div>
                  <div>{editForm.location || "-"}</div>
                </div>
                <div className="kv">
                  <div className="muted">Source</div>
                  <div>{editForm.source || "-"}</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="row wrap" style={{ marginTop: 12 }}>
              <div className="kv">
                <div className="muted">Applied</div>
                <div>{new Date(app.appliedDate).toLocaleDateString()}</div>
              </div>
              <div className="kv">
                <div className="muted">Location</div>
                <div>{app.location || "-"}</div>
              </div>
              <div className="kv">
                <div className="muted">Source</div>
                <div>{app.source || "-"}</div>
              </div>
              <div className="kv">
                <div className="muted">Job link</div>
                <div>
                  {app.jobLink ? (
                    <a className="link" href={app.jobLink} target="_blank" rel="noreferrer">
                      Open
                    </a>
                  ) : (
                    "-"
                  )}
                </div>
              </div>
            </div>
            {app.notes ? (
              <div style={{ marginTop: 10 }}>
                <div className="muted">Notes</div>
                <div className="pre">{app.notes}</div>
              </div>
            ) : null}
          </>
        )}
      </div>

      <div className="grid2">
        <div className="card">
          <h3>Interview rounds</h3>
          <div className="muted small">Track each round date/status/notes.</div>
          <ul className="list">
            {(app.interviewRounds || []).map((r) => (
              <li key={r._id} className="list-item">
                {roundEditId === r._id ? (
                  <div style={{ width: "100%" }}>
                    <div className="row wrap">
                      <select
                        className="input"
                        value={roundEditForm.roundType}
                        onChange={(e) => setRoundEditForm((f) => ({ ...f, roundType: e.target.value }))}
                      >
                        {["HR", "Technical", "Managerial", "Final", "Other"].map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                      <input
                        className="input"
                        type="datetime-local"
                        value={roundEditForm.scheduledAt}
                        onChange={(e) => setRoundEditForm((f) => ({ ...f, scheduledAt: e.target.value }))}
                      />
                      <select
                        className="input"
                        value={roundEditForm.status}
                        onChange={(e) => setRoundEditForm((f) => ({ ...f, status: e.target.value }))}
                      >
                        {["Scheduled", "Completed", "Cleared", "Rejected"].map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <input
                        className="input"
                        placeholder="Notes"
                        value={roundEditForm.notes}
                        onChange={(e) => setRoundEditForm((f) => ({ ...f, notes: e.target.value }))}
                      />
                    </div>
                    <div className="row" style={{ marginTop: 10 }}>
                      <button
                        className="btn btn-primary"
                        onClick={async () => {
                          setError("");
                          try {
                            const updated = await api.updateInterviewRound(id, r._id, {
                              roundType: roundEditForm.roundType,
                              scheduledAt: roundEditForm.scheduledAt
                                ? new Date(roundEditForm.scheduledAt).toISOString()
                                : undefined,
                              status: roundEditForm.status,
                              notes: roundEditForm.notes,
                            });
                            setApp(updated);
                            setRoundEditId(null);
                          } catch (e) {
                            setError("Failed to update interview round.");
                          }
                        }}
                      >
                        Save
                      </button>
                      <button className="btn" onClick={() => setRoundEditId(null)}>
                        Cancel
                      </button>
                      <div className="spacer" />
                      <button
                        className="btn"
                        onClick={async () => {
                          const ok = window.confirm("Delete this interview round?");
                          if (!ok) return;
                          setError("");
                          try {
                            const updated = await api.deleteInterviewRound(id, r._id);
                            setApp(updated);
                            setRoundEditId(null);
                          } catch (e) {
                            setError("Failed to delete interview round.");
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ width: "100%" }}>
                      <div className="row">
                        <div>
                          <div className="title">
                            {r.roundType} - {r.status}
                          </div>
                          <div className="muted">
                            {r.scheduledAt ? new Date(r.scheduledAt).toLocaleString() : "No date"}
                          </div>
                          {r.notes ? <div className="pre small">{r.notes}</div> : null}
                        </div>
                        <div className="spacer" />
                        <button
                          className="btn"
                          onClick={() => {
                            setRoundEditId(r._id);
                            setRoundEditForm({
                              roundType: r.roundType,
                              scheduledAt: r.scheduledAt ? new Date(r.scheduledAt).toISOString().slice(0, 16) : "",
                              status: r.status,
                              notes: r.notes || "",
                            });
                          }}
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </li>
            ))}
            {app.interviewRounds?.length ? null : <li className="muted">No rounds yet.</li>}
          </ul>

          <div className="divider" />
          <h4>Add round</h4>
          <div className="row wrap">
            <select
              className="input"
              value={roundForm.roundType}
              onChange={(e) => setRoundForm((f) => ({ ...f, roundType: e.target.value }))}
            >
              {["HR", "Technical", "Managerial", "Final", "Other"].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <input
              className="input"
              type="datetime-local"
              value={roundForm.scheduledAt}
              onChange={(e) => setRoundForm((f) => ({ ...f, scheduledAt: e.target.value }))}
            />
            <select
              className="input"
              value={roundForm.status}
              onChange={(e) => setRoundForm((f) => ({ ...f, status: e.target.value }))}
            >
              {["Scheduled", "Completed", "Cleared", "Rejected"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <input
              className="input"
              placeholder="Notes"
              value={roundForm.notes}
              onChange={(e) => setRoundForm((f) => ({ ...f, notes: e.target.value }))}
            />
            <button
              className="btn btn-primary"
              onClick={async () => {
                setError("");
                try {
                  const updated = await api.addInterviewRound(id, {
                    roundType: roundForm.roundType,
                    scheduledAt: roundForm.scheduledAt ? new Date(roundForm.scheduledAt).toISOString() : undefined,
                    status: roundForm.status,
                    notes: roundForm.notes,
                  });
                  setApp(updated);
                  setRoundForm((f) => ({ ...f, scheduledAt: "", notes: "" }));
                } catch (e) {
                  setError("Failed to add interview round.");
                }
              }}
            >
              Add
            </button>
          </div>
        </div>

        <div className="card">
          <h3>Open tasks</h3>
          <ul className="list">
            {tasks.map((t) => (
              <li key={t._id} className="list-item">
                {taskEditId === t._id ? (
                  <div style={{ width: "100%" }}>
                    <div className="row wrap">
                      <input
                        className="input"
                        placeholder="Task title"
                        value={taskEditForm.title}
                        onChange={(e) => setTaskEditForm((f) => ({ ...f, title: e.target.value }))}
                      />
                      <input
                        className="input"
                        type="date"
                        value={taskEditForm.dueAt}
                        onChange={(e) => setTaskEditForm((f) => ({ ...f, dueAt: e.target.value }))}
                      />
                      <button
                        className="btn btn-primary"
                        onClick={async () => {
                          setError("");
                          try {
                            await api.updateTask(t._id, {
                              title: taskEditForm.title,
                              dueAt: taskEditForm.dueAt,
                            });
                            setTaskEditId(null);
                            await refresh();
                          } catch (e) {
                            setError("Failed to update task.");
                          }
                        }}
                      >
                        Save
                      </button>
                      <button className="btn" onClick={() => setTaskEditId(null)}>
                        Cancel
                      </button>
                      <button
                        className="btn"
                        onClick={async () => {
                          const ok = window.confirm("Delete this task?");
                          if (!ok) return;
                          setError("");
                          try {
                            await api.deleteTask(t._id);
                            setTaskEditId(null);
                            await refresh();
                          } catch (e) {
                            setError("Failed to delete task.");
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <div className="title">{t.title}</div>
                      <div className="muted">{new Date(t.dueAt).toLocaleDateString()}</div>
                    </div>
                    <div className="spacer" />
                    <div className="row">
                      <button
                        className="btn"
                        onClick={async () => {
                          await api.completeTask(t._id);
                          await refresh();
                        }}
                      >
                        Done
                      </button>
                      <button
                        className="btn"
                        onClick={() => {
                          setTaskEditId(t._id);
                          setTaskEditForm({
                            title: t.title || "",
                            dueAt: t.dueAt ? new Date(t.dueAt).toISOString().slice(0, 10) : "",
                          });
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="btn"
                        onClick={async () => {
                          await api.dismissTask(t._id);
                          await refresh();
                        }}
                      >
                        Dismiss
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
            {tasks.length === 0 ? <li className="muted">No open tasks.</li> : null}
          </ul>

          <div className="divider" />
          <h4>Add task</h4>
          <div className="row wrap">
            <input
              className="input"
              placeholder="Task title"
              value={taskForm.title}
              onChange={(e) => setTaskForm((f) => ({ ...f, title: e.target.value }))}
            />
            <input
              className="input"
              type="date"
              value={taskForm.dueAt}
              onChange={(e) => setTaskForm((f) => ({ ...f, dueAt: e.target.value }))}
            />
            <button
              className="btn btn-primary"
              onClick={async () => {
                setError("");
                try {
                  await api.createTask({
                    applicationId: id,
                    title: taskForm.title,
                    dueAt: taskForm.dueAt,
                  });
                  setTaskForm((f) => ({ ...f, title: "" }));
                  await refresh();
                } catch (e) {
                  setError("Failed to create task.");
                }
              }}
            >
              Create
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
