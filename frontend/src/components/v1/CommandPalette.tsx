import React, { useEffect, useMemo, useRef, useState } from 'react';
import GlobalStateStore from '@/services/global-state-store';
import '@/components/v1/CommandPalette.css';

export interface Command {
  id: string;
  label: string;
  description?: string;
  action: () => void;
}

interface CommandPaletteProps {
  commands: Command[];
  placeholder?: string;
}

const commandStore = new GlobalStateStore();

const fuzzyMatch = (query: string, haystack: string): boolean => {
  const needle = query.trim().toLowerCase();
  if (needle.length === 0) return true;
  const text = haystack.toLowerCase();
  return needle.split('').every((char, index) => {
    const pos = text.indexOf(char, index > 0 ? text.indexOf(needle[index - 1]) + 1 : 0);
    return pos >= 0;
  });
};

const CommandPalette: React.FC<CommandPaletteProps> = ({
  commands,
  placeholder = 'Type a command or search...',
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(commandStore.selectCommandPaletteOpen());
  const [query, setQuery] = useState<string>('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const unsubscribe = commandStore.subscribe((state) => {
      setIsOpen(state.commandPalette.isOpen);
    });
    return unsubscribe;
  }, []);

  const openPalette = () => {
    commandStore.dispatch({ type: 'COMMAND_PALETTE_OPEN' });
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const closePalette = () => {
    commandStore.dispatch({ type: 'COMMAND_PALETTE_CLOSE' });
    setIsOpen(false);
    setQuery('');
    setActiveIndex(0);
  };

  const filteredCommands = useMemo(() => {
    return commands.filter((cmd) => fuzzyMatch(query, `${cmd.label} ${cmd.description ?? ''}`));
  }, [commands, query]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          closePalette();
        } else {
          openPalette();
        }
      }

      if (!isOpen) {
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        closePalette();
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((current) => Math.min(current + 1, filteredCommands.length - 1));
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((current) => Math.max(current - 1, 0));
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        const cmd = filteredCommands[activeIndex];
        if (cmd) {
          cmd.action();
          closePalette();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, activeIndex, filteredCommands]);


  useEffect(() => {
    if (activeIndex >= filteredCommands.length) {
      setActiveIndex(0);
    }
  }, [filteredCommands.length, activeIndex]);

  if (!isOpen) return null;

  return (
    <div className="command-palette-backdrop" role="dialog" aria-modal="true" aria-label="Command palette">
      <div className="command-palette" data-testid="command-palette">
        <input
          ref={inputRef}
          className="command-palette-input"
          value={query}
          placeholder={placeholder}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search commands"
          data-testid="command-palette-input"
        />
        <ul className="command-palette-list" role="listbox">
          {filteredCommands.length === 0 && (
            <li className="command-palette-item no-results" data-testid="command-palette-empty">
              No matching command.
            </li>
          )}
          {filteredCommands.map((cmd, index) => (
            <li
              key={cmd.id}
              className={`command-palette-item ${index === activeIndex ? 'active' : ''}`}
              role="option"
              aria-selected={index === activeIndex}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => {
                cmd.action();
                closePalette();
              }}
              data-testid={`command-palette-item-${cmd.id}`}
            >
              <span className="command-palette-item-label">{cmd.label}</span>
              {cmd.description && <span className="command-palette-item-desc">{cmd.description}</span>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export { commandStore };
export default CommandPalette;
