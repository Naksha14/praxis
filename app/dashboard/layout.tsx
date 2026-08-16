import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";
import { ToastProvider } from "@/components/ui";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const user = session.user as any;

  return (
    <ToastProvider>
      <div className="flex min-h-screen flex-col md:flex-row">
        <Sidebar role={user.role} name={user.name} />
        <div className="min-w-0 flex-1">
          <div className="p-6 md:p-10">{children}</div>
        </div>
      </div>
    </ToastProvider>
  );
}
