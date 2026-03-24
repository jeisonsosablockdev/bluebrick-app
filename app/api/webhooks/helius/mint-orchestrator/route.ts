import { NextRequest, NextResponse } from "next/server";
import { recordMintWebhookEvent } from "@/lib/mint-orchestrator-store";

export async function POST(request: NextRequest) {
  // 1. Validar el secreto de Helius (Mitigación de "Forged webhook request" en threat-model)
  const authHeader = request.headers.get("authorization");
  const webhookSecret = process.env.HELIUS_WEBHOOK_SECRET;

  if (!webhookSecret || authHeader !== webhookSecret) {
    console.warn("Helius Webhook: Unauthorized attempt. Secret mismatch.");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = await request.json();

    // Helius envía un array de transacciones (Enriched Transactions)
    if (Array.isArray(payload)) {
      for (const tx of payload) {
        const signature = tx.signature;
        
        // En Helius, si transactionError es null, la transacción fue exitosa.
        const isSuccess = tx.transactionError === null;
        const status = isSuccess ? "confirmed" : "failed";
        
        console.log(`[Helius Webhook] Procesando tx: ${signature} | Estado on-chain: ${status}`);

        if (!isSuccess) {
          console.error(`[Helius Webhook] Error on-chain para ${signature}:`, tx.transactionError);
        }

        // 3. Registrar el evento para deduplicación (Mitigación en threat-model)
        const { duplicate } = recordMintWebhookEvent({
          provider: "helius",
          eventFingerprint: signature, // Usamos la firma como huella única
          signature: signature,
          eventType: tx.type || "UNKNOWN",
          slot: tx.slot || null
        });

        if (duplicate) {
          console.log(`[Helius Webhook] Evento duplicado ignorado para tx: ${signature}`);
          continue; // Saltamos a la siguiente transacción si ya la procesamos
        }
        
        // TODO: En el futuro, aquí buscaremos el `jobId` en PostgreSQL usando la firma
        // y llamaremos a `reconcileMintJobSignatures` para actualizar la compra.
      }
    }

    // 2. Responder rápidamente con 200 OK para evitar que Helius haga reintentos (timeouts)
    return NextResponse.json({ received: true }, { status: 200 });
    
  } catch (error) {
    console.error("[Helius Webhook] Error procesando el payload:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}