// =============================================================================
// Browser-side image compression — resize + WebP-ify before upload
//
// Why client-side:
// - Vercel serverless body limit is 4.5MB — would block 5MB+ phone uploads
// - WebP saves 70-90% vs original JPEG/PNG/HEIC at similar visual quality
// - User sees "preparing" briefly, but doesn't wait for upload of huge file
// - Storage cost on Supabase stays tiny
//
// All file uploads in the app should go through this helper. If it fails
// (very old browser, weird codec), caller falls back to original file.
// =============================================================================

import imageCompression from "browser-image-compression";

export type CompressKind = "avatar" | "banner" | "cover" | "general";

interface KindPreset {
  /** Target max file size in MB after compression. Library aims for this; may be slightly over. */
  maxSizeMB: number;
  /** Hard ceiling on the longer dimension in pixels (preserves aspect ratio). */
  maxWidthOrHeight: number;
}

const PRESETS: Record<CompressKind, KindPreset> = {
  avatar: { maxSizeMB: 0.15, maxWidthOrHeight: 512 },
  banner: { maxSizeMB: 0.3, maxWidthOrHeight: 1600 },
  cover: { maxSizeMB: 0.25, maxWidthOrHeight: 1024 },
  general: { maxSizeMB: 0.5, maxWidthOrHeight: 2048 },
};

/**
 * Compress + convert an image File to WebP. Always returns a `.webp` File
 * with the same base name. Caller can use `result.size` to verify saving.
 *
 * Throws on hard failure (e.g. unsupported file type). Caller decides
 * whether to abort upload or fall back to original.
 */
export async function compressImage(file: File, kind: CompressKind): Promise<File> {
  const preset = PRESETS[kind];

  // Skip if already tiny + already WebP (avoid re-encoding lossy → lossy)
  if (
    file.type === "image/webp" &&
    file.size <= preset.maxSizeMB * 1024 * 1024
  ) {
    return file;
  }

  const compressed = await imageCompression(file, {
    maxSizeMB: preset.maxSizeMB,
    maxWidthOrHeight: preset.maxWidthOrHeight,
    fileType: "image/webp",
    useWebWorker: true,
    initialQuality: 0.85,
  });

  // Library returns Blob-ish object; rewrap as File so Supabase upload accepts
  // the .name we want (avoids "blob" filenames in storage paths).
  const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
  return new File([compressed], `${baseName}.webp`, {
    type: "image/webp",
    lastModified: Date.now(),
  });
}

/** Returns a human-readable percentage of bytes saved. Used in toasts. */
export function compressionPercent(originalBytes: number, compressedBytes: number): number {
  if (originalBytes <= 0) return 0;
  return Math.max(0, Math.round((1 - compressedBytes / originalBytes) * 100));
}
