import type { ChartEntry } from "../types";

// Only real web links: the URL comes from the CRM and must never become a javascript: link.
const isWebUrl = (url?: string): url is string => !!url && /^https?:\/\//i.test(url);

export default function ChartRow({ title, label, position, url }: ChartEntry) {
  const linked = isWebUrl(url);
  return (
    // A linked row is reached through its link, so the row itself isn't a separate tab stop.
    <li tabIndex={linked ? undefined : 0} className={linked ? "linked" : undefined}>
      {linked && (
        <a className="row-link" href={url} target="_blank" rel="noopener noreferrer" aria-label={`${title} on Spotify`} />
      )}
      <span className="t">
        <span className="eq" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span>{title}</span>
      </span>
      <span>{label}</span>
      <span className="pos">{position}</span>
    </li>
  );
}
