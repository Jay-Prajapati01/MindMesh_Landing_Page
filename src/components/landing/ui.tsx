import { motion } from "motion/react";
import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const EASE = [0.16, 1, 0.3, 1] as const;

export function Label({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-ink">
      <span className="h-2 w-2 rounded-full bg-orange" />[ {children} ]
    </span>
  );
}

// Breadcrumb shared by the Contact, Beta, and Join pages: ← BACK HOME ● [ PAGE ].
// Three separate elements in a flex row with CSS gap (never literal spaces),
// so the dot can never touch either text block. Tighter gap on mobile via
// the responsive gap-x, otherwise identical everywhere.
export function Crumb({ label }: { label: string }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-8 flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-xs font-bold uppercase tracking-widest sm:gap-x-5"
    >
      <Link to="/" className="inline-flex items-center gap-2 hover:text-orange">
        <ArrowLeft className="h-4 w-4" />
        Back home
      </Link>
      <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-orange" />
      <span>[ {label} ]</span>
    </nav>
  );
}

export function Btn({
  children,
  variant = "orange",
  href = "#",
}: {
  children: ReactNode;
  variant?: "orange" | "paper";
  href?: string;
}) {
  const v =
    variant === "orange" ? "bg-orange hover:bg-orange-hover text-ink" : "bg-paper text-ink";
  return (
    <a
      href={href}
      className={`brut-btn inline-flex items-center gap-2 px-6 py-3.5 text-base font-bold ${v}`}
    >
      {children}
    </a>
  );
}

export function FadeUp({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}
