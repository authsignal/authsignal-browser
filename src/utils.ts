export function browserSupportsDigitalCredential(): boolean {
  if (typeof window !== "undefined" && "DigitalCredential" in window) {
    return typeof window.DigitalCredential === "function";
  }

  return false;
}
