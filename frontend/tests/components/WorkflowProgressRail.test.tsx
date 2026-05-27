/**
 * @vitest-environment happy-dom
 */

import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  WorkflowProgressRail,
  type WorkflowStep,
} from '@/components/v1/WorkflowProgressRail';

const GAME_JOIN_STEPS: WorkflowStep[] = [
  { id: 'browse', label: 'Browse', description: 'Select a game' },
  { id: 'wager', label: 'Set Wager', description: 'Choose your stake' },
  { id: 'review', label: 'Review', description: 'Confirm details' },
  { id: 'confirm', label: 'Confirm', description: 'Sign transaction' },
  { id: 'done', label: 'Done', description: 'Match started' },
];

describe('WorkflowProgressRail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Primary Success Path', () => {
    it('renders all step labels', () => {
      render(<WorkflowProgressRail steps={GAME_JOIN_STEPS} currentStepIndex={0} />);

      expect(screen.getByText('Browse')).toBeInTheDocument();
      expect(screen.getByText('Set Wager')).toBeInTheDocument();
      expect(screen.getByText('Review')).toBeInTheDocument();
      expect(screen.getByText('Confirm')).toBeInTheDocument();
      expect(screen.getByText('Done')).toBeInTheDocument();
    });

    it('marks the active step with aria-current="step"', () => {
      render(<WorkflowProgressRail steps={GAME_JOIN_STEPS} currentStepIndex={2} />);

      const reviewStep = screen.getByTestId('workflow-progress-rail-step-2');
      const activeEl = reviewStep.querySelector('[aria-current="step"]');
      expect(activeEl).toBeInTheDocument();
    });

    it('derives completed status for steps before currentStepIndex', () => {
      render(<WorkflowProgressRail steps={GAME_JOIN_STEPS} currentStepIndex={2} />);

      expect(screen.getByTestId('workflow-progress-rail-step-0').querySelector('[data-step-status="completed"]')).toBeInTheDocument();
      expect(screen.getByTestId('workflow-progress-rail-step-1').querySelector('[data-step-status="completed"]')).toBeInTheDocument();
    });

    it('derives pending status for steps after currentStepIndex', () => {
      render(<WorkflowProgressRail steps={GAME_JOIN_STEPS} currentStepIndex={2} />);

      expect(screen.getByTestId('workflow-progress-rail-step-3').querySelector('[data-step-status="pending"]')).toBeInTheDocument();
      expect(screen.getByTestId('workflow-progress-rail-step-4').querySelector('[data-step-status="pending"]')).toBeInTheDocument();
    });

    it('renders connectors between steps (n-1 connectors for n steps)', () => {
      render(<WorkflowProgressRail steps={GAME_JOIN_STEPS} currentStepIndex={0} />);

      for (let i = 0; i < GAME_JOIN_STEPS.length - 1; i++) {
        expect(
          screen.getByTestId(`workflow-progress-rail-connector-${i}`),
        ).toBeInTheDocument();
      }
      expect(
        screen.queryByTestId(`workflow-progress-rail-connector-${GAME_JOIN_STEPS.length - 1}`),
      ).not.toBeInTheDocument();
    });

    it('calls onStepClick with id and index when a completed step is clicked', () => {
      const mockClick = vi.fn();
      render(
        <WorkflowProgressRail
          steps={GAME_JOIN_STEPS}
          currentStepIndex={3}
          onStepClick={mockClick}
        />,
      );

      const wagerStepEl = screen
        .getByTestId('workflow-progress-rail-step-1')
        .querySelector('[data-step-id="wager"]')!;

      fireEvent.click(wagerStepEl);
      expect(mockClick).toHaveBeenCalledWith('wager', 1);
    });

    it('does not call onStepClick for the active or pending steps', () => {
      const mockClick = vi.fn();
      render(
        <WorkflowProgressRail
          steps={GAME_JOIN_STEPS}
          currentStepIndex={2}
          onStepClick={mockClick}
        />,
      );

      // click active step
      const activeEl = screen.getByTestId('workflow-progress-rail-step-2')
        .querySelector('[data-step-id="review"]')!;
      fireEvent.click(activeEl);

      // click pending step
      const pendingEl = screen.getByTestId('workflow-progress-rail-step-3')
        .querySelector('[data-step-id="confirm"]')!;
      fireEvent.click(pendingEl);

      expect(mockClick).not.toHaveBeenCalled();
    });
  });

  describe('Explicit per-step status', () => {
    it('respects explicit step status overrides', () => {
      const steps: WorkflowStep[] = [
        { id: 'a', label: 'Alpha', status: 'completed' },
        { id: 'b', label: 'Beta', status: 'error' },
        { id: 'c', label: 'Gamma', status: 'blocked' },
      ];

      render(<WorkflowProgressRail steps={steps} />);

      expect(
        screen.getByTestId('workflow-progress-rail-step-0').querySelector('[data-step-status="completed"]'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('workflow-progress-rail-step-1').querySelector('[data-step-status="error"]'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('workflow-progress-rail-step-2').querySelector('[data-step-status="blocked"]'),
      ).toBeInTheDocument();
    });

    it('allows clicking an error step', () => {
      const mockClick = vi.fn();
      const steps: WorkflowStep[] = [
        { id: 'a', label: 'Alpha', status: 'completed' },
        { id: 'b', label: 'Beta', status: 'error' },
      ];

      render(<WorkflowProgressRail steps={steps} onStepClick={mockClick} />);

      fireEvent.click(
        screen.getByTestId('workflow-progress-rail-step-1').querySelector('[data-step-id="b"]')!,
      );
      expect(mockClick).toHaveBeenCalledWith('b', 1);
    });
  });

  describe('Edge Cases and Fallback Behavior', () => {
    it('shows empty state when steps array is empty', () => {
      render(<WorkflowProgressRail steps={[]} />);

      expect(screen.getByTestId('workflow-progress-rail-empty')).toBeInTheDocument();
      expect(screen.getByText('No steps defined')).toBeInTheDocument();
    });

    it('clamps currentStepIndex to valid range', () => {
      render(<WorkflowProgressRail steps={GAME_JOIN_STEPS} currentStepIndex={999} />);

      // Last step should be active when index is out of bounds
      const lastStep = screen.getByTestId(`workflow-progress-rail-step-${GAME_JOIN_STEPS.length - 1}`);
      expect(lastStep.querySelector('[data-step-status="active"]')).toBeInTheDocument();
    });

    it('hides labels when showLabels is false', () => {
      render(
        <WorkflowProgressRail
          steps={GAME_JOIN_STEPS}
          currentStepIndex={0}
          showLabels={false}
        />,
      );

      expect(screen.queryByText('Browse')).not.toBeInTheDocument();
    });

    it('applies compact size class', () => {
      render(<WorkflowProgressRail steps={GAME_JOIN_STEPS} size="compact" />);

      expect(screen.getByTestId('workflow-progress-rail')).toHaveClass('wpr--compact');
    });

    it('applies vertical orientation class', () => {
      render(<WorkflowProgressRail steps={GAME_JOIN_STEPS} orientation="vertical" />);

      expect(screen.getByTestId('workflow-progress-rail')).toHaveClass('wpr--vertical');
    });

    it('blocked step is not clickable even with onStepClick provided', () => {
      const mockClick = vi.fn();
      const steps: WorkflowStep[] = [
        { id: 'a', label: 'Alpha', status: 'completed' },
        { id: 'b', label: 'Beta', status: 'blocked' },
      ];

      render(<WorkflowProgressRail steps={steps} onStepClick={mockClick} />);

      fireEvent.click(
        screen.getByTestId('workflow-progress-rail-step-1').querySelector('[data-step-id="b"]')!,
      );
      expect(mockClick).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('renders a nav element with aria-label', () => {
      render(<WorkflowProgressRail steps={GAME_JOIN_STEPS} currentStepIndex={0} />);

      expect(screen.getByRole('navigation', { name: 'Workflow progress' })).toBeInTheDocument();
    });

    it('gives each step an aria-label including its status', () => {
      render(<WorkflowProgressRail steps={GAME_JOIN_STEPS} currentStepIndex={1} />);

      // Step 0 is completed
      expect(
        screen
          .getByTestId('workflow-progress-rail-step-0')
          .querySelector('[aria-label="Browse: Completed"]'),
      ).toBeInTheDocument();

      // Step 1 is active
      expect(
        screen
          .getByTestId('workflow-progress-rail-step-1')
          .querySelector('[aria-label="Set Wager: Current"]'),
      ).toBeInTheDocument();
    });

    it('exposes clickable completed steps as buttons via role', () => {
      render(
        <WorkflowProgressRail
          steps={GAME_JOIN_STEPS}
          currentStepIndex={2}
          onStepClick={() => {}}
        />,
      );

      // Steps 0 and 1 are completed and should have role="button"
      const step0 = screen
        .getByTestId('workflow-progress-rail-step-0')
        .querySelector('[role="button"]');
      expect(step0).toBeInTheDocument();
    });

    it('supports Enter key to activate a completed step', () => {
      const mockClick = vi.fn();
      render(
        <WorkflowProgressRail
          steps={GAME_JOIN_STEPS}
          currentStepIndex={2}
          onStepClick={mockClick}
        />,
      );

      const btn = screen
        .getByTestId('workflow-progress-rail-step-0')
        .querySelector<HTMLElement>('[role="button"]')!;

      btn.focus();
      fireEvent.keyDown(btn, { key: 'Enter' });
      expect(mockClick).toHaveBeenCalledWith('browse', 0);
    });
  });
});
