import * as React from "react";
import * as ReactDOM from "react-dom/client";
import App from "./App";
import "./global.css";

// Ensure Error objects never display as [object Object]
if (!Error.prototype.toString.name?.includes('custom')) {
  const originalToString = Error.prototype.toString;
  Error.prototype.toString = function() {
    return this.message || this.name || 'Unknown error';
  };
  (Error.prototype.toString as any).name = 'customToString';
}

// Comprehensive warning suppression for defaultProps from third-party libraries
const originalWarn = console.warn;
const originalError = console.error;

console.warn = (...args) => {
  // Convert all arguments to strings and check for patterns
  const fullMessage = args.map((arg) => String(arg)).join(" ");

  // Check for various defaultProps warning patterns
  if (
    fullMessage.includes("Support for defaultProps will be removed") ||
    fullMessage.includes("defaultProps will be removed") ||
    fullMessage.includes("Use JavaScript default parameters instead") ||
    (fullMessage.includes("XAxis") && fullMessage.includes("defaultProps")) ||
    (fullMessage.includes("YAxis") && fullMessage.includes("defaultProps")) ||
    fullMessage.includes("XAxis2") ||
    fullMessage.includes("YAxis2") ||
    // Pattern for React's formatted warnings with %s
    (fullMessage.includes("Warning:") && fullMessage.includes("XAxis")) ||
    (fullMessage.includes("Warning:") && fullMessage.includes("YAxis"))
  ) {
    return; // Suppress these warnings
  }
  originalWarn.apply(console, args);
};

console.error = (...args) => {
  // Create a string representation for filtering, but preserve original args for logging
  const fullMessage = args.map((arg) =>
    typeof arg === 'string' ? arg :
    typeof arg === 'object' && arg !== null ? JSON.stringify(arg) :
    String(arg)
  ).join(" ");

  // Also suppress from console.error in case React uses that
  if (
    fullMessage.includes("Support for defaultProps will be removed") ||
    fullMessage.includes("Use JavaScript default parameters instead") ||
    fullMessage.includes("XAxis2") ||
    fullMessage.includes("YAxis2")
  ) {
    return;
  }

  // Pass original args to preserve object details in console
  originalError.apply(console, args);
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
