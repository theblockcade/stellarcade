"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import GlobalStateStore from "../services/global-state-store";
import { cn } from "../lib/utils";

/**
 * Ported from frontend/src/components/v1/CommandPalette.tsx. Styling has
 * since moved from CommandPalette.css to Tailwind utilities; the semantic
 * class names are retained as query/test hooks only.
 */

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
  return needle.split("").every((char, index) => {
    const pos = text.indexOf(char, index > 0 ? text.indexOf(needle[index - 1]!) + 1 : 0);
    return pos >= 0;
  });
};

const CommandPalette: React.FC<CommandPaletteProps> = ({ commands, placeholder = "Type a command or search..." }) => {
  const [isOpen, setIsOpen] = useState<boolean>(commandStore.selectCommandPaletteOpen());
  const [query, setQuery] = useState<string>("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const unsubscribe = commandStore.subscribe((state) => {
      setIsOpen(state.commandPalette.isOpen);
    });
    return unsubscribe;
  }, []);

  const openPalette = () => {
    commandStore.dispatch({ type: "COMMAND_PALETTE_OPEN" });
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const closePalette = () => {
    commandStore.dispatch({ type: "COMMAND_PALETTE_CLOSE" });
    setIsOpen(false);
    setQuery("");
    setActiveIndex(0);
  };

  const filteredCommands = useMemo(() => {
    return commands.filter((cmd) => fuzzyMatch(query, `${cmd.label} ${cmd.description ?? ""}`));
  }, [commands, query]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
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

      if (e.key === "Escape") {
        e.preventDefault();
        closePalette();
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((current) => Math.min(current + 1, filteredCommands.length - 1));
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((current) => Math.max(current - 1, 0));
      }

      if (e.key === "Enter") {
        e.preventDefault();
        const cmd = filteredCommands[activeIndex];
        if (cmd) {
          cmd.action();
          closePalette();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, activeIndex, filteredCommands]);

  useEffect(() => {
    if (activeIndex >= filteredCommands.length) {
      setActiveIndex(0);
    }
  }, [filteredCommands.length, activeIndex]);

  if (!isOpen) return null;

  return (
    <div
      className="command-palette-backdrop fixed inset-0 z-9999 flex items-start justify-center bg-black/70 pt-[10vh] backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div
        className="command-palette w-[min(90vw,560px)] overflow-hidden rounded-2xl border border-border bg-[rgba(10,10,10,0.95)] shadow-[0_20px_40px_rgba(0,0,0,0.5),0_0_30px_rgba(0,255,204,0.05)] backdrop-blur-xl"
        data-testid="command-palette"
      >
        <input
          ref={inputRef}
          className="command-palette-input w-full border-b border-border bg-transparent px-5 py-4 text-[1.05rem] text-foreground outline-none placeholder:text-muted-foreground"
          value={query}
          placeholder={placeholder}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search commands"
          data-testid="command-palette-input"
        />
        <ul className="command-palette-list max-h-80 list-none overflow-y-auto py-2" role="listbox">
          {filteredCommands.length === 0 && (
            <li
              className="command-palette-item no-results p-8 text-center text-sm text-muted-foreground"
              data-testid="command-palette-empty"
            >
              No matching command.
            </li>
          )}
          {filteredCommands.map((cmd, index) => {
            const isActive = index === activeIndex;
            return (
              <li
                key={cmd.id}
                className={cn(
                  "command-palette-item flex cursor-pointer flex-col gap-0.5 border-l-3 px-5 py-3.5 transition-colors",
                  isActive
                    ? "active border-l-primary bg-primary/8"
                    : "border-l-transparent hover:border-l-primary hover:bg-primary/8",
                )}
                role="option"
                aria-selected={isActive}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => {
                  cmd.action();
                  closePalette();
                }}
                data-testid={`command-palette-item-${cmd.id}`}
              >
                <span
                  className={cn(
                    "command-palette-item-label text-[0.95rem] font-bold",
                    isActive ? "text-primary" : "text-foreground",
                  )}
                >
                  {cmd.label}
                </span>
                {cmd.description && (
                  <span
                    className={cn(
                      "command-palette-item-desc text-xs",
                      isActive ? "text-foreground/80" : "text-muted-foreground",
                    )}
                  >
                    {cmd.description}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export { commandStore };
export default CommandPalette;
