/**
 * Split Metadata Layout System
 *
 * Reusable responsive UI primitives for frontend detail sidebars.
 * Provides predictable loading, empty, and disabled states with
 * accessibility-safe focus/navigation behavior.
 */

export interface MetadataField {
  /** Unique identifier for this field */
  id: string;
  /** Display label for the field */
  label: string;
  /** Field value (can be ReactNode for rich content) */
  value: React.ReactNode;
  /** Optional tooltip/help text */
  helpText?: string;
  /** Whether this field should be displayed */
  visible?: boolean;
  /** Whether the field value is loading */
  loading?: boolean;
}

export interface MetadataSection {
  /** Unique identifier for this section */
  id: string;
  /** Section title */
  title: string;
  /** Fields in this section */
  fields: MetadataField[];
  /** Whether this section is collapsible */
  collapsible?: boolean;
  /** Default open state for collapsible sections */
  defaultOpen?: boolean;
  /** Whether to show section at all */
  visible?: boolean;
}

export interface SplitMetadataLayoutProps {
  /** Primary content (left side) */
  primaryContent: React.ReactNode;
  /** Metadata sections for the sidebar (right side) */
  metadataSections: MetadataSection[];
  /** Whether data is loading */
  isLoading?: boolean;
  /** Whether the layout is disabled (e.g., read-only mode) */
  isDisabled?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Custom className for the layout */
  className?: string;
  /** Callback when a field is interacted with */
  onFieldInteraction?: (fieldId: string, sectionId: string) => void;
  /** Breakpoint at which to stack vertically (px) */
  stackBreakpoint?: number;
}

export interface MetadataSectionProps {
  /** Section configuration */
  section: MetadataSection;
  /** Whether the entire layout is disabled */
  isDisabled?: boolean;
  /** Callback when a field is interacted with */
  onFieldInteraction?: (fieldId: string) => void;
  /** Current open state for this section (controlled) */
  isOpen?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (isOpen: boolean) => void;
}

export interface LoadingSkeletonProps {
  /** Number of fields to show as skeleton */
  fieldCount?: number;
  /** Height of each skeleton line (px) */
  lineHeight?: number;
  /** Gap between skeleton lines (px) */
  gap?: number;
  /** Pulse animation speed (ms) */
  pulseSpeed?: number;
}

export interface StateDisplayProps {
  /** State type: 'empty', 'loading', 'error', 'disabled' */
  state: "empty" | "loading" | "error" | "disabled";
  /** Custom message for the state */
  message?: string;
  /** Icon component or string */
  icon?: React.ReactNode;
}
