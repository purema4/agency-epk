export default function LoadingScreen() {
  return (
    <div className="screen" role="status" aria-live="polite" aria-label="Loading press kit">
      <div className="loader" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </div>
      <p>Loading press kit…</p>
    </div>
  );
}
