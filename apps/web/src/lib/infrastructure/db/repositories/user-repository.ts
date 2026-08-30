/**
 * @file apps/web/src/lib/infrastructure/db/repositories/user-repository.ts
 * @description Layer 4: Infrastructure - User persistence repository for Neon PostgreSQL.
 */

import { DatabaseExecutor, getDatabasePool } from "../neon-client";
import type { DbUser } from "@/lib/types/db";

export interface CreateUserInput {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  tier?: string;
}

export class UserRepository {
  private readonly db: DatabaseExecutor;

  constructor(db: DatabaseExecutor = getDatabasePool()) {
    this.db = db;
  }

  /**
   * Finds a user by unique identifier.
   */
  async findById(id: string): Promise<DbUser | null> {
    // Step 1: Query users table by primary key
    const query = `
      SELECT id, email, first_name, last_name, avatar_url, tier, created_at, updated_at
      FROM users
      WHERE id = $1
      LIMIT 1;
    `;
    const res = await this.db.query(query, [id]);

    // Step 2: Map database row to DbUser domain entity
    if (!res.rows || res.rows.length === 0) {
      return null;
    }

    const row = res.rows[0];
    return {
      id: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      avatarUrl: row.avatar_url,
      tier: row.tier,
      createdAt: new Date(row.created_at),
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
    };
  }

  /**
   * Upserts a user record (used for JIT synchronization from WorkOS).
   */
  async upsertUser(input: CreateUserInput): Promise<DbUser> {
    // Step 1: Execute parameterized UPSERT query
    const query = `
      INSERT INTO users (id, email, first_name, last_name, avatar_url, tier, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url),
        tier = COALESCE(EXCLUDED.tier, users.tier),
        updated_at = NOW()
      RETURNING id, email, first_name, last_name, avatar_url, tier, created_at, updated_at;
    `;

    const res = await this.db.query(query, [
      input.id,
      input.email,
      input.firstName,
      input.lastName,
      input.avatarUrl || null,
      input.tier || "Inversionista Privado",
    ]);

    const row = res.rows[0];
    return {
      id: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      avatarUrl: row.avatar_url,
      tier: row.tier,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  /**
   * Updates avatar URL for an existing user record.
   */
  async updateAvatarUrl(userId: string, avatarUrl: string | null): Promise<DbUser | null> {
    // Step 1: Execute parameterized update query
    const query = `
      UPDATE users
      SET avatar_url = $2, updated_at = NOW()
      WHERE id = $1
      RETURNING id, email, first_name, last_name, avatar_url, tier, created_at, updated_at;
    `;

    const res = await this.db.query(query, [userId, avatarUrl]);

    // Step 2: Return null if no matching user record was found
    if (!res.rows || res.rows.length === 0) {
      return null;
    }

    const row = res.rows[0];
    return {
      id: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      avatarUrl: row.avatar_url,
      tier: row.tier,
      createdAt: new Date(row.created_at),
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
    };
  }
}
