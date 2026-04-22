import React, { useEffect, useMemo, useState } from "react";

import { useAuth } from "../auth/useAuth";
import { createApi } from "../api/api";

export default function SharesPage() {
  const { getIdToken } = useAuth();
  const api = useMemo(() => createApi(getIdToken), [getIdToken]);

  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const data = await api.listShares?.();
      if (!data) {
        setError("Shares API not available in client.");
        setShares([]);
      } else {
        setShares(data);
      }
    } catch (_e) {
      setError("Failed to load shares.");
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
        <h2>Shares</h2>
        <div className="spacer" />
        <button className="btn" onClick={refresh}>
          Refresh
        </button>
      </div>

      {error ? <div className="error">{error}</div> : null}
      {loading ? <div className="muted">Loading...</div> : null}

      <div className="card">
        <div className="muted small">
          Note: share URLs are only shown once on creation for security. You can always create a new share link from an
          application.
        </div>
        <table className="table" style={{ marginTop: 10 }}>
          <thead>
            <tr>
              <th>Application</th>
              <th>Expires</th>
              <th>Docs</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {shares.map((s) => (
              <tr key={s.id}>
                <td>
                  {s.application ? (
                    <div>
                      <div className="title">
                        {s.application.role} @ {s.application.companyName}
                      </div>
                      <div className="muted small">{s.application.status}</div>
                    </div>
                  ) : (
                    <span className="muted">Application not found</span>
                  )}
                </td>
                <td>{s.expiresAt ? new Date(s.expiresAt).toLocaleString() : "No expiry"}</td>
                <td>{s.includeDocuments ? "Included" : "Hidden"}</td>
                <td>
                  <button
                    className="btn"
                    onClick={async () => {
                      const ok = window.confirm("Revoke this share link?");
                      if (!ok) return;
                      setError("");
                      try {
                        await api.revokeShare(s.id);
                        await refresh();
                      } catch (_e) {
                        setError("Failed to revoke share.");
                      }
                    }}
                  >
                    Revoke
                  </button>
                </td>
              </tr>
            ))}
            {shares.length === 0 ? (
              <tr>
                <td colSpan={4} className="muted">
                  No active shares.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

