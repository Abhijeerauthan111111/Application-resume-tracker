import React, { useEffect, useMemo, useState } from "react";

import { useAuth } from "../auth/useAuth";
import { createApi } from "../api/api";

export default function SettingsPage() {
  const { getIdToken } = useAuth();
  const api = useMemo(() => createApi(getIdToken), [getIdToken]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  const [form, setForm] = useState({
    timezone: "",
    emailRemindersEnabled: true,
    dailyDigestEnabled: true,
    dailyDigestTime: "09:00",
    followUpDefaultDays: 4,
  });

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError("");
      try {
        const me = await api.me();
        const s = me.settings || {};
        if (!cancelled) {
          setForm({
            timezone: s.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "",
            emailRemindersEnabled: s.emailRemindersEnabled !== false,
            dailyDigestEnabled: s.dailyDigestEnabled !== false,
            dailyDigestTime: s.dailyDigestTime || "09:00",
            followUpDefaultDays: s.followUpDefaultDays ?? 4,
          });
        }
      } catch (_e) {
        if (!cancelled) setError("Failed to load settings.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [api]);

  if (loading) return <div className="container muted">Loading...</div>;

  return (
    <div className="container">
      <div className="row">
        <h2>Settings</h2>
        <div className="spacer" />
        {saved ? <span className="muted small">{saved}</span> : null}
      </div>

      {error ? <div className="error">{error}</div> : null}

      <div className="card">
        <div className="row wrap">
          <div style={{ minWidth: 260 }}>
            <div className="muted small">Timezone</div>
            <input
              className="input"
              placeholder="e.g. Asia/Calcutta"
              value={form.timezone}
              onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}
            />
            <div className="muted small" style={{ marginTop: 6 }}>
              Used for daily digest timing.
            </div>
          </div>

          <div style={{ minWidth: 220 }}>
            <div className="muted small">Follow-up default days</div>
            <input
              className="input"
              type="number"
              min={1}
              max={30}
              value={form.followUpDefaultDays}
              onChange={(e) => setForm((f) => ({ ...f, followUpDefaultDays: Number(e.target.value) }))}
            />
            <div className="muted small" style={{ marginTop: 6 }}>
              Used to auto-create follow-up tasks when status becomes Applied.
            </div>
          </div>

          <div style={{ minWidth: 220 }}>
            <div className="muted small">Daily digest time</div>
            <input
              className="input"
              type="time"
              value={form.dailyDigestTime}
              onChange={(e) => setForm((f) => ({ ...f, dailyDigestTime: e.target.value }))}
            />
            <div className="muted small" style={{ marginTop: 6 }}>
              Requires server jobs enabled.
            </div>
          </div>
        </div>

        <div className="divider" />

        <label className="checkrow">
          <input
            type="checkbox"
            checked={form.emailRemindersEnabled}
            onChange={(e) => setForm((f) => ({ ...f, emailRemindersEnabled: e.target.checked }))}
          />
          <span>Email reminders (SendGrid)</span>
        </label>

        <label className="checkrow">
          <input
            type="checkbox"
            checked={form.dailyDigestEnabled}
            onChange={(e) => setForm((f) => ({ ...f, dailyDigestEnabled: e.target.checked }))}
          />
          <span>Daily digest email</span>
        </label>

        <div className="divider" />

        <button
          className="btn btn-primary"
          onClick={async () => {
            setError("");
            setSaved("");
            try {
              await api.updateSettings({
                timezone: form.timezone,
                emailRemindersEnabled: form.emailRemindersEnabled,
                dailyDigestEnabled: form.dailyDigestEnabled,
                dailyDigestTime: form.dailyDigestTime,
                followUpDefaultDays: form.followUpDefaultDays,
              });
              setSaved("Saved.");
              setTimeout(() => setSaved(""), 1500);
            } catch (_e) {
              setError("Failed to save settings.");
            }
          }}
        >
          Save settings
        </button>
      </div>
    </div>
  );
}

