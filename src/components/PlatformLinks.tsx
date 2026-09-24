import type { Platform } from "../types";

interface PlatformLinksProps {
  platforms: Platform[];
}

export default function PlatformLinks({ platforms }: PlatformLinksProps) {
  return (
    <nav className="platforms" aria-label="Listen and follow">
      {platforms.map(({ name, url }) => (
        <a key={name} href={url} target="_blank" rel="noopener noreferrer">
          {name}
        </a>
      ))}
    </nav>
  );
}
