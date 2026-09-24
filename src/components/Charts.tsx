import type { ChartEntry } from "../types";
import ChartRow from "./ChartRow";

interface ChartsProps {
  entries: ChartEntry[];
  heading?: string;
}

export default function Charts({ entries, heading = "CHARTS TOP 100" }: ChartsProps) {
  return (
    <div className="charts">
      <h2>{heading}</h2>
      <ul className="chart">
        {entries.map((e) => (
          <ChartRow key={e.title} {...e} />
        ))}
      </ul>
    </div>
  );
}
