import * as React from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { cn } from "../lib/utils";

export type CalloutVariant = "info" | "warning" | "success" | "error";

export interface CalloutProps {
  title?: string;
  children: React.ReactNode;
  variant?: CalloutVariant;
  className?: string;
  testId?: string;
  icon?: React.ReactNode;
}

const VARIANT_STYLES: Record<CalloutVariant, string> = {
  info: "border-[color:var(--sc-info)] text-[color:var(--sc-info)] [&>svg]:text-[color:var(--sc-info)]",
  success:
    "border-[color:var(--sc-success)] text-[color:var(--sc-success)] [&>svg]:text-[color:var(--sc-success)]",
  warning:
    "border-[color:var(--sc-warning)] text-[color:var(--sc-warning)] [&>svg]:text-[color:var(--sc-warning)]",
  error: "border-destructive text-destructive [&>svg]:text-destructive",
};

const DEFAULT_ICONS: Record<CalloutVariant, React.ReactNode> = {
  info: <Info />,
  success: <CheckCircle2 />,
  warning: <AlertTriangle />,
  error: <XCircle />,
};

/** Next.js/shadcn port of frontend/src/components/v1/Callout.tsx — a lighter,
 * icon-optional sibling of AlertBanner for static inline notices. */
export const Callout: React.FC<CalloutProps> = ({
  title,
  children,
  variant = "info",
  className = "",
  testId = "callout",
  icon,
}) => {
  const roleAttr = variant === "error" || variant === "warning" ? "alert" : "status";

  return (
    <Alert
      variant={variant === "error" ? "destructive" : "default"}
      className={cn(VARIANT_STYLES[variant], className)}
      data-testid={testId}
      role={roleAttr}
    >
      {icon !== undefined ? icon : DEFAULT_ICONS[variant]}
      {title && <AlertTitle>{title}</AlertTitle>}
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  );
};

export default Callout;
