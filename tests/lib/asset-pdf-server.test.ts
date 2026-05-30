import { afterEach, describe, expect, it, vi } from "vitest";

const brandonBriefText = `
BLUE BRICK INVESTMENTS OPPORTUNITY BRIEF BRANDON - FLORIDA
Deal Number: 117
1- Property Overview
Address: 117 Hickory Creek Blvd, Brandon, FL 33511
Purchase Price: $275,000
After Repair Value (ARV): $580,000
Rehab Budget: $150,000
Project Type: Fix & Flip Residential
2 -Financial Breakdown
Closing Costs (7%) $18,550
Rehab / Construction $150,000
Holding & Misc. $5,413
Selling Costs (7%) $40,600
Total Project Cost $490,163
3- Capital Structure
Minimum Capital Required to Participate in the Project 30% $147,049
Cantidad de Ticket de inversion 10
Structuring fee $5,395
MINIMUM TICKET Ticket Value Structuring fee Total Participation Value
10 $14,705 $540 $15,244
4- Projected Profit Analysis
Net Profit (before distribution) $89,837
6- Application of Fees to Investor Profit
Management Fee (of invested capital) 2% $2,941
Broker Fee (of capital raised) 6% $8,823
Net Profit for Investor $33,155 21.75%
8- Estimated Timeline
Total Estimated Duration 9 12 Months
9- Security & Transparency
Escrow Account: fondos de inversionistas gestionados bajo una cuenta escrow específica por proyecto.
LLC Independiente: el proyecto opera bajo su propia estructura legal (SPV).
Private Lender Oversight: liberación de fondos según hitos verificados.
Contracts & Reports: contrato firmado, reportes mensuales de avance y cierre contable al final.
Exit Strategy: liquidación final y distribución de utilidades desde la cuenta escrow.
10- Investment Highlights
✅Estructurardor - Operador: Blue Brick Capital LLC + Quality asset group inc
`;

describe("lib/admin/asset-pdf-server", () => {
  afterEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it("extracts PDF text through an isolated Node worker before normalizing the brief", async () => {
    const workerInstances: Array<{
      source: URL;
      options: unknown;
      postedMessage: unknown;
      transferList: unknown;
      terminate: ReturnType<typeof vi.fn>;
      removeAllListeners: ReturnType<typeof vi.fn>;
    }> = [];

    class MockWorker {
      readonly source: URL;
      readonly options: unknown;
      postedMessage: unknown;
      transferList: unknown;
      readonly listeners = new Map<string, (...args: Array<unknown>) => void>();
      readonly terminate = vi.fn(async () => 0);
      readonly removeAllListeners = vi.fn(() => this);

      constructor(source: URL, options: unknown) {
        this.source = source;
        this.options = options;
        workerInstances.push(this);
      }

      once(eventName: string, listener: (...args: Array<unknown>) => void): this {
        this.listeners.set(eventName, listener);
        return this;
      }

      postMessage(message: unknown, transferList?: unknown): void {
        this.postedMessage = message;
        this.transferList = transferList;
        queueMicrotask(() => {
          this.listeners.get("message")?.({
            ok: true,
            extractedText: brandonBriefText
          });
        });
      }
    }

    vi.doMock("node:worker_threads", async (importOriginal) => {
      const actual = await importOriginal<typeof import("node:worker_threads")>();
      return {
        ...actual,
        Worker: MockWorker
      };
    });

    const { parseInvestmentBriefPdfBuffer } = await import("@/lib/admin/asset-pdf-server");
    const result = await parseInvestmentBriefPdfBuffer(new Uint8Array([1, 2, 3]));

    expect(workerInstances).toHaveLength(1);
    expect(workerInstances[0].source.href).toContain("data:text/javascript");
    expect(decodeURIComponent(workerInstances[0].source.href)).toContain("process.cwd()");
    expect(decodeURIComponent(workerInstances[0].source.href)).not.toContain("import.meta.url");
    expect(workerInstances[0].postedMessage).toBeInstanceOf(ArrayBuffer);
    expect(workerInstances[0].transferList).toEqual([workerInstances[0].postedMessage]);
    expect(workerInstances[0].terminate).toHaveBeenCalledTimes(1);
    expect(result.extractedText).toContain("Deal Number: 117");
    expect(result.rows).toHaveLength(1);
  });
});
