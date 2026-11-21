import type { Metadata } from "next";
import { Suspense } from "react";
import FinderExplorer from "@/components/ui/finder-explorer/finder-explorer";

export const metadata: Metadata = {
  title: "Documents — Sahrul Portfolio",
  description:
    "Explore curriculum vitae, academic records, case studies, and engineering references.",
};

export default function DocumentsPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100dvh" }} />}>
      <FinderExplorer />
    </Suspense>
  );
}
