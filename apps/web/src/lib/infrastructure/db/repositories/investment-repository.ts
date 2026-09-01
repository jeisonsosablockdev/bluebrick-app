/**
 * @file apps/web/src/lib/infrastructure/db/repositories/investment-repository.ts
 * @description Layer 4: Infrastructure - Investment portfolio repository for Neon PostgreSQL.
 * Provides clean modular transformers, typed queries, and robust fallback policies.
 */

import { DatabaseExecutor, getDatabasePool } from "../neon-client";
import type {
  PortfolioSummary,
  DbReinvestmentOpportunity,
  PortfolioItem,
  DbClientRow,
  RawClientInvestment,
  ProjectPhase,
} from "@/lib/types/db";

/** Standard aesthetic gradients for portfolio cards. */
export const PORTFOLIO_CARD_GRADIENTS = [
  "linear-gradient(135deg,#2F8F6B 0%,#173F30 100%)",
  "linear-gradient(135deg,#C41230 0%,#4A0F1A 100%)",
  "linear-gradient(135deg,#57B98C 0%,#0A1220 100%)",
  "linear-gradient(135deg,#E8495F 0%,#3B1018 100%)",
] as const;

/**
 * Parses and normalizes ROI percentage values across heterogeneous formats (decimal 0.16, percent string "16.0%", or integer 16).
 *
 * @param rawRoi - Raw unparsed ROI value.
 * @returns Normalized percentage number (e.g. 16.0).
 */
export function parseRoiPercentage(rawRoi?: string | number | null): number {
  if (rawRoi === undefined || rawRoi === null) return 15.0;

  if (typeof rawRoi === "number") {
    if (Number.isNaN(rawRoi)) return 15.0;
    return rawRoi <= 1 && rawRoi > 0 ? Number((rawRoi * 100).toFixed(1)) : rawRoi;
  }

  const cleanStr = String(rawRoi).replace("%", "").trim();
  const parsed = parseFloat(cleanStr);
  if (Number.isNaN(parsed)) return 15.0;
  return parsed <= 1 && parsed > 0 ? Number((parsed * 100).toFixed(1)) : parsed;
}

/**
 * Parses and normalizes monetary investment amounts, stripping symbols and commas.
 *
 * @param rawAmount - Raw unparsed amount string or number.
 * @returns Clean numeric monetary amount.
 */
