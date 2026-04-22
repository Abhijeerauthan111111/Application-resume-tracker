import React, { useEffect, useMemo, useState } from "react";

import { useAuth } from "../auth/useAuth";
import { createApi } from "../api/api";

export default function DocumentsPage() {
  const { getIdToken } = useAuth();
  const api = useMemo(() => createApi(getIdToken), [getIdToken]);

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [type, setType] = useState("");

  const [linkForm, setLinkForm] = useState({
    type: "resume",
    name: "",
    externalUrl: "",
    roleFocus: "",
    tags: "",
    notes: "",
  });

  const [uploadForm, setUploadForm] = useState({
    type: "resume",
    name: "",
    roleFocus: "",
    tags: "",
    notes: "",
    file: null,
  });

  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", roleFocus: "", tags: "", notes: "" });

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const data = await api.listDocuments({ q: q || undefined, type: type || undefined });
      setDocuments(data);
    } catch (e) {
      setError("Failed to load documents.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const parseTags = (s) =>
    s
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);

  return (
    <div className="container">
      <div className="row">
        <h2>Documents</h2>
        <div className="spacer" />
        <input className="input" placeholder="Search..." value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All types</option>
          <option value="resume">Resume</option>
          <option value="cover_letter">Cover letter</option>
          <option value="portfolio">Portfolio</option>
        </select>
        <button className="btn" onClick={refresh}>
          Apply
        </button>
      </div>

      {error ? <div className="error">{error}</div> : null}
      {loading ? <div className="muted">Loading...</div> : null}

      <div className="grid2">
        <div className="card">
          <h3>Add external link</h3>
          <div className="row wrap">
            <select
              className="input"
              value={linkForm.type}
              onChange={(e) => setLinkForm((f) => ({ ...f, type: e.target.value }))}
            >
              <option value="resume">Resume</option>
              <option value="cover_letter">Cover letter</option>
              <option value="portfolio">Portfolio</option>
            </select>
            <input
              className="input"
              placeholder="Name"
              value={linkForm.name}
              onChange={(e) => setLinkForm((f) => ({ ...f, name: e.target.value }))}
            />
            <input
              className="input"
              placeholder="External URL"
              value={linkForm.externalUrl}
              onChange={(e) => setLinkForm((f) => ({ ...f, externalUrl: e.target.value }))}
            />
            <input
              className="input"
              placeholder="Role focus (optional)"
              value={linkForm.roleFocus}
              onChange={(e) => setLinkForm((f) => ({ ...f, roleFocus: e.target.value }))}
            />
            <input
              className="input"
              placeholder="Tags (comma-separated)"
              value={linkForm.tags}
              onChange={(e) => setLinkForm((f) => ({ ...f, tags: e.target.value }))}
            />
            <input
              className="input"
              placeholder="Notes (optional)"
              value={linkForm.notes}
              onChange={(e) => setLinkForm((f) => ({ ...f, notes: e.target.value }))}
            />
            <button
              className="btn btn-primary"
              onClick={async () => {
                setError("");
                try {
                  await api.createDocument({
                    type: linkForm.type,
                    name: linkForm.name,
                    source: "external",
                    externalUrl: linkForm.externalUrl,
                    roleFocus: linkForm.roleFocus || "",
                    tags: parseTags(linkForm.tags),
                    notes: linkForm.notes || "",
                  });
                  setLinkForm({ type: "resume", name: "", externalUrl: "", roleFocus: "", tags: "", notes: "" });
                  await refresh();
                } catch (e) {
                  setError("Failed to create document link.");
                }
              }}
            >
              Create
            </button>
          </div>
        </div>

        <div className="card">
          <h3>Upload file (Cloudinary)</h3>
          <div className="muted small">Set Cloudinary env vars on the server to enable uploads.</div>
          <div className="row wrap" style={{ marginTop: 10 }}>
            <select
              className="input"
              value={uploadForm.type}
              onChange={(e) => setUploadForm((f) => ({ ...f, type: e.target.value }))}
            >
              <option value="resume">Resume</option>
              <option value="cover_letter">Cover letter</option>
              <option value="portfolio">Portfolio</option>
            </select>
            <input
              className="input"
              placeholder="Name"
              value={uploadForm.name}
              onChange={(e) => setUploadForm((f) => ({ ...f, name: e.target.value }))}
            />
            <input
              className="input"
              placeholder="Role focus (optional)"
              value={uploadForm.roleFocus}
              onChange={(e) => setUploadForm((f) => ({ ...f, roleFocus: e.target.value }))}
            />
            <input
              className="input"
              placeholder="Tags (comma-separated)"
              value={uploadForm.tags}
              onChange={(e) => setUploadForm((f) => ({ ...f, tags: e.target.value }))}
            />
            <input
              className="input"
              placeholder="Notes (optional)"
              value={uploadForm.notes}
              onChange={(e) => setUploadForm((f) => ({ ...f, notes: e.target.value }))}
            />
            <input
              className="input"
              type="file"
              onChange={(e) => setUploadForm((f) => ({ ...f, file: e.target.files?.[0] || null }))}
            />
            <button
              className="btn btn-primary"
              onClick={async () => {
                if (!uploadForm.file) {
                  setError("Pick a file first.");
                  return;
                }
                setError("");
                try {
                  const fd = new FormData();
                  fd.append("file", uploadForm.file);
                  fd.append("type", uploadForm.type);
                  fd.append("name", uploadForm.name);
                  fd.append("roleFocus", uploadForm.roleFocus || "");
                  fd.append("tags", JSON.stringify(parseTags(uploadForm.tags)));
                  fd.append("notes", uploadForm.notes || "");
                  await api.uploadDocument(fd);
                  setUploadForm({ type: "resume", name: "", roleFocus: "", tags: "", notes: "", file: null });
                  await refresh();
                } catch (e) {
                  setError("Upload failed. Check Cloudinary server env vars and file size.");
                }
              }}
            >
              Upload
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Your documents</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Source</th>
              <th>Link</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {documents.map((d) => (
              <tr key={d._id}>
                <td>
                  {editId === d._id ? (
                    <input
                      className="input"
                      value={editForm.name}
                      onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                    />
                  ) : (
                    d.name
                  )}
                  {editId === d._id ? (
                    <div className="row wrap" style={{ marginTop: 8 }}>
                      <input
                        className="input"
                        placeholder="Role focus"
                        value={editForm.roleFocus}
                        onChange={(e) => setEditForm((f) => ({ ...f, roleFocus: e.target.value }))}
                      />
                      <input
                        className="input"
                        placeholder="Tags (comma-separated)"
                        value={editForm.tags}
                        onChange={(e) => setEditForm((f) => ({ ...f, tags: e.target.value }))}
                      />
                      <input
                        className="input"
                        placeholder="Notes"
                        value={editForm.notes}
                        onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                      />
                    </div>
                  ) : null}
                </td>
                <td>{d.type}</td>
                <td>{d.source}</td>
                <td>
                  {d.source === "external" && d.externalUrl ? (
                    <a className="link" href={d.externalUrl} target="_blank" rel="noreferrer">
                      Open
                    </a>
                  ) : d.file?.secureUrl ? (
                    <a className="link" href={d.file.secureUrl} target="_blank" rel="noreferrer">
                      Open
                    </a>
                  ) : (
                    "-"
                  )}
                </td>
                <td>
                  {editId === d._id ? (
                    <div className="row">
                      <button
                        className="btn btn-primary"
                        onClick={async () => {
                          setError("");
                          try {
                            await api.updateDocument(d._id, {
                              name: editForm.name,
                              roleFocus: editForm.roleFocus || "",
                              tags: parseTags(editForm.tags),
                              notes: editForm.notes || "",
                            });
                            setEditId(null);
                            await refresh();
                          } catch (_e) {
                            setError("Failed to update document.");
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
                          setEditId(d._id);
                          setEditForm({
                            name: d.name || "",
                            roleFocus: d.roleFocus || "",
                            tags: (d.tags || []).join(", "),
                            notes: d.notes || "",
                          });
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="btn"
                        onClick={async () => {
                          const ok = window.confirm("Delete this document? It must not be attached to any application.");
                          if (!ok) return;
                          setError("");
                          try {
                            await api.deleteDocument(d._id);
                            await refresh();
                          } catch (e) {
                            setError("Failed to delete document. Detach it from applications first.");
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
            {documents.length === 0 ? (
              <tr>
                <td colSpan={5} className="muted">
                  No documents yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
