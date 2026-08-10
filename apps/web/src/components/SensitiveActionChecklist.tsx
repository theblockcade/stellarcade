import React, { useMemo } from "react";

export interface SensitiveActionChecklistItem {
  id: string;
  label: string;
}

export interface SensitiveActionChecklistProps {
  items: SensitiveActionChecklistItem[];
  checkedIds: string[];
  onToggle: (id: string) => void;
  className?: string;
  testId?: string;
}

export const SensitiveActionChecklist: React.FC<SensitiveActionChecklistProps> = ({
  items,
  checkedIds,
  onToggle,
  className = "",
  testId = "sensitive-action-checklist",
}) => {
  const checkedSet = useMemo(() => new Set(checkedIds), [checkedIds]);

  return (
    <fieldset className={className} data-testid={testId}>
      <legend>Review checklist</legend>
      {items.map((item) => (
        <label key={item.id} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <input
            type="checkbox"
            checked={checkedSet.has(item.id)}
            onChange={() => onToggle(item.id)}
          />
          <span>{item.label}</span>
        </label>
      ))}
    </fieldset>
  );
};

export default SensitiveActionChecklist;
