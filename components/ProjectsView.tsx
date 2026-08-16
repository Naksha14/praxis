"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Search, Plus, FolderKanban, Layers, TrendingUp, TrendingDown, Wallet, FileText } from "lucide-react";
import { StatCard, EmptyState, ConfirmDialog, fmtMoney, useToast } from "./ui";
import { ProjectCard } from "./ProjectCard";
import { ProjectFormModal } from "./ProjectFormModal";

export function ProjectsView({ showStats }: { showStats: boolean }) {
  const { data: session } = useSession();
  const user = session?.user as any;
  const isAdmin = user?.role === "ADMIN";
  const toast = useToast();

  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [inchargeUsers, setInchargeUsers] = useState<any[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/projects");
      if (res.ok) setProjects(await res.json());
      else {
        const body = await res.json().catch(() => ({}));
        toast(body.error || "Could not load projects.", "error");
      }
    } catch {
      toast("Could not reach the server. Check your connection and try again.", "error");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (isAdmin) {
      fetch("/api/users")
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then(setInchargeUsers)
        .catch(() => toast("Could not load the in-charge list.", "error"));
    }
  }, [isAdmin]);

  const filtered = projects.filter((p) => {
    const matchesQ = !q || [p.title, p.client, p.code, p.inChargeName].join(" ").toLowerCase().includes(q.toLowerCase());
    const matchesStatus = status === "all" || p.status === status;
    return matchesQ && matchesStatus;
  });

  const stats = isAdmin
    ? {
        total: projects.length,
        active: projects.filter((p) => p.status !== "completed").length,
        revenue: projects.reduce((a, p) => a + p.totalRevenue, 0),
        expenditure: projects.reduce((a, p) => a + p.totalExpenditure, 0),
        charges: projects.reduce((a, p) => a + p.totalCharges, 0),
      }
    : {
        total: projects.length,
        revenue: projects.reduce((a, p) => a + p.totalRevenue, 0),
        expenditure: projects.reduce((a, p) => a + p.totalExpenditure, 0),
        docs: projects.reduce((a, p) => a + p.docsCount, 0),
      };

  async function createProject(data: any) {
    setBusy(true);
    const res = await fetch("/api/projects", { method: "POST", body: JSON.stringify(data) });
    const body = await res.json();
    setBusy(false);
    if (!res.ok) { toast(body.error || "Could not create project.", "error"); return; }
    setAddOpen(false);
    toast("Project created.", "success");
    load();
  }

  async function saveEdit(data: any) {
    setBusy(true);
    const res = await fetch(`/api/projects/${editTarget.id}`, { method: "PATCH", body: JSON.stringify(data) });
    const body = await res.json();
    setBusy(false);
    if (!res.ok) { toast(body.error || "Could not update project.", "error"); return; }
    setEditTarget(null);
    toast("Project updated.", "success");
    load();
  }

  async function confirmDelete() {
    setBusy(true);
    const res = await fetch(`/api/projects/${deleteTarget.id}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) { const b = await res.json(); toast(b.error || "Could not delete project.", "error"); return; }
    setDeleteTarget(null);
    toast("Project deleted.", "success");
    load();
  }

  if (!user) return null;

  return (
    <div>
      {showStats && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {isAdmin ? (
            <>
              <StatCard icon={FolderKanban} label="Total Projects" value={stats.total} />
              <StatCard icon={Layers} label="Active Projects" value={stats.active} tone="success" />
              <StatCard icon={TrendingUp} label="Total Revenue" value={fmtMoney(stats.revenue)} tone="amber" />
              <StatCard icon={TrendingDown} label="Total Expenditure" value={fmtMoney(stats.expenditure)} />
              <StatCard icon={Wallet} label="Additional Charges" value={fmtMoney(stats.charges)} />
            </>
          ) : (
            <>
              <StatCard icon={FolderKanban} label="My Projects" value={stats.total} />
              <StatCard icon={TrendingUp} label="Total Revenue" value={fmtMoney(stats.revenue)} tone="amber" />
              <StatCard icon={TrendingDown} label="Total Expenditure" value={fmtMoney(stats.expenditure)} />
              <StatCard icon={FileText} label="Documents" value={stats.docs} />
            </>
          )}
        </div>
      )}

      <div className="mb-4.5 mb-5 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-1 flex-wrap gap-2.5" style={{ minWidth: 240 }}>
          <div className="relative min-w-[200px] max-w-[320px] flex-1">
            <Search size={15} className="absolute left-2.5 top-2.5 text-steellight" />
            <input className="w-full rounded-md border border-line py-2 pl-8 pr-3 text-sm outline-none focus:border-blueprint" placeholder="Search projects, clients, IDs…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <select className="rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-blueprint" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All Projects</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        {isAdmin && (
          <button onClick={() => setAddOpen(true)} className="flex items-center gap-1.5 rounded-md bg-amber px-4 py-2 text-[13.5px] font-semibold text-[#211404] hover:bg-amberdark">
            <Plus size={16} /> Add Project
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-[240px] animate-pulse rounded-xl bg-line/40" />)}
        </div>
      ) : filtered.length === 0 ? (
        projects.length === 0 ? (
          isAdmin ? (
            <EmptyState icon={FolderKanban} title="No projects created yet." subtitle="Get every site on the board — create your first project to start tracking documents, media and finances."
              action={<button onClick={() => setAddOpen(true)} className="flex items-center gap-1.5 rounded-md bg-amber px-4 py-2 text-sm font-semibold text-[#211404]"><Plus size={16} /> Add Project</button>} />
          ) : (
            <EmptyState icon={FolderKanban} title="No projects assigned yet." subtitle="Projects assigned to you by an admin will appear here." />
          )
        ) : (
          <EmptyState icon={Search} title="No matching projects." subtitle="Try a different search term or clear the status filter." />
        )
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <ProjectCard key={p.id} p={p} role={user.role} onEdit={() => setEditTarget(p)} onDelete={() => setDeleteTarget(p)} />
          ))}
        </div>
      )}

      {addOpen && <ProjectFormModal inchargeUsers={inchargeUsers} canReassign={true} busy={busy} onClose={() => setAddOpen(false)} onSave={createProject} />}
      {editTarget && (
        <ProjectFormModal initial={editTarget} inchargeUsers={isAdmin ? inchargeUsers : [{ id: editTarget.inChargeId, name: editTarget.inChargeName, loginId: "" }]}
          canReassign={isAdmin} busy={busy} onClose={() => setEditTarget(null)} onSave={saveEdit} />
      )}
      {deleteTarget && (
        <ConfirmDialog title="Delete project?" confirmLabel="Delete Project" busy={busy}
          message={`"${deleteTarget.title}" and all of its documents, media, finance and charge records will be permanently deleted. This action cannot be undone.`}
          onCancel={() => setDeleteTarget(null)} onConfirm={confirmDelete} />
      )}
    </div>
  );
}
