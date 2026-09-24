import { useId, useState } from "react";
import type { BioContent } from "../types";

export default function Bio({ short, extra }: BioContent) {
  const [open, setOpen] = useState(false);
  const extraId = useId();
  return (
    <div className="bio">
      <h2>BIO</h2>
      <p>{short}</p>
      {extra && (
        <>
          <div className={`bio-extra${open ? " open" : ""}`} id={extraId} aria-hidden={!open}>
            <div>
              <p>{extra}</p>
            </div>
          </div>
          <button
            type="button"
            className="bio-more"
            aria-expanded={open}
            aria-controls={extraId}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? "Show less" : "Read full bio"}
          </button>
        </>
      )}
    </div>
  );
}
