'use client';

import { useEffect, useCallback } from 'react';

interface ImageLightboxProps {
  src: string;
  name: string;
  onClose: () => void;
}

export function ImageLightbox({ src, name, onClose }: ImageLightboxProps) {
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [handleKey]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/85"
      onClick={onClose}
    >
      {/* Top bar */}
      <div
        className="w-full flex items-center justify-between px-5 py-3 text-white/80 text-sm select-none"
        onClick={e => e.stopPropagation()}
      >
        <span className="truncate max-w-[80vw]">{name}</span>
        <button
          onClick={onClose}
          className="ml-4 flex-shrink-0 text-white/60 hover:text-white text-2xl leading-none"
          aria-label="关闭"
        >
          ✕
        </button>
      </div>

      {/* Image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={name}
        className="max-w-[90vw] max-h-[82vh] object-contain rounded shadow-2xl"
        onClick={e => e.stopPropagation()}
      />

      {/* Bottom hint */}
      <p className="mt-3 text-white/30 text-xs select-none">点击空白处或按 Esc 关闭</p>
    </div>
  );
}
