/**
 * =========================================================================================
 * Layer 2: Application / API Layer — Approve Payout Override Route
 * Route: /api/admin/compliance/overrides/[id]/approve
 * Description: Approves a pending payout override with multisig execution signature and optimistic locking.
 * =========================================================================================
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getRequestRole } from "@/lib/auth-session";
import {
  approvePayoutOverrideWithMultisig,
  PayoutOverrideServiceError
} from "@/features/staking-distribution/application/payout-override-service";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const ApproveOverrideSchema = z.object({
  expectedVersion: z.number().int().positive(),
  approvalTxSignature: z.string().min(32).max(128),
  isRunSealed: z.boolean().optional()
});

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

function jsonResponse(payload: unknown, status = 200): NextResponse {
  return new NextResponse(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json"
    }
  });
}

function getAdminActorId(request: NextRequest): string | null {
  const role = getRequestRole(request);
  if (!role.authenticated || role.role !== "admin") {
    return null;
  }

  return role.pubkey ?? "admin";
}

/**
 * POST /api/admin/compliance/overrides/[id]/approve
 * 
 * ¿QUÉ HACE?: Aprueba un override pendiente aplicando la firma on-chain de autorización y el control optimista de versiones.
 * ¿CÓMO LO HACE?:
 *  - Valida el rol de admin del solicitante.
 *  - Resuelve el parámetro de ruta `id` del override.
 *  - Valida el payload con Zod (`expectedVersion`, `approvalTxSignature`, `isRunSealed`).
 *  - Invoca `approvePayoutOverrideWithMultisig()` para actualizar atómicamente la DB a estado `APPROVED`.
 *  - Retorna el registro actualizado o 409 si hubo conflicto concurrente o el lote de distribución ya fue sellado.
 */
export async function POST(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  // Step 1: Validar autorización de administrador
  const actorId = getAdminActorId(request);
  if (!actorId) {
    return errorResponse(403, "FORBIDDEN", "Admin role is required.");
  }

  try {
    // Step 2: Resolver parámetros asíncronos de la ruta dinámica
    const { id } = await context.params;

    // Step 3: Validar el cuerpo de la petición con el esquema Zod
    const body = await request.json();
    const parsed = ApproveOverrideSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(400, "INVALID_REQUEST_BODY", "Validation failed for override approval.", {
        issues: parsed.error.issues
      });
    }

    // Step 4: Ejecutar la aprobación en el servicio de aplicación
    const approved = await approvePayoutOverrideWithMultisig({
      overrideId: id,
      expectedVersion: parsed.data.expectedVersion,
      approvedBy: actorId,
      approvalTxSignature: parsed.data.approvalTxSignature,
      isRunSealed: parsed.data.isRunSealed
    });

    return jsonResponse({
      ok: true,
      data: approved
    });
  } catch (error) {
    if (error instanceof PayoutOverrideServiceError) {
      return errorResponse(error.status, error.code, error.message, error.details);
    }

    const message = error instanceof Error ? error.message : "An unexpected error occurred.";
    return errorResponse(500, "APPROVE_OVERRIDE_FAILED", message);
  }
}
