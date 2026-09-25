export default function LoadingScreen({ label = "Loading press kit" }: { label?: string }) {
  return (
    <div className="screen" role="status" aria-live="polite" aria-label={label}>
      <div className="loader" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </div>
      <p>{label}…</p>
    </div>
  );
}
