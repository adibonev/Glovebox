"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * A camera with a guide frame, for photographing a document.
 *
 * The system camera gives no control over what ends up in the picture, and every field the
 * reader missed so far traced back to framing: a page shot at an angle, or one whose last line
 * — the one carrying the Expiry Date — fell outside the shot. Here the frame states the shape
 * to fill, and the capture is **cropped to it**, so the background never reaches recognition.
 */

/** A4 portrait, the shape of every Bulgarian vehicle document worth scanning. */
const PAGE_ASPECT = 210 / 297;

/**
 * Ask for as much resolution as the camera will give. Only the guide frame survives the crop,
 * so the pixels that reach recognition are a fraction of the frame — and the small print on a
 * certificate is right at the limit of what the engine can read.
 */
const VIDEO_CONSTRAINTS: MediaTrackConstraints = {
  facingMode: { ideal: "environment" },
  width: { ideal: 3840 },
  height: { ideal: 2160 },
};

export function DocumentCamera({
  onCapture,
  onCancel,
}: {
  onCapture: (file: File) => void;
  onCancel: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: VIDEO_CONSTRAINTS });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setReady(true);
        }
      } catch {
        setError(
          "Нямам достъп до камерата. Разреши я в настройките на браузъра, или се върни и въведи данните ръчно.",
        );
      }
    }

    void start();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, []);

  /**
   * Cut the guide frame out of the live picture.
   *
   * The preview is `object-fit: cover`, so what the User sees is a centre crop of a larger
   * source. Mapping the frame back through that scale is what makes "what is inside the frame"
   * and "what gets recognised" the same rectangle.
   */
  const capture = useCallback(() => {
    const video = videoRef.current;
    const frame = frameRef.current;
    if (!video || !frame || !video.videoWidth) return;

    const view = video.getBoundingClientRect();
    const box = frame.getBoundingClientRect();
    const scale = Math.max(view.width / video.videoWidth, view.height / video.videoHeight);
    const offsetX = (video.videoWidth * scale - view.width) / 2;
    const offsetY = (video.videoHeight * scale - view.height) / 2;

    const sx = (box.left - view.left + offsetX) / scale;
    const sy = (box.top - view.top + offsetY) / scale;
    const sw = box.width / scale;
    const sh = box.height / scale;

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(sw);
    canvas.height = Math.round(sh);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) onCapture(new File([blob], "document.png", { type: "image/png" }));
    }, "image/png");
  }, [onCapture]);

  if (error) {
    return (
      <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center backdrop-blur-md">
        <p className="font-body text-sm text-silver/75">{error}</p>
        <button
          type="button"
          onClick={onCancel}
          className="mx-auto rounded-xl border border-white/15 px-5 py-2.5 font-body font-semibold text-silver/80 transition hover:border-white/30 hover:text-ivory"
        >
          Назад
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-ink">
        <video
          ref={videoRef}
          playsInline
          muted
          className="h-[70vh] max-h-[560px] w-full object-cover"
        />

        {/* The guide. `pointer-events-none` so nothing here can swallow the capture tap. */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
          <div
            ref={frameRef}
            style={{ aspectRatio: `${PAGE_ASPECT}` }}
            className="relative h-full max-h-full rounded-lg shadow-[0_0_0_9999px_rgba(7,16,12,0.62)]"
          >
            {/* Corner marks read as "align to this" far faster than a full outline does. */}
            {[
              "left-0 top-0 border-l-2 border-t-2 rounded-tl-lg",
              "right-0 top-0 border-r-2 border-t-2 rounded-tr-lg",
              "left-0 bottom-0 border-b-2 border-l-2 rounded-bl-lg",
              "right-0 bottom-0 border-b-2 border-r-2 rounded-br-lg",
            ].map((corner) => (
              <span key={corner} className={`absolute h-8 w-8 border-copper ${corner}`} />
            ))}
          </div>
        </div>

        <p className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink to-transparent px-6 pb-5 pt-10 text-center font-body text-[13px] text-ivory">
          Побери <strong>целия лист</strong> в рамката — включително последния ред със срока.
          Дръж го изправен и без отблясък.
        </p>
      </div>

      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={capture}
          disabled={!ready}
          className="rounded-xl bg-copper px-6 py-2.5 font-body font-semibold text-ink transition hover:bg-copper/90 disabled:opacity-60"
        >
          {ready ? "Снимай" : "Включвам камерата…"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-white/15 px-5 py-2.5 font-body text-silver/80 transition hover:border-white/30 hover:text-ivory"
        >
          Отказ
        </button>
      </div>
    </div>
  );
}
