import { z } from "zod";

import { DOCUMENT_STATUSES, DOCUMENT_TYPES } from "./types";

export const DocumentStatusSchema = z.enum(DOCUMENT_STATUSES);

export const DocumentTypeSchema = z.enum(DOCUMENT_TYPES);

const SlugSchema = z
  .string()
  .min(1)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug must be kebab-case");

export const ContentFrontmatterSchema = z
  .object({
    id: z.string().min(1),
    slug: SlugSchema,
    title: z.string().min(1),
    summary: z.string().min(1),
    status: DocumentStatusSchema,
    type: DocumentTypeSchema,
    version: z.string().min(1),
    updatedAt: z
      .string()
      .datetime({ offset: true })
      .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    tags: z.array(z.string().min(1)).default([]),
    canonicalPath: z.string().startsWith("/"),
    aliases: z.array(z.string().startsWith("/")).optional(),
    supersededBySlug: SlugSchema.optional()
  })
  .superRefine((value, ctx) => {
    if (value.status === "superseded" && !value.supersededBySlug) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["supersededBySlug"],
        message: "superseded docs require supersededBySlug"
      });
    }
  });

export type ContentFrontmatterInput = z.input<typeof ContentFrontmatterSchema>;
export type ContentFrontmatterValidated = z.output<typeof ContentFrontmatterSchema>;
