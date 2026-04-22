import React, { useEffect, useMemo, useState } from "react";

import { useAuth } from "../auth/useAuth";
import { createApi } from "../api/api";

export default function TasksPage() {
  const { getIdToken } = useAuth();
  const api = useMemo(() => createApi(getIdToken), [getIdToken]);

  const [tasks, setTasks] = useState([]);
  const [status, setStatus] = useState("open");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({ title: "", dueAt: "", description: "" });

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const data = await api.listTasks({ status });
      setTasks(data);
    } catch (e) {
      setError("Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <div className="container">
      <div className="row">
        <h2>Tasks</h2>
        <div className="spacer" />
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="open">Open</option>
          <option value="done">Done</option>
          <option value="dismissed">Dismissed</option>
        </select>
        <button className="btn" onClick={refresh}>
          Refresh
        </button>
      </div>

      {error ? <div className="error">{error}</div> : null}
      {loading ? <div className="muted">Loading...</div> : null}

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Due</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {tasks.map((t) => (
              <tr key={t._id}>
                <td>
                  {editId === t._id ? (
                    <input
                      className="input"
                      value={editForm.title}
                      onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                    />
                  ) : (
                    t.title
                  )}
                </td>
                <td>
                  {editId === t._id ? (
                    <input
                      className="input"
                      type="date"
                      value={editForm.dueAt}
                      onChange={(e) => setEditForm((f) => ({ ...f, dueAt: e.target.value }))}
                    />
                  ) : (
                    new Date(t.dueAt).toLocaleDateString()
                  )}
                </td>
                <td>{t.status}</td>
                <td>
                  {editId === t._id ? (
                    <div className="row">
                      <button
                        className="btn btn-primary"
                        onClick={async () => {
                          setError("");
                          try {
                            await api.updateTask(t._id, {
                              title: editForm.title,
                              dueAt: editForm.dueAt,
                              description: editForm.description,
                            });
                            setEditId(null);
                            await refresh();
                          } catch (e) {
                            setError("Failed to update task.");
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
                      {t.status === "open" ? (
                        <>
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
                            onClick={async () => {
                              await api.dismissTask(t._id);
                              await refresh();
                            }}
                          >
                            Dismiss
                          </button>
                        </>
                      ) : null}
                      <button
                        className="btn"
                        onClick={() => {
                          setEditId(t._id);
                          setEditForm({
                            title: t.title || "",
                            dueAt: t.dueAt ? new Date(t.dueAt).toISOString().slice(0, 10) : "",
                            description: t.description || "",
                          });
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="btn"
                        onClick={async () => {
                          const ok = window.confirm("Delete this task?");
                          if (!ok) return;
                          setError("");
                          try {
                            await api.deleteTask(t._id);
                            await refresh();
                          } catch (e) {
                            setError("Failed to delete task.");
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
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={4} className="muted">
                  No tasks.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
