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
   */
  async getPortfolioSummary(userId: string): Promise<PortfolioSummary> {
    // Step 1: Join user_investments with properties
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

    const res = await this.db.query(query, [userId]);
    const rows = res.rows || [];

    // Step 2: Map database items
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

    // Step 3: Compute aggregate portfolio metrics
    const totalInvested = items.reduce((sum, item) => sum + item.investedAmount, 0);
    const activeCount = items.filter((item) => item.status === "activa").length;
    const concludedCount = items.filter((item) => item.status === "concluida").length;

    // Step 4: Calculate capital-weighted ROI
    const weightedRoi =
      totalInvested > 0
        ? items.reduce((sum, item) => sum + (item.investedAmount * item.roi), 0) / totalInvested
        : 0;

    return {
      userId,
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
