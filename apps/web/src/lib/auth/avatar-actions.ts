/**
 * @file apps/web/src/lib/auth/avatar-actions.ts
 * @description Layer 2: Application - Server actions for investor avatar upload and old asset cleanup.
 */

"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedInvestor } from "./workos-session";
import { uploadInvestorAvatarPipeline, type UploadResult } from "@/lib/pipelines/blob-storage-pipeline";
import { UserRepository } from "@/lib/infrastructure/db/repositories/user-repository";
import { defaultBlobClient } from "@/lib/infrastructure/blob/vercel-blob-client";

/**
 * Server action to handle avatar uploads for authenticated investors.
 */
export async function uploadAvatarAction(formData: FormData): Promise<UploadResult> {
  try {
    // Step 1: Resolve authenticated user context
    const userRepo = new UserRepository();
    const investor = await getAuthenticatedInvestor(userRepo);
    if (!investor || !investor.id) {
      return {
        success: false,
        error: "No autorizado. Sesión no válida.",
      };
    }

    // Step 2: Extract uploaded file and optional previous avatar URL from FormData
    const file = formData.get("file") as File | null;
    if (!file || typeof file === "string") {
      return {
        success: false,
        error: "No se proporcionó ningún archivo de imagen.",
      };
    }

    const oldAvatarUrl = (formData.get("oldAvatarUrl") as string | null) || investor.avatarUrl || null;

    // Step 3: Execute domain upload and cleanup pipeline
    const result = await uploadInvestorAvatarPipeline(
      investor.id,
      file,
      { oldAvatarUrl },
      defaultBlobClient,
      userRepo
    );

    // Step 4: Revalidate dashboard layout on successful upload
    if (result.success) {
      revalidatePath("/dashboard");
    }

    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error inesperado al actualizar avatar.",
    };
  }
}
