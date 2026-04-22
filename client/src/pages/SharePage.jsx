import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { publicApi } from "../api/api";
import StatusPill from "../components/StatusPill";

export default function SharePage() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError("");
      try {
        const res = await publicApi().getPublicShare(token);
        if (!cancelled) setData(res);
      } catch (e) {
        if (!cancelled) setError("This share link is invalid or expired.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading) return <div className="container muted">Loading...</div>;
  if (error) return <div className="container error">{error}</div>;

  const app = data?.application;
  if (!app) return <div className="container muted">Not found.</div>;

  return (
    <div className="container">
      <div className="card">
        <div className="row">
          <div>
            <h2 style={{ margin: 0 }}>{app.role}</h2>
            <div className="muted">{app.company?.name || ""}</div>
          </div>
          <div className="spacer" />
          <StatusPill status={app.status} />
        </div>

        <div className="row wrap" style={{ marginTop: 12 }}>
          <div className="kv">
            <div className="muted">Applied</div>
            <div>{app.appliedDate ? new Date(app.appliedDate).toLocaleDateString() : "-"}</div>
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
      </div>

      <div className="grid2">
        <div className="card">
          <h3>Interview rounds</h3>
          <ul className="list">
            {(app.interviewRounds || []).map((r) => (
              <li key={r._id} className="list-item">
                <div>
                  <div className="title">
                    {r.roundType} - {r.status}
                  </div>
                  <div className="muted">{r.scheduledAt ? new Date(r.scheduledAt).toLocaleString() : "No date"}</div>
                  {r.notes ? <div className="pre small">{r.notes}</div> : null}
                </div>
              </li>
            ))}
            {(app.interviewRounds || []).length === 0 ? <li className="muted">No rounds.</li> : null}
          </ul>
        </div>

        <div className="card">
          <h3>Documents</h3>
          <div className="muted small">Documents may be hidden by the owner for privacy.</div>
          <ul className="list">
            {(data?.documents || []).map((d) => (
              <li key={d._id} className="list-item">
                <div>
                  <div className="title">{d.name}</div>
                  <div className="muted small">{d.type}</div>
                </div>
                <div className="spacer" />
                {d.source === "external" && d.externalUrl ? (
                  <a className="link" href={d.externalUrl} target="_blank" rel="noreferrer">
                    Open
                  </a>
                ) : d.file?.secureUrl ? (
                  <a className="link" href={d.file.secureUrl} target="_blank" rel="noreferrer">
                    Open
                  </a>
                ) : (
                  <span className="muted">-</span>
                )}
              </li>
            ))}
            {(data?.documents || []).length === 0 ? <li className="muted">No documents shared.</li> : null}
          </ul>
        </div>
      </div>
    </div>
  );
}

