import {describe, expect, it} from "vitest";

import {buildHeaders} from "../src/api/helpers";

describe("buildHeaders", () => {
  it("builds browser-safe headers without custom SDK metadata headers", () => {
    const headers = buildHeaders({tenantId: "tenant-id"});

    expect(headers).toEqual({
      "Content-Type": "application/json",
      Authorization: `Basic ${window.btoa(encodeURIComponent("tenant-id"))}`,
    });
    expect(Object.keys(headers).some((header) => header.toLowerCase().startsWith("x-authsignal-"))).toBe(false);
  });

  it("uses bearer authorization when a token is provided", () => {
    expect(buildHeaders({tenantId: "tenant-id", token: "token"})).toEqual({
      "Content-Type": "application/json",
      Authorization: "Bearer token",
    });
  });
});
