'use client';

import React, { useState } from 'react';
import type { ClanRole, MemberAction, MemberActionMenuProps } from './types';

/**
 * Which actions `currentUserRole` may take on a member holding `targetRole`.
 * - Leaders can manage officers and members, and transfer leadership.
 * - Officers can only promote/demote plain members (not other officers, and
 *   never the leader), and cannot kick.
 * - Members have no management actions available.
 */
function availableActions(currentUserRole: ClanRole, targetRole: ClanRole): MemberAction[] {
  if (targetRole === 'leader') {
    // Nobody manages the leader through this menu.
    return [];
  }

  if (currentUserRole === 'leader') {
    const actions: MemberAction[] = [];
    if (targetRole === 'member') {
      actions.push('promote');
    }
    if (targetRole === 'officer') {
      actions.push('demote', 'transfer');
    }
    actions.push('kick');
    return actions;
  }

  if (currentUserRole === 'officer') {
    if (targetRole === 'member') {
      return ['promote'];
    }
    return [];
  }

  return [];
}

const ACTION_LABELS: Record<MemberAction, string> = {
  promote: 'Promote to Officer',
  demote: 'Demote to Member',
  transfer: 'Transfer Leadership',
  kick: 'Kick Member',
};

const DESTRUCTIVE_ACTIONS: MemberAction[] = ['kick', 'demote'];

export const MemberActionMenu: React.FC<MemberActionMenuProps> = ({
  member,
  currentUserRole,
  onRoleChange,
  onKick,
  testId = `member-action-menu-${member.id}`,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<MemberAction | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const actions = availableActions(currentUserRole, member.role);

  if (actions.length === 0) {
    return null;
  }

  const runAction = async (action: MemberAction) => {
    setIsSubmitting(true);
    try {
      if (action === 'promote') {
        await onRoleChange(member.id, 'officer');
      } else if (action === 'demote') {
        await onRoleChange(member.id, 'member');
      } else if (action === 'transfer') {
        await onRoleChange(member.id, 'leader');
      } else if (action === 'kick') {
        await onKick(member.id);
      }
    } finally {
      setIsSubmitting(false);
      setPendingAction(null);
      setIsOpen(false);
    }
  };

  const handleSelect = (action: MemberAction) => {
    setIsOpen(false);
    if (DESTRUCTIVE_ACTIONS.includes(action)) {
      setPendingAction(action);
    } else {
      void runAction(action);
    }
  };

  return (
    <div className="member-action-menu" data-testid={testId}>
      <button
        type="button"
        className="member-action-menu__trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        data-testid={`${testId}-trigger`}
      >
        ⋮
      </button>

      {isOpen && (
        <ul className="member-action-menu__dropdown" role="menu" data-testid={`${testId}-dropdown`}>
          {actions.map((action) => (
            <li key={action} role="none">
              <button
                type="button"
                role="menuitem"
                className={`member-action-menu__item ${
                  DESTRUCTIVE_ACTIONS.includes(action) ? 'member-action-menu__item--destructive' : ''
                }`}
                onClick={() => handleSelect(action)}
                data-testid={`${testId}-action-${action}`}
              >
                {ACTION_LABELS[action]}
              </button>
            </li>
          ))}
        </ul>
      )}

      {pendingAction && (
        <div
          className="member-action-menu__confirm-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={`Confirm ${ACTION_LABELS[pendingAction]}`}
          data-testid={`${testId}-confirm`}
        >
          <div className="member-action-menu__confirm-box">
            <p>
              {ACTION_LABELS[pendingAction]} for <strong>{member.name}</strong>?
            </p>
            <div className="member-action-menu__confirm-actions">
              <button
                type="button"
                onClick={() => setPendingAction(null)}
                data-testid={`${testId}-confirm-cancel`}
              >
                Cancel
              </button>
              <button
                type="button"
                className="member-action-menu__confirm-confirm"
                onClick={() => runAction(pendingAction)}
                disabled={isSubmitting}
                aria-busy={isSubmitting}
                data-testid={`${testId}-confirm-ok`}
              >
                {isSubmitting ? 'Working…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

MemberActionMenu.displayName = 'MemberActionMenu';
export default MemberActionMenu;
