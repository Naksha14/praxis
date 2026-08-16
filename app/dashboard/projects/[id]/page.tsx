"use client";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  ArrowLeft, Building2, User as UserIcon, Calendar, Pencil, FileText, Upload, Eye, Download, Trash2,
  Image as ImageIcon, Film, TrendingUp, TrendingDown, Wallet, IndianRupee, Loader2,
} from "lucide-react";
import { StatCard, EmptyState, ConfirmDialog, Modal, Ledger, EntryFormModal, fmtMoney, fmtDate, fmtBytes, useToast } from "@/components/ui";
import { ProjectFormModal } from "@/components/ProjectFormModal";
import { PaymentPanel } from "@/components/PaymentPanel";
import { computeExpenseSummary } from "@/lib/shared";
import { supabaseBrowser, STORAGE_BUCKET } from "@/lib/supabase-browser";

const LEDGER_LABEL: Record<string, string> = {
  revenue: "Revenue entry", expenditure: "Expenditure entry", labour: "Labour charge",
  material: "Material charge", transport: "Transport charge", extra: "Extra charge",
};

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const user = session?.user as any;
  const toast = useToast();

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");

  const [docModal, setDocModal] = useState(false);
  const [mediaModal, setMediaModal] = useState<null | "photo" | "video">(null);
  const [entryModal, setEntryModal] = useState<any>(null);
  const [confirmState, setConfirmState] = useState<any>(null);
  const [lightbox, setLightbox] = useState<any>(null);
  const [editInfo, setEditInfo] = useState(false);
  const [busy, setBusy] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${params.id}`);
      if (res.ok) setProject(await res.json());
      else {
        const body = await res.json().catch(() => ({}));
        toast(body.error || "Could not load project.", "error");
      }
    } catch {
      toast("Could not reach the server. Check your connection and try again.", "error");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, [params.id]);

  if (loading || !user) {
    return <div className="h-40 animate-pulse rounded-xl bg-line/40" />;
  }
  if (!project) {
    return (
      <div className="rounded-xl border border-line bg-white p-8 text-center">
        <p className="mb-3 text-sm text-steel">This project couldn't be loaded — it may not exist, or you may not have access to it.</p>
        <button onClick={load} className="rounded-md border border-line px-4 py-2 text-sm font-semibold hover:bg-paper">Try again</button>
      </div>
    );
  }

  const isAdmin = user.role === "ADMIN";
  const canDeleteItem = (item: any) => isAdmin || item.uploadedBy?.name === user.name;
  const t = project.totals;

  async function toggleStatus() {
    const willBe = project.status === "completed" ? "active" : "completed";
    const res = await fetch(`/api/projects/${params.id}`, { method: "PATCH", body: JSON.stringify({ status: willBe }) });
    if (res.ok) { toast(`Marked as ${willBe}.`, "success"); load(); }
  }

  async function saveEditInfo(data: any) {
    setBusy(true);
    const res = await fetch(`/api/projects/${params.id}`, { method: "PATCH", body: JSON.stringify(data) });
    setBusy(false);
    if (!res.ok) { const b = await res.json(); toast(b.error || "Could not update project.", "error"); return; }
    setEditInfo(false);
    toast("Project details updated.", "success");
    load();
  }

  async function addLedgerEntry(type: string, data: any) {
    setBusy(true);
    const res = await fetch(`/api/projects/${params.id}/ledger/${type}`, { method: "POST", body: JSON.stringify(data) });
    const body = await res.json();
    setBusy(false);
    if (!res.ok) { toast(body.error || "Could not save entry.", "error"); return; }
    toast(`${LEDGER_LABEL[type]} added.`, "success");
    setEntryModal(null);
    load();
  }
  async function editLedgerEntry(type: string, entryId: string, data: any) {
    setBusy(true);
    const res = await fetch(`/api/projects/${params.id}/ledger/${type}/${entryId}`, { method: "PATCH", body: JSON.stringify(data) });
    const body = await res.json();
    setBusy(false);
    if (!res.ok) { toast(body.error || "Could not update entry.", "error"); return; }
    toast(`${LEDGER_LABEL[type]} updated.`, "success");
    setEntryModal(null);
    load();
  }
  async function deleteLedgerEntry(type: string, entryId: string) {
    setBusy(true);
    const res = await fetch(`/api/projects/${params.id}/ledger/${type}/${entryId}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) { const b = await res.json(); toast(b.error || "Could not delete entry.", "error"); return; }
    toast(`${LEDGER_LABEL[type]} removed.`, "success");
    setConfirmState(null);
    load();
  }

  async function uploadDocument(file: File, docType: string) {
    setBusy(true);
    try {
      console.log("📄 Uploading document:", file.name, file.size, file.type);
      const urlRes = await fetch("/api/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: params.id,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          kind: "document"
        }),
      });
      const urlBody = await urlRes.json();
      if (!urlRes.ok) { toast(urlBody.error || "Upload rejected.", "error"); return; }

      const { error: uploadErr } = await supabaseBrowser.storage.from(STORAGE_BUCKET).uploadToSignedUrl(urlBody.fileKey, urlBody.token, file);
      if (uploadErr) { toast(`Upload failed: ${uploadErr.message}`, "error"); return; }

      const metaRes = await fetch(`/api/projects/${params.id}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: file.name, docType, fileKey: urlBody.fileKey, mimeType: file.type, size: file.size }),
      });
      if (!metaRes.ok) { toast("Upload succeeded but saving the record failed.", "error"); return; }
      toast("Document uploaded.", "success");
      setDocModal(false);
      load();
    } catch (e: any) {
      toast(`Upload failed: ${e?.message || "please check your connection and try again."}`, "error");
    } finally {
      setBusy(false);
    }
  }

  async function uploadMedia(file: File, kind: "photo" | "video") {
    setBusy(true);
    try {
      console.log("📸 Uploading media:", file.name, file.size, file.type, kind);
      
      const urlRes = await fetch("/api/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: params.id,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          kind: kind
        }),
      });
      
      const urlBody = await urlRes.json();
      if (!urlRes.ok) {
        toast(urlBody.error || "Upload rejected.", "error");
        return;
      }

      const { error: uploadErr } = await supabaseBrowser.storage
        .from(STORAGE_BUCKET)
        .uploadToSignedUrl(urlBody.fileKey, urlBody.token, file);
        
      if (uploadErr) {
        toast(`Upload failed: ${uploadErr.message}`, "error");
        return;
      }

      const metaRes = await fetch(`/api/projects/${params.id}/media`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: file.name,
          kind: kind,
          fileKey: urlBody.fileKey,
          mimeType: file.type,
          size: file.size
        }),
      });
      
      if (!metaRes.ok) {
        toast("Upload succeeded but saving the record failed.", "error");
        return;
      }
      
      toast(`${kind === "photo" ? "Photo" : "Video"} uploaded.`, "success");
      setMediaModal(null);
      load();
    } catch (e: any) {
      toast(`Upload failed: ${e?.message || "please check your connection and try again."}`, "error");
    } finally {
      setBusy(false);
    }
  }

  async function openFile(kind: "document" | "media", item: any) {
    const res = await fetch(`/api/download-url?kind=${kind}&id=${item.id}`);
    const body = await res.json();
    if (!res.ok) { toast(body.error || "Could not open file.", "error"); return null; }
    return body.url as string;
  }
  async function viewFile(kind: "document" | "media", item: any, type: string) {
    const url = await openFile(kind, item);
    if (url) setLightbox({ type, url, name: item.name });
  }
  async function downloadFile(kind: "document" | "media", item: any) {
    const url = await openFile(kind, item);
    if (url) window.open(url, "_blank");
  }

  async function deleteDocument(doc: any) {
    setBusy(true);
    const res = await fetch(`/api/projects/${params.id}/documents/${doc.id}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) { const b = await res.json(); toast(b.error || "Could not delete document.", "error"); return; }
    toast("Document deleted.", "success");
    setConfirmState(null);
    load();
  }
  async function deleteMedia(m: any) {
    setBusy(true);
    const res = await fetch(`/api/projects/${params.id}/media/${m.id}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) { const b = await res.json(); toast(b.error || "Could not delete file.", "error"); return; }
    toast("File deleted.", "success");
    setConfirmState(null);
    load();
  }

  const inRange = (d: string) => (!from || d >= from) && (!to || d <= to);
  const rev = (project.revenues || []).filter((r: any) => inRange(new Date(r.date).toISOString().slice(0, 10)));
  const exp = (project.expenditures || []).filter((r: any) => inRange(new Date(r.date).toISOString().slice(0, 10)));
  const rangeRevenue = rev.reduce((a: number, x: any) => a + Number(x.amount), 0);
  const rangeExpenditure = exp.reduce((a: number, x: any) => a + Number(x.amount), 0);
  const rangeNet = rangeRevenue - rangeExpenditure;

  return (
    <div>
      <Link href="/dashboard/projects" className="mb-3.5 inline-flex items-center gap-1.5 text-sm font-semibold text-steel hover:text-ink"><ArrowLeft size={15} /> Back to projects</Link>

      <div className="mb-4.5 rounded-xl border border-line bg-white p-5.5 p-[22px]">
        <div className="flex flex-wrap items-start justify-between gap-3.5">
          <div>
            <div className="stamp-corners mb-2.5 inline-block border border-line px-2.5 py-0.5 font-mono text-[10.5px] text-steel">ID {project.code}</div>
            <h1 className="mb-1 font-display text-2xl font-bold">{project.title}</h1>
            <div className="flex flex-wrap gap-4 text-[13.5px] text-steel">
              <span className="flex items-center gap-1.5"><Building2 size={13} /> {project.client}</span>
              <span className="flex items-center gap-1.5"><UserIcon size={13} /> {project.inCharge.name}</span>
              <span className="flex items-center gap-1.5"><Calendar size={13} /> {fmtDate(project.date)}</span>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span onClick={toggleStatus} className={`cursor-pointer rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${project.status === "completed" ? "bg-[#EEF0F3] text-steel" : "bg-successbg text-success"}`}>
              {project.status === "completed" ? "Completed" : "Active"}
            </span>
            <button onClick={() => setEditInfo(true)} className="flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-[12.5px] font-semibold hover:bg-paper"><Pencil size={13} /> Edit Info</button>
          </div>
        </div>
      </div>

      <div className="mb-5 flex gap-5 overflow-x-auto border-b border-line">
        {[["overview", "Overview"], ["documents", "Documents"], ["media", "Media"], ["finance", "Finance"], ["charges", "Charges"]].map(([k, l]) => (
          <div key={k} onClick={() => setTab(k)} className={`cursor-pointer whitespace-nowrap border-b-2 py-2.5 text-[13.5px] font-semibold ${tab === k ? "border-amber text-ink" : "border-transparent text-steel"}`}>{l}</div>
        ))}
      </div>

      {tab === "overview" && (
        <div>
          <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <StatCard icon={TrendingUp} label="Total Revenue" value={fmtMoney(t.totalRevenue)} tone="amber" />
            <StatCard icon={TrendingDown} label="Total Expenditure" value={fmtMoney(t.totalExpenditure)} />
            <StatCard icon={Wallet} label="Total Charges" value={fmtMoney(t.totalCharges)} />
            <StatCard icon={IndianRupee} label="Net Amount" value={fmtMoney(t.netAmount)} tone={t.netAmount < 0 ? "danger" : "success"} />
            <StatCard icon={FileText} label="Documents" value={project.documents.length} />
            <StatCard icon={ImageIcon} label="Photos" value={project.media.filter((m: any) => m.kind === "photo").length} />
            <StatCard icon={Film} label="Videos" value={project.media.filter((m: any) => m.kind === "video").length} />
          </div>

          <div className="mb-5">
            <PaymentPanel
              projectId={project.id}
              isAdmin={isAdmin}
              payment={project.payment}
              paymentHistory={project.paymentHistory || []}
              expenseSummary={computeExpenseSummary(project.payment ? Number(project.payment.amount) : null, t.totalProjectExpenses, project.status)}
              onChanged={load}
            />
          </div>

          <div className="rounded-xl border border-line bg-white p-5">
            <h4 className="mb-3.5 text-sm font-bold">Project Information</h4>
            <div className="grid grid-cols-1 gap-4 text-[13.5px] sm:grid-cols-2 lg:grid-cols-3">
              <div><div className="mb-0.5 text-steel">Project Title</div><div className="font-semibold">{project.title}</div></div>
              <div><div className="mb-0.5 text-steel">Client Details</div><div className="font-semibold">{project.client}</div></div>
              <div><div className="mb-0.5 text-steel">Project In-Charge</div><div className="font-semibold">{project.inCharge.name}</div></div>
              <div><div className="mb-0.5 text-steel">Project Date</div><div className="font-semibold">{fmtDate(project.date)}</div></div>
              <div><div className="mb-0.5 text-steel">Project ID</div><div className="font-mono font-semibold">{project.code}</div></div>
            </div>
          </div>
        </div>
      )}

      {tab === "documents" && (
        <div>
          <div className="mb-3.5 flex items-center justify-between">
            <h4 className="text-[15px] font-bold">Drawings &amp; Progress Documents</h4>
            <button onClick={() => setDocModal(true)} className="flex items-center gap-1.5 rounded-md bg-amber px-3 py-1.5 text-[12.5px] font-semibold text-[#211404] hover:bg-amberdark"><Upload size={14} /> Upload Document</button>
          </div>
          {project.documents.length === 0 ? (
            <EmptyState icon={FileText} title="No documents yet." subtitle="Upload drawings, progress reports or other project files — everyone with access to this project will see them here."
              action={<button onClick={() => setDocModal(true)} className="flex items-center gap-1.5 rounded-md bg-amber px-4 py-2 text-sm font-semibold text-[#211404]"><Upload size={15} /> Upload Document</button>} />
          ) : (
            <div className="overflow-hidden rounded-xl border border-line bg-white">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[13px]">
                  <thead><tr className="bg-paper">{["File", "Type", "Uploaded By", "Date", "Size", ""].map((h) => <th key={h} className="px-4 py-2.5 text-left text-[11px] font-bold uppercase text-steel">{h}</th>)}</tr></thead>
                  <tbody>
                    {project.documents.map((d: any) => (
                      <tr key={d.id} className="border-t border-line">
                        <td className="px-4 py-2.5 font-semibold"><FileText size={14} className="mr-1.5 inline text-blueprint" />{d.name}</td>
                        <td className="px-4 py-2.5"><span className="rounded-full bg-[#EEF0F3] px-2.5 py-0.5 text-[11.5px] font-semibold text-steel">{d.docType}</span></td>
                        <td className="px-4 py-2.5 text-steel">{d.uploadedBy.name}</td>
                        <td className="whitespace-nowrap px-4 py-2.5">{fmtDate(d.createdAt)}</td>
                        <td className="px-4 py-2.5">{fmtBytes(d.size)}</td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-right">
                          <button onClick={() => viewFile("document", d, d.mimeType === "application/pdf" ? "pdf" : "file")} className="rounded p-1.5 hover:bg-paper"><Eye size={13} /></button>
                          <button onClick={() => downloadFile("document", d)} className="rounded p-1.5 hover:bg-paper"><Download size={13} /></button>
                          {canDeleteItem(d) && <button onClick={() => setConfirmState({ kind: "doc", item: d })} className="rounded p-1.5 hover:bg-paper"><Trash2 size={13} className="text-danger" /></button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "media" && (
        <div>
          <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2.5">
            <h4 className="text-[15px] font-bold">Photos &amp; Videos</h4>
            <div className="flex gap-2">
              <button onClick={() => setMediaModal("photo")} className="flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-[12.5px] font-semibold hover:bg-paper"><Upload size={14} /> Upload Photos</button>
              <button onClick={() => setMediaModal("video")} className="flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-[12.5px] font-semibold hover:bg-paper"><Upload size={14} /> Upload Videos</button>
            </div>
          </div>
          {project.media.length === 0 ? (
            <EmptyState icon={ImageIcon} title="No media yet." subtitle="Upload site photos and videos to keep a visual record of progress."
              action={<button onClick={() => setMediaModal("photo")} className="flex items-center gap-1.5 rounded-md bg-amber px-4 py-2 text-sm font-semibold text-[#211404]"><Upload size={15} /> Upload Photos</button>} />
          ) : (
            <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4">
              {project.media.map((m: any) => (
                <div key={m.id} className="overflow-hidden rounded-xl border border-line bg-white">
                  <div onClick={() => viewFile("media", m, m.kind)} className="flex h-[110px] cursor-pointer items-center justify-center bg-paper">
                    {m.kind === "video" ? <Film size={26} className="text-steellight" /> : <ImageIcon size={26} className="text-steellight" />}
                  </div>
                  <div className="p-2.5">
                    <div className="truncate text-[12.5px] font-semibold">{m.name}</div>
                    <div className="mb-2 text-[11px] text-steel">{fmtDate(m.createdAt)} · {m.uploadedBy.name}</div>
                    <div className="flex gap-1">
                      <button onClick={() => downloadFile("media", m)} className="flex flex-1 items-center justify-center rounded p-1.5 hover:bg-paper"><Download size={13} /></button>
                      {canDeleteItem(m) && <button onClick={() => setConfirmState({ kind: "media", item: m })} className="flex flex-1 items-center justify-center rounded p-1.5 hover:bg-paper"><Trash2 size={13} className="text-danger" /></button>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "finance" && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end gap-3.5 rounded-xl border border-line bg-white p-4">
            <div><label className="mb-1.5 block text-xs font-semibold uppercase text-steel">From Date</label><input type="date" className="rounded-md border border-line px-3 py-2 text-sm" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
            <div><label className="mb-1.5 block text-xs font-semibold uppercase text-steel">To Date</label><input type="date" className="rounded-md border border-line px-3 py-2 text-sm" value={to} onChange={(e) => setTo(e.target.value)} /></div>
            {(from || to) && <button onClick={() => { setFrom(""); setTo(""); }} className="text-sm font-semibold text-steel hover:text-ink">Clear filter</button>}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard icon={TrendingUp} label="Total Revenue" value={fmtMoney(rangeRevenue)} tone="amber" />
            <StatCard icon={TrendingDown} label="Total Expenditure" value={fmtMoney(rangeExpenditure)} />
            <StatCard icon={IndianRupee} label="Net Revenue" value={fmtMoney(rangeNet)} tone={rangeNet < 0 ? "danger" : "success"} />
          </div>
          <Ledger rows={rev} addLabel="+ Add Revenue" emptyText="No revenue recorded for this period."
            onAdd={() => setEntryModal({ type: "revenue" })} onEdit={(r) => setEntryModal({ type: "revenue", edit: r })}
            onDelete={(r) => setConfirmState({ kind: "ledger", ledgerType: "revenue", item: r })} />
          <Ledger rows={exp} addLabel="+ Add Expenditure" emptyText="No expenditure recorded for this period."
            onAdd={() => setEntryModal({ type: "expenditure" })} onEdit={(r) => setEntryModal({ type: "expenditure", edit: r })}
            onDelete={(r) => setConfirmState({ kind: "ledger", ledgerType: "expenditure", item: r })} />
        </div>
      )}

      {tab === "charges" && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard icon={Wallet} label="Labour" value={fmtMoney(project.labourCharges.length ? t.totalLabour : null)} />
            <StatCard icon={Wallet} label="Material" value={fmtMoney(project.materialCharges.length ? t.totalMaterial : null)} />
            <StatCard icon={Wallet} label="Transport" value={fmtMoney(project.transportCharges.length ? t.totalTransport : null)} />
            <StatCard icon={Wallet} label="Extra" value={fmtMoney(project.extraCharges.length ? t.totalExtra : null)} />
            <StatCard icon={IndianRupee} label="Total Additional Charges" value={fmtMoney(t.totalCharges)} tone="amber" />
          </div>
          {(["labour", "material", "transport", "extra"] as const).map((key) => {
            const field = key === "labour" ? "labourCharges" : key === "material" ? "materialCharges" : key === "transport" ? "transportCharges" : "extraCharges";
            return (
              <Ledger key={key} rows={project[field]} addLabel={`+ Add ${key[0].toUpperCase() + key.slice(1)} Charge`} emptyText={`No ${key} charges recorded.`}
                onAdd={() => setEntryModal({ type: key })} onEdit={(r) => setEntryModal({ type: key, edit: r })}
                onDelete={(r) => setConfirmState({ kind: "ledger", ledgerType: key, item: r })} />
            );
          })}
        </div>
      )}

      {docModal && <DocUploadModal onClose={() => setDocModal(false)} onUpload={uploadDocument} busy={busy} />}
      {mediaModal && <MediaUploadModal kind={mediaModal} onClose={() => setMediaModal(null)} onUpload={(f) => uploadMedia(f, mediaModal)} busy={busy} />}

      {entryModal && (
        <EntryFormModal
          title={entryModal.edit ? `Edit ${LEDGER_LABEL[entryModal.type]}` : `Add ${LEDGER_LABEL[entryModal.type]}`}
          initial={entryModal.edit} busy={busy} onClose={() => setEntryModal(null)}
          onSave={(data) => entryModal.edit ? editLedgerEntry(entryModal.type, entryModal.edit.id, data) : addLedgerEntry(entryModal.type, data)}
        />
      )}

      {editInfo && (
        <ProjectFormModal initial={{ ...project, inChargeId: project.inChargeId }} inchargeUsers={[{ id: project.inChargeId, name: project.inCharge.name, loginId: "" }]}
          canReassign={false} busy={busy} onClose={() => setEditInfo(false)} onSave={saveEditInfo} />
      )}

      {confirmState && (
        <ConfirmDialog
          title={confirmState.kind === "doc" ? "Delete document?" : confirmState.kind === "media" ? "Delete this file?" : "Delete this entry?"}
          message={confirmState.kind === "ledger" ? "This entry will be permanently removed. This action cannot be undone." : `"${confirmState.item.name}" will be permanently removed.`}
          busy={busy} onCancel={() => setConfirmState(null)}
          onConfirm={() => {
            if (confirmState.kind === "doc") deleteDocument(confirmState.item);
            else if (confirmState.kind === "media") deleteMedia(confirmState.item);
            else deleteLedgerEntry(confirmState.ledgerType, confirmState.item.id);
          }}
        />
      )}

      {lightbox && (
        <Modal title={lightbox.name} onClose={() => setLightbox(null)} width={700}>
          {lightbox.type === "photo" && <img src={lightbox.url} alt={lightbox.name} className="w-full rounded-lg" />}
          {lightbox.type === "video" && <video src={lightbox.url} controls className="w-full rounded-lg" />}
          {lightbox.type === "pdf" && <iframe src={lightbox.url} title={lightbox.name} className="h-[60vh] w-full rounded-lg border-0" />}
          {lightbox.type === "file" && <a href={lightbox.url} target="_blank" className="text-blueprint underline">Open file in a new tab</a>}
        </Modal>
      )}
    </div>
  );
}

function DocUploadModal({ onClose, onUpload, busy }: { onClose: () => void; onUpload: (f: File, type: string) => void; busy: boolean }) {
  const [docType, setDocType] = useState("Drawing");
  const [file, setFile] = useState<File | null>(null);
  const [err, setErr] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <Modal title="Upload Document" onClose={onClose} width={440}>
      {err && <div className="mb-3.5 rounded-md bg-dangerbg px-3 py-2 text-[13px] text-danger">{err}</div>}
      <label className="mb-1.5 block text-xs font-semibold uppercase text-steel">Document Type</label>
      <select className="mb-3.5 w-full rounded-md border border-line px-3 py-2.5 text-sm" value={docType} onChange={(e) => setDocType(e.target.value)}>
        <option>Drawing</option><option>Progress Document</option><option>Report</option><option>Other</option>
      </select>
      <label className="mb-1.5 block text-xs font-semibold uppercase text-steel">File</label>
      <div onClick={() => inputRef.current?.click()} className="mb-5 flex cursor-pointer items-center justify-between rounded-md border border-line px-3 py-2.5 text-sm">
        <span className={file ? "text-ink" : "text-steellight"}>{file ? file.name : "Click to choose a file…"}</span>
        <Upload size={15} className="text-steel" />
      </div>
      <input ref={inputRef} type="file" hidden onChange={(e) => { setErr(""); const f = e.target.files?.[0]; if (f && f.size > 25 * 1024 * 1024) { setErr("File exceeds the 25 MB limit."); return; } setFile(f || null); }} />
      <div className="flex justify-end gap-2.5">
        <button className="rounded-md border border-line px-4 py-2 text-sm font-semibold hover:bg-paper" onClick={onClose} disabled={busy}>Cancel</button>
        <button className="flex items-center gap-1.5 rounded-md bg-amber px-4 py-2 text-sm font-semibold text-[#211404] hover:bg-amberdark" disabled={busy}
          onClick={() => { if (!file) { setErr("Please choose a file to upload."); return; } onUpload(file, docType); }}>
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />} Upload
        </button>
      </div>
    </Modal>
  );
}

function MediaUploadModal({ kind, onClose, onUpload, busy }: { kind: "photo" | "video"; onClose: () => void; onUpload: (f: File) => void; busy: boolean }) {
  const [file, setFile] = useState<File | null>(null);
  const [err, setErr] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <Modal title={`Upload ${kind === "photo" ? "Photos" : "Videos"}`} onClose={onClose} width={420}>
      {err && <div className="mb-3.5 rounded-md bg-dangerbg px-3 py-2 text-[13px] text-danger">{err}</div>}
      <div onClick={() => inputRef.current?.click()} className="mb-5 flex cursor-pointer items-center justify-between rounded-md border border-line px-3.5 py-5.5 py-[22px] text-sm">
        <span className={file ? "text-ink" : "text-steellight"}>{file ? file.name : `Click to choose a ${kind}…`}</span>
        <Upload size={15} className="text-steel" />
      </div>
      <input ref={inputRef} type="file" accept={kind === "photo" ? "image/*" : "video/*"} hidden
        onChange={(e) => { setErr(""); const f = e.target.files?.[0]; const max = (kind === "photo" ? 15 : 500) * 1024 * 1024; if (f && f.size > max) { setErr("File is too large."); return; } setFile(f || null); }} />
      <div className="flex justify-end gap-2.5">
        <button className="rounded-md border border-line px-4 py-2 text-sm font-semibold hover:bg-paper" onClick={onClose} disabled={busy}>Cancel</button>
        <button className="flex items-center gap-1.5 rounded-md bg-amber px-4 py-2 text-sm font-semibold text-[#211404] hover:bg-amberdark" disabled={busy}
          onClick={() => { if (!file) { setErr(`Please choose a ${kind}.`); return; } onUpload(file); }}>
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />} Upload
        </button>
      </div>
    </Modal>
  );
}