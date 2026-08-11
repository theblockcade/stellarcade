"use client";

import React, { useState, useRef, useEffect } from "react";
import { Globe, Check, ChevronDown } from "lucide-react";
import { useI18n, type Locale } from "../i18n/provider";

const localeNames: Record<Locale, { label: string; flag: string }> = {
  en: { label: "English", flag: "🇺🇸" },
  es: { label: "Español", flag: "🇪🇸" },
  fr: { label: "Français", flag: "🇫🇷" },
  de: { label: "Deutsch", flag: "🇩🇪" },
  ja: { label: "日本語", flag: "🇯🇵" },
};

export const LocaleSwitcher: React.FC = () => {
  const { locale, setLocale } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (code: Locale) => {
    setLocale(code);
    setIsOpen(false);
  };

  const currentLocaleInfo = localeNames[locale] ?? { label: "English", flag: "🇺🇸" };

  return (
    <div ref={dropdownRef} style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "6px 12px",
          borderRadius: "8px",
          background: "rgba(255, 255, 255, 0.05)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          color: "var(--sc-text-main, #fff)",
          fontSize: "13px",
          fontWeight: 600,
          cursor: "pointer",
          transition: "all 0.15s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "var(--sc-accent, #00ffcc)";
          e.currentTarget.style.background = "rgba(0, 255, 204, 0.08)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.12)";
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
        }}
      >
        <Globe size={14} style={{ color: "var(--sc-accent, #00ffcc)" }} />
        <span>{currentLocaleInfo.label}</span>
        <ChevronDown
          size={13}
          style={{
            color: "var(--sc-text-dim, #94a3b8)",
            transform: isOpen ? "rotate(180deg)" : "none",
            transition: "transform 0.2s ease",
          }}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            minWidth: "150px",
            background: "rgba(10, 10, 10, 0.95)",
            backdropFilter: "blur(16px)",
            border: "1px solid var(--sc-border-glass, rgba(255, 255, 255, 0.15))",
            borderRadius: "10px",
            padding: "4px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
            zIndex: 1000,
            display: "flex",
            flexDirection: "column",
            gap: "2px",
          }}
        >
          {Object.entries(localeNames).map(([code, info]) => {
            const isSelected = locale === code;
            return (
              <button
                key={code}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(code as Locale)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 10px",
                  borderRadius: "6px",
                  border: "none",
                  background: isSelected ? "rgba(0, 255, 204, 0.15)" : "transparent",
                  color: isSelected ? "var(--sc-accent, #00ffcc)" : "#e2e8f0",
                  fontSize: "13px",
                  fontWeight: isSelected ? 700 : 500,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background 0.1s ease",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span>{info.flag}</span>
                  <span>{info.label}</span>
                </div>
                {isSelected && <Check size={14} style={{ color: "var(--sc-accent, #00ffcc)" }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LocaleSwitcher;
