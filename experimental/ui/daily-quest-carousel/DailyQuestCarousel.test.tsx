import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { DailyQuestCarousel } from './DailyQuestCarousel';
import type { QuestItem } from './types';

const baseQuests: QuestItem[] = [
  {
    id: 'q1',
    title: 'Play 3 Matches',
    description: 'Complete 3 arcade matches today',
    category: 'daily',
    progress: 3,
    target: 3,
    reward: '500 XP',
    claimed: false,
  },
  {
    id: 'q2',
    title: 'Win a Duel',
    description: 'Win one trivia duel',
    category: 'daily',
    progress: 1,
    target: 2,
    reward: '1 Chest',
    claimed: false,
  },
  {
    id: 'q3',
    title: 'Weekly Streak',
    description: 'Play every day this week',
    category: 'weekly',
    progress: 5,
    target: 7,
    reward: '2000 XP',
    claimed: false,
  },
];

describe('DailyQuestCarousel', () => {
  it('renders active and completed quests for the active filter', () => {
    render(
      <DailyQuestCarousel
        quests={baseQuests}
        activeFilter="daily"
        onFilterChange={vi.fn()}
        onClaim={vi.fn()}
      />,
    );

    expect(screen.getByText('Play 3 Matches')).toBeInTheDocument();
    expect(screen.getByText('Win a Duel')).toBeInTheDocument();
    expect(screen.queryByText('Weekly Streak')).not.toBeInTheDocument();
  });

  it('switching filter tabs displays the correctly filtered items', () => {
    const onFilterChange = vi.fn();
    const { rerender } = render(
      <DailyQuestCarousel
        quests={baseQuests}
        activeFilter="daily"
        onFilterChange={onFilterChange}
        onClaim={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId('daily-quest-carousel-filter-weekly'));
    expect(onFilterChange).toHaveBeenCalledWith('weekly');

    rerender(
      <DailyQuestCarousel
        quests={baseQuests}
        activeFilter="weekly"
        onFilterChange={onFilterChange}
        onClaim={vi.fn()}
      />,
    );

    expect(screen.getByText('Weekly Streak')).toBeInTheDocument();
    expect(screen.queryByText('Play 3 Matches')).not.toBeInTheDocument();
  });

  it('marks the active filter tab as selected', () => {
    render(
      <DailyQuestCarousel
        quests={baseQuests}
        activeFilter="weekly"
        onFilterChange={vi.fn()}
        onClaim={vi.fn()}
      />,
    );

    expect(screen.getByTestId('daily-quest-carousel-filter-weekly')).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByTestId('daily-quest-carousel-filter-daily')).toHaveAttribute(
      'aria-selected',
      'false',
    );
  });

  it('claim button click on a completed quest triggers onClaim with the quest id', async () => {
    const onClaim = vi.fn().mockResolvedValue(undefined);
    render(
      <DailyQuestCarousel
        quests={baseQuests}
        activeFilter="daily"
        onFilterChange={vi.fn()}
        onClaim={onClaim}
      />,
    );

    const claimButton = screen.getByTestId('quest-card-q1-claim-button');
    expect(claimButton).not.toBeDisabled();
    fireEvent.click(claimButton);

    await waitFor(() => expect(onClaim).toHaveBeenCalledWith('q1'));
  });

  it('disables the claim button for an in-progress quest', () => {
    render(
      <DailyQuestCarousel
        quests={baseQuests}
        activeFilter="daily"
        onFilterChange={vi.fn()}
        onClaim={vi.fn()}
      />,
    );

    const claimButton = screen.getByTestId('quest-card-q2-claim-button');
    expect(claimButton).toBeDisabled();
    expect(claimButton).toHaveTextContent('1/2');
  });

  it('transitions the claim button into a loading state while claiming', async () => {
    let resolveClaim: () => void = () => {};
    const onClaim = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveClaim = resolve;
        }),
    );

    render(
      <DailyQuestCarousel
        quests={baseQuests}
        activeFilter="daily"
        onFilterChange={vi.fn()}
        onClaim={onClaim}
      />,
    );

    const claimButton = screen.getByTestId('quest-card-q1-claim-button');
    fireEvent.click(claimButton);

    await waitFor(() => expect(claimButton).toHaveTextContent('Claiming…'));
    expect(claimButton).toBeDisabled();

    resolveClaim();
    await waitFor(() => expect(onClaim).toHaveBeenCalledTimes(1));
  });

  it('shows a claim error message when onClaim rejects', async () => {
    const onClaim = vi.fn().mockRejectedValue(new Error('network down'));
    render(
      <DailyQuestCarousel
        quests={baseQuests}
        activeFilter="daily"
        onFilterChange={vi.fn()}
        onClaim={onClaim}
      />,
    );

    fireEvent.click(screen.getByTestId('quest-card-q1-claim-button'));

    await waitFor(() =>
      expect(screen.getByTestId('quest-card-q1-error')).toHaveTextContent('network down'),
    );
  });

  it('does not allow claiming an already-claimed quest', () => {
    // Include a second, still-active quest so the carousel doesn't fall
    // into its "all complete" empty state and hide the claimed card.
    const claimedQuests: QuestItem[] = [{ ...baseQuests[0], claimed: true }, baseQuests[1]];
    const onClaim = vi.fn();
    render(
      <DailyQuestCarousel
        quests={claimedQuests}
        activeFilter="daily"
        onFilterChange={vi.fn()}
        onClaim={onClaim}
      />,
    );

    const claimButton = screen.getByTestId('quest-card-q1-claim-button');
    expect(claimButton).toBeDisabled();
    expect(claimButton).toHaveTextContent('Claimed');
    fireEvent.click(claimButton);
    expect(onClaim).not.toHaveBeenCalled();
  });

  it('renders an empty state when all quests in the active filter are claimed', () => {
    const allClaimed: QuestItem[] = [{ ...baseQuests[0], claimed: true }];
    render(
      <DailyQuestCarousel
        quests={allClaimed}
        activeFilter="daily"
        onFilterChange={vi.fn()}
        onClaim={vi.fn()}
      />,
    );

    expect(screen.getByTestId('daily-quest-carousel-empty')).toBeInTheDocument();
  });

  it('renders an empty state when the active filter category has no quests', () => {
    render(
      <DailyQuestCarousel
        quests={baseQuests}
        activeFilter="milestone"
        onFilterChange={vi.fn()}
        onClaim={vi.fn()}
      />,
    );

    expect(screen.getByTestId('daily-quest-carousel-empty')).toBeInTheDocument();
  });

  it('exposes left/right scroll arrows that call scrollBy on the track', () => {
    render(
      <DailyQuestCarousel
        quests={baseQuests}
        activeFilter="daily"
        onFilterChange={vi.fn()}
        onClaim={vi.fn()}
      />,
    );

    const track = screen.getByTestId('daily-quest-carousel-track');
    const scrollBySpy = vi.fn();
    // jsdom does not implement scrollBy; stub it to verify wiring.
    (track as unknown as { scrollBy: typeof scrollBySpy }).scrollBy = scrollBySpy;

    fireEvent.click(screen.getByTestId('daily-quest-carousel-arrow-right'));
    expect(scrollBySpy).toHaveBeenCalledWith({ left: 240, behavior: 'smooth' });

    fireEvent.click(screen.getByTestId('daily-quest-carousel-arrow-left'));
    expect(scrollBySpy).toHaveBeenCalledWith({ left: -240, behavior: 'smooth' });
  });
});
