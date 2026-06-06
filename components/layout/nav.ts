import {
  LayoutDashboard,
  Calculator,
  Flame,
  Dices,
  Target,
  Wallet,
  Receipt,
  Bot,
  GitCompareArrows,
  PieChart,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  description: string;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, description: "Financial health at a glance" },
  { href: "/calculator", label: "Retirement Calculator", icon: Calculator, description: "When can you retire?" },
  { href: "/fire", label: "FIRE Calculator", icon: Flame, description: "Lean, Regular & Fat FIRE" },
  { href: "/monte-carlo", label: "Monte Carlo", icon: Dices, description: "Probability of success" },
  { href: "/portfolio", label: "Portfolio Analyzer", icon: PieChart, description: "Allocation & risk" },
  { href: "/goals", label: "Goal Planning", icon: Target, description: "Life goals impact" },
  { href: "/income", label: "Income Planner", icon: Wallet, description: "Post-retirement income" },
  { href: "/tax", label: "Tax Optimizer", icon: Receipt, description: "Old vs New regime" },
  { href: "/scenarios", label: "Scenarios", icon: GitCompareArrows, description: "Compare strategies" },
  { href: "/coach", label: "AI Coach", icon: Bot, description: "Ask anything" },
];
