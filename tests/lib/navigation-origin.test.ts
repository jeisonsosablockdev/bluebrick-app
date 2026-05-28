import { describe, expect, it } from "vitest";

import {
  clearNavigationOrigin,
  getNavigationOrigin,
  recordNavigationOriginFromClick
} from "@/components/motion/navigation-origin";

describe("components/motion/navigation-origin", () => {
  it("records the center point for primary navigation clicks", () => {
    clearNavigationOrigin();

    const target = {
      getBoundingClientRect: () => ({
        left: 20,
        top: 32,
        width: 120,
        height: 44
      })
    } as HTMLAnchorElement;

    recordNavigationOriginFromClick(
      {
        currentTarget: target,
        defaultPrevented: false,
        button: 0,
        metaKey: false,
        ctrlKey: false,
        shiftKey: false,
        altKey: false
      } as never,
      "/marketplace"
    );

    expect(getNavigationOrigin()).toMatchObject({
      x: 80,
      y: 54
    });
  });

  it("ignores non-primary hrefs and modifier clicks", () => {
    clearNavigationOrigin();

    const target = {
      getBoundingClientRect: () => ({
        left: 0,
        top: 0,
        width: 100,
        height: 40
      })
    } as HTMLAnchorElement;

    recordNavigationOriginFromClick(
      {
        currentTarget: target,
        defaultPrevented: false,
        button: 0,
        metaKey: true,
        ctrlKey: false,
        shiftKey: false,
        altKey: false
      } as never,
      "/marketplace"
    );

    expect(getNavigationOrigin()).toBeNull();

    recordNavigationOriginFromClick(
      {
        currentTarget: target,
        defaultPrevented: false,
        button: 0,
        metaKey: false,
        ctrlKey: false,
        shiftKey: false,
        altKey: false
      } as never,
      "/docs"
    );

    expect(getNavigationOrigin()).toBeNull();
  });
});
