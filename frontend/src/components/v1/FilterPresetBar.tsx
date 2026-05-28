import React, { useCallback, useEffect, useRef, useState } from 'react';
import './FilterPresetBar.css';

export interface FilterPreset<T = Record<string, unknown>> {
  id: string;
  name: string;
  filters: T;
  savedAt: number;
}

export interface FilterPresetBarProps<T = Record<string, unknown>> {
  scope: string;
  currentFilters: T;
  onApply: (preset: FilterPreset<T>) => void;
  testId?: string;
}

function storageKey(scope: string) {
  return `stellarcade.filter-presets.${scope}`;
}

function loadPresets<T>(scope: string): FilterPreset<T>[] {
  try {
    const raw = localStorage.getItem(storageKey(scope));
    return raw ? (JSON.parse(raw) as FilterPreset<T>[]) : [];
  } catch {
    return [];
  }
}

function savePresets<T>(scope: string, presets: FilterPreset<T>[]): void {
  try {
    localStorage.setItem(storageKey(scope), JSON.stringify(presets));
  } catch {
    // storage full — silently ignore
  }
}

export function FilterPresetBar<T = Record<string, unknown>>({
  scope,
  currentFilters,
  onApply,
  testId = 'filter-preset-bar',
}: FilterPresetBarProps<T>): React.ReactElement {
  const [presets, setPresets] = useState<FilterPreset<T>[]>(() => loadPresets<T>(scope));
  const [inputName, setInputName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPresets(loadPresets<T>(scope));
  }, [scope]);

  const handleSave = useCallback(() => {
    const name = inputName.trim();
    if (!name) return;
    const newPreset: FilterPreset<T> = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name,
      filters: currentFilters,
      savedAt: Date.now(),
    };
    const updated = [...presets, newPreset];
    setPresets(updated);
    savePresets(scope, updated);
    setInputName('');
    inputRef.current?.focus();
  }, [inputName, currentFilters, presets, scope]);

  const handleDelete = useCallback((id: string) => {
    const updated = presets.filter((p) => p.id !== id);
    setPresets(updated);
    savePresets(scope, updated);
  }, [presets, scope]);

  const handleApply = useCallback((preset: FilterPreset<T>) => {
    onApply(preset);
  }, [onApply]);

  return (
    <div className="filter-preset-bar" data-testid={testId} role="region" aria-label="Filter presets">
      <div className="filter-preset-bar__save-row">
        <input
          ref={inputRef}
          className="filter-preset-bar__input"
          type="text"
          placeholder="Preset name…"
          value={inputName}
          onChange={(e) => setInputName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
          aria-label="New preset name"
          data-testid={`${testId}-name-input`}
        />
        <button
          type="button"
          className="filter-preset-bar__save-btn"
          onClick={handleSave}
          disabled={!inputName.trim()}
          data-testid={`${testId}-save-btn`}
        >
          Save preset
        </button>
      </div>

      {presets.length === 0 ? (
        <p className="filter-preset-bar__empty" data-testid={`${testId}-empty`}>
          No saved presets yet.
        </p>
      ) : (
        <ul className="filter-preset-bar__list" data-testid={`${testId}-list`}>
          {presets.map((preset) => (
            <li key={preset.id} className="filter-preset-bar__item" data-testid={`${testId}-item-${preset.id}`}>
              <button
                type="button"
                className="filter-preset-bar__apply-btn"
                onClick={() => handleApply(preset)}
                data-testid={`${testId}-apply-${preset.id}`}
              >
                {preset.name}
              </button>
              <button
                type="button"
                className="filter-preset-bar__delete-btn"
                onClick={() => handleDelete(preset.id)}
                aria-label={`Delete preset ${preset.name}`}
                data-testid={`${testId}-delete-${preset.id}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default FilterPresetBar;
