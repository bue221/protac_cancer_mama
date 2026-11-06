import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { CheckStatus } from "@/types/viabilidad"

const labels: Record<CheckStatus, string> = {
  pass: "PASS",
  warn: "WARN",
  fail: "FAIL",
}

export function StatusBadge({ status }: { status: CheckStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-md px-2 font-mono text-[11px] tracking-wider",
        status === "pass" && "border-pass/40 bg-pass/10 text-pass",
        status === "warn" && "border-warn/40 bg-warn/15 text-[oklch(0.45_0.1_75)]",
        status === "fail" && "border-destructive/40 bg-destructive/10 text-destructive",
      )}
    >
      {labels[status]}
    </Badge>
  )
}
