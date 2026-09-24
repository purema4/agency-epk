// Standalone page (npm run dev). The GoDaddy embed entry point is src/embed/index.tsx.
import { QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createApiConfig } from "./api/client";
import { ApiProvider } from "./api/context";
import App from "./App";
import { createQueryClient } from "./queryClient";
import "./styles/global.css";
import { getArtistId } from "./utils/artistId";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ApiProvider value={createApiConfig(import.meta.env.VITE_API_URL)}>
      <QueryClientProvider client={createQueryClient()}>
        <App artistId={getArtistId()} syncDocumentTitle />
      </QueryClientProvider>
    </ApiProvider>
  </StrictMode>
);
