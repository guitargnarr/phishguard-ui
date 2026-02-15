import { Suspense } from "react";
import type { Metadata } from "next";
import StateComparison from "./components/StateComparison";

export const metadata: Metadata = {
  title: "Compare State Markets | Meridian",
  description:
    "Compare pharmacy market data side-by-side for 2-3 US states. Pharmacy counts, active rates, density, and revenue potential at a glance.",
};

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#050505] pt-14 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#14b8a6] border-t-transparent" />
        </div>
      }
    >
      <StateComparison />
    </Suspense>
  );
}
