#!/usr/bin/env node

import { createHash, randomBytes, randomUUID } from "node:crypto";
import { execFile, spawn } from "node:child_process";
import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import { setTimeout as delay } from "node:timers/promises";
import path from "node:path";
import process from "node:process";

import { Keypair } from "@solana/web3.js";
import nacl from "tweetnacl";
import pg from "pg";

const execFileAsync = promisify(execFile);
const { Client } = pg;

const APP_HOST = "127.0.0.1";
const APP_PORT = 3001;
const CDN_WEBHOOK_PORT = 3999;
const QSTASH_SHIM_PORT = 3998;
const CDN_URL_MAP_NAME = "metaplex-admin-assets-map";
const CDN_BACKEND_BUCKET_NAME = "metaplex-admin-assets-bb";

const repoRoot = process.cwd();
const envLocalPath = path.join(repoRoot, ".env.local");
const artifactsDir = path.join(repoRoot, "docs", "rfcs", "EPIC-001-admin-asset-create-form", "artifacts");

function nowIso() {
  return new Date().toISOString();
}

function parseEnvFile(raw) {
  const env = {};

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1);
    env[key] = value;
  }

  return env;
}

async function ensureCloudCdnInfrastructure(bucketName) {
  const steps = [];

  try {
    const { stdout } = await execFileAsync("gcloud", [
      "beta",
      "compute",
      "backend-buckets",
      "describe",
      CDN_BACKEND_BUCKET_NAME,
      "--global",
      "--format=value(name)"
    ]);

    steps.push({ step: "backend-bucket-exists", output: stdout.trim() });
  } catch {
    const { stdout } = await execFileAsync("gcloud", [
      "beta",
      "compute",
      "backend-buckets",
      "create",
      CDN_BACKEND_BUCKET_NAME,
      `--gcs-bucket-name=${bucketName}`,
      "--enable-cdn",
      "--global"
    ]);

    steps.push({ step: "backend-bucket-created", output: stdout.trim() });
  }

  try {
    const { stdout } = await execFileAsync("gcloud", [
      "compute",
      "url-maps",
      "describe",
      CDN_URL_MAP_NAME,
      "--format=value(name)"
    ]);

    steps.push({ step: "url-map-exists", output: stdout.trim() });
  } catch {
    const { stdout } = await execFileAsync("gcloud", [
      "compute",
      "url-maps",
      "create",
      CDN_URL_MAP_NAME,
      `--default-backend-bucket=${CDN_BACKEND_BUCKET_NAME}`
    ]);

    steps.push({ step: "url-map-created", output: stdout.trim() });
  }

  const { stdout: backendBucketYaml } = await execFileAsync("gcloud", [
    "beta",
    "compute",
    "backend-buckets",
    "describe",
    CDN_BACKEND_BUCKET_NAME,
    "--global",
    "--format=yaml(name,bucketName,enableCdn,cdnPolicy.cacheMode)"
  ]);

  const { stdout: urlMapYaml } = await execFileAsync("gcloud", [
    "compute",
    "url-maps",
    "describe",
    CDN_URL_MAP_NAME,
    "--format=yaml(name,defaultService)"
  ]);

  return {
    steps,
    backendBucketYaml: backendBucketYaml.trim(),
    urlMapYaml: urlMapYaml.trim()
  };
}

