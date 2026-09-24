import type { Epk } from "../types";
import Bio from "./Bio";
import Booking from "./Booking";
import Charts from "./Charts";
import Hero from "./Hero";
import Lede from "./Lede";
import Rule from "./Rule";
import Stats from "./Stats";

export default function EpkPage({ epk }: { epk: Epk }) {
  return (
    <>
      <Hero
        name={epk.name}
        label={epk.label}
        kicker={epk.kicker}
        photo={epk.photo}
        tags={epk.tags}
        platforms={epk.platforms}
      />
      <main>
        <div className="wrap">
          <Lede text={epk.lede} />
          <Rule />
          <Stats stats={epk.stats} />
          <section className="split">
            <Bio short={epk.bio.short} extra={epk.bio.extra} />
            <Charts entries={epk.charts} />
          </section>
          <Booking {...epk.booking} />
        </div>
      </main>
    </>
  );
}
