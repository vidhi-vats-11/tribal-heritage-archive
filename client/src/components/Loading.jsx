export function Loading() {
  return <p className="text-sm text-stone-500">Loading…</p>;
}

export function ErrorBox({ error }) {
  return (
    <div className="card border-red-200 bg-red-50 p-4 text-sm text-red-800">
      {error.message || String(error)}. Is the API server running?
    </div>
  );
}
