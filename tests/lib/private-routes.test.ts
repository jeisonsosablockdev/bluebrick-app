import { describe, expect, it } from "vitest";

import { shouldRedirectToPublicAfterLogout } from "@/lib/navigation/private-routes";

describe("private route navigation helpers", () => {
  it("redirects private post-logout paths to the public surface", () => {
    expect(shouldRedirectToPublicAfterLogout("/admin")).toBe(true);
    expect(shouldRedirectToPublicAfterLogout("/admin/dashboard")).toBe(true);
    expect(shouldRedirectToPublicAfterLogout("/protected")).toBe(true);
    expect(shouldRedirectToPublicAfterLogout("/protected/perfil")).toBe(true);
    expect(shouldRedirectToPublicAfterLogout("/checkout")).toBe(true);
  });

  it("keeps public post-logout paths in place", () => {
    expect(shouldRedirectToPublicAfterLogout("/")).toBe(false);
    expect(shouldRedirectToPublicAfterLogout("/marketplace")).toBe(false);
    expect(shouldRedirectToPublicAfterLogout("/403")).toBe(false);
  });
});
