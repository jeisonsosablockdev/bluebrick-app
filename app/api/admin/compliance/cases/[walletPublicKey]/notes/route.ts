import { NextRequest, NextResponse } from "next/server";

import { getRequestRole } from "@/lib/auth-session";
import { addComplianceCaseNote, ComplianceCaseServiceError, getComplianceCaseNotes } from "@/features/profile/application/case-service";

type RouteParams = {
  params: Promise<{
    walletPublicKey: string;
  }>;
};

type AddNoteBody = {
  noteText?: unknown;
};

function toOptionalPositiveInt(value: string | null): number | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return undefined;
  }

  return parsed;
}

function errorResponse(status: number, code: string, message: string, details?: Record<string, unknown>): NextResponse {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        details: details ?? null
      }
    },
    { status }
  );
}

function normalizeBody(raw: unknown): { noteText: string } {
  if (!raw || typeof raw !== "object") {
    throw new ComplianceCaseServiceError("INVALID_BODY", "Request body must be an object.", 400);
  }

  const body = raw as AddNoteBody;
  const noteText = typeof body.noteText === "string" ? body.noteText : "";
  return { noteText };
}

export async function GET(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const role = getRequestRole(request);
  if (!role.authenticated || role.role !== "admin") {
    return errorResponse(403, "FORBIDDEN", "Admin role is required.");
  }

  try {
    const { walletPublicKey } = await params;
    const limit = toOptionalPositiveInt(request.nextUrl.searchParams.get("limit"));
    const notes = await getComplianceCaseNotes({ walletPublicKey, limit });

    return NextResponse.json({
      ok: true,
      data: {
        notes
      }
    });
  } catch (error) {
    if (error instanceof ComplianceCaseServiceError) {
      return errorResponse(error.status, error.code, error.message, error.details);
    }

    const message = error instanceof Error ? error.message : "Could not load compliance notes.";
    return errorResponse(500, "COMPLIANCE_NOTES_FETCH_FAILED", message);
  }
}

export async function POST(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const role = getRequestRole(request);
  if (!role.authenticated || role.role !== "admin" || !role.pubkey) {
    return errorResponse(403, "FORBIDDEN", "Admin role is required.");
  }

  try {
    const { walletPublicKey } = await params;
    const body = normalizeBody(await request.json().catch(() => null));
    const note = await addComplianceCaseNote({
      walletPublicKey,
      adminActorId: role.pubkey,
      noteText: body.noteText
    });

    return NextResponse.json({
      ok: true,
      data: note
    });
  } catch (error) {
    if (error instanceof ComplianceCaseServiceError) {
      return errorResponse(error.status, error.code, error.message, error.details);
    }

    const message = error instanceof Error ? error.message : "Could not add compliance note.";
    return errorResponse(500, "COMPLIANCE_NOTE_CREATE_FAILED", message);
  }
}
