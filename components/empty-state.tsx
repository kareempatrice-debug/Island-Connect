import { SearchX } from "lucide-react";

export function EmptyState({ title, children, icon: Icon = SearchX }: { title: string; children?: React.ReactNode; icon?: typeof SearchX }) {
  return (
    <div className="rounded-panel border border-dashed border-line bg-raised/70 px-6 py-12 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sunken">
        <Icon className="h-6 w-6 text-muted" aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-xl font-semibold">{title}</h3>
      {children && <div className="mx-auto mt-2 max-w-md">{children}</div>}
    </div>
  );
}
