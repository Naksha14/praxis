"use client";
export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Eye, Download } from "lucide-react";
import { EmptyState, fmtDate, fmtBytes, Modal, useToast } from "@/components/ui";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    fetch("/api/documents")
      .then((res) => res.json())
      .then((data) => {
        setDocuments(data);
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
        <h1 className="font-display text-[22px] font-bold">Documents</h1>
        <p className="mt-1 text-[13.5px] text-steel">All documents across all projects.</p>
      </div>
      {documents.length === 0 ? (
        <EmptyState title="No documents found" description="Upload documents from project pages." />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {documents.map((doc: any) => (
            <div key={doc.id} className="border rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-blue-500" />
                <div>
                  <p className="font-medium">{doc.name}</p>
                  <p className="text-sm text-gray-500">{fmtDate(doc.createdAt)} • {fmtBytes(doc.size)}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-gray-100 rounded">
                  <Eye size={16} />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded">
                  <Download size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}