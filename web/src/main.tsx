import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import { idbGet, idbSet, requestPersist } from "./lib/persist";
import { store } from "./lib/store";
import { ThemeProvider } from "./lib/theme";
import "./index.css";

// Durable progress (#99): mirror every change to IndexedDB and restore it if
// localStorage was cleared. Best-effort; never blocks the app.
store.subscribe(() => {
  void idbSet(store.export());
});
void requestPersist();
void idbGet().then((text) => {
  if (text && localStorage.getItem("stufe-progress-v2") == null) {
    try {
      store.import(text);
    } catch {
      /* ignore corrupt backup */
    }
  } else {
    void idbSet(store.export());
  }
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <HashRouter>
        <App />
      </HashRouter>
    </ThemeProvider>
  </React.StrictMode>,
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}
