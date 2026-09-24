import type { ChartEntry } from "../types";

export default function ChartRow({ title, label, position }: ChartEntry) {
  return (
    <li tabIndex={0}>
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
