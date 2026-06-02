import { describe, expect, it } from "vitest";

import {
  getMplCoreAssetCollection,
  getMplCoreAssetOwner,
  hasOwnerFreezeDelegatePlugin
} from "@/lib/mpl-core-freeze-delegate";

describe("lib/mpl-core-freeze-delegate", () => {
  it("accepts MPL Core FreezeDelegate only when authority is Owner", () => {
    expect(hasOwnerFreezeDelegatePlugin({
      freezeDelegate: {
        frozen: false,
        authority: {
          type: "Owner"
        }
      }
    })).toBe(true);

    expect(hasOwnerFreezeDelegatePlugin({
      freezeDelegate: {
        frozen: false,
        authority: {
          type: "Address",
          address: "Delegate1111111111111111111111111111111111"
        }
      }
    })).toBe(false);

    expect(hasOwnerFreezeDelegatePlugin({
      permanentFreezeDelegate: {
        frozen: false,
        authority: {
          type: "UpdateAuthority"
        }
      }
    })).toBe(false);
  });

  it("supports generated enum shapes returned by MPL Core account fetches", () => {
    expect(hasOwnerFreezeDelegatePlugin({
      freezeDelegate: {
        frozen: false,
        authority: {
          __kind: "Owner"
        }
      }
    })).toBe(true);
  });

  it("extracts owner and collection from MPL Core asset account shapes", () => {
    expect(getMplCoreAssetOwner({
      owner: "Owner111111111111111111111111111111111111"
    })).toBe("Owner111111111111111111111111111111111111");

    expect(getMplCoreAssetCollection({
      updateAuthority: {
        __kind: "Collection",
        fields: ["Collection1111111111111111111111111111111"]
      }
    })).toBe("Collection1111111111111111111111111111111");
  });
});
