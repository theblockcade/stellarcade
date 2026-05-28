import { StateDisplayProps } from "./types";
import "./StateDisplay.css";

/**
 * StateDisplay Component
 *
 * Renders loading, empty, error, or disabled states with consistent styling.
 * Used as fallback when metadata is not available or system is in a special state.
 */
export function StateDisplay({
  state,
  message,
  icon,
}: StateDisplayProps) {
  const defaultMessages: Record<string, string> = {
    empty: "No metadata available",
    loading: "Loading...",
    error: "Failed to load metadata",
    disabled: "View is read-only",
  };

  const defaultIcons: Record<string, string> = {
    empty: "◌",
    loading: "⟳",
    error: "⚠",
    disabled: "🔒",
  };

  return (
    <div className={`state-display state-${state}`} role="status" aria-live="polite">
      <div className={`state-icon ${state === "loading" ? "animate-spin" : ""}`}>
        {icon || defaultIcons[state]}
      </div>
      <div className="state-message">
        {message || defaultMessages[state]}
      </div>
    </div>
  );
}
