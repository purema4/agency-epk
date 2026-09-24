import { useInView } from "../hooks/useInView";
import type { StatItem } from "../types";
import Stat from "./Stat";

interface StatsProps {
  stats: StatItem[];
}

export default function Stats({ stats }: StatsProps) {
  const [ref, inView] = useInView<HTMLElement>();
  return (
    <section ref={ref} className="stats" aria-label="Key numbers">
      {stats.map((s) => (
        <Stat key={s.label} value={s.value} label={s.label} animate={inView} />
      ))}
    </section>
  );
}
