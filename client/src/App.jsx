import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { useAuth } from "./auth/useAuth";
import Navbar from "./components/Navbar";
import LoginPage from "./pages/LoginPage";
import ApplicationsPage from "./pages/ApplicationsPage";
import ApplicationDetailPage from "./pages/ApplicationDetailPage";
import TasksPage from "./pages/TasksPage";
import CompaniesPage from "./pages/CompaniesPage";

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="container">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const { user } = useAuth();

  return (
    <div>
      {user ? <Navbar /> : null}
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/applications"
          element={
            <Protected>
              <ApplicationsPage />
            </Protected>
          }
        />
        <Route
          path="/applications/:id"
          element={
            <Protected>
              <ApplicationDetailPage />
            </Protected>
          }
        />
        <Route
          path="/tasks"
          element={
            <Protected>
              <TasksPage />
            </Protected>
          }
        />
        <Route
          path="/companies"
          element={
            <Protected>
              <CompaniesPage />
            </Protected>
          }
        />
        <Route path="*" element={<Navigate to={user ? "/applications" : "/login"} replace />} />
      </Routes>
    </div>
  );
}
