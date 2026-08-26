import React from 'react';

export interface EmojiPickerDropdownProps {
  isOpen: boolean;
  onSelectEmoji: (emoji: string) => void;
  onClose: () => void;
}

const COMMON_EMOJIS = ['👍', '🔥', '🚀', '🎉', '🏆', '💎', '🎮', '💯', '😎', '⭐'];

export const EmojiPickerDropdown: React.FC<EmojiPickerDropdownProps> = ({
  isOpen,
  onSelectEmoji,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="emoji-picker-dropdown" data-testid="emoji-picker-dropdown">
      <div className="emoji-picker-grid">
        {COMMON_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            className="emoji-btn"
            type="button"
            data-testid={`emoji-option-${emoji}`}
            onClick={() => {
              onSelectEmoji(emoji);
              onClose();
            }}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};
