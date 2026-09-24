import { useInView } from "../hooks/useInView";

// Orange divider that sweeps in when scrolled into view.
export default function Rule() {
  const [ref, inView] = useInView();
  return <div ref={ref} className={`rule${inView ? " in" : ""}`} data-testid="rule" />;
}
