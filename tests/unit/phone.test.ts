import { describe, expect, it } from "vitest";
import { normalizeKenyaPhone } from "@/lib/phone";

describe("normalizeKenyaPhone", () => {
  it("accepts 0-prefixed, 254-prefixed, +254-prefixed and bare 9-digit numbers", () => {
    expect(normalizeKenyaPhone("0712345678")).toBe("712345678");
    expect(normalizeKenyaPhone("254712345678")).toBe("712345678");
    expect(normalizeKenyaPhone("+254712345678")).toBe("712345678");
    expect(normalizeKenyaPhone("712345678")).toBe("712345678");
    expect(normalizeKenyaPhone("0112345678")).toBe("112345678");
  });

  it("strips spaces and dashes", () => {
    expect(normalizeKenyaPhone("0712 345 678")).toBe("712345678");
    expect(normalizeKenyaPhone("+254-712-345-678")).toBe("712345678");
  });

  it("rejects numbers that aren't a valid Kenyan mobile local part", () => {
    expect(normalizeKenyaPhone("0212345678")).toBeNull(); // landline prefix
    expect(normalizeKenyaPhone("12345")).toBeNull(); // too short
    expect(normalizeKenyaPhone("not a phone")).toBeNull();
  });
});
