import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { onCLS, onINP, onLCP, onTTFB } from "web-vitals";
import "./index.css";
import App from "./App.jsx";

console.info(`Ultimate Steel v${__APP_VERSION__}`);

// Core Web Vitals reporting
const sendMetric = (m) => console.debug(`[WebVital] ${m.name}: ${m.value.toFixed(1)}`);
onCLS(sendMetric);
onINP(sendMetric);
onLCP(sendMetric);
onTTFB(sendMetric);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
