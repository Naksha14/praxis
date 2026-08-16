"use client";
export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { Image as ImageIcon, Film, Upload } from "lucide-react";
import { EmptyState } from "@/components/ui";

export default function MediaPage() {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/media")
      .then((res) => res.json())
      .then((data) => {
        setMedia(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display text-[22px] font-bold">Media</h1>
        <p className="mt-1 text-[13.5px] text-steel">Photos and videos across all projects.</p>
      </div>
      {media.length === 0 ? (
        <EmptyState icon={Upload} title="No media found" subtitle="Upload photos and videos from project pages." />
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {media.map((item: any) => (
            <div key={item.id} className="border rounded-lg p-3">
              {item.kind === "photo" ? (
                <ImageIcon className="w-8 h-8 text-blue-500" />
              ) : (
                <Film className="w-8 h-8 text-red-500" />
              )}
              <p className="text-sm truncate mt-2">{item.name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}