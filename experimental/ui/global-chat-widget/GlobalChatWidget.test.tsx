import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GlobalChatWidget } from './GlobalChatWidget';
import { ChatMessage, ChatUser } from './types';

describe('GlobalChatWidget', () => {
  const currentUser: ChatUser = { id: 'u1', username: 'PlayerOne', levelBadge: 'Lvl 10' };
  const sampleMessages: ChatMessage[] = [
    { id: 'm1', sender: { id: 'u2', username: 'PlayerTwo', levelBadge: 'Lvl 5' }, text: 'GL HF!', timestamp: Date.now() },
    { id: 'm2', sender: currentUser, text: 'System announcement', timestamp: Date.now(), isSystemAnnouncement: true },
  ];

  it('renders message history and character counter', () => {
    render(
      <GlobalChatWidget
        messages={sampleMessages}
        currentUser={currentUser}
        onSendMessage={vi.fn()}
      />
    );

    expect(screen.getByTestId('global-chat-widget')).toBeDefined();
    expect(screen.getByText('GL HF!')).toBeDefined();
    expect(screen.getByTestId('char-counter').textContent).toBe('0/200');
  });

  it('submits text message and clears input on send', async () => {
    const onSendMessageMock = vi.fn().mockResolvedValue(undefined);

    render(
      <GlobalChatWidget
        messages={sampleMessages}
        currentUser={currentUser}
        onSendMessage={onSendMessageMock}
      />
    );

    const input = screen.getByTestId('chat-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Hello world' } });
    expect(input.value).toBe('Hello world');

    const sendBtn = screen.getByTestId('send-btn');
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(onSendMessageMock).toHaveBeenCalledWith('Hello world');
      expect(input.value).toBe('');
    });
  });

  it('prevents submitting whitespace or empty messages', () => {
    const onSendMessageMock = vi.fn();

    render(
      <GlobalChatWidget
        messages={sampleMessages}
        currentUser={currentUser}
        onSendMessage={onSendMessageMock}
      />
    );

    const input = screen.getByTestId('chat-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '   ' } });

    const sendBtn = screen.getByTestId('send-btn') as HTMLButtonElement;
    expect(sendBtn.disabled).toBe(true);
  });

  it('toggles emoji picker and inserts emoji into input', () => {
    render(
      <GlobalChatWidget
        messages={sampleMessages}
        currentUser={currentUser}
        onSendMessage={vi.fn()}
      />
    );

    const emojiToggleBtn = screen.getByTestId('emoji-toggle-btn');
    fireEvent.click(emojiToggleBtn);

    expect(screen.getByTestId('emoji-picker-dropdown')).toBeDefined();

    const emojiOption = screen.getByTestId('emoji-option-🚀');
    fireEvent.click(emojiOption);

    const input = screen.getByTestId('chat-input') as HTMLInputElement;
    expect(input.value).toContain('🚀');
  });

  it('validates character limit', () => {
    render(
      <GlobalChatWidget
        messages={sampleMessages}
        currentUser={currentUser}
        onSendMessage={vi.fn()}
        maxCharCount={10}
      />
    );

    const input = screen.getByTestId('chat-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Short' } });

    expect(screen.getByTestId('char-counter').textContent).toBe('5/10');
  });
});
