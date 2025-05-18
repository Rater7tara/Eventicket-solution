import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { RouterProvider, useLocation } from "react-router-dom";
import { router } from "./routes/Routes.jsx";
import React from "react";
import AuthProvider from "./providers/AuthProvider.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <div className="max-w-screen-2xl mx-auto bg-base-100">
        <RouterProvider router={router} />
      </div>
    </AuthProvider>
  </React.StrictMode>
);
