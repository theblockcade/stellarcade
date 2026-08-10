import React, { useCallback, useEffect, useRef, useState } from 'react';
import './StatusAnnouncer.css';

export type AnnouncePoliteness = 'polite' | 'assertive';

export interface StatusAnnouncerHandle {
  announce: (message: string, politeness?: AnnouncePoliteness) => void;
  clear: () => void;
}

export interface StatusAnnouncerProps {
  message?: string;
  politeness?: AnnouncePoliteness;
  clearAfterMs?: number;
  className?: string;
  testId?: string;
}

/**
 * Renders an off-screen ARIA live region so screen readers announce dynamic
 * status updates without moving keyboard focus. Mount once near the app root
 * and pass `message` to trigger an announcement.
 *
 * The live region is deliberately emptied then refilled so repeated identical
 * messages are re-announced by assistive technology.
 */
export const StatusAnnouncer: React.FC<StatusAnnouncerProps> = ({
  message = '',
  politeness = 'polite',
  clearAfterMs,
  className = '',
  testId = 'status-announcer',
}) => {
  const [liveMessage, setLiveMessage] = useState('');
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!message) {
      setLiveMessage('');
      return;
    }

    // Clear first so the same message can be re-announced.
    setLiveMessage('');

    const announce = setTimeout(() => {
      setLiveMessage(message);
    }, 50);

    if (clearAfterMs != null && clearAfterMs > 0) {
      clearTimerRef.current = setTimeout(() => {
        setLiveMessage('');
      }, clearAfterMs + 50);
    }

    return () => {
      clearTimeout(announce);
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    };
  }, [message, clearAfterMs]);

  return (
    <div
      className={['status-announcer', className].filter(Boolean).join(' ')}
      aria-live={politeness}
      aria-atomic="true"
      aria-relevant="additions text"
      data-testid={testId}
    >
      {liveMessage}
    </div>
  );
};

/**
 * Headless hook variant. Returns a `{ ref, announce, clear }` tuple.
 * Attach `ref` to a visually-hidden `<div aria-live="polite">` you render
 * yourself when you need programmatic control.
 */
export function useStatusAnnouncer(): StatusAnnouncerHandle & {
  message: string;
  politeness: AnnouncePoliteness;
} {
  const [message, setMessage] = useState('');
  const [politeness, setPoliteness] = useState<AnnouncePoliteness>('polite');

  const announce = useCallback(
    (text: string, level: AnnouncePoliteness = 'polite') => {
      setPoliteness(level);
      setMessage('');
      setTimeout(() => setMessage(text), 50);
    },
    [],
  );

  const clear = useCallback(() => setMessage(''), []);

  return { message, politeness, announce, clear };
}

StatusAnnouncer.displayName = 'StatusAnnouncer';

export default StatusAnnouncer;
