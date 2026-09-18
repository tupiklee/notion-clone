import type { BlockType } from "./types"

export const BLOCK_TYPE_OPTIONS: {
  type: BlockType
  label: string
  defaultIcon?: string
}[] = [
  { type: "text", label: "텍스트" },
  { type: "heading1", label: "제목 1" },
  { type: "heading2", label: "제목 2" },
  { type: "heading3", label: "제목 3" },
  { type: "bulleted", label: "글머리 기호" },
  { type: "numbered", label: "번호 매기기" },
  { type: "todo", label: "할 일" },
  { type: "quote", label: "인용" },
  { type: "callout", label: "콜아웃", defaultIcon: "💡" },
  { type: "divider", label: "구분선" },
]

export function blockTypeForNewAfter(current: BlockType): BlockType {
  if (current === "divider") return "text"
  if (current === "callout") return "text"
  return current
}
