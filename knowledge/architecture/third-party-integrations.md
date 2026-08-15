---
type: Architecture Spec
title: Third-Party Integrations & Services Registry
description: Canonical registry of external tools, API keys, redirect URIs, and environments for BRIDS.
tags: [architecture, integrations, workos, solana, vercel]
timestamp: 2026-08-15T13:30:00Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/architecture/third-party-integrations.md
---

# 🔗 Third-Party Integrations & External Services Registry

Este documento es el **registro canónico del proyecto BRIDS** para la configuración de servicios y herramientas de terceros, incluyendo sus variables de entorno, puertos autorizados, dominios y enlaces de administración.

---

## 1. WorkOS AuthKit (Autenticación Híbrida & SSO)

* **Propósito**: Autenticación federada (Google, Email) previa a la vinculación de la wallet de Solana.
* **Documento Canónico**: [`knowledge/features/bri-154/feature-shared-hybrid-auth-workos-wallet-bri-154.md`](../features/bri-154/feature-shared-hybrid-auth-workos-wallet-bri-154.md)
* **Variables de Entorno**:
  * `WORKOS_CLIENT_ID`
  * `WORKOS_API_KEY`
  * `WORKOS_COOKIE_PASSWORD` (mínimo 32 caracteres)
  * `NEXT_PUBLIC_WORKOS_REDIRECT_URI`
* **Redirect URIs Autorizados** (deben registrarse en [WorkOS Dashboard](https://dashboard.workos.com) y en [Google Cloud Console](https://console.cloud.google.com/apis/credentials)):
  * `http://localhost:3001/callback` *(Desarrollo Local puerto 3001)*
  * `http://localhost:3000/callback` *(Desarrollo Local puerto 3000)*
  * `https://brids.io/callback` *(Producción Principal)*
  * `https://www.brids.io/callback` *(Producción WWW)*
  * `https://qa.brids.io/callback` *(Preview Vercel `develop`)*
  * `https://rc.brids.io/callback` *(Release Candidate Vercel `main`)*
* **App Homepage URL**: `https://brids.io/` (`http://localhost:3001/`)
* **Initiate Login URI (Sign-in Endpoint)**: `https://brids.io/` (`http://localhost:3001/`)
* **Sign-Out URIs**: `https://brids.io/`, `http://localhost:3001/`, `https://qa.brids.io/`

### 1.1 Google Cloud Console (OAuth 2.0 Client Credentials)

* **Propósito**: Proveedor de Identidad SSO (Google Sign-In) integrado con WorkOS AuthKit.
* **Consola de Administración**: [Google Cloud Credentials](https://console.cloud.google.com/apis/credentials)
* **URIs de redireccionamiento autorizados** (*Authorized redirect URIs*):
  * `http://localhost:3001/callback` *(Desarrollo Local puerto 3001)*
  * `http://localhost:3000/callback` *(Desarrollo Local puerto 3000)*
  * `https://brids.io/callback` *(Producción Principal)*
  * `https://www.brids.io/callback` *(Producción WWW)*
  * `https://qa.brids.io/callback` *(Preview Vercel `develop`)*
  * `https://rc.brids.io/callback` *(Release Candidate Vercel `main`)*
  * `https://auth.workos.com/sso/oauth/google/...` *(Proxy de callback interno de WorkOS)*



---

## 2. Solana Infrastructure (Helius RPC & DAS Client)

* **Propósito**: Consultas a la blockchain en Devnet, minteo de Metaplex Core y reconciliación de eventos.
* **Variables de Entorno**:
  * `SOLANA_RPC_URL` (Servidor)
  * `NEXT_PUBLIC_SOLANA_RPC` (Cliente)
  * `HELIUS_API_KEY`
  * `HELIUS_WEBHOOK_SECRET`
  * `SOLANA_DAS_URL`
* **Configuración**: El servidor prioriza la API Key privada de Helius para evitar rate limits (`HTTP 429`) del RPC público.

---

## 3. Storage & IPFS (Pinata & Vercel Blob)

* **Propósito**: Almacenamiento de metadatos JSON de NFTs en IPFS e imágenes estáticas del marketplace.
* **Variables de Entorno**:
  * `PINATA_JWT`
  * `PINATA_GATEWAY_BASE_URL` (`https://gateway.pinata.cloud/ipfs`)
  * `BLOB_READ_WRITE_TOKEN`
  * `BLOB_STORE_ID`

---

## 4. Maps & Geolocation (Google Maps & Mapbox)

* **Propósito**: Renderizado interactivo de propiedades en el marketplace y geocodificación de inmuebles.
* **Variables de Entorno**:
  * `GOOGLE_MAPS_API_KEY`
  * `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY`
  * `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`
  * `NEXT_PUBLIC_MAPBOX_STYLE_URL`

---

## 5. Persistence & Database (Neon PostgreSQL)

* **Propósito**: Base de datos relacional serverless para perfiles de usuario, intentos de compra e idempotencia.
* **Variables de Entorno**:
  * `DATABASE_URL` (Pooler)
  * `DATABASE_URL_UNPOOLED` (Direct Connection para migraciones)

---

## 6. Despliegue y Dominios en Vercel

* **Propósito**: Alojamiento de la aplicación Next.js y alias de subdominios.
* **Documento Canónico**: [`knowledge/fixes/bri-162/fix-single-project-vercel-alias-flow-bri-162-implementation.md`](../fixes/bri-162/fix-single-project-vercel-alias-flow-bri-162-implementation.md)
* **Dominios del Proyecto**:
  * `brids.io` (Producción)
  * `qa.brids.io` (QA / Staging)
  * `rc.brids.io` (Release Candidate)