export function parseMonetaryAmount(rawAmount?: string | number | null): number {
  if (rawAmount === undefined || rawAmount === null) return 0;
  if (typeof rawAmount === "number") return Number.isNaN(rawAmount) ? 0 : rawAmount;

  const cleanNum = String(rawAmount).replace(/[$,]/g, "").trim();
  const parsed = parseFloat(cleanNum);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * Resolves a cyclic visual gradient for portfolio items.
 *
 * @param index - Zero-based index of item.
 * @returns CSS linear-gradient string.
 */
export function resolveItemGradient(index: number): string {
  return PORTFOLIO_CARD_GRADIENTS[Math.abs(index) % PORTFOLIO_CARD_GRADIENTS.length];
}

/**
 * Calculates total invested, weighted ROI, active count, and concluded count.
 *
 * @param items - Portfolio items array.
 * @returns Summary aggregate numbers.
 */
export function calculatePortfolioMetrics(items: PortfolioItem[]): {
  totalInvested: number;
  weightedRoi: number;
  activeCount: number;
  concludedCount: number;
} {
  const totalInvested = items.reduce((sum, item) => sum + item.investedAmount, 0);
  const activeCount = items.filter((item) => item.status === "activa").length;
  const concludedCount = items.filter((item) => item.status === "concluida").length;
  const weightedRoi =
    totalInvested > 0
      ? Number((items.reduce((sum, item) => sum + item.investedAmount * item.roi, 0) / totalInvested).toFixed(1))
      : 0;

  return { totalInvested, weightedRoi, activeCount, concludedCount };
}

/**
 * Maps a database client row and its associated investments array into domain PortfolioItems.
 *
 * @param client - The client entity row.
 * @param rawInvestments - List of client investments.
 * @returns Typed PortfolioItem domain array.
 */
export function mapClientToPortfolioItems(
  client: DbClientRow,
  rawInvestments: RawClientInvestment[]
): PortfolioItem[] {
  return rawInvestments.map((inv, idx) => {
    const projectName = String(inv.nombre_proyecto || inv.project || client.name || "Inversión Inmobiliaria");
    const rawCity = String(inv.ciudad || inv.city || "TAMPA");
    const city = rawCity.toUpperCase() === "TAMPA" ? "TAMPA" : rawCity;
    const parsedRoi = parseRoiPercentage(inv.roi_pct ?? inv.roi);
    const parsedAmount = parseMonetaryAmount(inv.monto_invertido ?? client.contract_amount);

    const invState = String(inv.estado || client.status || "Activa").toLowerCase();
    const status: PortfolioItem["status"] = invState.includes("conclu") ? "concluida" : "activa";
    const timing = inv.fecha_timing
      ? new Date(inv.fecha_timing).toLocaleDateString("es-ES", { month: "long", year: "numeric" })
      : "Noviembre 2026";

    const currentPhase = inv.fase_actual ? String(inv.fase_actual) : undefined;
    const rawAvance = (inv as any).avance_fase_pct;
    const phaseProgressPct = rawAvance !== undefined && rawAvance !== null
      ? Number((Number(rawAvance) * (Number(rawAvance) <= 1 ? 100 : 1)).toFixed(2))
      : undefined;

    return {
      id: `${client.id}_${inv.id_inversion || idx}`,
      propertyId: inv.id_inversion || client.tax_id || `prop_${idx}`,
      propertyName: projectName,
      city,
      propertyType: "Residencial",
      investedAmount: parsedAmount,
      roi: parsedRoi,
      status,
      timing,
      monthsLeft: 4,
      gradient: resolveItemGradient(idx),
      currentPhase,
      phaseProgressPct,
    };
  });
}

export class InvestmentRepository {
  private readonly db: DatabaseExecutor;

  constructor(db: DatabaseExecutor = getDatabasePool()) {
    this.db = db;
  }

  /**
   * Retrieves full aggregated portfolio summary for an investor.
   * Prioritizes resolving the investor's active record from the `clients` table (ingested from Excel) by email.
   * Falls back to `user_investments` (demo portfolio) if email is omitted or not found in `clients`.
   *
   * @param userEmailOrId - User email (primary lookup) or userId.
   * @param fallbackUserId - Optional fallback userId for user_investments table.
   * @returns {Promise<PortfolioSummary>} Aggregated portfolio summary and items.
   */
  async getPortfolioSummary(
    userEmailOrId?: string | null,
    fallbackUserId?: string | null
  ): Promise<PortfolioSummary> {
    const isEmail = typeof userEmailOrId === "string" && userEmailOrId.includes("@");
    const sanitizedEmail = isEmail ? userEmailOrId.trim().toLowerCase() : null;

    // Step 1: Primary lookup — Search in `clients` table by sanitized email
    if (sanitizedEmail) {
      const clientQuery = `
        SELECT id, name, tax_id, email, phone, contract_amount, status, metadata, created_at
        FROM clients
        WHERE LOWER(TRIM(email)) = $1 AND status = 'ACTIVE'
        ORDER BY created_at DESC;
      `;
      try {
        const clientRes = await this.db.query(clientQuery, [sanitizedEmail]);
        const clientRows = (clientRes.rows || []) as DbClientRow[];

        if (clientRows.length > 0) {
          const client = clientRows[0];
          const meta = client.metadata || {};
          const rawInvestments: RawClientInvestment[] = Array.isArray(meta.allInvestments) && meta.allInvestments.length > 0
            ? meta.allInvestments
            : clientRows.map((r) => ({
                id_inversion: r.tax_id,
                nombre_proyecto: r.metadata?.project || r.name,
                ciudad: r.metadata?.city || "TAMPA",
                monto_invertido: r.contract_amount,
                roi_pct: r.metadata?.roi,
                estado: r.status,
              }));

          const items = mapClientToPortfolioItems(client, rawInvestments);
          await this.enrichItemsWithProjectPhases(items);
          const metrics = calculatePortfolioMetrics(items);

          return {
            userId: sanitizedEmail,
            ...metrics,
            items,
          };
        }
      } catch (err) {
        // Invariant: Log client query issue and gracefully proceed to fallback
        console.warn("Could not query clients table, proceeding to fallback.", err);
      }
    }

    // Step 2: Fallback lookup — Query user_investments JOIN properties for userId or default seed
    const effectiveUserId = fallbackUserId || (!isEmail && userEmailOrId ? userEmailOrId : null) || "user_sofia_martinez";
    const query = `
      SELECT
        ui.id AS investment_id,
        p.id AS property_id,
        p.name AS property_name,
        p.city AS city,
        p.type AS property_type,
        ui.invested_amount AS invested_amount,
        p.roi AS roi,
        p.status AS status,
        p.timing AS timing,
        p.months_left AS months_left,
        p.gradient AS gradient
      FROM user_investments ui
      JOIN properties p ON ui.property_id = p.id
      WHERE ui.user_id = $1
      ORDER BY ui.invested_amount DESC;
    `;

    const res = await this.db.query(query, [effectiveUserId]);
    const rows = res.rows || [];

    // Step 3: Map fallback database items
    const items: PortfolioItem[] = rows.map((r, idx) => ({
      id: r.investment_id,
      propertyId: r.property_id,
      propertyName: r.property_name,
      city: r.city,
      propertyType: r.property_type,
      investedAmount: parseMonetaryAmount(r.invested_amount),
      roi: parseRoiPercentage(r.roi),
      status: r.status,
      timing: r.timing,
      monthsLeft: Number(r.months_left) || 0,
      gradient: r.gradient || resolveItemGradient(idx),
    }));

    await this.enrichItemsWithProjectPhases(items);
    const metrics = calculatePortfolioMetrics(items);

    return {
      userId: effectiveUserId,
      ...metrics,
      items,
    };
  }

  /**
   * Enriches portfolio items with real construction milestones from dashboard_project_phases table.
   * Gracefully degrades without throwing if the table is unavailable or has no rows.
   *
   * @param items - List of portfolio items to enrich in-place
   */
  private async enrichItemsWithProjectPhases(items: PortfolioItem[]): Promise<void> {
    if (!items || items.length === 0) return;

    // Collect all candidate project identifiers (e.g. 'BG-01', 'BK-02', 'CW-04')
    const candidateSkus = items.map((i) => i.propertyId).filter(Boolean);
    if (candidateSkus.length === 0) return;

    try {
      const phasesRes = await this.db.query(
        `SELECT id, id_fase, id_inversion, orden, nombre_fase, estado, fecha_inicio, fecha_fin, imagen_url_1, imagen_url_2, imagen_url_3
         FROM dashboard_project_phases
         WHERE id_inversion = ANY($1)
         ORDER BY id_inversion, orden ASC`,
        [candidateSkus]
      );

      const phaseRows = (phasesRes?.rows || []) as Array<{
        id: string;
        id_fase: string;
        id_inversion: string;
        orden: number;
        nombre_fase: string;
        estado: "Completada" | "En curso" | "Pendiente" | "No aplica";
        fecha_inicio?: string | Date | null;
        fecha_fin?: string | Date | null;
        imagen_url_1?: string | null;
        imagen_url_2?: string | null;
        imagen_url_3?: string | null;
      }>;

      if (phaseRows.length === 0) return;

      const phasesByProject = new Map<string, ProjectPhase[]>();
      for (const row of phaseRows) {
        const sku = String(row.id_inversion);
        if (!phasesByProject.has(sku)) {
          phasesByProject.set(sku, []);
        }

        const images = [row.imagen_url_1, row.imagen_url_2, row.imagen_url_3].filter(
          (img): img is string => typeof img === "string" && img.trim().length > 0
        );

        phasesByProject.get(sku)!.push({
          id: String(row.id_fase || row.id),
          projectId: sku,
          order: Number(row.orden),
          name: String(row.nombre_fase),
          status: row.estado,
          startDate: row.fecha_inicio ? String(row.fecha_inicio) : null,
          endDate: row.fecha_fin ? String(row.fecha_fin) : null,
          images,
        });
      }

      for (const item of items) {
        if (phasesByProject.has(item.propertyId)) {
          item.phases = phasesByProject.get(item.propertyId);
        }
      }
    } catch {
      // Invariant: Non-blocking graceful degradation
    }
  }

  /**
   * Retrieves featured reinvestment opportunities.
   */
  async getReinvestmentOpportunities(): Promise<DbReinvestmentOpportunity[]> {
    // Step 1: Query reinvestment opportunities ordered by projected ROI descending
    const query = `
      SELECT id, title, city, projected_roi, min_investment, days_left, gradient, created_at
      FROM reinvestment_opportunities
      ORDER BY projected_roi DESC;
    `;
    const res = await this.db.query(query);

    return (res.rows || []).map((r) => ({
      id: r.id,
      title: r.title,
      city: r.city,
      projectedRoi: Number(r.projected_roi),
      minInvestment: Number(r.min_investment),
      daysLeft: Number(r.days_left),
      gradient: r.gradient,
      createdAt: r.created_at ? new Date(r.created_at) : undefined,
    }));
  }
}

