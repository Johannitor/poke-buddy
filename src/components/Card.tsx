import type { ReactNode } from "react";

export function Card({ title, className = "", children }: { title?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <section className={`rounded-xl border border-line bg-panel p-4 ${className}`}>
      {title && <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted">{title}</h2>}
      {children}
    </section>
  );
}

export function Message({ children, error = false }: { children: ReactNode; error?: boolean }) {
  return <p className={`mt-[15vh] text-center ${error ? "text-accent" : "text-muted"}`}>{children}</p>;
}
