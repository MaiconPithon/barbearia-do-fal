import { describe, expect, it } from "vitest";
import { isHomeTextHidden } from "@/lib/homeVisibility";

describe("Home text visibility setting", () => {
  it("defaults to visible when the setting is absent", () => {
    expect(isHomeTextHidden(undefined)).toBe(false);
    expect(isHomeTextHidden(null)).toBe(false);
  });
  it("hides Home text only when enabled", () => {
    expect(isHomeTextHidden("true")).toBe(true);
  });
  it("restores Home text when disabled", () => {
    expect(isHomeTextHidden("false")).toBe(false);
  });
});