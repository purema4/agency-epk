interface LedeProps {
  text: string;
}

// Intro line; each word lights up on hover.
export default function Lede({ text }: LedeProps) {
  return (
    <p className="lede">
      {text.split(/(\s+)/).map((w, i) =>
        !w || /\s/.test(w) ? w : (
          <span key={i} className="w">
            {w}
          </span>
        )
      )}
    </p>
  );
}
