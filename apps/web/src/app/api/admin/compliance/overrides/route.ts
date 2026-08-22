/**
 * =========================================================================================
 * Layer 2: Application / API Layer — Compliance Payout Overrides Route
 * Route: /api/admin/compliance/overrides
 * Description: Lists pending payout overrides (GET) and submits new wallet override requests (POST).
 *              Enforces strict administrative authorization and Zod schema validations.
 * =========================================================================================
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getRequestRole } from "@/lib/auth-session";
import {
  listPendingOverridesForCompliance,
  requestPayoutOverride,
  PayoutOverrideServiceError
} from "@/features/staking-distribution/application/payout-override-service";

const RequestOverrideSchema = z.object({
  originalWallet: z.string().min(32).max(44),
  requestedWallet: z.string().min(32).max(44),
  caseNumber: z.string().min(1).max(64),
  reason: z.string().min(1).max(1000)
});

/**
 * ¿QUÉ HACE?: Construye una respuesta JSON tipada de error HTTP estandarizada.
 * ¿CÓMO LO HACE?: Empaqueta `{ error: { code, message, details } }` con el código de estado HTTP correspondiente.
 */
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

/**
 * ¿QUÉ HACE?: Retorna una respuesta exitosa con header Content-Type application/json.
 * ¿CÓMO LO HACE?: Serializa el payload a JSON y define el status HTTP (default 200).
 */
function jsonResponse(payload: unknown, status = 200): NextResponse {
  return new NextResponse(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json"
    }
  });
}

/**
 * ¿QUÉ HACE?: Extrae el identificador público del administrador que realiza la petición.
 * ¿CÓMO LO HACE?: Inspecciona la sesión criptográfica autenticada en `getRequestRole(request)` y valida que el rol sea 'admin'.
 */
function getAdminActorId(request: NextRequest): string | null {
  const role = getRequestRole(request);
  if (!role.authenticated || role.role !== "admin") {
    return null;
  }

  return role.pubkey ?? "admin";
}

/**
 * GET /api/admin/compliance/overrides
 * 
 * ¿QUÉ HACE?: Lista todas las solicitudes de override en estado PENDING para la cola de cumplimiento.
 * ¿CÓMO LO HACE?:
 *  - Valida autenticación y rol de administrador (403 si falla).
 *  - Consulta el servicio de aplicación `listPendingOverridesForCompliance()`.
 *  - Retorna un JSON `{ ok: true, data: [...] }`.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  // Step 1: Verificar autorización de administrador
  const actorId = getAdminActorId(request);
  if (!actorId) {
    return errorResponse(403, "FORBIDDEN", "Admin role is required.");
  }

  try {
    // Step 2: Obtener overrides pendientes desde la capa de aplicación
    const pendingOverrides = await listPendingOverridesForCompliance();

    return jsonResponse({
      ok: true,
      data: pendingOverrides
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load pending overrides.";
    return errorResponse(500, "LIST_OVERRIDES_FAILED", message);
  }
}

/**
 * POST /api/admin/compliance/overrides
 * 
 * ¿QUÉ HACE?: Crea una nueva solicitud de reasignación de wallet de pago en estado PENDING.
 * ¿CÓMO LO HACE?:
 *  - Valida sesión de admin.
 *  - Valida el cuerpo JSON contra el esquema Zod `RequestOverrideSchema`.
 *  - Invoca `requestPayoutOverride()` en la capa de aplicación.
 *  - Retorna el registro creado con HTTP 201 Created.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // Step 1: Verificar autorización de administrador
  const actorId = getAdminActorId(request);
  if (!actorId) {
    return errorResponse(403, "FORBIDDEN", "Admin role is required.");
  }

  try {
    // Step 2: Parsear y validar el payload con Zod
    const body = await request.json();
    const parsed = RequestOverrideSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(400, "INVALID_REQUEST_BODY", "Validation failed for override request.", {
        issues: parsed.error.issues
      });
    }

    // Step 3: Invocar servicio de dominio para persistir en estado PENDING
    const override = await requestPayoutOverride({
      originalWallet: parsed.data.originalWallet,
      requestedWallet: parsed.data.requestedWallet,
      caseNumber: parsed.data.caseNumber,
      reason: parsed.data.reason,
      requestedBy: actorId
    });

    return jsonResponse(
      {
        ok: true,
        data: override
      },
      201
    );
  } catch (error) {
    if (error instanceof PayoutOverrideServiceError) {
      return errorResponse(error.status, error.code, error.message, error.details);
    }

    const message = error instanceof Error ? error.message : "An unexpected error occurred.";
    return errorResponse(500, "CREATE_OVERRIDE_FAILED", message);
  }
}
