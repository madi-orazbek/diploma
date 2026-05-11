export default function NotFound() {
  return (
    <div className="card p-8 text-center">
      <h1 className="text-3xl font-bold mb-2">Page not found</h1>
      <p className="text-slate-600 mb-4">The page you requested does not exist.</p>
      <a href="/" className="px-4 py-2 bg-brand text-white rounded">Go to Home</a>
    </div>
  );
}
