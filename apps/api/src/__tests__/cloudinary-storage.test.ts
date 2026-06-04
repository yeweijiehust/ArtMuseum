import { describe, expect, it } from "vitest";
import { resolveCloudinaryCredentials } from "../services/cloudinary-storage.js";

describe("Cloudinary storage configuration", () => {
  it("prefers explicit Cloudinary credentials over a URL", () => {
    expect(
      resolveCloudinaryCredentials({
        cloudinaryUrl: "cloudinary://old-key:old-secret@old-cloud",
        cloudName: " dashboard-cloud ",
        apiKey: " dashboard-key ",
        apiSecret: " dashboard-secret "
      })
    ).toEqual({
      cloudName: "dashboard-cloud",
      apiKey: "dashboard-key",
      apiSecret: "dashboard-secret"
    });
  });

  it("parses a single Cloudinary URL as a fallback", () => {
    expect(
      resolveCloudinaryCredentials({
        cloudinaryUrl: "cloudinary://key:secret%2Fwith%2Fslashes@demo"
      })
    ).toEqual({
      cloudName: "demo",
      apiKey: "key",
      apiSecret: "secret/with/slashes"
    });
  });

  it("rejects incomplete Cloudinary URLs", () => {
    expect(() =>
      resolveCloudinaryCredentials({
        cloudinaryUrl: "cloudinary://key@demo"
      })
    ).toThrow(/api_key/);
  });
});
