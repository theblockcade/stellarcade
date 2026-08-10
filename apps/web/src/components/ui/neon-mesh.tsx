"use client";

import * as React from "react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface Point3D {
  x: number;
  y: number;
  z: number;
  oldX: number;
  oldY: number;
  oldZ: number;
  pinned: boolean;
  baseX: number;
  baseY: number;
  baseZ: number;
  projX: number;
  projY: number;
  projScale: number;
}

interface Constraint3D {
  p1: Point3D;
  p2: Point3D;
  length: number;
}

export interface NeonMeshProps {
  title?: string;
  subtitle?: string;
  description?: string;
  className?: string;
}

/**
 * Interactive 3D Verlet-physics cloth mesh, from 21st.dev's "Neon Mesh"
 * pattern. Adapted for StellarCade:
 *
 * - The source's `NeonMagneticMeshProps` type reference in the destructured
 *   params didn't match its own exported `NeonMeshProps` interface — a typo
 *   that would fail to compile. Fixed.
 * - The source's className was built via string concatenation
 *   (`` `...${className}` ``), so a caller-supplied className couldn't
 *   override a conflicting default utility (e.g. h-screen vs h-full) — the
 *   winner would depend on Tailwind's internal stylesheet order, not intent.
 *   Rebuilt on cn()/tailwind-merge like every other component here.
 * - Dropped the prefers-color-scheme light/dark split: this app has a single
 *   dark theme (see app/globals.css), so the light branch was dead code that
 *   would never run through our own UI.
 * - Mesh/glow colors now match @stellarcade/tokens' --sc-bg-dark/--sc-accent
 *   instead of the source's unrelated lime-green palette. Canvas fillStyle
 *   can't consume CSS custom properties directly, so these are the literal
 *   values — same numbers as tokens.css, not a coincidence.
 * - title/subtitle/description default to empty: this app's only current
 *   usage is as a pure background layer behind the landing hero's own
 *   heading, so the source's baked-in overlay text (with mix-blend-difference)
 *   would otherwise double up against it.
 */
