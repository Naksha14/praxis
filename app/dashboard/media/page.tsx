"use client";`n`nexport const dynamic = 'force-dynamic';`n`n`n`n`n`nimport { useEffect, useState } from "react";
import Link from "next/link";
import { Image as ImageIcon, Film } from "lucide-react";
import { EmptyState, Modal, useToast } from "@/components/ui";

export default function MediaPage() {
  const [rows, setRows] = useState<any[] | null>(null);
  const [lightbox, setLightbox] = useState<any>(null);
  const toast = useToast();

  useEffect(() => {
    fetch("/api/media")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setRows)
      .catch(() => { setRows([]); toast("Could not load media. Please refresh the page.", "error"); });
  }, []);

  async function open(m: any) {
    const res = await fetch(`/api/download-url?kind=media&id=${m.id}`);
    const body = await res.json();
    if (!res.ok) { toast(body.error || "Could not open file.", "error"); return; }
    setLightbox({ url: body.url, name: m.name, kind: m.kind });
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display text-[22px] font-bold">Media</h1>
        <p className="mt-1 text-[13.5px] text-steel">Every photo and video across all visible projects.</p>
      </div>

      {rows === null ? (
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">{[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-[140px] animate-pulse rounded-xl bg-line/40" />)}</div>
      ) : rows.length === 0 ? (
        <EmptyState icon={ImageIcon} title="No media yet." subtitle="Photos and videos uploaded across all projects will appear here." />
      ) : (
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
          {rows.map((m) => (
            <div key={m.id} className="overflow-hidden rounded-xl border border-line bg-white">
              <div onClick={() => open(m)} className="flex h-[100px] cursor-pointer items-center justify-center bg-paper">
                {m.kind === "video" ? <Film size={22} className="text-steellight" /> : <ImageIcon size={22} className="text-steellight" />}
              </div>
              <div className="p-2.5">
                <div className="truncate text-xs font-semibold">{m.name}</div>
                <Link href={`/dashboard/projects/${m.project.id}`} className="text-[10.5px] text-steel hover:text-blueprint hover:underline">{m.project.title}</Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {lightbox && (
        <Modal title={lightbox.name} onClose={() => setLightbox(null)} width={700}>
          {lightbox.kind === "photo" && <img src={lightbox.url} alt={lightbox.name} className="w-full rounded-lg" />}
          {lightbox.kind === "video" && <video src={lightbox.url} controls className="w-full rounded-lg" />}
        </Modal>
      )}
    </div>
  );
}



