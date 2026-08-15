import { NextRequest, NextResponse } from "next/server";

import { getRequestRole } from "@/lib/auth-session";
import { buildPdfImportFingerprint } from "@/lib/admin/asset-import-fingerprint";
import { AssetPdfBriefError } from "@/lib/admin/asset-pdf-brief";
import { parseInvestmentBriefPdfBuffer } from "@/lib/admin/asset-pdf-server";

export const runtime = "nodejs";

function errorResponse(status: number, code: string, message: string): NextResponse {
  return NextResponse.json(
    {
      error: {
        code,
        message
      }
    },
    { status }
  );
}

function isPdfFileName(fileName: string): boolean {
  return fileName.toLowerCase().endsWith(".pdf");
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const roleResult = getRequestRole(request);

  if (!roleResult.authenticated || roleResult.role !== "admin" || !roleResult.pubkey) {
    return errorResponse(403, "FORBIDDEN", "Admin role is required.");
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return errorResponse(400, "MISSING_IMPORT_FILE", "A PDF file is required.");
    }

    if (!isPdfFileName(file.name)) {
      return errorResponse(415, "UNSUPPORTED_IMPORT_FILE", "Only PDF files are supported by this preview endpoint.");
    }

    const data = new Uint8Array(await file.arrayBuffer());
    const parsed = await parseInvestmentBriefPdfBuffer(data);

    return NextResponse.json({
      ok: true,
      data: {
        fileName: file.name,
        fingerprint: buildPdfImportFingerprint(file.name, parsed.headers, parsed.rows[0]),
        text: "",
        headers: parsed.headers,
        rows: parsed.rows
      }
    });
  } catch (error) {
    if (error instanceof AssetPdfBriefError) {
      const status = error.code === "UNSUPPORTED_PDF_TEMPLATE" ? 422 : 400;
      return errorResponse(status, error.code, error.message);
    }

    const message = error instanceof Error ? error.message : "Could not preview PDF import.";
    return errorResponse(500, "IMPORT_PREVIEW_FAILED", message);
  }
}
