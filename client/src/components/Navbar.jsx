import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../auth/useAuth";

export default function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="nav">
      <div className="nav-left">
        <Link to="/applications" className="brand">
          AppTracker
        </Link>
        <NavLink to="/applications" className={({ isActive }) => (isActive ? "active" : "")}>
          Applications
        </NavLink>
        <NavLink to="/companies" className={({ isActive }) => (isActive ? "active" : "")}>
          Companies
        </NavLink>
        <NavLink to="/documents" className={({ isActive }) => (isActive ? "active" : "")}>
          Documents
        </NavLink>
        <NavLink to="/shares" className={({ isActive }) => (isActive ? "active" : "")}>
          Shares
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => (isActive ? "active" : "")}>
          Settings
        </NavLink>
        <NavLink to="/tasks" className={({ isActive }) => (isActive ? "active" : "")}>
          Tasks
        </NavLink>
      </div>
      <div className="nav-right">
        <span className="muted">{user?.email}</span>
        <button
          className="btn"
          onClick={async () => {
            await signOut();
            navigate("/login");
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
