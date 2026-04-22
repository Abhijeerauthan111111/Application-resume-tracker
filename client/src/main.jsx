import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import { AuthProvider } from "./auth/AuthProvider";
import AuthBootstrap from "./components/AuthBootstrap";
import App from "./App";
import "./styles/app.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AuthBootstrap>
          <App />
        </AuthBootstrap>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
