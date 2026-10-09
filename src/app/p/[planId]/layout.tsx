import { PlanShell } from "@/features/plans/PlanShell";

export default function PlanLayout({ children }: { children: React.ReactNode }) {
  return <PlanShell>{children}</PlanShell>;
}
