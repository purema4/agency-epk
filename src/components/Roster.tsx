import { useRoster } from "../hooks/useRoster";
import type { RosterArtist } from "../types";
import { safeUrl } from "../utils/safeUrl";
import ErrorScreen from "./ErrorScreen";
import LoadingScreen from "./LoadingScreen";

interface RosterProps {
  /** Where a tile links to, with {id} replaced by the artist id, e.g. "/epk?artist={id}". No links when unset. */
  hrefTemplate?: string | null;
}

export const artistHref = (template: string | null | undefined, id: string) =>
  (template && safeUrl(template.replaceAll("{id}", encodeURIComponent(id)))) || null;

export default function Roster({ hrefTemplate }: RosterProps) {
  const { data, error, isPending, isFetching, refetch } = useRoster();

  return (
    <div className="roster">
      {isPending ? (
        <LoadingScreen label="Loading artists" />
      ) : error ? (
        <ErrorScreen
          title="Couldn’t load the artists"
          message={error.message}
          onRetry={() => refetch()}
          retrying={isFetching}
        />
      ) : data.artists.length === 0 ? (
        <p className="roster-empty">No artists yet.</p>
      ) : (
        <ul className="mosaic" aria-label="Artists">
          {data.artists.map((artist, i) => (
            <li key={artist.id} style={{ "--i": i }}>
              <RosterTile artist={artist} href={artistHref(hrefTemplate, artist.id)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RosterTile({ artist, href }: { artist: RosterArtist; href: string | null }) {
  // On a link, the name alone names the tile; the photo description would only repeat it.
  const body = (
    <>
      <img src={artist.photo.src} alt={href ? "" : artist.photo.alt} loading="lazy" decoding="async" />
      <span className="tile-name">{artist.name}</span>
    </>
  );
  // _top: inside GoDaddy's iframe, open the artist page in the whole window, not the frame.
  return href ? (
    <a className="tile" href={href} target="_top">
      {body}
    </a>
  ) : (
    <div className="tile">{body}</div>
  );
}
