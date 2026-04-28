import { describe, expect, it } from "vitest";

import {
  AdminCollectionLocationFormError,
  normalizeAdminCollectionCountryCode,
  normalizeAdminCollectionLocationForm,
  normalizeAdminCollectionStateProvince
} from "@/lib/admin/admin-collection-location-form";

describe("lib/admin/admin-collection-location-form", () => {
  describe("normalizeAdminCollectionCountryCode", () => {
    it("accepts ISO-2 country codes and uppercases them canonically", () => {
      expect(normalizeAdminCollectionCountryCode("co")).toBe("CO");
      expect(normalizeAdminCollectionCountryCode("US")).toBe("US");
    });

    it("maps deterministic localized country names to ISO-2", () => {
      expect(normalizeAdminCollectionCountryCode("Colombia")).toBe("CO");
      expect(normalizeAdminCollectionCountryCode("Colômbia")).toBe("CO");
      expect(normalizeAdminCollectionCountryCode("Estados Unidos")).toBe("US");
    });

    it("rejects unsupported ambiguous countries", () => {
      expect(() => normalizeAdminCollectionCountryCode("Latam")).toThrow(
        AdminCollectionLocationFormError
      );
    });
  });

  describe("normalizeAdminCollectionStateProvince", () => {
    it("preserves visible business text for stateProvince", () => {
      expect(normalizeAdminCollectionStateProvince("CO", "Antioquia")).toBe("Antioquia");
    });

    it("maps division codes to visible division names when deterministic", () => {
      expect(normalizeAdminCollectionStateProvince("CO", "ANT")).toBe("Antioquia");
      expect(normalizeAdminCollectionStateProvince("US", "CA")).toBe("California");
    });
  });

  describe("normalizeAdminCollectionLocationForm", () => {
    it("normalizes the canonical location form shape", () => {
      expect(
        normalizeAdminCollectionLocationForm({
          country: "Colombia",
          stateProvince: "ANT",
          city: " Medellin ",
          address: " Carrera 43A #1-50 ",
          geoLat: "6.25184",
          geoLng: -75.56359
        })
      ).toEqual({
        country: "CO",
        stateProvince: "Antioquia",
        city: "Medellin",
        address: "Carrera 43A #1-50",
        geoLat: 6.25184,
        geoLng: -75.56359
      });
    });

    it("allows optional coordinates and stateProvince to stay null", () => {
      expect(
        normalizeAdminCollectionLocationForm({
          country: "US",
          city: "Miami",
          address: "Brickell Avenue",
          stateProvince: "   ",
          geoLat: "",
          geoLng: undefined
        })
      ).toEqual({
        country: "US",
        stateProvince: null,
        city: "Miami",
        address: "Brickell Avenue",
        geoLat: null,
        geoLng: null
      });
    });

    it("rejects invalid coordinate ranges", () => {
      expect(() =>
        normalizeAdminCollectionLocationForm({
          country: "CO",
          city: "Bogota",
          address: "Carrera 7",
          geoLat: "91",
          geoLng: "-74.07"
        })
      ).toThrow("geoLat must be between -90 and 90.");
    });

    it("rejects non-decimal coordinates", () => {
      expect(() =>
        normalizeAdminCollectionLocationForm({
          country: "CO",
          city: "Bogota",
          address: "Carrera 7",
          geoLat: "north",
          geoLng: "-74.07"
        })
      ).toThrow("geoLat must be a valid decimal number.");
    });

    it("rejects missing city or address", () => {
      expect(() =>
        normalizeAdminCollectionLocationForm({
          country: "CO",
          city: "   ",
          address: "Carrera 7"
        })
      ).toThrow("city is required.");

      expect(() =>
        normalizeAdminCollectionLocationForm({
          country: "CO",
          city: "Bogota",
          address: "   "
        })
      ).toThrow("address is required.");
    });
  });
});
