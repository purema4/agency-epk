import { useRef } from "react";
import type { BookingInfo } from "../types";
import { isEmail, safeUrl } from "../utils/safeUrl";
import { useToast } from "./Toast";

export default function Booking({ contact, email, agencyUrl, agencyLabel }: BookingInfo) {
  const toast = useToast();
  const mailRef = useRef<HTMLAnchorElement>(null);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      toast("Email copied");
    } catch {
      // Clipboard blocked: select the address so the user can copy it by hand.
      const sel = window.getSelection();
      if (!mailRef.current || !sel) return;
      const range = document.createRange();
      range.selectNodeContents(mailRef.current);
      sel.removeAllRanges();
      sel.addRange(range);
      toast("Email selected, press Ctrl+C to copy");
    }
  };

  return (
    <footer className="booking">
      <div>
        {contact && <div>{contact}</div>}
        {/* Without a valid address it stays plain text (still copyable). */}
        <a ref={mailRef} href={isEmail(email) ? `mailto:${email}` : undefined}>
          {email.toUpperCase()}
        </a>
        <br />
        <button type="button" className="copy" onClick={copy}>
          Copy email
        </button>
      </div>
      <a href={safeUrl(agencyUrl)} target="_blank" rel="noopener noreferrer">
        {agencyLabel}
      </a>
    </footer>
  );
}
