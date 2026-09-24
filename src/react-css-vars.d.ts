import "react";

// Allow CSS custom properties like "--i" in inline style objects.
declare module "react" {
  interface CSSProperties {
    [key: `--${string}`]: string | number | undefined;
  }
}
