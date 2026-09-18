import { z } from "zod"

const blockType = z.enum([
  "heading1",
  "heading2",
  "heading3",
  "text",
  "bulleted",
  "numbered",
  "todo",
  "quote",
  "callout",
  "divider",
])

export const createBlockSchema = z.object({
  type: blockType,
  content: z.string().nullable().optional(),
  checked: z.boolean().nullable().optional(),
  icon: z.string().max(16).nullable().optional(),
  sortOrder: z.number().int().optional(),
})

export const updateBlockSchema = z.object({
  type: blockType.optional(),
  content: z.string().nullable().optional(),
  checked: z.boolean().nullable().optional(),
  icon: z.string().max(16).nullable().optional(),
  sortOrder: z.number().int().optional(),
})
