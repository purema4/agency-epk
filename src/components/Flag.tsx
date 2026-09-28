import { useState, type CSSProperties } from "react";

// SVG flags from the flag-icons package: emoji flags don't render on Windows (it shows "CA").
const FLAG_URL = "https://cdn.jsdelivr.net/npm/flag-icons@7.5.0/flags/4x3/";

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

/** "CA" -> "Canada"; undefined for anything that isn't a two-letter country code. */
export function countryName(code: string | undefined): string | undefined {
  if (!code || !/^[a-z]{2}$/i.test(code)) return undefined;
  try {
    return regionNames.of(code.toUpperCase());
  } catch {
    return undefined;
  }
}

interface FlagProps {
  /** ISO 3166 country code from the CRM, e.g. "CA". Nothing is shown when it's missing or invalid. */
  country?: string;
  className?: string;
  style?: CSSProperties;
}

export default function Flag({ country, className, style }: FlagProps) {
  const [failed, setFailed] = useState(false);
  const name = countryName(country);
  if (!name || failed) return null;

  return (
    <img
      className={className ? `flag ${className}` : "flag"}
      src={`${FLAG_URL}${country!.toLowerCase()}.svg`}
      alt={name}
      title={name}
      style={style}
      width={4}
      height={3}
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
