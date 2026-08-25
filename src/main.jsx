import React from "react";
import { createRoot } from "react-dom/client";
import LivingTrustFramework from "./LivingTrustFramework.jsx";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LivingTrustFramework />
  </React.StrictMode>
);