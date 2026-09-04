/**
 * @file tests/unit/drive-folder-detection.test.ts
 * @description Layer 3 Domain & Layer 4 Adapter Unit Test Suite for Google Drive Folder Detection & Extraction.
 *
 * Requirements tested per SPEC-1:
 *  - @spec BBC-8-SPEC-1-FOLDER-EXTRACTION: Extracts valid Google Drive folder IDs from multiple URL formats and raw IDs.
 *  - @spec BBC-8-SPEC-1-CANONICAL-SCHEMA: CanonicalProjectPhaseSchema validates and preserves folderUrl.
 *  - @spec BBC-8-SPEC-1-SPREADSHEET-PARSER: StreamingSpreadsheetAdapter identifies Drive folder in imagen_url_1 and populates folderUrl.
 */

import { describe, it, expect } from "vitest";
import * as XLSX from "xlsx";
import {
  extractDriveFolderId,
  isDriveFolderReference,
} from "@/features/ai-ingestion/domain/utils/drive-folder-utils";
import {
  CanonicalProjectPhaseSchema,
} from "@/features/ai-ingestion/domain/schemas/canonical-dashboard-schema";
import { StreamingSpreadsheetAdapter } from "@/features/ai-ingestion/infrastructure/streaming-spreadsheet-adapter";

