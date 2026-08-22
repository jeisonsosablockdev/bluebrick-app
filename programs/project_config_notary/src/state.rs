//! =========================================================================================
//! Layer: Layer 4 — Infrastructure / Smart Contracts (Solana Anchor Runtime)
//! Program: project_config_notary
//! Module: state
//!
//! 🏛️ PROPÓSITO ARQUITECTÓNICO:
//! Este archivo define el estado del PDA Notario On-Chain (`ProjectConfigState`) para cada proyecto
//! inmobiliario/tokenizado en BRIDS. Actúa como la fuente inmutable y canónica de las fechas oficiales
//! de inicio y fin de operaciones/rendimientos.
//!
//! 🛡️ MODELO DE SEGURIDAD ZERO-TRUST:
//! 1. Derivación Canónica: `[b"project_config", collection_address]`. Cada colección Metaplex Core
//!    tiene exactamente UN PDA Notario determinístico en toda la red de Solana.
//! 2. Autoridad Exclusiva de Squads v4: La modificación de las fechas (`update_project_dates`)
//!    SOLO puede ser ejecutada por la Vault PDA de Squads v4 (`authority_vault`).
//! 3. Invariante de Fechas: Se garantiza matemáticamente que `start_at <= end_at`.
//! =========================================================================================

use anchor_lang::prelude::*;

/// Semilla canónica de texto para la derivación determinística del PDA: `[b"project_config", collection_address]`
pub const PROJECT_CONFIG_SEED: &[u8] = b"project_config";

/// Dirección del Programa Oficial de Squads Protocol v4 en Solana Devnet y Mainnet-Beta.
/// Program ID: `SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf`
pub const SQUADS_V4_PROGRAM_ID: Pubkey = pubkey!("SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf");

/// Cuenta de Estado On-Chain que almacena la configuración notarizada del proyecto en Solana.
///
/// 📦 DISTRIBUCIÓN EXACTA DE MEMORIA (134 Bytes):
/// - Discriminador Anchor:    8 bytes (identificador de tipo de cuenta)
/// - authority_vault:        32 bytes (Vault PDA de Squads con autoridad exclusiva de firma)
/// - multisig:               32 bytes (Cuenta Multisig de Squads v4 de BRIDS)
/// - vault_index:             1 byte  (Índice de la bóveda dentro del multisig, ej. 0)
/// - collection_address:     32 bytes (Dirección pública de la colección Metaplex Core)
/// - start_at:                8 bytes (Timestamp Unix i64: Fecha de inicio de rendimientos)
/// - end_at:                  8 bytes (Timestamp Unix i64: Fecha de finalización del proyecto)
/// - version:                 4 bytes (Contador u32 incremental de auditoría por cada cambio)
/// - updated_at:              8 bytes (Timestamp Unix i64 del último cambio autorizado)
/// - bump:                    1 byte  (Semilla bump del PDA para validación de curva)
/// ----------------------------------------------------------------------------------------
/// Total Size = 8 + 32 + 32 + 1 + 32 + 8 + 8 + 4 + 8 + 1 = 134 Bytes
#[account]
#[derive(Default)]
pub struct ProjectConfigState {
    /// 🏛️ Vault PDA de Squads v4 (`D9i1XNftRp...`)
    /// Es la ÚNICA cuenta autorizada para emitir modificaciones sobre este PDA mediante CPI.
    pub authority_vault: Pubkey,

    /// 🤝 Cuenta Multisig de Squads v4 (`rVKwqnxyq2...`)
    /// Propietaria de la Vault. Se valida on-chain que su owner sea el programa de Squads v4.
    pub multisig: Pubkey,

    /// 🔢 Índice de la bóveda en Squads (típicamente 0)
    pub vault_index: u8,

    /// 🎨 Dirección de la Colección Metaplex Core del proyecto
    /// Sirve como semilla determinística para vincular el NFT con su Notario on-chain.
    pub collection_address: Pubkey,

    /// 📅 Fecha de Inicio Oficial (Timestamp Unix en Segundos)
    /// Define el momento exacto a partir del cual los inversores acumulan rendimientos de staking.
    pub start_at: i64,

    /// 🏁 Fecha de Finalización Oficial (Timestamp Unix en Segundos)
    /// Define el cierre del proyecto o ciclo de inversión.
    pub end_at: i64,

    /// 📈 Versión de Auditoría (Incrementa con cada actualización)
    /// Permite a los indexadores y al motor de dispersión detectar cambios históricos.
    pub version: u32,

    /// ⏱️ Timestamp Unix del último cambio registrado on-chain
    pub updated_at: i64,

    /// 🔑 Semilla bump para la verificación criptográfica del PDA en el runtime de Solana
    pub bump: u8,
}

impl ProjectConfigState {
    /// Tamaño total en bytes requerido para asignar la cuenta en Solana (incluyendo discriminador)
    pub const LEN: usize = 8 + 32 + 32 + 1 + 32 + 8 + 8 + 4 + 8 + 1; // 134 bytes
}
