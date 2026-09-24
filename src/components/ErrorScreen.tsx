interface ErrorScreenProps {
  message: string;
  onRetry?: () => void;
  retrying?: boolean;
}

export default function ErrorScreen({ message, onRetry, retrying = false }: ErrorScreenProps) {
  return (
    <div className="screen" role="alert">
      <h2>Couldn’t load the press kit</h2>
      <p>{message}</p>
      {onRetry && (
        <button type="button" className="bio-more" onClick={onRetry} disabled={retrying}>
          {retrying ? "Retrying…" : "Try again"}
        </button>
      )}
    </div>
  );
}
