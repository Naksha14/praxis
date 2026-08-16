"use client";
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui";

export default function InchargesPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const toast = useToast();

  useEffect(() => {
    fetch("/api/users")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setUsers)
      .catch(() => toast("Could not load the in-charge directory. Please refresh the page.", "error"));
    fetch("/api/projects")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setProjects)
      .catch(() => {});
  }, []);

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display text-[22px] font-bold">Project In-Charges</h1>
        <p className="mt-1 text-[13.5px] text-steel">Everyone currently responsible for a project.</p>
      </div>
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {users.map((u) => {
          const count = projects.filter((p) => p.inChargeId === u.id).length;
          return (
            <div key={u.id} className="flex items-center gap-3 rounded-xl border border-line bg-white p-4.5 p-[18px]">
              <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-blueprint font-bold text-white">
                {u.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("")}
              </div>
              <div>
                <div className="text-[14.5px] font-bold">{u.name}</div>
                <div className="font-mono text-xs text-steel">{u.loginId}</div>
                <div className="mt-0.5 text-xs text-steel">{count} project{count !== 1 ? "s" : ""} assigned</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
