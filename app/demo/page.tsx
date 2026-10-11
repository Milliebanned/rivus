import type { Metadata } from "next";
import { Dashboard } from "@/components/Dashboard";

export const metadata: Metadata = { title: "Live demo · Rivus" };

export default function Demo() {
  return <Dashboard />;
}
