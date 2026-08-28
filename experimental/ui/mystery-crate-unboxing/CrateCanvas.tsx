import React from 'react';
import { CrateState, RewardRarity } from './types';

export interface CrateCanvasProps {
  state: CrateState;
  rarity?: RewardRarity;
  /** Renders the CSS-only fallback (no particle layer) for low-performance
   * devices, per the issue's accessibility/perf requirement. */
  reducedEffects?: boolean;
}

const RARITY_GLOW_CLASS: Record<RewardRarity, string> = {
  common: 'crate-glow-common',
  rare: 'crate-glow-rare',
  epic: 'crate-glow-epic',
  legendary: 'crate-glow-legendary',
};

export const CrateCanvas: React.FC<CrateCanvasProps> = ({ state, rarity, reducedEffects }) => {
  const glowClass = rarity ? RARITY_GLOW_CLASS[rarity] : '';

  return (
    <div
      className={`crate-canvas crate-canvas--${state}${reducedEffects ? ' crate-canvas--reduced' : ''}`}
      data-testid="crate-canvas"
      data-state={state}
    >
      <div className={`crate-box crate-box--${state}`} data-testid="crate-box">
        📦
      </div>

      {state === 'opening' && (
        <div className="crate-light-rays" data-testid="crate-light-rays" />
      )}

      {state === 'opened' && !reducedEffects && (
        <div className={`crate-particles ${glowClass}`} data-testid="crate-particles">
          {Array.from({ length: 12 }).map((_, i) => (
            <span key={i} className="crate-particle" />
          ))}
        </div>
      )}
    </div>
  );
};
