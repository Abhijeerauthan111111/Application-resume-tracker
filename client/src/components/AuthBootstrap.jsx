import React, { useEffect, useMemo, useState } from "react";

import { useAuth } from "../auth/useAuth";
import { createApi } from "../api/api";

export default function AuthBootstrap({ children }) {
  const { user, loading, getIdToken } = useAuth();
  const api = useMemo(() => createApi(getIdToken), [getIdToken]);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (loading) return;
      if (!user) return;

      setError("");
      try {
        await api.me();
      } catch (_e) {
        const message =
          _e?.response?.data?.error?.message ||
          "Signed in, but backend verification failed. Check server Firebase Admin env vars.";
        if (!cancelled) setError(message);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [api, user, loading]);

  return (
    <>
      {error ? (
        <div className="container">
          <div className="card">
            <div className="error">{error}</div>
            <div className="muted small">
              If this persists: restart the server after changing `server/.env`, and confirm your MongoDB Atlas `MONGODB_URI`
              is correct.
            </div>
          </div>
        </div>
      ) : null}
      {children}
    </>
  );
}
