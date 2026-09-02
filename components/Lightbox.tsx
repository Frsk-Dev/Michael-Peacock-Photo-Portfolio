"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef } from "react";
import type { Photo } from "@/data/photos";

interface Props {
  photos: Photo[];
  index: number;
  onClose: () => void;
  onIndexChange: (next: number) => void;
}

export default function Lightbox({
  photos,
  index,
  onClose,
  onIndexChange,
}: Props) {
  const photo = photos[index];
  const dialogRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const go = useCallback(
    (delta: number) => {
      if (photos.length < 2) return;
      onIndexChange((index + delta + photos.length) % photos.length);
    },
    [index, photos.length, onIndexChange],
  );

  // Keyboard: Escape closes, arrows navigate, Tab stays inside the dialog.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        go(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(-1);
      } else if (e.key === "Tab") {
        const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
          "button, [href], [tabindex]:not([tabindex='-1'])",
        );
        if (!focusables?.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, onClose]);

  // Lock background scrolling without the layout shifting as the bar vanishes.
  useEffect(() => {
    const { body } = document;
    const prevOverflow = body.style.overflow;
    const prevPadding = body.style.paddingRight;
    const gap = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = "hidden";
    if (gap > 0) body.style.paddingRight = `${gap}px`;
    dialogRef.current?.focus();
    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPadding;
    };
  }, []);

  if (!photo) return null;

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    touchStart.current = null;
    // Horizontal swipes navigate; a decisive downward swipe closes.
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
    else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) onClose();
  };

  // Skip the year when the event name already carries it ("Gravity 2026").
  const yearIsRedundant =
    photo.year != null && (photo.event ?? "").includes(String(photo.year));
  const meta = [photo.event, photo.location, yearIsRedundant ? null : photo.year]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`${photo.title}. Image ${index + 1} of ${photos.length}`}
      tabIndex={-1}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      className="fixed inset-0 z-80 flex animate-fade flex-col bg-ink/97 backdrop-blur-md outline-none"
    >
      {/* Backdrop click target - sits behind the image and the controls. */}
      <button
        type="button"
        aria-label="Close image viewer"
        onClick={onClose}
        className="absolute inset-0 cursor-zoom-out"
        tabIndex={-1}
      />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between gap-4 px-5 py-4 md:px-8">
        <span className="font-display text-xs font-semibold tracking-[0.22em] text-muted">
          {String(index + 1).padStart(2, "0")}
          <span className="mx-2 text-muted-2">/</span>
          {String(photos.length).padStart(2, "0")}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="group flex items-center gap-2 font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-muted transition-colors hover:text-bone"
        >
          Close
          <span
            aria-hidden
            className="grid h-7 w-7 place-items-center border border-line transition-colors group-hover:border-accent group-hover:bg-accent group-hover:text-white"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path
                d="M1 1l8 8M9 1l-8 8"
                stroke="currentColor"
                strokeWidth="1.4"
              />
            </svg>
          </span>
        </button>
      </div>

      {/* Stage */}
      <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center px-3 md:px-20">
        <div className="pointer-events-none relative flex h-full w-full items-center justify-center">
          <Image
            key={photo.id}
            src={photo.src}
            alt={photo.alt}
            width={photo.width}
            height={photo.height}
            placeholder={photo.blurDataURL ? "blur" : "empty"}
            blurDataURL={photo.blurDataURL}
            sizes="(max-width: 768px) 100vw, 90vw"
            priority
            className="max-h-full w-auto max-w-full animate-fade object-contain"
          />
        </div>

        {photos.length > 1 && (
          <>
            <NavButton side="left" onClick={() => go(-1)} />
            <NavButton side="right" onClick={() => go(1)} />
          </>
        )}
      </div>

      {/* Caption */}
      <div className="relative z-10 px-5 pb-6 pt-5 md:px-8 md:pb-8">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 border-t border-line/70 pt-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-lg font-bold uppercase tracking-tight text-bone md:text-xl">
              {photo.title}
            </h2>
            {meta && <p className="mt-1 text-sm text-muted">{meta}</p>}
          </div>
          {photo.settings && (
            <p className="font-display text-[11px] tracking-[0.16em] text-muted-2">
              {photo.settings}
            </p>
          )}
        </div>
      </div>

      {/* Neighbours preloaded so navigation feels instant. */}
      <div className="hidden">
        {[-1, 1].map((d) => {
          const p = photos[(index + d + photos.length) % photos.length];
          return p && p.id !== photo.id ? (
            <Image
              key={`pre-${p.id}`}
              src={p.src}
              alt=""
              width={32}
              height={32}
              sizes="90vw"
              aria-hidden
            />
          ) : null;
        })}
      </div>
    </div>
  );
}

function NavButton({
  side,
  onClick,
}: {
  side: "left" | "right";
  onClick: () => void;
}) {
  const isLeft = side === "left";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isLeft ? "Previous image" : "Next image"}
      className={`group absolute top-1/2 z-20 grid h-12 w-12 -translate-y-1/2 place-items-center border border-line bg-ink/70 text-bone backdrop-blur transition-colors duration-300 hover:border-accent hover:bg-accent hover:text-white md:h-14 md:w-14 ${
        isLeft ? "left-2 md:left-6" : "right-2 md:right-6"
      }`}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        aria-hidden
        className={`transition-transform duration-300 ${
          isLeft
            ? "group-hover:-translate-x-0.5"
            : "rotate-180 group-hover:translate-x-0.5"
        }`}
      >
        <path
          d="M9 1L3 7l6 6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="square"
        />
      </svg>
    </button>
  );
}
