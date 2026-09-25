interface ErrorScreenProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retrying?: boolean;
}

export default function ErrorScreen({
  title = "Couldn’t load the press kit",
  message,
  onRetry,
  retrying = false,
}: ErrorScreenProps) {
  return (
    <div className="screen" role="alert">
      <h2>{title}</h2>
      <p>{message}</p>
      {onRetry && (
        <button type="button" className="bio-more" onClick={onRetry} disabled={retrying}>
          {retrying ? "Retrying…" : "Try again"}
        </button>
      )}
    </div>
  );
}
