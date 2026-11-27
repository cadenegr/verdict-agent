import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App.tsx";
import { applySettings } from "./features/settings/applySettings.ts";
import { loadSettings } from "./features/settings/settingsStorage.ts";
import "./styles/index.css";

// Apply the saved theme and text size before the first render, so the page doesn't flash.
applySettings(loadSettings());

const root = document.getElementById("root");
if (!root) throw new Error("index.html is missing the #root element");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
