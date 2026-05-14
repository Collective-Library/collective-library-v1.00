"use client";

import { useState, useEffect, useRef } from "react";

function CoverPlaceholder({ title }: { title: string }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 from-cream to-parchment">
      <p className="font-display text-title-md text-ink line-clamp-3 text-center leading-tight">
        {title}
      </p>
    </div>
  );
}

export function CoverImage({
  src,
  alt,
  className = "",
  title = "",
  author = "",
  fallback = "default",
}: {
  src: string | null;
  alt: string;
  className?: string;
  title?: string;
  author?: string;
  fallback?: "default" | null;
}) {
  const [isPlaceholder, setIsPlaceholder] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!src || isPlaceholder || !imgRef.current) return;
    const img = imgRef.current;
    if (img.complete && img.naturalWidth <= 1 && img.naturalHeight <= 1) {
      setIsPlaceholder(true);
    }
  }, [src, isPlaceholder]);

  if (!src || isPlaceholder) {
    if (fallback === null) return null;
    return <CoverPlaceholder title={title}/>;
  }

  return (
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onLoad={(e) => {
        const img = e.currentTarget;
        if (img.naturalWidth <= 1 && img.naturalHeight <= 1) {
          setIsPlaceholder(true);
          img.src = "";
        }
      }}
    />
  );
}