describe("BBC-8 SPEC-1: Google Drive Folder Detection & Extraction", () => {
  describe("extractDriveFolderId() & isDriveFolderReference() (@spec BBC-8-SPEC-1-FOLDER-EXTRACTION)", () => {
    it("should extract folder ID from standard Google Drive folder URLs", () => {
      const url = "https://drive.google.com/drive/folders/1ABC_xyz-1234567890abcdefghijkl";
      expect(extractDriveFolderId(url)).toBe("1ABC_xyz-1234567890abcdefghijkl");
      expect(isDriveFolderReference(url)).toBe(true);
    });

    it("should extract folder ID from URLs containing user index path (/drive/u/0/folders/)", () => {
      const url = "https://drive.google.com/drive/u/1/folders/1ABC_xyz-1234567890abcdefghijkl";
      expect(extractDriveFolderId(url)).toBe("1ABC_xyz-1234567890abcdefghijkl");
      expect(isDriveFolderReference(url)).toBe(true);
    });

    it("should extract folder ID from URLs with sharing query parameters (?usp=sharing&usp=drive_link)", () => {
      const url = "https://drive.google.com/drive/folders/1ABC_xyz-1234567890abcdefghijkl?usp=sharing&authuser=0";
      expect(extractDriveFolderId(url)).toBe("1ABC_xyz-1234567890abcdefghijkl");
      expect(isDriveFolderReference(url)).toBe(true);
    });

    it("should extract folder ID from open?id= Google Drive links", () => {
      const url = "https://drive.google.com/open?id=1ABC_xyz-1234567890abcdefghijkl";
      expect(extractDriveFolderId(url)).toBe("1ABC_xyz-1234567890abcdefghijkl");
      expect(isDriveFolderReference(url)).toBe(true);
    });

    it("should accept raw alphanumeric Google Drive folder IDs", () => {
      const rawId = "1ABC_xyz-1234567890abcdefghijkl";
      expect(extractDriveFolderId(rawId)).toBe("1ABC_xyz-1234567890abcdefghijkl");
      expect(isDriveFolderReference(rawId)).toBe(true);
    });

    it("should return null for direct image URLs (e.g. Unsplash, Cloudinary, standard CDN)", () => {
      const imgUrl = "https://images.unsplash.com/photo-1541888946425-d0fbb18086f6";
      expect(extractDriveFolderId(imgUrl)).toBeNull();
      expect(isDriveFolderReference(imgUrl)).toBe(false);
    });

    it("should return null for Google Drive single file links (not folders)", () => {
      const fileUrl = "https://drive.google.com/file/d/1ABC_xyz-1234567890abcdefghijkl/view";
      expect(extractDriveFolderId(fileUrl)).toBeNull();
      expect(isDriveFolderReference(fileUrl)).toBe(false);
    });

    it("should handle formula-sanitized strings safely (stripping single quote prefix)", () => {
      const sanitized = "'https://drive.google.com/drive/folders/1ABC_xyz-1234567890abcdefghijkl";
      expect(extractDriveFolderId(sanitized)).toBe("1ABC_xyz-1234567890abcdefghijkl");
      expect(isDriveFolderReference(sanitized)).toBe(true);
    });

    it("should return null for empty, whitespace, or invalid inputs", () => {
      expect(extractDriveFolderId("")).toBeNull();
      expect(extractDriveFolderId("   ")).toBeNull();
      expect(extractDriveFolderId(null)).toBeNull();
      expect(extractDriveFolderId(undefined)).toBeNull();
      expect(extractDriveFolderId("shortId")).toBeNull();
    });
  });

  describe("CanonicalProjectPhaseSchema (@spec BBC-8-SPEC-1-CANONICAL-SCHEMA)", () => {
    it("should validate and preserve folderUrl when provided", () => {
      const input = {
        idFase: "FASE-0001",
        idInversion: "BG-01",
        orden: 1,
        nombreFase: "1. Adquisición y Cierre",
        estado: "Completada" as const,
        folderUrl: "https://drive.google.com/drive/folders/1ABC_xyz-1234567890abcdefghijkl",
        imagenes: ["https://blob.vercel-storage.com/photo1.jpg"],
      };

      const parsed = CanonicalProjectPhaseSchema.parse(input);
      expect(parsed.folderUrl).toBe("https://drive.google.com/drive/folders/1ABC_xyz-1234567890abcdefghijkl");
      expect(parsed.imagenes).toEqual(["https://blob.vercel-storage.com/photo1.jpg"]);
    });

    it("should allow folderUrl to be null or omitted without validation error", () => {
      const input = {
        idFase: "FASE-0002",
        idInversion: "BG-01",
        orden: 2,
        nombreFase: "2. Demolición",
        estado: "En curso" as const,
        imagenes: [],
      };

      const parsed = CanonicalProjectPhaseSchema.parse(input);
      expect(parsed.folderUrl).toBeUndefined();
    });
  });

  describe("StreamingSpreadsheetAdapter parseFasesSheet (@spec BBC-8-SPEC-1-SPREADSHEET-PARSER)", () => {
    it("should extract folderUrl and keep imagenes clean when imagen_url_1 contains a Drive folder", async () => {
      const adapter = new StreamingSpreadsheetAdapter();
      const wb = XLSX.utils.book_new();

      const wsData = [
        ["id_fase", "id_inversion", "orden", "nombre_fase", "estado", "fecha_inicio", "fecha_fin", "imagen_url_1", "imagen_url_2", "imagen_url_3"],
        [
          "FASE-0001",
          "BG-01",
          1,
          "1. Adquisición",
          "Completada",
          44562,
          44600,
          "https://drive.google.com/drive/folders/1ABC_xyz-1234567890abcdefghijkl",
          null,
          null,
        ],
      ];

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      XLSX.utils.book_append_sheet(wb, ws, "Fases_Proyecto");
      const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

      const result = await adapter.parseDashboardWorkbook(buffer, "test.xlsx");
      const phase = result.fases[0];

      expect(phase).toBeDefined();
      expect(phase.idFase).toBe("FASE-0001");
      expect(phase.folderUrl).toBe("https://drive.google.com/drive/folders/1ABC_xyz-1234567890abcdefghijkl");
      // Invariant: The Drive folder link must NOT be passed as a direct image URL into imagenes
      expect(phase.imagenes).toEqual([]);
    });

    it("should populate imagenes array normally when cells contain standard direct image URLs", async () => {
      const adapter = new StreamingSpreadsheetAdapter();
      const wb = XLSX.utils.book_new();

      const wsData = [
        ["id_fase", "id_inversion", "orden", "nombre_fase", "estado", "fecha_inicio", "fecha_fin", "imagen_url_1", "imagen_url_2", "imagen_url_3"],
        [
          "FASE-0002",
          "BG-01",
          2,
          "2. Estructura",
          "En curso",
          44601,
          44650,
          "https://images.unsplash.com/photo-1541888946425-d0fbb18086f6",
          "https://images.unsplash.com/photo-1503387762-592deb58ef4e",
          null,
        ],
      ];

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      XLSX.utils.book_append_sheet(wb, ws, "Fases_Proyecto");
      const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

      const result = await adapter.parseDashboardWorkbook(buffer, "test.xlsx");
      const phase = result.fases[0];

      expect(phase).toBeDefined();
      expect(phase.idFase).toBe("FASE-0002");
      expect(phase.folderUrl).toBeUndefined();
      expect(phase.imagenes).toEqual([
        "https://images.unsplash.com/photo-1541888946425-d0fbb18086f6",
        "https://images.unsplash.com/photo-1503387762-592deb58ef4e",
      ]);
    });
  });
});
