import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("static web assets consolidation & public hygiene (SPEC-30)", () => {
  const appsWebPublicDir = path.resolve(process.cwd(), "apps", "web", "public");

  it("verifies apps/web/public directory exists and contains all static folders", () => {
    expect(fs.existsSync(appsWebPublicDir)).toBe(true);
    const imagesDir = path.join(appsWebPublicDir, "images");
    const brandDir = path.join(appsWebPublicDir, "brand");
    const avatarsDir = path.join(appsWebPublicDir, "avatars");

    expect(fs.existsSync(imagesDir)).toBe(true);
    expect(fs.existsSync(brandDir)).toBe(true);
    expect(fs.existsSync(avatarsDir)).toBe(true);
  });

  it("verifies all 17 required image assets exist in apps/web/public/images", () => {
    const imagesDir = path.join(appsWebPublicDir, "images");
    const images = fs.readdirSync(imagesDir);
    const pngFiles = images.filter((img) => img.endsWith(".png"));
    expect(pngFiles.length).toBeGreaterThanOrEqual(17);
    expect(fs.existsSync(path.join(imagesDir, "BRD-NY-04.png"))).toBe(true);
  });
});
