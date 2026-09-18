import { z } from "zod"

export const createPageSchema = z.object({
  title: z.string().min(1).max(200),
  icon: z.string().max(16).optional(),
  parentId: z.string().uuid().nullable().optional(),
  sidebarSection: z.enum(["FAVORITE", "WORKSPACE", "PRIVATE"]).optional(),
  coverUrl: z.string().max(500).nullable().optional(),
})

export const updatePageSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  icon: z.string().max(16).optional(),
  coverUrl: z.string().max(500).nullable().optional(),
  parentId: z.string().uuid().nullable().optional(),
  isFavorite: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  sidebarSection: z.enum(["FAVORITE", "WORKSPACE", "PRIVATE"]).optional(),
})
