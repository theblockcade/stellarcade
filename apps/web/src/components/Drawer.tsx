"use client";

import React, { useCallback, useEffect, useRef } from "react";

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  side?: "left" | "right";
  children?: React.ReactNode;
  testId?: string;
}

export const Drawer: React.FC<DrawerProps> = ({
  open,
  onClose,
  title,
  side = "right",
  children,
  testId = "drawer",
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [open, onClose]);

  const handleBackdropClick = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!open) return null;

  return (
    <>
      <div
        className="drawer-backdrop"
        onClick={handleBackdropClick}
        data-testid={`${testId}-backdrop`}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.75)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          zIndex: 9000,
        }}
        aria-hidden="true"
      />
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label={title ?? "Drawer"}
        data-testid={testId}
        style={{
          position: "fixed",
          top: 0,
          bottom: 0,
          [side]: 0,
          width: "380px",
          maxWidth: "90vw",
          background: "#0d0f17",
          boxShadow: side === "right" ? "-10px 0 35px rgba(0, 0, 0, 0.6)" : "10px 0 35px rgba(0, 0, 0, 0.6)",
          borderLeft: side === "right" ? "1px solid rgba(255, 255, 255, 0.12)" : "none",
          borderRight: side === "left" ? "1px solid rgba(255, 255, 255, 0.12)" : "none",
          zIndex: 9001,
          display: "flex",
          flexDirection: "column",
          padding: "1.5rem",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          {title && <h2 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700 }}>{title}</h2>}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close drawer"
            data-testid={`${testId}-close`}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--sc-text-main, #ffffff)",
              fontSize: "1.25rem",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto" }} data-testid={`${testId}-body`}>
          {children}
        </div>
      </div>
    </>
  );
};

Drawer.displayName = "Drawer";
export default Drawer;
