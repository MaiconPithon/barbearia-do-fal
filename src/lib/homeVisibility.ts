/** Missing settings preserve the default visible Home branding. */
export function isHomeTextHidden(value?: string | null): boolean {
  return value === "true";
}