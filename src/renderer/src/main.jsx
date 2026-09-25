import React from "react";
import { createRoot } from "react-dom/client";
import { installWebApiIfNeeded } from "./lib/webApi.js";
import App from "./App.jsx";
import "./styles.css";

// Outside Electron (e.g. the web demo) there is no preload bridge — use the browser store.
installWebApiIfNeeded();

createRoot(document.getElementById("root")).render(<App />);
