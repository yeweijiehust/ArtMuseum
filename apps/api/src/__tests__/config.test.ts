import { describe, expect, it } from "vitest";
import { loadConfig } from "../config.js";

describe("configuration", () => {
  it("accepts Cloudinary cloud name, API key, and API secret", () => {
    const config = loadConfig({
      nodeEnv: "test",
      dataStore: "memory",
      storageDriver: "cloudinary",
      jwtSecret: "test-jwt-secret-test-jwt-secret",
      cookieSecret: "test-cookie-secret-test-cookie-secret",
      cloudinaryCloudName: "demo",
      cloudinaryApiKey: "key",
      cloudinaryApiSecret: "secret"
    });
    expect(config.cloudinaryCloudName).toBe("demo");
    expect(config.cloudinaryApiKey).toBe("key");
    expect(config.cloudinaryApiSecret).toBe("secret");
  });

  it("still accepts a single Cloudinary URL", () => {
    const config = loadConfig({
      nodeEnv: "test",
      dataStore: "memory",
      storageDriver: "cloudinary",
      jwtSecret: "test-jwt-secret-test-jwt-secret",
      cookieSecret: "test-cookie-secret-test-cookie-secret",
      cloudinaryUrl: "cloudinary://key:secret@demo"
    });
    expect(config.cloudinaryUrl).toBe("cloudinary://key:secret@demo");
  });

  it("requires Cloudinary credentials when the real storage driver is enabled", () => {
    expect(() =>
      loadConfig({
        nodeEnv: "test",
        dataStore: "memory",
        storageDriver: "cloudinary",
        jwtSecret: "test-jwt-secret-test-jwt-secret",
        cookieSecret: "test-cookie-secret-test-cookie-secret"
      })
    ).toThrow(/CLOUDINARY_URL/);
  });
});
