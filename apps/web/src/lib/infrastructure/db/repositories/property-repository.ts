/**
 * @file apps/web/src/lib/infrastructure/db/repositories/property-repository.ts
 * @description Layer 4: Infrastructure - Property persistence repository for Neon PostgreSQL.
 */

import { DatabaseExecutor, getDatabasePool } from "../neon-client";
import type { DbProperty } from "@/lib/types/db";

export class PropertyRepository {
  private readonly db: DatabaseExecutor;

  constructor(db: DatabaseExecutor = getDatabasePool()) {
    this.db = db;
  }

  /**
   * Lists all property assets in the catalog.
   */
  async listAll(): Promise<DbProperty[]> {
    // Step 1: Query all properties ordered by target amount descending
    const query = `
      SELECT id, name, city, type, target_amount, roi, status, timing, months_left, gradient, created_at
      FROM properties
      ORDER BY target_amount DESC;
    `;
    const res = await this.db.query(query);

    // Step 2: Map database rows to DbProperty domain models
    return (res.rows || []).map((r) => ({
      id: r.id,
      name: r.name,
      city: r.city,
      type: r.type,
      targetAmount: Number(r.target_amount),
      roi: Number(r.roi),
      status: r.status,
      timing: r.timing,
      monthsLeft: Number(r.months_left),
      gradient: r.gradient,
      createdAt: r.created_at ? new Date(r.created_at) : undefined,
    }));
  }

  /**
   * Finds a specific property by its unique identifier.
   */
  async findById(id: string): Promise<DbProperty | null> {
    // Step 1: Query single property
    const query = `
      SELECT id, name, city, type, target_amount, roi, status, timing, months_left, gradient, created_at
      FROM properties
      WHERE id = $1
      LIMIT 1;
    `;
    const res = await this.db.query(query, [id]);

    if (!res.rows || res.rows.length === 0) {
      return null;
    }

    const r = res.rows[0];
    return {
      id: r.id,
      name: r.name,
      city: r.city,
      type: r.type,
      targetAmount: Number(r.target_amount),
      roi: Number(r.roi),
      status: r.status,
      timing: r.timing,
      monthsLeft: Number(r.months_left),
      gradient: r.gradient,
      createdAt: r.created_at ? new Date(r.created_at) : undefined,
    };
  }
}
