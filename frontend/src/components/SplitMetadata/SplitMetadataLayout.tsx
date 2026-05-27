import { useMemo, useCallback, useState } from "react";
import { MetadataSection } from "./MetadataSection";
import { StateDisplay } from "./StateDisplay";
import { SplitMetadataLayoutProps } from "./types";
import "./SplitMetadataLayout.css";

/**
 * SplitMetadataLayout Component
 *
 * Main layout wrapper for detail views with split primary content and metadata sidebar.
 * Provides responsive design, loading states, and accessibility support.
 *
 * @example
 * ```tsx
 * <SplitMetadataLayout
 *   primaryContent={<GameDetail />}
 *   metadataSections={[
 *     {
 *       id: 'stats',
 *       title: 'Game Statistics',
 *       fields: [
 *         { id: 'players', label: 'Players', value: 150 },
 *         { id: 'winRate', label: 'Win Rate', value: '45%' }
 *       ]
 *     }
 *   ]}
 *   isLoading={false}
 *   onFieldInteraction={(fieldId, sectionId) => {
 *     console.log(`Interacted with ${fieldId} in ${sectionId}`);
 *   }}
 * />
 * ```
 */
export function SplitMetadataLayout({
  primaryContent,
  metadataSections,
  isLoading = false,
  isDisabled = false,
  emptyMessage = "No metadata available",
  className = "",
  onFieldInteraction,
  stackBreakpoint: _stackBreakpoint = 768,
}: SplitMetadataLayoutProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  // Filter visible sections
  const visibleSections = useMemo(
    () => metadataSections.filter((s) => s.visible !== false),
    [metadataSections]
  );

  // Check if we have any visible fields at all
  const hasContent = useMemo(
    () => visibleSections.some((s) => s.fields.some((f) => f.visible !== false)),
    [visibleSections]
  );

  const handleSectionToggle = useCallback((sectionId: string, isOpen: boolean) => {
    setOpenSections((prev) => ({ ...prev, [sectionId]: isOpen }));
  }, []);

  const handleFieldInteraction = useCallback(
    (fieldId: string, sectionId: string) => {
      onFieldInteraction?.(fieldId, sectionId);
    },
    [onFieldInteraction]
  );

  return (
    <div
      className={`split-metadata-layout ${className} ${isDisabled ? "disabled" : ""}`}
      role="main"
      aria-busy={isLoading}
    >
      {/* Primary Content Area */}
      <div className="split-primary-content" role="region" aria-label="Main Content">
        {isLoading ? (
          <StateDisplay state="loading" message="Loading content..." />
        ) : (
          primaryContent
        )}
      </div>

      {/* Metadata Sidebar */}
      <aside className="split-metadata-sidebar" aria-label="Metadata">
        {isLoading ? (
          <StateDisplay state="loading" message="Loading metadata..." />
        ) : !hasContent ? (
          <StateDisplay state="empty" message={emptyMessage} />
        ) : isDisabled ? (
          <StateDisplay state="disabled" message="View is read-only" />
        ) : (
          <div className="metadata-sections-container" role="complementary">
            {visibleSections.map((section) => (
              <MetadataSection
                key={section.id}
                section={section}
                isDisabled={isDisabled}
                isOpen={openSections[section.id]}
                onOpenChange={(isOpen) => handleSectionToggle(section.id, isOpen)}
                onFieldInteraction={(fieldId) =>
                  handleFieldInteraction(fieldId, section.id)
                }
              />
            ))}
          </div>
        )}
      </aside>
    </div>
  );
}

export default SplitMetadataLayout;
