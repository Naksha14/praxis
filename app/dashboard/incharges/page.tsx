"use client";
export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { Users, Mail } from "lucide-react";
import { EmptyState } from "@/components/ui";

export default function InchargesPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => {
        setUsers(data);
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
        <h1 className="font-display text-[22px] font-bold">In-Charges</h1>
        <p className="mt-1 text-[13.5px] text-steel">Manage project in-charges.</p>
      </div>
      {users.length === 0 ? (
        <EmptyState title="No in-charges found" description="Add in-charges to manage projects." />
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {users.map((user: any) => (
            <div key={user.id} className="border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-gray-500">{user.loginId}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                <Mail size={14} />
                <span>{user.email || "No email"}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
