import { useState, useId, useCallback } from "react";
import { MetadataField, MetadataSectionProps } from "./types";
import "./MetadataSection.css";

/**
 * MetadataSection Component
 *
 * Renders a collapsible or static section of metadata fields.
 * Supports loading, empty, and disabled states with keyboard navigation.
 */
export function MetadataSection({
  section,
  isDisabled = false,
  onFieldInteraction,
  isOpen: controlledIsOpen,
  onOpenChange,
}: MetadataSectionProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(section.defaultOpen ?? true);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const sectionId = useId();

  const handleToggle = useCallback(() => {
    const newState = !isOpen;
    setInternalIsOpen(newState);
    onOpenChange?.(newState);
  }, [isOpen, onOpenChange]);

  const visibleFields = section.fields.filter((f) => f.visible !== false);

  if (!section.visible) {
    return null;
  }

  return (
    <div
      className={`metadata-section ${isDisabled ? "disabled" : ""}`}
      role="region"
      aria-label={section.title}
    >
      {section.collapsible ? (
        <>
          <button
            className="metadata-section-header"
            onClick={handleToggle}
            aria-expanded={isOpen}
            aria-controls={sectionId}
            disabled={isDisabled}
          >
            <span className="section-title">{section.title}</span>
            <span
              className={`toggle-icon ${isOpen ? "open" : "closed"}`}
              aria-hidden="true"
            >
              ▶
            </span>
          </button>

          {isOpen && (
            <div id={sectionId} className="metadata-section-content" role="group">
              {visibleFields.length === 0 ? (
                <div className="metadata-empty-state">
                  <p>No metadata available</p>
                </div>
              ) : (
                <div className="fields-grid">
                  {visibleFields.map((field) => (
                    <MetadataFieldComponent
                      key={field.id}
                      field={field}
                      isDisabled={isDisabled}
                      onInteraction={() => onFieldInteraction?.(field.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="metadata-section-static">
          <h3 className="section-title">{section.title}</h3>
          {visibleFields.length === 0 ? (
            <div className="metadata-empty-state">
              <p>No metadata available</p>
            </div>
          ) : (
            <div className="fields-grid" role="group">
              {visibleFields.map((field) => (
                <MetadataFieldComponent
                  key={field.id}
                  field={field}
                  isDisabled={isDisabled}
                  onInteraction={() => onFieldInteraction?.(field.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Internal component for rendering individual metadata fields
 */
interface MetadataFieldComponentProps {
  field: MetadataField;
  isDisabled?: boolean;
  onInteraction?: () => void;
}

function MetadataFieldComponent({
  field,
  isDisabled: _isDisabled = false,
  onInteraction,
}: MetadataFieldComponentProps) {
  const fieldId = useId();

  return (
    <div
      className={`metadata-field ${field.loading ? "loading" : ""}`}
      data-field-id={field.id}
      onClick={onInteraction}
      role="article"
      aria-labelledby={fieldId}
    >
      <label htmlFor={fieldId} className="field-label">
        {field.label}
        {field.helpText && (
          <span
            className="help-icon"
            title={field.helpText}
            aria-label={`Help: ${field.helpText}`}
          >
            ℹ
          </span>
        )}
      </label>

      {field.loading ? (
        <div className="field-loading">
          <div className="skeleton skeleton-line" aria-label="Loading..." />
        </div>
      ) : (
        <div className="field-value" id={fieldId}>
          {field.value || <span className="text-dim">—</span>}
        </div>
      )}
    </div>
  );
}
