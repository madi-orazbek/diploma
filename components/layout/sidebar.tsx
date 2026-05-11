export function Sidebar({ items }: { items: Array<{ label: string; href: string }> }) {
  return (
    <aside className="card p-4 h-fit">
      <div className="space-y-2">
        {items.map((i) => (
          <a key={i.href} href={i.href} className="block px-3 py-2 rounded-lg hover:bg-slate-100">{i.label}</a>
        ))}
      </div>
    </aside>
  );
}
