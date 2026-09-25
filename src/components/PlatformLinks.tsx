import type { Platform } from "../types";
import { safeUrl } from "../utils/safeUrl";

interface PlatformLinksProps {
  platforms: Platform[];
}

export default function PlatformLinks({ platforms }: PlatformLinksProps) {
  return (
    <nav className="platforms" aria-label="Listen and follow">
      {platforms.map(({ name, url }) => {
        const href = safeUrl(url);
        return (
          href && (
            <a key={name} href={href} target="_blank" rel="noopener noreferrer">
              {name}
            </a>
          )
        );
      })}
    </nav>
  );
}
