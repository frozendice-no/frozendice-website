"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Play, X } from "lucide-react";
import type { FeaturedVods, Vod } from "@/sanity/types";

export function FeaturedVodsSection({ data }: { data: FeaturedVods | null }) {
  if (!data || data.vods.length === 0) return null;

  return (
    <section className="border-t border-white/10 bg-black py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-white/70">
            Recent episodes
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Catch up on past sessions.
          </h2>
          <p className="mt-3 text-base text-white/70">
            Click any thumbnail to play it inline.
          </p>
        </div>
        <VodGrid vods={data.vods} />
      </div>
    </section>
  );
}

function VodGrid({ vods }: { vods: Vod[] }) {
  const [activeVod, setActiveVod] = useState<Vod | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {vods.slice(0, 6).map((vod) => (
          <VodThumbnail
            key={vod._key}
            vod={vod}
            onClick={() => setActiveVod(vod)}
          />
        ))}
      </div>
      {activeVod && (
        <VodLightbox vod={activeVod} onClose={() => setActiveVod(null)} />
      )}
    </>
  );
}

function VodThumbnail({ vod, onClick }: { vod: Vod; onClick: () => void }) {
  // i.ytimg.com mqdefault is 320x180 — clean 16:9, always available.
  const thumb = `https://i.ytimg.com/vi/${vod.youtubeVideoId}/mqdefault.jpg`;
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative aspect-video overflow-hidden rounded-lg bg-white/5 ring-1 ring-white/10 transition-transform hover:scale-[1.02]"
    >
      <Image
        src={thumb}
        alt={vod.title ?? "FrozenDice video"}
        width={320}
        height={180}
        className="h-full w-full object-cover"
      />
      <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/40">
        <div className="scale-90 rounded-full bg-white/0 p-3 opacity-0 transition-all group-hover:scale-100 group-hover:bg-white/90 group-hover:opacity-100">
          <Play aria-hidden="true" className="h-6 w-6 fill-stone-900 text-stone-900" />
        </div>
      </div>
      {vod.title && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-8">
          <p className="line-clamp-2 text-left text-sm font-medium text-white">
            {vod.title}
          </p>
        </div>
      )}
    </button>
  );
}

function VodLightbox({ vod, onClose }: { vod: Vod; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();

    function handleClose() {
      onClose();
    }
    function handleBackdropClick(e: MouseEvent) {
      // Native dialog: clicking outside the dialog content fires a click
      // on the dialog element itself.
      if (e.target === dialog) onClose();
    }

    dialog.addEventListener("close", handleClose);
    dialog.addEventListener("click", handleBackdropClick);
    return () => {
      dialog.removeEventListener("close", handleClose);
      dialog.removeEventListener("click", handleBackdropClick);
    };
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      className="m-auto w-[min(90vw,1024px)] rounded-xl bg-black p-0 backdrop:bg-black/80 backdrop:backdrop-blur-sm"
      aria-label={vod.title ? `Playing: ${vod.title}` : "Playing video"}
    >
      <div className="relative aspect-video w-full">
        <iframe
          src={`https://www.youtube.com/embed/${vod.youtubeVideoId}?autoplay=1&rel=0`}
          title={vod.title ?? "FrozenDice video"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 rounded-full bg-black/70 p-2 text-white backdrop-blur-sm transition-colors hover:bg-black/90"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </dialog>
  );
}
