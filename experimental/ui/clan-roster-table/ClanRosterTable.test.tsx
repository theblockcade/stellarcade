import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import React from 'react';
import { ClanRosterTable } from './ClanRosterTable';
import type { ClanMember } from './types';

const members: ClanMember[] = [
  {
    id: 'm1',
    name: 'Alice',
    role: 'leader',
    trophies: 5000,
    lastActive: '2026-08-20T00:00:00.000Z',
  },
  {
    id: 'm2',
    name: 'Bob',
    role: 'officer',
    trophies: 3200,
    lastActive: '2026-08-22T00:00:00.000Z',
  },
  {
    id: 'm3',
    name: 'Charlie',
    role: 'member',
    trophies: 1800,
    lastActive: '2026-08-15T00:00:00.000Z',
  },
];

describe('ClanRosterTable', () => {
  it('renders all members with rank, role, and trophy columns', () => {
    render(
      <ClanRosterTable
        members={members}
        currentUserRole="leader"
        onRoleChange={vi.fn()}
        onKick={vi.fn()}
      />,
    );

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
    expect(screen.getByText('Leader')).toBeInTheDocument();
    expect(screen.getByText('Officer')).toBeInTheDocument();
    expect(screen.getByText('Member')).toBeInTheDocument();
  });

  it('sorts by trophies (default) descending', () => {
    render(
      <ClanRosterTable
        members={members}
        currentUserRole="leader"
        onRoleChange={vi.fn()}
        onKick={vi.fn()}
      />,
    );

    const rows = screen.getAllByRole('row').slice(1); // skip header row
    expect(within(rows[0]).getByText('Alice')).toBeInTheDocument();
    expect(within(rows[1]).getByText('Bob')).toBeInTheDocument();
    expect(within(rows[2]).getByText('Charlie')).toBeInTheDocument();
  });

  it('sorting by trophies toggles ascending on repeated click', () => {
    render(
      <ClanRosterTable
        members={members}
        currentUserRole="leader"
        onRoleChange={vi.fn()}
        onKick={vi.fn()}
      />,
    );

    // First click switches the already-active trophies column to ascending.
    fireEvent.click(screen.getByTestId('clan-roster-table-sort-trophies'));

    const rows = screen.getAllByRole('row').slice(1);
    expect(within(rows[0]).getByText('Charlie')).toBeInTheDocument();
    expect(within(rows[2]).getByText('Alice')).toBeInTheDocument();
  });

  it('sorting by name orders alphabetically and sets aria-sort', () => {
    render(
      <ClanRosterTable
        members={members}
        currentUserRole="leader"
        onRoleChange={vi.fn()}
        onKick={vi.fn()}
      />,
    );

    // Switching to a new sort column starts descending (Z→A) by default.
    fireEvent.click(screen.getByTestId('clan-roster-table-sort-name'));

    let rows = screen.getAllByRole('row').slice(1);
    expect(within(rows[0]).getByText('Charlie')).toBeInTheDocument();
    expect(within(rows[1]).getByText('Bob')).toBeInTheDocument();
    expect(within(rows[2]).getByText('Alice')).toBeInTheDocument();

    const nameHeader = screen.getByTestId('clan-roster-table-sort-name').closest('th');
    expect(nameHeader).toHaveAttribute('aria-sort', 'descending');

    // Clicking the same column again reverses to ascending (A→Z).
    fireEvent.click(screen.getByTestId('clan-roster-table-sort-name'));
    rows = screen.getAllByRole('row').slice(1);
    expect(within(rows[0]).getByText('Alice')).toBeInTheDocument();
    expect(within(rows[1]).getByText('Bob')).toBeInTheDocument();
    expect(within(rows[2]).getByText('Charlie')).toBeInTheDocument();
    expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
  });

  it('search filter narrows down table rows by name', () => {
    render(
      <ClanRosterTable
        members={members}
        currentUserRole="leader"
        onRoleChange={vi.fn()}
        onKick={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByTestId('clan-roster-table-search'), {
      target: { value: 'bo' },
    });

    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
    expect(screen.queryByText('Charlie')).not.toBeInTheDocument();
  });

  it('shows an empty state message when the search yields no matches', () => {
    render(
      <ClanRosterTable
        members={members}
        currentUserRole="leader"
        onRoleChange={vi.fn()}
        onKick={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByTestId('clan-roster-table-search'), {
      target: { value: 'nobody-named-this' },
    });

    expect(screen.getByText(/No members match/)).toBeInTheDocument();
  });

  it('search is case-insensitive', () => {
    render(
      <ClanRosterTable
        members={members}
        currentUserRole="leader"
        onRoleChange={vi.fn()}
        onKick={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByTestId('clan-roster-table-search'), {
      target: { value: 'ALICE' },
    });

    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  describe('action menu permissions', () => {
    it('leader sees promote, kick for a member row', () => {
      render(
        <ClanRosterTable
          members={members}
          currentUserRole="leader"
          onRoleChange={vi.fn()}
          onKick={vi.fn()}
        />,
      );

      fireEvent.click(screen.getByTestId('member-action-menu-m3-trigger'));
      expect(screen.getByTestId('member-action-menu-m3-action-promote')).toBeInTheDocument();
      expect(screen.getByTestId('member-action-menu-m3-action-kick')).toBeInTheDocument();
      expect(screen.queryByTestId('member-action-menu-m3-action-demote')).not.toBeInTheDocument();
    });

    it('leader sees demote, transfer, kick for an officer row', () => {
      render(
        <ClanRosterTable
          members={members}
          currentUserRole="leader"
          onRoleChange={vi.fn()}
          onKick={vi.fn()}
        />,
      );

      fireEvent.click(screen.getByTestId('member-action-menu-m2-trigger'));
      expect(screen.getByTestId('member-action-menu-m2-action-demote')).toBeInTheDocument();
      expect(screen.getByTestId('member-action-menu-m2-action-transfer')).toBeInTheDocument();
      expect(screen.getByTestId('member-action-menu-m2-action-kick')).toBeInTheDocument();
    });

    it('no action menu is rendered for the leader row', () => {
      render(
        <ClanRosterTable
          members={members}
          currentUserRole="leader"
          onRoleChange={vi.fn()}
          onKick={vi.fn()}
        />,
      );

      expect(screen.queryByTestId('member-action-menu-m1-trigger')).not.toBeInTheDocument();
    });

    it('a plain member sees no action menus at all', () => {
      render(
        <ClanRosterTable
          members={members}
          currentUserRole="member"
          onRoleChange={vi.fn()}
          onKick={vi.fn()}
        />,
      );

      expect(screen.queryByTestId('member-action-menu-m2-trigger')).not.toBeInTheDocument();
      expect(screen.queryByTestId('member-action-menu-m3-trigger')).not.toBeInTheDocument();
    });

    it('an officer can only promote plain members, and cannot manage other officers', () => {
      render(
        <ClanRosterTable
          members={members}
          currentUserRole="officer"
          onRoleChange={vi.fn()}
          onKick={vi.fn()}
        />,
      );

      // Can act on a member.
      fireEvent.click(screen.getByTestId('member-action-menu-m3-trigger'));
      expect(screen.getByTestId('member-action-menu-m3-action-promote')).toBeInTheDocument();
      expect(screen.queryByTestId('member-action-menu-m3-action-kick')).not.toBeInTheDocument();

      // No menu at all on a peer officer.
      expect(screen.queryByTestId('member-action-menu-m2-trigger')).not.toBeInTheDocument();
    });

    it('promote calls onRoleChange with officer immediately (non-destructive, no confirmation)', async () => {
      const onRoleChange = vi.fn().mockResolvedValue(undefined);
      render(
        <ClanRosterTable
          members={members}
          currentUserRole="leader"
          onRoleChange={onRoleChange}
          onKick={vi.fn()}
        />,
      );

      fireEvent.click(screen.getByTestId('member-action-menu-m3-trigger'));
      fireEvent.click(screen.getByTestId('member-action-menu-m3-action-promote'));

      await waitFor(() => expect(onRoleChange).toHaveBeenCalledWith('m3', 'officer'));
      expect(screen.queryByTestId('member-action-menu-m3-confirm')).not.toBeInTheDocument();
    });

    it('kick requires confirmation before calling onKick', async () => {
      const onKick = vi.fn().mockResolvedValue(undefined);
      render(
        <ClanRosterTable
          members={members}
          currentUserRole="leader"
          onRoleChange={vi.fn()}
          onKick={onKick}
        />,
      );

      fireEvent.click(screen.getByTestId('member-action-menu-m3-trigger'));
      fireEvent.click(screen.getByTestId('member-action-menu-m3-action-kick'));

      expect(screen.getByTestId('member-action-menu-m3-confirm')).toBeInTheDocument();
      expect(onKick).not.toHaveBeenCalled();

      fireEvent.click(screen.getByTestId('member-action-menu-m3-confirm-ok'));
      await waitFor(() => expect(onKick).toHaveBeenCalledWith('m3'));
    });

    it('cancelling the kick confirmation does not call onKick', () => {
      const onKick = vi.fn();
      render(
        <ClanRosterTable
          members={members}
          currentUserRole="leader"
          onRoleChange={vi.fn()}
          onKick={onKick}
        />,
      );

      fireEvent.click(screen.getByTestId('member-action-menu-m3-trigger'));
      fireEvent.click(screen.getByTestId('member-action-menu-m3-action-kick'));
      fireEvent.click(screen.getByTestId('member-action-menu-m3-confirm-cancel'));

      expect(screen.queryByTestId('member-action-menu-m3-confirm')).not.toBeInTheDocument();
      expect(onKick).not.toHaveBeenCalled();
    });

    it('demote requires confirmation before calling onRoleChange', async () => {
      const onRoleChange = vi.fn().mockResolvedValue(undefined);
      render(
        <ClanRosterTable
          members={members}
          currentUserRole="leader"
          onRoleChange={onRoleChange}
          onKick={vi.fn()}
        />,
      );

      fireEvent.click(screen.getByTestId('member-action-menu-m2-trigger'));
      fireEvent.click(screen.getByTestId('member-action-menu-m2-action-demote'));
      expect(onRoleChange).not.toHaveBeenCalled();

      fireEvent.click(screen.getByTestId('member-action-menu-m2-confirm-ok'));
      await waitFor(() => expect(onRoleChange).toHaveBeenCalledWith('m2', 'member'));
    });
  });
});
