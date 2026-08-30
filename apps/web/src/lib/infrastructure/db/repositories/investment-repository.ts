/**
 * @file apps/web/src/lib/infrastructure/db/repositories/investment-repository.ts
 * @description Layer 4: Infrastructure - Investment portfolio repository for Neon PostgreSQL.
 */

import { DatabaseExecutor, getDatabasePool } from "../neon-client";
import type { PortfolioSummary, DbReinvestmentOpportunity, PortfolioItem } from "@/lib/types/db";

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
        const clientRows = clientRes.rows || [];

        if (clientRows.length > 0) {
          const client = clientRows[0];
          const meta = (typeof client.metadata === "object" && client.metadata !== null) ? client.metadata : {};
          const rawInvestments = Array.isArray(meta.allInvestments) && meta.allInvestments.length > 0
            ? meta.allInvestments
            : clientRows.map((r) => ({
                id_inversion: r.tax_id,
                nombre_proyecto: (r.metadata as any)?.project || r.name,
                ciudad: (r.metadata as any)?.city || "TAMPA",
                monto_invertido: r.contract_amount,
                roi_pct: (r.metadata as any)?.roi,
                estado: r.status,
              }));

          const gradients = [
            "linear-gradient(135deg,#2F8F6B 0%,#173F30 100%)",
            "linear-gradient(135deg,#C41230 0%,#4A0F1A 100%)",
            "linear-gradient(135deg,#57B98C 0%,#0A1220 100%)",
            "linear-gradient(135deg,#E8495F 0%,#3B1018 100%)",
          ];

          const items: PortfolioItem[] = rawInvestments.map((inv: any, idx: number) => {
            const projectName = String(inv.nombre_proyecto || inv.project || client.name || "Inversión Inmobiliaria");
            const rawCity = String(inv.ciudad || inv.city || "TAMPA");
            const city = rawCity.toUpperCase() === "TAMPA" ? "TAMPA" : rawCity;

            // Cleanly parse ROI whether decimal 0.16, percent "16.0%", or number 16
            let parsedRoi = 15.0;
            const rawRoi = inv.roi_pct ?? inv.roi;
            if (rawRoi !== undefined && rawRoi !== null) {
              if (typeof rawRoi === "number") {
                parsedRoi = rawRoi <= 1 && rawRoi > 0 ? Number((rawRoi * 100).toFixed(1)) : rawRoi;
              } else {
                const rawRoiStr = String(rawRoi).replace("%", "").trim();
                const numRoi = parseFloat(rawRoiStr);
                if (!Number.isNaN(numRoi)) {
                  parsedRoi = numRoi <= 1 && numRoi > 0 ? Number((numRoi * 100).toFixed(1)) : numRoi;
                }
              }
            }

            // Cleanly parse invested amount
            let parsedAmount = 0;
            const rawAmt = inv.monto_invertido ?? client.contract_amount;
            if (rawAmt !== undefined && rawAmt !== null) {
              const numAmt = parseFloat(String(rawAmt).replace(/[$,]/g, ""));
              if (!Number.isNaN(numAmt)) {
                parsedAmount = numAmt;
              }
            }

            const invState = String(inv.estado || client.status || "Activa").toLowerCase();
            const status = invState.includes("conclu") ? "concluida" : "activa";
            const timing = inv.fecha_timing
              ? new Date(inv.fecha_timing).toLocaleDateString("es-ES", { month: "long", year: "numeric" })
              : "Noviembre 2026";

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
              gradient: gradients[idx % gradients.length],
            };
          });

          const totalInvested = items.reduce((sum, item) => sum + item.investedAmount, 0);
          const activeCount = items.filter((item) => item.status === "activa").length;
          const concludedCount = items.filter((item) => item.status === "concluida").length;
          const weightedRoi =
            totalInvested > 0
              ? items.reduce((sum, item) => sum + (item.investedAmount * item.roi), 0) / totalInvested
              : 0;

          return {
            userId: sanitizedEmail,
            totalInvested,
            weightedRoi: Number(weightedRoi.toFixed(1)),
            activeCount,
            concludedCount,
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
    const items: PortfolioItem[] = rows.map((r) => ({
      id: r.investment_id,
      propertyId: r.property_id,
      propertyName: r.property_name,
      city: r.city,
      propertyType: r.property_type,
      investedAmount: Number(r.invested_amount),
      roi: Number(r.roi),
      status: r.status,
      timing: r.timing,
      monthsLeft: Number(r.months_left),
      gradient: r.gradient,
    }));

    // Step 4: Compute fallback aggregate portfolio metrics
    const totalInvested = items.reduce((sum, item) => sum + item.investedAmount, 0);
    const activeCount = items.filter((item) => item.status === "activa").length;
    const concludedCount = items.filter((item) => item.status === "concluida").length;

    const weightedRoi =
      totalInvested > 0
        ? items.reduce((sum, item) => sum + (item.investedAmount * item.roi), 0) / totalInvested
        : 0;

    return {
      userId: effectiveUserId,
      totalInvested,
      weightedRoi,
      activeCount,
      concludedCount,
      items,
    };
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
