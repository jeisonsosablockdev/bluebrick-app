import { describe, expect, it } from "vitest";

import {
  applyFinancialRule,
  mapImportRowToFormFields,
  parseTabularText,
  parseTextFileToTabularRows,
  suggestMetadataFromIdentity,
  suggestCollectionFromIdentity
} from "@/lib/admin/asset-form";

describe("lib/admin/asset-form", () => {
  describe("suggestCollectionFromIdentity", () => {
    it("builds collection suggestions from slug and internal code", () => {
      expect(
        suggestCollectionFromIdentity({
          slug: "torre-marina-premium",
          internalCode: "BLD-001"
        })
      ).toEqual({
        collectionName: "BLD-001 Torre Marina Premium",
        collectionSymbol: "BLD001TORR"
      });
    });

    it("returns empty suggestions when slug and internal code are empty", () => {
      expect(
        suggestCollectionFromIdentity({
          slug: "   ",
          internalCode: "   "
        })
      ).toEqual({
        collectionName: "",
        collectionSymbol: ""
      });
    });
  });

  describe("applyFinancialRule", () => {
    it("keeps funding goal fixed and recalculates nft cost when total units changes", () => {
      expect(
        applyFinancialRule({
          fundingGoal: "100000",
          totalUnits: "400",
          nftCost: "",
          source: "totalUnits"
        })
      ).toEqual({
        totalUnits: "400",
        nftCost: "250",
        fundingGoal: "100000"
      });
    });

    it("keeps funding goal fixed and recalculates total units when nft cost changes", () => {
      expect(
        applyFinancialRule({
          fundingGoal: "100000",
          totalUnits: "",
          nftCost: "200",
          source: "nftCost"
        })
      ).toEqual({
        totalUnits: "500",
        nftCost: "200",
        fundingGoal: "100000"
      });
    });

    it("prevents zero-priced NFT by forcing at least cost 1 when total units exceeds funding goal", () => {
      expect(
        applyFinancialRule({
          fundingGoal: "10",
          totalUnits: "100",
          nftCost: "",
          source: "totalUnits"
        })
      ).toEqual({
        totalUnits: "10",
        nftCost: "1",
        fundingGoal: "10"
      });
    });
  });

  describe("suggestMetadataFromIdentity", () => {
    it("builds metadata suggestions from slug and internal code", () => {
      expect(
        suggestMetadataFromIdentity({
          slug: "torre-marina-premium",
          internalCode: "BLD-001"
        })
      ).toEqual({
        metadataBaseName: "BLD-001 Torre Marina Premium #",
        metadataBaseUri: "https://metadata.example.com/torre-marina-premium/"
      });
    });
  });

  describe("parseTabularText", () => {
    it("parses CSV with header row", () => {
      expect(parseTabularText("assetName,slug,internalCode\nTorre A,torre-a,BLD-001\n")).toEqual({
        headers: ["assetName", "slug", "internalCode"],
        rows: [
          {
            assetName: "Torre A",
            internalCode: "BLD-001",
            slug: "torre-a"
          }
        ]
      });
    });

    it("parses TSV from pasted excel cells", () => {
      expect(parseTabularText("assetName\tslug\tinternalCode\nLote 1\tlote-1\tLND-001")).toEqual({
        headers: ["assetName", "slug", "internalCode"],
        rows: [
          {
            assetName: "Lote 1",
            internalCode: "LND-001",
            slug: "lote-1"
          }
        ]
      });
    });
  });

  describe("parseTextFileToTabularRows", () => {
    it("uses csv parser for .csv and .txt files", () => {
      expect(parseTextFileToTabularRows("file.csv", "assetName,slug\nAsset,asset")).toEqual({
        headers: ["assetName", "slug"],
        rows: [{ assetName: "Asset", slug: "asset" }]
      });

      expect(parseTextFileToTabularRows("file.txt", "assetName,slug\nAsset,asset")).toEqual({
        headers: ["assetName", "slug"],
        rows: [{ assetName: "Asset", slug: "asset" }]
      });
    });

    it("throws for unsupported extensions", () => {
      expect(() => parseTextFileToTabularRows("import.xlsx", "binary-content")).toThrow(
        "Unsupported import file extension. Use CSV/TXT or paste from Excel."
      );
    });
  });

  describe("mapImportRowToFormFields", () => {
    it("maps csv aliases used by users into form keys", () => {
      expect(
        mapImportRowToFormFields({
          assetName: "Torre A",
          geoLat: "6.25184",
          geoLong: "-75.56359",
          shortDescription: "Resumen",
          longDescription: "Descripcion larga",
          investmentThesis: "Tesis",
          riskNotes: "Riesgos",
          videoURL: "https://video.example.com/id",
          metadataBaseURI: "https://meta.example.com/torre-a/"
        })
      ).toEqual({
        assetName: "Torre A",
        geoLat: "6.25184",
        geoLng: "-75.56359",
        shortDescription: "Resumen",
        longDescription: "Descripcion larga",
        investmentThesis: "Tesis",
        riskNotes: "Riesgos",
        videoUrl: "https://video.example.com/id",
        metadataBaseUri: "https://meta.example.com/torre-a/"
      });
    });
  });
});
