import type { SVGProps } from "react";

export function T3Wordmark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 96 64" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 54 30 10h11L21 54Z" fill="currentColor" />
      <path d="m36 54 20-44h11L47 54Z" fill="currentColor" />
      <path d="M68 54V34h12v20Z" fill="currentColor" />
    </svg>
  );
}