export function NeonMesh({ title = "", subtitle = "", description = "", className = "" }: NeonMeshProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;

    const mouse = {
      x: -1000,
      y: -1000,
      targetAngleX: 0.2,
      targetAngleY: -0.3,
      angleX: 0.2,
      angleY: -0.3,
      // Toned down from the source's radius:180 / force:22 — a background
      // layer sitting behind real hero copy shouldn't react this forcefully.
      radius: 130,
    };

    let points: Point3D[] = [];
    let constraints: Constraint3D[] = [];

    const handleResize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
      initMesh();
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const rawX = e.clientX - rect.left;
      const rawY = e.clientY - rect.top;

      mouse.x = rawX;
      mouse.y = rawY;

      const normX = (rawX / width - 0.5) * 2;
      const normY = (rawY / height - 0.5) * 2;
      mouse.targetAngleY = normX * 0.45;
      mouse.targetAngleX = -normY * 0.35 + 0.2;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
      mouse.targetAngleX = 0.2;
      mouse.targetAngleY = 0;
    };

    const initMesh = () => {
      points = [];
      constraints = [];

      const spacing = 42;
      const cols = Math.ceil((width * 1.1) / spacing) + 1;
      const rows = Math.ceil((height * 1.1) / spacing) + 1;

      const grid: Point3D[][] = [];
      const startX = -(cols * spacing) / 2;
      const startY = -(rows * spacing) / 2;

      for (let j = 0; j < rows; j++) {
        grid[j] = [];
        for (let i = 0; i < cols; i++) {
          const bx = startX + i * spacing;
          const by = startY + j * spacing;
          const bz = 0;

          const isEdge = i === 0 || i === cols - 1 || j === 0 || j === rows - 1;

          const p: Point3D = {
            x: bx,
            y: by,
            z: bz,
            oldX: bx,
            oldY: by,
            oldZ: bz,
            pinned: isEdge,
            baseX: bx,
            baseY: by,
            baseZ: bz,
            projX: 0,
            projY: 0,
            projScale: 1,
          };

          points.push(p);
          grid[j][i] = p;
        }
      }

      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          if (i < cols - 1) {
            constraints.push({ p1: grid[j][i], p2: grid[j][i + 1], length: spacing });
          }
          if (j < rows - 1) {
            constraints.push({ p1: grid[j][i], p2: grid[j + 1][i], length: spacing });
          }
        }
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);

    let time = 0;

    // @stellarcade/tokens: --sc-bg-dark, --sc-accent (as an RGB triplet for
    // the rgba() template below). The "hot" glow is --sc-accent at reduced
    // alpha rather than a solid fill — the source's full-opacity neon was
    // too loud for a layer sitting behind real hero copy.
    const bgColor = "#050505";
    const baseMeshColor = "0, 255, 204";
    const neonAccent = "rgba(0, 255, 204, 0.55)";

    const render = () => {
      time += 0.025;

      mouse.angleX += (mouse.targetAngleX - mouse.angleX) * 0.05;
      mouse.angleY += (mouse.targetAngleY - mouse.angleY) * 0.05;

      const cosX = Math.cos(mouse.angleX);
      const sinX = Math.sin(mouse.angleX);
      const cosY = Math.cos(mouse.angleY);
      const sinY = Math.sin(mouse.angleY);

      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        if (p.pinned) continue;

        const vx = (p.x - p.oldX) * 0.93;
        const vy = (p.y - p.oldY) * 0.93;
        const vz = (p.z - p.oldZ) * 0.93;

        p.oldX = p.x;
        p.oldY = p.y;
        p.oldZ = p.z;

        p.x += vx;
        p.y += vy;
        p.z += vz;

        const ambientZ = Math.sin(p.baseX * 0.015 + p.baseY * 0.015 + time) * 18;

        p.x += (p.baseX - p.x) * 0.04;
        p.y += (p.baseY - p.y) * 0.04;
        p.z += (p.baseZ + ambientZ - p.z) * 0.04;
      }

      const perspective = 600;
      const centerX = width / 2;
      const centerY = height / 2;

      for (let i = 0; i < points.length; i++) {
        const p = points[i];

        const rx1 = p.x * cosY + p.z * sinY;
        const ry1 = p.y;
        const rz1 = -p.x * sinY + p.z * cosY;

        const rx2 = rx1;
        const ry2 = ry1 * cosX - rz1 * sinX;
        const rz2 = ry1 * sinX + rz1 * cosX + 400;

        const scale = perspective / Math.max(1, rz2);
        p.projScale = scale;
        p.projX = centerX + rx2 * scale;
        p.projY = centerY + ry2 * scale;

        if (!p.pinned) {
          const dx = p.projX - mouse.x;
          const dy = p.projY - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < mouse.radius && dist > 0) {
            const force = (1 - dist / mouse.radius) * 14;
            const angle = Math.atan2(dy, dx);
            p.x += (Math.cos(angle) * force) / p.projScale;
            p.y += (Math.sin(angle) * force) / p.projScale;
            p.z -= (force * 1.5) / p.projScale;
          }
        }
      }

      for (let iter = 0; iter < 4; iter++) {
        for (let i = 0; i < constraints.length; i++) {
          const c = constraints[i];
          const dx = c.p2.x - c.p1.x;
          const dy = c.p2.y - c.p1.y;
          const dz = c.p2.z - c.p1.z;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          const delta = (dist - c.length) / (dist || 1);

          if (!c.p1.pinned) {
            c.p1.x += dx * 0.5 * delta;
            c.p1.y += dy * 0.5 * delta;
            c.p1.z += dz * 0.5 * delta;
          }
          if (!c.p2.pinned) {
            c.p2.x -= dx * 0.5 * delta;
            c.p2.y -= dy * 0.5 * delta;
            c.p2.z -= dz * 0.5 * delta;
          }
        }
      }

      for (let i = 0; i < constraints.length; i++) {
        const c = constraints[i];
        const midX = (c.p1.projX + c.p2.projX) / 2;
        const midY = (c.p1.projY + c.p2.projY) / 2;

        const dx = mouse.x - midX;
        const dy = mouse.y - midY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const isHot = dist < mouse.radius;
        const avgScale = (c.p1.projScale + c.p2.projScale) / 2;

        ctx.strokeStyle = isHot
          ? neonAccent
          : `rgba(${baseMeshColor}, ${Math.min(0.7, Math.max(0.04, 0.12 * avgScale))})`;
        ctx.lineWidth = isHot ? 1.4 * avgScale : 0.6 * avgScale;

        ctx.beginPath();
        ctx.moveTo(c.p1.projX, c.p1.projY);
        ctx.lineTo(c.p2.projX, c.p2.projY);
        ctx.stroke();
      }

      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const dx = mouse.x - p.projX;
        const dy = mouse.y - p.projY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 80) {
          ctx.fillStyle = neonAccent;
          ctx.beginPath();
          ctx.arc(p.projX, p.projY, 1.8 * p.projScale, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full h-screen overflow-hidden select-none bg-background", className)}
    >
      <canvas ref={canvasRef} className="absolute inset-0 block cursor-crosshair" />

      {(title || subtitle || description) && (
        <div className="relative z-10 flex h-full flex-col items-center justify-center text-center px-4 pointer-events-none mix-blend-difference text-white">
          {subtitle && (
            <span className="font-mono text-xs tracking-widest uppercase mb-3 text-[#00ffcc]">{subtitle}</span>
          )}
          {title && (
            <h1 className="font-mono text-6xl md:text-9xl font-black tracking-tighter uppercase leading-none">
              {title}
            </h1>
          )}
          {description && <p className="mt-4 font-mono text-xs md:text-sm max-w-lg opacity-80">{description}</p>}
        </div>
      )}
    </div>
  );
}

export default NeonMesh;