function createBodyParser(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) {
        resolve(null);
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function jsonResponse(res, statusCode, payload) {
  const serialized = JSON.stringify(payload);

  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Length", Buffer.byteLength(serialized, "utf8"));
  res.end(serialized);
}

async function startCdnWebhookServer({ token, eventLog }) {
  const server = createServer(async (req, res) => {
    try {
      if (req.method !== "POST" || req.url !== "/invalidate") {
        jsonResponse(res, 404, { error: "Not found" });
        return;
      }

      const authorization = req.headers.authorization || "";
      const expected = `Bearer ${token}`;

      if (authorization !== expected) {
        jsonResponse(res, 401, { error: "Unauthorized" });
        return;
      }

      const body = await createBodyParser(req);
      const inputPaths = Array.isArray(body?.paths) ? body.paths.filter((item) => typeof item === "string") : [];

      if (inputPaths.length === 0) {
        jsonResponse(res, 400, { error: "paths array is required" });
        return;
      }

      const operations = [];

      for (const pathValue of inputPaths) {
        const { stdout } = await execFileAsync("gcloud", [
          "compute",
          "url-maps",
          "invalidate-cdn-cache",
          CDN_URL_MAP_NAME,
          "--path",
          pathValue,
          "--async",
          "--format=json"
        ]);

        let operation = null;

        try {
          operation = JSON.parse(stdout);
        } catch {
          operation = { raw: stdout.trim() };
        }

        operations.push({ path: pathValue, operation });
      }

      const requestId = operations
        .map((entry) => entry.operation?.name)
        .find((value) => typeof value === "string") || randomUUID();

      eventLog.push({
        type: "cdn-webhook",
        requestedAt: nowIso(),
        paths: inputPaths,
        requestId,
        operations
      });

      jsonResponse(res, 200, {
        requestId,
        operations
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected webhook failure";

      eventLog.push({
        type: "cdn-webhook-error",
        requestedAt: nowIso(),
        message
      });

      jsonResponse(res, 500, { error: message });
    }
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(CDN_WEBHOOK_PORT, APP_HOST, resolve);
  });

  return server;
}

async function startQstashShimServer({ eventLog }) {
  const server = createServer(async (req, res) => {
    try {
      if (req.method !== "POST" || !req.url || !req.url.startsWith("/v2/publish/")) {
        jsonResponse(res, 404, { error: "Not found" });
        return;
      }

      const encodedTargetUrl = req.url.slice("/v2/publish/".length);
      const targetUrl = decodeURIComponent(encodedTargetUrl);

      const chunks = [];
      req.on("data", (chunk) => chunks.push(chunk));

      await new Promise((resolve, reject) => {
        req.on("end", resolve);
        req.on("error", reject);
      });

      const rawBody = Buffer.concat(chunks).toString("utf8") || "{}";

      const forwardWorkerToken = req.headers["upstash-forward-x-import-worker-token"];
      const workerToken = typeof forwardWorkerToken === "string" ? forwardWorkerToken : null;

      const forwardHeaders = {
        "Content-Type": "application/json"
      };

      if (workerToken) {
        forwardHeaders["x-import-worker-token"] = workerToken;
      }

      const forwardResponse = await fetch(targetUrl, {
        method: "POST",
        headers: forwardHeaders,
        body: rawBody
      });

      const forwardPayload = await forwardResponse
        .json()
        .catch(() => ({ ok: false, error: "Could not parse process response." }));

      eventLog.push({
        type: "qstash-publish",
        requestedAt: nowIso(),
        targetUrl,
        workerTokenForwarded: Boolean(workerToken),
        processStatus: forwardResponse.status,
        processPayload: forwardPayload
      });

      jsonResponse(res, 200, {
        messageId: randomUUID(),
        processStatus: forwardResponse.status
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected qstash shim error";

      eventLog.push({
        type: "qstash-publish-error",
        requestedAt: nowIso(),
        message
      });

      jsonResponse(res, 500, { error: message });
    }
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(QSTASH_SHIM_PORT, APP_HOST, resolve);
  });

  return server;
}

async function waitForEndpoint(url, timeoutMs = 120_000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url, { method: "GET" });
      if (response.ok) {
        return;
      }
    } catch {
      // retry
    }

    await delay(1_000);
  }

  throw new Error(`Timed out waiting for ${url}`);
}

function createSiwsMessage({ domain, publicKey, nonce, statement, issuedAt }) {
  return [
    "Sign-In With Solana",
    `Domain: ${domain}`,
    `Address: ${publicKey}`,
    `Statement: ${statement}`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`
  ].join("\n");
}

function fileMd5Base64(content) {
  return createHash("md5").update(content).digest("base64");
}

function parseSetCookie(setCookieHeader) {
  if (!setCookieHeader) {
    return null;
  }

  const firstChunk = setCookieHeader.split(";")[0]?.trim();
  return firstChunk || null;
}

function terminalImportState(state) {
  return state === "completed" || state === "completed_with_errors" || state === "failed";
}

async function run() {
  const eventLog = [];
  const baseUrl = `http://${APP_HOST}:${APP_PORT}`;

  const rawEnvLocal = await readFile(envLocalPath, "utf8");
  const envLocal = parseEnvFile(rawEnvLocal);

  const bucketName = envLocal.GCS_UPLOAD_BUCKET;
  const databaseUrl = envLocal.DATABASE_URL;

  if (!bucketName) {
    throw new Error("Missing GCS_UPLOAD_BUCKET in .env.local");
  }

  if (!databaseUrl) {
    throw new Error("Missing DATABASE_URL in .env.local");
  }

  const cloudCdn = await ensureCloudCdnInfrastructure(bucketName);

  const adminKeypair = Keypair.generate();
  const adminPubkey = adminKeypair.publicKey.toBase58();

  const cdnWebhookToken = randomBytes(18).toString("hex");
  const importWorkerToken = randomBytes(18).toString("hex");

  const serverEnv = {
    ...process.env,
    ...envLocal,
    ADMIN_WALLETS: adminPubkey,
    APP_BASE_URL: baseUrl,
    QSTASH_TOKEN: "validation-local-qstash-token",
    QSTASH_BASE_URL: `http://${APP_HOST}:${QSTASH_SHIM_PORT}`,
    QSTASH_IMPORT_PROCESS_URL: `${baseUrl}/api/admin/assets/import-jobs/process`,
    IMPORT_WORKER_TOKEN: importWorkerToken,
    CDN_INVALIDATION_WEBHOOK_URL: `http://${APP_HOST}:${CDN_WEBHOOK_PORT}/invalidate`,
    CDN_INVALIDATION_WEBHOOK_TOKEN: cdnWebhookToken,
    NEXT_TELEMETRY_DISABLED: "1"
  };

  const cdnServer = await startCdnWebhookServer({ token: cdnWebhookToken, eventLog });
  const qstashServer = await startQstashShimServer({ eventLog });

  let nextProcess = null;
  let dbClient = null;

  try {
    nextProcess = spawn("npm", ["run", "dev", "--", "--hostname", APP_HOST, "--port", String(APP_PORT)], {
      cwd: repoRoot,
      env: serverEnv,
      stdio: ["ignore", "pipe", "pipe"]
    });

    nextProcess.stdout.on("data", (chunk) => {
      process.stdout.write(`[next] ${chunk}`);
    });

    nextProcess.stderr.on("data", (chunk) => {
      process.stderr.write(`[next] ${chunk}`);
    });

    await waitForEndpoint(`${baseUrl}/api/auth/nonce`);

    let cookieHeader = "";

    async function requestJson(routePath, options = {}) {
      const requestUrl = `${baseUrl}${routePath}`;
      const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
      };

      if (cookieHeader) {
        headers.Cookie = cookieHeader;
      }

      const response = await fetch(requestUrl, {
        method: options.method || "GET",
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined
      });

      const setCookie = response.headers.get("set-cookie");
      const sessionCookie = parseSetCookie(setCookie);

      if (sessionCookie) {
        cookieHeader = sessionCookie;
      }

      const payload = await response
        .json()
        .catch(async () => ({ raw: await response.text().catch(() => "") }));

      return {
        status: response.status,
        ok: response.ok,
        payload
      };
    }

    const nonceResponse = await requestJson("/api/auth/nonce");
    if (!nonceResponse.ok || typeof nonceResponse.payload?.nonce !== "string") {
      throw new Error(`Could not fetch nonce: ${JSON.stringify(nonceResponse)}`);
    }

    const nonce = nonceResponse.payload.nonce;
    const issuedAt = new Date().toISOString();

    const siwsMessage = createSiwsMessage({
      domain: `${APP_HOST}:${APP_PORT}`,
      publicKey: adminPubkey,
      nonce,
      statement: "EPIC-001 validation run",
      issuedAt
    });

    const signatureBase64 = Buffer.from(
      nacl.sign.detached(new TextEncoder().encode(siwsMessage), adminKeypair.secretKey)
    ).toString("base64");

    const verifyResponse = await requestJson("/api/auth/verify", {
      method: "POST",
      body: {
        message: siwsMessage,
        signature: signatureBase64,
        publicKey: adminPubkey
      }
    });

    if (!verifyResponse.ok) {
      throw new Error(`SIWS verify failed: ${JSON.stringify(verifyResponse)}`);
    }

    const authMe = await requestJson("/api/auth/me");
    if (!authMe.ok || authMe.payload?.role !== "admin") {
      throw new Error(`Auth role is not admin: ${JSON.stringify(authMe)}`);
    }

    async function createUploadContract({ draftId, fileName, category, mimeType, content }) {
      const md5 = fileMd5Base64(content);

      const signedUrl = await requestJson("/api/admin/assets/uploads/signed-url", {
        method: "POST",
        body: {
          category,
          fileName,
          mimeType,
          sizeBytes: content.length,
          contentMd5Base64: md5,
          draftId
        }
      });

      if (!signedUrl.ok) {
        throw new Error(`Signed URL request failed: ${JSON.stringify(signedUrl)}`);
      }

      return {
        draftId,
        uploadId: signedUrl.payload.uploadId,
        uploadUrl: signedUrl.payload.uploadUrl,
        objectKey: signedUrl.payload.objectKey,
        requiredHeaders: signedUrl.payload.requiredHeaders,
        md5,
        mimeType,
        sizeBytes: content.length
      };
    }

    async function uploadToGcs(contract, content) {
      const response = await fetch(contract.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": contract.requiredHeaders["Content-Type"],
          "Content-Length": contract.requiredHeaders["Content-Length"],
          "Content-MD5": contract.requiredHeaders["Content-MD5"]
        },
        body: content
      });

      const etag = response.headers.get("etag")?.replace(/^\"+|\"+$/g, "") || null;

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(`GCS upload failed (${response.status}): ${text}`);
      }

      return { etag };
    }

    async function finalizeUpload(contract, { etag, previousCdnUrl = null }) {
      const response = await requestJson(`/api/admin/assets/uploads/${contract.uploadId}/finalize`, {
        method: "POST",
        body: {
          draftId: contract.draftId,
          etag,
          sizeBytes: contract.sizeBytes,
          mimeType: contract.mimeType,
          contentMd5Base64: contract.md5,
          previousCdnUrl
        }
      });

      if (!response.ok) {
        throw new Error(`Finalize failed: ${JSON.stringify(response)}`);
      }

      return response.payload;
    }

    const draftId = randomUUID();

    const firstContent = Buffer.from("epic-001-validation-image-content-1", "utf8");
    const firstContract = await createUploadContract({
      draftId,
      fileName: "validation-1.png",
      category: "galleryImage",
      mimeType: "image/png",
      content: firstContent
    });

    const firstUpload = await uploadToGcs(firstContract, firstContent);
    const firstFinalize = await finalizeUpload(firstContract, {
      etag: firstUpload.etag
    });

    const secondContent = Buffer.from("epic-001-validation-image-content-2", "utf8");
    const secondContract = await createUploadContract({
      draftId,
      fileName: "validation-2.png",
      category: "galleryImage",
      mimeType: "image/png",
      content: secondContent
    });

    const secondUpload = await uploadToGcs(secondContract, secondContent);
    const secondFinalize = await finalizeUpload(secondContract, {
      etag: secondUpload.etag,
      previousCdnUrl: firstFinalize.cdnUrl
    });

    const manualPurge = await requestJson("/api/admin/cdn/purge", {
      method: "POST",
      body: {
        paths: [firstFinalize.cdnUrl]
      }
    });

    if (!manualPurge.ok) {
      throw new Error(`Manual CDN purge failed: ${JSON.stringify(manualPurge)}`);
    }

    const temporaryDraftId = randomUUID();
    const temporaryContent = Buffer.from("epic-001-validation-image-content-temp", "utf8");
    const temporaryContract = await createUploadContract({
      draftId: temporaryDraftId,
      fileName: "validation-temp.png",
      category: "galleryImage",
      mimeType: "image/png",
      content: temporaryContent
    });

    dbClient = new Client({ connectionString: databaseUrl });
    await dbClient.connect();

    await dbClient.query(
      `
        UPDATE asset_upload_contracts
        SET created_at = NOW() - INTERVAL '40000 days'
        WHERE upload_id = ANY($1::uuid[])
      `,
      [[temporaryContract.uploadId, firstContract.uploadId]]
    );

    const orphanDryRun = await requestJson("/api/admin/assets/uploads/orphan-reconciler", {
      method: "POST",
      body: {
        dryRun: true,
        temporaryRetentionDays: 36500,
        abandonedRetentionDays: 36500,
        limit: 20
      }
    });

    if (!orphanDryRun.ok) {
      throw new Error(`Orphan dry-run failed: ${JSON.stringify(orphanDryRun)}`);
    }

    const orphanExecute = await requestJson("/api/admin/assets/uploads/orphan-reconciler", {
      method: "POST",
      body: {
        dryRun: false,
        temporaryRetentionDays: 36500,
        abandonedRetentionDays: 36500,
        limit: 20
      }
    });

    if (!orphanExecute.ok) {
      throw new Error(`Orphan execute failed: ${JSON.stringify(orphanExecute)}`);
    }

    const csvText = [
      "assetName,slug,internalCode,country,city,buildingExitStrategy",
      "Activo Uno,activo-uno,AUNO-001,CO,Bogota,sale",
      "Activo Dos,activo-dos,ADOS-002,CO,Medellin,no-es-valido"
    ].join("\n");

    const importCreate = await requestJson("/api/admin/assets/import-jobs", {
      method: "POST",
      body: {
        fileName: "validation-import.csv",
        mimeType: "text/csv",
        csvText,
        draftId: draftId,
        idempotencyKey: `epic-001-${randomUUID()}`
      }
    });

    if (!importCreate.ok) {
      throw new Error(`Import job create failed: ${JSON.stringify(importCreate)}`);
    }

    const importJobId = importCreate.payload.importJobId;

    let importStatus = null;
    for (let attempt = 0; attempt < 30; attempt += 1) {
      const statusResponse = await requestJson(`/api/admin/assets/import-jobs/${importJobId}`);

      if (!statusResponse.ok) {
        throw new Error(`Import status failed: ${JSON.stringify(statusResponse)}`);
      }

      importStatus = statusResponse.payload;

      if (terminalImportState(importStatus.state)) {
        break;
      }

      await delay(1_000);
    }

    if (!importStatus || !terminalImportState(importStatus.state)) {
      throw new Error(`Import job did not reach terminal state: ${JSON.stringify(importStatus)}`);
    }

    const importErrors = await requestJson(`/api/admin/assets/import-jobs/${importJobId}/errors?limit=50`);

    if (!importErrors.ok) {
      throw new Error(`Import errors fetch failed: ${JSON.stringify(importErrors)}`);
    }

    const dbInvalidationEvents = await dbClient.query(
      `
        SELECT source, status, provider_request_id, paths, created_at
        FROM asset_cdn_invalidation_events
        ORDER BY created_at DESC
        LIMIT 10
      `
    );

    const dbImportDlqRows = await dbClient.query(
      `
        SELECT id, job_id, attempt_count, reason, created_at
        FROM asset_import_job_dlq
        ORDER BY created_at DESC
        LIMIT 5
      `
    );

    const { stdout: gcloudConfig } = await execFileAsync("gcloud", [
      "config",
      "list",
      "--format=text(core.project,core.account)"
    ]);

    const invalidationOperationNames = [];
    for (const event of eventLog) {
      if (event.type !== "cdn-webhook") {
        continue;
      }

      for (const item of event.operations) {
        const operationPayload = Array.isArray(item.operation) ? item.operation[0] : item.operation;
        const operationName = operationPayload?.name;
        if (typeof operationName === "string") {
          invalidationOperationNames.push(operationName);
        }
      }
    }

    const operationStatus = [];
    for (const operationName of invalidationOperationNames.slice(0, 5)) {
      const { stdout } = await execFileAsync("gcloud", [
        "compute",
        "operations",
        "describe",
        operationName,
        "--global",
        "--format=yaml(name,status,operationType,startTime,endTime,targetLink)"
      ]);

      operationStatus.push({
        operationName,
        describeYaml: stdout.trim()
      });
    }

    const artifact = {
      generatedAt: nowIso(),
      environment: {
        appBaseUrl: baseUrl,
        appPort: APP_PORT,
        adminPubkey,
        bucketName,
        cloudCdnUrlMap: CDN_URL_MAP_NAME,
        cloudCdnBackendBucket: CDN_BACKEND_BUCKET_NAME
      },
      gcloud: {
        config: gcloudConfig.trim(),
        backendBucket: cloudCdn.backendBucketYaml,
        urlMap: cloudCdn.urlMapYaml,
        setupSteps: cloudCdn.steps,
        invalidationOperationStatus: operationStatus
      },
      auth: {
        nonceResponse,
        verifyResponse,
        authMe
      },
      uploads: {
        firstContract,
        firstFinalize,
        secondContract,
        secondFinalize,
        manualPurge,
        temporaryContract
      },
      orphanReconciler: {
        dryRun: orphanDryRun,
        execute: orphanExecute
      },
      importJobs: {
        create: importCreate,
        status: importStatus,
        errors: importErrors,
        dlqRows: dbImportDlqRows.rows
      },
      audit: {
        cdnInvalidationEvents: dbInvalidationEvents.rows,
        queueAndWebhookEvents: eventLog
      }
    };

    await mkdir(artifactsDir, { recursive: true });

    const artifactName = `validation-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    const artifactPath = path.join(artifactsDir, artifactName);

    await writeFile(artifactPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");

    const latestPath = path.join(artifactsDir, "latest-validation.json");
    await writeFile(latestPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");

    console.log(`VALIDATION_ARTIFACT=${artifactPath}`);
    console.log(`VALIDATION_ARTIFACT_LATEST=${latestPath}`);
  } finally {
    if (dbClient) {
      await dbClient.end().catch(() => {});
    }

    if (nextProcess) {
      nextProcess.kill("SIGTERM");
      await delay(1_000);
      if (!nextProcess.killed) {
        nextProcess.kill("SIGKILL");
      }
    }

    await new Promise((resolve) => cdnServer.close(resolve));
    await new Promise((resolve) => qstashServer.close(resolve));
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
