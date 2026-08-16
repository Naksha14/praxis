"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutDashboard, FolderKanban, Users, Settings, LogOut, HardHat, Wallet, FileText, Image as ImageIcon } from "lucide-react";

export function Sidebar({ role, name }: { role: "ADMIN" | "PROJECT_INCHARGE"; name: string }) {
  const pathname = usePathname();
  const nav = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/projects", label: role === "ADMIN" ? "Projects" : "My Projects", icon: FolderKanban },
    { href: "/dashboard/finance", label: "Finance", icon: Wallet },
    { href: "/dashboard/documents", label: "Documents", icon: FileText },
    { href: "/dashboard/media", label: "Media", icon: ImageIcon },
    ...(role === "ADMIN" ? [{ href: "/dashboard/incharges", label: "Project In-Charges", icon: Users }] : []),
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="flex w-[236px] shrink-0 flex-col bg-ink p-3.5 text-white">
      <div className="flex items-center gap-2.5 px-2.5 pb-5 pt-1">
        <div className="flex h-[30px] w-[30px] items-center justify-center rounded-md bg-amber">
          <HardHat size={16} color="#211404" />
        </div>
        <span className="font-display text-[15.5px] font-bold tracking-wide">PRAXIS</span>
      </div>

      <div className="flex flex-1 flex-col gap-0.5">
        {nav.map((n) => {
          const active = pathname === n.href;
          return (
            <Link key={n.href} href={n.href}
              className={`flex items-center gap-2.5 rounded-lg border-l-[3px] px-3.5 py-2.5 text-sm font-medium transition ${active ? "border-amber bg-amber/10 text-white" : "border-transparent text-[#AEB8C4] hover:bg-white/5 hover:text-white"}`}>
              <n.icon size={16} /> {n.label}
            </Link>
          );
        })}
      </div>

      <div className="mt-2.5 border-t border-white/10 pt-3.5">
        <div className="flex items-center gap-2.5 px-2.5 pb-3">
          <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-blueprint text-[12.5px] font-bold">
            {name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
          </div>
          <div className="min-w-0">
            <div className="truncate text-[13px] font-semibold">{name}</div>
            <div className="text-[11px] text-[#8A93A1]">{role === "ADMIN" ? "Administrator" : "Project In-Charge"}</div>
          </div>
        </div>
        <button onClick={() => signOut({ callbackUrl: "/login" })} className="flex w-full items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-sm font-medium text-[#AEB8C4] hover:bg-white/5 hover:text-white">
          <LogOut size={16} /> Logout
        </button>
      </div>
    </div>
  );
}
