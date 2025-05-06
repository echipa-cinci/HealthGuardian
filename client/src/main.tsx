import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { registerServiceWorker, initInstallPrompt } from "./lib/pwa";

// Register service worker
registerServiceWorker().catch(error => {
  console.error('Service worker registration failed:', error);
});

// Initialize install prompt listener
initInstallPrompt();

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
