import React, { useState } from "react";
import { Navigate } from "react-router-dom";

import { useAuth } from "../auth/useAuth";
import { firebaseConfig } from "../auth/firebaseClient";

export default function LoginPage() {
  const { user, signIn, loading } = useAuth();
  const [err, setErr] = useState(null);

  if (!loading && user) return <Navigate to="/applications" replace />;

  const missing = [];
  if (!firebaseConfig.apiKey) missing.push("VITE_FIREBASE_API_KEY");
  if (!firebaseConfig.authDomain) missing.push("VITE_FIREBASE_AUTH_DOMAIN");
  if (!firebaseConfig.projectId) missing.push("VITE_FIREBASE_PROJECT_ID");
  if (!firebaseConfig.appId) missing.push("VITE_FIREBASE_APP_ID");

  const isMisconfigured = missing.length > 0;

  const helpForCode = (code) => {
    if (code === "auth/configuration-not-found") {
      return "Enable Google provider in Firebase Auth for this project, and make sure your client .env points to the same Firebase project.";
    }
    if (code === "auth/unauthorized-domain") {
      return "Add localhost to Firebase Auth -> Settings -> Authorized domains.";
    }
    if (code === "auth/popup-blocked") {
      return "Allow popups for localhost:5173 and try again.";
    }
    if (code === "auth/invalid-api-key") {
      return "Your VITE_FIREBASE_API_KEY is wrong for the selected Firebase project.";
    }
    return "";
  };

  return (
    <div className="container">
      <div className="auth-shell">
        <div className="auth-hero">
          <div className="auth-badge">MVP • Phase 1</div>
          <h1 className="auth-title">Application Tracker</h1>
          <p className="muted auth-subtitle">
            Track job applications with a Kanban pipeline, interview rounds, and tasks - with Google sign-in.
          </p>
          <div className="auth-points">
            <div className="auth-point">
              <span className="dot" />
              <span>Kanban + table views</span>
            </div>
            <div className="auth-point">
              <span className="dot" />
              <span>Interview rounds per application</span>
            </div>
            <div className="auth-point">
              <span className="dot" />
              <span>Tasks for follow-ups and prep</span>
            </div>
          </div>
        </div>

        <div className="card auth-card">
          <h2 className="auth-card-title">Sign in</h2>
          <p className="muted small">Use Google to create your account and keep your data private.</p>

        {isMisconfigured ? (
          <div className="error">
            <div>Firebase client config is missing.</div>
            <div className="muted small">Set these in `application-tracker/client/.env` and restart Vite:</div>
            <div className="muted small">
              <code>{missing.join(", ")}</code>
            </div>
          </div>
        ) : null}
        {err ? (
          <div className="error">
            <div>Sign-in failed.</div>
            <div className="muted small">
              {err.code ? <span>Code: {err.code}. </span> : null}
              {err.message ? <span>{err.message}</span> : <span>Check Firebase config and try again.</span>}
            </div>
            {err.code ? (
              <div className="muted small" style={{ marginTop: 6 }}>
                {helpForCode(err.code)}
              </div>
            ) : null}
          </div>
        ) : null}
        <button
          className="btn btn-primary auth-btn"
          disabled={isMisconfigured}
          onClick={async () => {
            setErr(null);
            try {
              await signIn();
            } catch (e) {
              // eslint-disable-next-line no-console
              console.error("Firebase sign-in error:", e);
              setErr({
                code: e?.code || "",
                message: e?.message || "",
              });
            }
          }}
        >
          <span className="google-mark" aria-hidden="true">
            <svg viewBox="0 0 48 48" width="18" height="18">
              <path
                fill="#FFC107"
                d="M43.611 20.083H42V20H24v8h11.303C33.651 32.657 29.194 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.047 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
              />
              <path
                fill="#FF3D00"
                d="M6.306 14.691l6.571 4.819C14.655 16.108 18.961 13 24 13c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.047 6.053 29.268 4 24 4c-7.682 0-14.35 4.33-17.694 10.691z"
              />
              <path
                fill="#4CAF50"
                d="M24 44c5.166 0 9.86-1.977 13.409-5.197l-6.19-5.238C29.155 35.091 26.715 36 24 36c-5.173 0-9.617-3.314-11.271-7.946l-6.52 5.025C9.518 39.556 16.227 44 24 44z"
              />
              <path
                fill="#1976D2"
                d="M43.611 20.083H42V20H24v8h11.303a12.05 12.05 0 0 1-4.087 5.565l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
              />
            </svg>
          </span>
          Continue with Google
        </button>
        <div className="muted small auth-footnote">
          Tip: if you see <code>auth/configuration-not-found</code>, enable Google provider in Firebase Auth.
        </div>
      </div>
    </div>
    </div>
  );
}
