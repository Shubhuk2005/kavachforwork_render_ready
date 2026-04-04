export default function StatusPopup({ toast }) {
  if (!toast) return null;

  const palette =
    toast.type === 'error'
      ? 'border-red-200 bg-red-50 text-red-700'
      : toast.type === 'warning'
        ? 'border-amber-200 bg-amber-50 text-amber-700'
        : 'border-green-200 bg-green-50 text-green-700';

  return (
    <div className="pointer-events-none fixed right-4 top-20 z-50 w-[min(24rem,calc(100vw-2rem))] animate-slide-up">
      <div className={`rounded-2xl border px-4 py-3 shadow-lg backdrop-blur ${palette}`}>
        <div className="text-sm font-semibold">{toast.title || 'Status updated'}</div>
        <div className="mt-1 text-sm">{toast.message}</div>
      </div>
    </div>
  );
}
