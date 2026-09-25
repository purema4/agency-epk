export interface Photo {
  src: string;
  alt: string;
}

export interface Platform {
  name: string;
  url: string;
}

export interface StatItem {
  value: string;
  label: string;
}

export interface BioContent {
  short: string;
  extra?: string;
}

export interface ChartEntry {
  title: string;
  label: string;
  position: string;
  /** Spotify track; the row links to it when set. */
  url?: string;
}

export interface BookingInfo {
  /** Optional name line shown above the email. */
  contact?: string;
  email: string;
  agencyUrl: string;
  agencyLabel: string;
}

export interface Epk {
  name: string;
  label: string;
  kicker: string;
  photo: Photo;
  tags: string[];
  platforms: Platform[];
  lede: string;
  stats: StatItem[];
  bio: BioContent;
  charts: ChartEntry[];
  booking: BookingInfo;
  /** "#rrggbb" from the CRM; replaces the default orange accent when set. */
  accentColor?: string;
}

/** One tile of the <artist-roster> mosaic. `id` is the artist-id of that artist's <artist-epk>. */
export interface RosterArtist {
  id: string;
  name: string;
  photo: Photo;
}

export interface Roster {
  artists: RosterArtist[];
}
