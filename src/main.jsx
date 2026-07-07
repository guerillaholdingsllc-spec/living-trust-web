import React from "react";
import { createRoot } from "react-dom/client";
import LivingTrustFramework from "./LivingTrustFramework.jsx";
import GlocksFriedChicken from "./GlocksFriedChicken.jsx";
import "./styles.css";

const path = window.location.pathname.toLowerCase();
const App = path === "/gafc" || path.endsWith("/gafc/") ? GlocksFriedChicken : LivingTrustFramework;

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
