// URLs from the API end up in href attributes. Only web links get through, never javascript:,
// data: or vbscript:, which would run script in the host page when clicked. Parsing (rather than
// a prefix check) sees the scheme the way the browser will, e.g. through leading spaces or tabs.
export function safeUrl(url: string | null | undefined, base: string = document.baseURI): string | undefined {
  if (!url) return undefined;
  try {
    const { protocol } = new URL(url, base);
    return protocol === "https:" || protocol === "http:" ? url : undefined;
  } catch {
    return undefined;
  }
}

// A plain address only: "?" or "&" would let a mailto: link pre-fill cc, bcc or the body.
export const isEmail = (s: string): boolean => /^[\w.+-]+@[\w-]+(\.[\w-]+)+$/.test(s);
