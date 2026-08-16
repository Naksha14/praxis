export const dynamic = 'force-dynamic';

export const dynamic = 'force-dynamic';

import { ProjectsView } from "@/components/ProjectsView";

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display text-[22px] font-bold">Dashboard</h1>
        <p className="mt-1 text-[13.5px] text-steel">Everything across every project, at a glance.</p>
      </div>
      <ProjectsView showStats={true} />
    </div>
  );
}


