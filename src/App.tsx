import { useEffect } from "react";
import Cursor from "./components/Cursor";
import EpkPage from "./components/EpkPage";
import ErrorScreen from "./components/ErrorScreen";
import LoadingScreen from "./components/LoadingScreen";
import ScrollProgress from "./components/ScrollProgress";
import { ToastProvider } from "./components/Toast";
import { useEpk } from "./hooks/useEpk";

interface AppProps {
  artistId: string;
  /** Standalone page only: an embedded widget must not rename the host page. */
  syncDocumentTitle?: boolean;
}

export const MISSING_ARTIST_MESSAGE = 'No artist selected. Add an artist-id, e.g. <artist-epk artist-id="ariovistus">.';

export default function App({ artistId, syncDocumentTitle = false }: AppProps) {
  const { data, error, isPending, isFetching, refetch } = useEpk(artistId);

  useEffect(() => {
    if (syncDocumentTitle && data) document.title = `${data.name} · ${data.kicker}`;
  }, [syncDocumentTitle, data]);

  return (
    <div className="epk">
      <ToastProvider>
        {!artistId ? (
          <ErrorScreen message={MISSING_ARTIST_MESSAGE} />
        ) : isPending ? (
          <LoadingScreen />
        ) : error ? (
          <ErrorScreen message={error.message} onRetry={() => refetch()} retrying={isFetching} />
        ) : (
          <EpkPage epk={data} />
        )}
        <ScrollProgress />
        <Cursor />
      </ToastProvider>
    </div>
  );
}
