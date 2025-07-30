import * as React from "react";
import * as ReactDOM from "react-dom/client";
import App from "./App";
import "./global.css";

// Suppress defaultProps warnings from third-party libraries like recharts
const originalWarn = console.warn;
console.warn = (...args) => {
  // Check if this is a defaultProps warning
  const message = args.join(' ');
  if (
    message.includes('Support for defaultProps will be removed') ||
    message.includes('defaultProps will be removed') ||
    (message.includes('XAxis') && message.includes('defaultProps')) ||
    (message.includes('YAxis') && message.includes('defaultProps')) ||
    message.includes('Use JavaScript default parameters instead')
  ) {
    return; // Suppress recharts defaultProps warnings
  }
  originalWarn.apply(console, args);
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
