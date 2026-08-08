"use client";

/**
 * PhotoPicker — two doors to the same upload.
 *
 * Why two inputs instead of one:
 *
 * A single `<input type="file" accept="image/*">` opens the FILE BROWSER on
 * iOS, not the camera — which is what /post shipped with, and why photographing
 * a card in hand took four taps through Files. Adding `capture="environment"`
 * fixes that, but it goes the other way: it opens the camera and REMOVES the
 * library option entirely. There is no attribute that offers both.
 *
 * So: two inputs, two buttons, one hidden field that actually submits. The
 * server action's contract is unchanged — it still reads one `image` field.
 *
 * The camera button is hidden under `@media (pointer: fine)` because on a
 * desktop `capture` silently degrades to a plain file picker, and two buttons
 * that do exactly the same thing is worse than one.
 *
 * DOWNSCALE (assumption A6 in the plan): a 12MP phone photo routinely clears
 * the server's 8MB cap, so shooting a card would fail with "Image is too
 * large" — the exact flow this component exists to enable. Anything over the
 * threshold is redrawn through a canvas at 2000px on the long edge before it
 * ever reaches the network. If canvas is unavailable the original is submitted
 * and the server's existing error is the honest fallback.
 */

import { useEffect, useRef, useState } from "react";

const MAX_EDGE = 2000;
const JPEG_QUALITY = 0.85;
/** Downscale anything above this. Server rejects at 8MB; leave headroom. */
const DOWNSCALE_OVER_BYTES = 4 * 1024 * 1024;

async function downscale(file: File): Promise<File> {
  if (file.size <= DOWNSCALE_OVER_BYTES) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    if (scale === 1) return file;

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
    );
    if (!blob || blob.size >= file.size) return file;

    const base = file.name.replace(/\.[^.]+$/, "") || "photo";
    return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
  } catch {
    // Old browser, tainted canvas, HEIC the decoder won't touch — send the
    // original and let the server say something true about it.
    return file;
  }
}

export function PhotoPicker({
  legend = "Photo",
  existingUrl,
  hint,
}: {
  legend?: string;
  existingUrl?: string | null;
  hint?: string;
}) {
  /** The field that actually submits. Populated via DataTransfer. */
  const submitRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const libraryRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  const accept = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    const ready = await downscale(file);
    const dt = new DataTransfer();
    dt.items.add(ready);
    if (submitRef.current) submitRef.current.files = dt.files;
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(ready);
    });
    setBusy(false);
  };

  const clear = () => {
    if (submitRef.current) submitRef.current.value = "";
    if (cameraRef.current) cameraRef.current.value = "";
    if (libraryRef.current) libraryRef.current.value = "";
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return null;
    });
  };

  const shown = preview ?? existingUrl ?? null;

  return (
    <fieldset>
      <legend className="mb-2 text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground">
        {legend}
      </legend>

      <input ref={submitRef} type="file" name="image" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => accept(e.target.files?.[0])}
      />
      <input
        ref={libraryRef}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => accept(e.target.files?.[0])}
      />

      {shown && (
        <div className="mb-2 flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={shown}
            alt="Reference photo you attached"
            className="max-h-40 w-full rounded-sm bg-muted object-contain"
          />
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => cameraRef.current?.click()}
          disabled={busy}
          className="flex min-h-11 flex-1 items-center justify-center rounded-sm border border-input bg-card px-3.5 text-sm transition-[background-color,border-color] duration-150 hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-45 [@media(pointer:fine)]:hidden"
        >
          {busy ? "Working…" : "Take photo"}
        </button>
        <button
          type="button"
          onClick={() => libraryRef.current?.click()}
          disabled={busy}
          className="flex min-h-11 flex-1 items-center justify-center rounded-sm border border-input bg-card px-3.5 text-sm transition-[background-color,border-color] duration-150 hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-45"
        >
          {busy ? "Working…" : shown ? "Replace" : "Choose photo"}
        </button>
        {preview && (
          <button
            type="button"
            onClick={clear}
            className="flex min-h-11 items-center justify-center rounded-sm border border-input px-3.5 text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Remove
          </button>
        )}
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        {hint ?? "Show the exact card or parallel you want. Large photos are resized automatically."}
      </p>
    </fieldset>
  );
}
