"use client";`n`nexport const dynamic = 'force-dynamic';`n`n`n`n`n`nimport { useSession } from "next-auth/react";
import { ProjectsView } from "@/components/ProjectsView";

export default function ProjectsPage() {
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.role === "ADMIN";
  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display text-[22px] font-bold">{isAdmin ? "Projects" : "My Projects"}</h1>
        <p className="mt-1 text-[13.5px] text-steel">Search, filter and manage your project portfolio.</p>
      </div>
      <ProjectsView showStats={false} />
    </div>
  );
}



