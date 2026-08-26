import React, { useState, useRef, useEffect } from 'react';
import { GlobalChatWidgetProps } from './types';
import { EmojiPickerDropdown } from './EmojiPickerDropdown';

export const GlobalChatWidget: React.FC<GlobalChatWidgetProps> = ({
  messages,
  currentUser,
  onSendMessage,
  onTipUser,
  isOpenDefault = true,
  maxCharCount = 200,
}) => {
  const [isOpen, setIsOpen] = useState(isOpenDefault);
  const [inputText, setInputText] = useState('');
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSentTime, setLastSentTime] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isSubmitting) return;

    // Rate limiting: 1 second threshold
    const now = Date.now();
    if (now - lastSentTime < 1000) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSendMessage(trimmed);
      setInputText('');
      setLastSentTime(Date.now());
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInsertEmoji = (emoji: string) => {
    if (!inputRef.current) {
      setInputText((prev) => prev + emoji);
      return;
    }
    const start = inputRef.current.selectionStart || inputText.length;
    const end = inputRef.current.selectionEnd || inputText.length;
    const newText = inputText.substring(0, start) + emoji + inputText.substring(end);
    setInputText(newText);
  };

  return (
    <div className={`global-chat-widget ${isOpen ? 'open' : 'collapsed'}`} data-testid="global-chat-widget">
      <div className="chat-header" onClick={() => setIsOpen(!isOpen)} data-testid="chat-header">
        <span className="chat-title">Arcade Live Chat</span>
        <button
          className="toggle-btn"
          aria-label={isOpen ? 'Collapse Chat' : 'Expand Chat'}
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          data-testid="toggle-chat-btn"
        >
          {isOpen ? '▼' : '▲'}
        </button>
      </div>

      {isOpen && (
        <div className="chat-body" data-testid="chat-body">
          <div className="messages-list" data-testid="messages-list">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`chat-message ${msg.isSystemAnnouncement ? 'system-announcement' : ''}`}
                data-testid={`chat-message-${msg.id}`}
              >
                {msg.isSystemAnnouncement ? (
                  <div className="announcement-banner">
                    📢 <span className="announcement-text">{msg.text}</span>
                  </div>
                ) : (
                  <>
                    <div className="message-header">
                      {msg.sender.levelBadge && <span className="level-badge">{msg.sender.levelBadge}</span>}
                      <span className="username">{msg.sender.username}</span>
                      <span className="timestamp">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {onTipUser && msg.sender.walletAddress && msg.sender.id !== currentUser.id && (
                        <button
                          type="button"
                          className="tip-btn"
                          data-testid={`tip-btn-${msg.sender.id}`}
                          onClick={() => onTipUser(msg.sender.walletAddress!)}
                        >
                          Tip
                        </button>
                      )}
                    </div>
                    <div className="message-content">{msg.text}</div>
                  </>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form className="chat-input-bar" onSubmit={handleSend} data-testid="chat-form">
            <div className="input-row">
              <input
                ref={inputRef}
                type="text"
                className="chat-input"
                data-testid="chat-input"
                placeholder="Type a message..."
                maxLength={maxCharCount}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              <button
                type="button"
                className="emoji-toggle-btn"
                data-testid="emoji-toggle-btn"
                onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
              >
                😊
              </button>
              <button
                type="submit"
                className="send-btn"
                data-testid="send-btn"
                disabled={!inputText.trim() || inputText.length > maxCharCount || isSubmitting}
              >
                Send
              </button>
            </div>
            <div className="input-meta">
              <span className="char-counter" data-testid="char-counter">
                {inputText.length}/{maxCharCount}
              </span>
            </div>
            <EmojiPickerDropdown
              isOpen={isEmojiPickerOpen}
              onSelectEmoji={handleInsertEmoji}
              onClose={() => setIsEmojiPickerOpen(false)}
            />
          </form>
        </div>
      )}
    </div>
  );
};
