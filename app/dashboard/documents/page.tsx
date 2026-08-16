"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Eye, Download } from "lucide-react";
import { EmptyState, fmtDate, fmtBytes, Modal, useToast } from "@/components/ui";

export default function DocumentsPage() {
  const [rows, setRows] = useState<any[] | null>(null);
  const [lightbox, setLightbox] = useState<any>(null);
  const toast = useToast();

  useEffect(() => {
    fetch("/api/documents")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setRows)
      .catch(() => { setRows([]); toast("Could not load documents. Please refresh the page.", "error"); });
  }, []);

  async function open(kind: "view" | "download", doc: any) {
    const res = await fetch(`/api/download-url?kind=document&id=${doc.id}`);
    const body = await res.json();
    if (!res.ok) { toast(body.error || "Could not open file.", "error"); return; }
    if (kind === "download") window.open(body.url, "_blank");
    else setLightbox({ url: body.url, name: doc.name, isPdf: doc.mimeType === "application/pdf" });
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display text-[22px] font-bold">Documents</h1>
        <p className="mt-1 text-[13.5px] text-steel">Every drawing and progress document across all visible projects.</p>
      </div>

      {rows === null ? (
        <div className="grid gap-2.5">{[1, 2, 3].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-line/40" />)}</div>
      ) : rows.length === 0 ? (
        <EmptyState icon={FileText} title="No documents yet." subtitle="Documents uploaded across all projects will appear here." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-white">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="bg-paper">
                  {["File", "Project", "Type", "Uploaded By", "Date", "Size", ""].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-steel">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((d) => (
                  <tr key={d.id} className="border-t border-line">
                    <td className="px-4 py-2.5 font-semibold"><FileText size={13} className="mr-1.5 inline text-blueprint" />{d.name}</td>
                    <td className="px-4 py-2.5">
                      <Link href={`/dashboard/projects/${d.project.id}`} className="hover:text-blueprint hover:underline">{d.project.title}</Link>
                    </td>
                    <td className="px-4 py-2.5"><span className="rounded-full bg-[#EEF0F3] px-2.5 py-0.5 text-[11.5px] font-semibold text-steel">{d.docType}</span></td>
                    <td className="px-4 py-2.5 text-steel">{d.uploadedBy.name}</td>
                    <td className="whitespace-nowrap px-4 py-2.5">{fmtDate(d.createdAt)}</td>
                    <td className="px-4 py-2.5">{fmtBytes(d.size)}</td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-right">
                      <button onClick={() => open("view", d)} className="rounded p-1.5 hover:bg-paper"><Eye size={13} /></button>
                      <button onClick={() => open("download", d)} className="rounded p-1.5 hover:bg-paper"><Download size={13} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {lightbox && (
        <Modal title={lightbox.name} onClose={() => setLightbox(null)} width={700}>
          {lightbox.isPdf ? <iframe src={lightbox.url} title={lightbox.name} className="h-[60vh] w-full rounded-lg border-0" /> : <a href={lightbox.url} target="_blank" className="text-blueprint underline">Open file in a new tab</a>}
        </Modal>
      )}
    </div>
  );
}
