import heroPhoto from "../assets/hero.jpg";
import type { Epk } from "../types";

// Sample CRM record served by the mock API (see handlers.ts).
export const ariovistus: Epk = {
  name: "ARIOVISTUS",
  label: "BERLIN RECORDS",
  kicker: "TALENT - EPK - 2026",
  photo: {
    src: heroPhoto,
    alt: "ARIOVISTUS behind the decks, lit by a cyan neon ring",
  },
  tags: ["PEAK TECHNO", "DRIVEN", "MELODIC"],
  platforms: [
    { name: "Spotify", url: "#" },
    { name: "Beatport", url: "#" },
    { name: "SoundCloud", url: "#" },
    { name: "YouTube", url: "#" },
    { name: "Instagram", url: "#" },
  ],
  lede: "ARIOVISTUS co-founded Berlin Records and built OUTKZT into a global, nomadic techno movement rooted in freedom over comfort.",
  stats: [
    { value: "8K", label: "Spotify monthly listeners (P)" },
    { value: "9,7K", label: "Instagram followers" },
    { value: "30+", label: "Performances a year" },
    { value: "XX", label: "xxxxxx xxxxx" },
    { value: "XXXk", label: "Total Stream" },
  ],
  bio: {
    short:
      "Born in Montreal in the early 1990s, ARIOVISTUS came of age as music shifted from analog to digital and techno and trance broke into the mainstream. Raised on a soundscape spanning Linkin Park, Daft Punk, Martin Garrix, and Illenium, he didn't pick up production and DJing until his late twenties, but once techno found him, it stuck.",
    extra:
      "Add a longer bio here: labels, key gigs, residencies, and what a set feels like on the floor.",
  },
  charts: [
    { title: "Red light", label: "Replicate", position: "xTH" },
    { title: "I LOVE YOU", label: "Animarum", position: "xTH" },
    { title: "WHERE ARE YOU", label: "Berlin records", position: "xTH" },
  ],
  booking: {
    email: "bookings@berlinrecords.world",
    agencyUrl: "https://berlinrecords.info/agency",
    agencyLabel: "BERLINRECORDS.INFO/AGENCY",
  },
};
