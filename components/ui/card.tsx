export function Card({ title, value }: { title: string; value: string | number }) {
  return <div className="card p-4"><p className="text-sm text-slate-500">{title}</p><p className="text-2xl font-semibold">{value}</p></div>;
}
