export default function DashboardLoading() {
  return (
    <div className="min-h-screen p-6 bg-sky-50">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm animate-pulse">
          <div className="h-8 w-1/3 rounded-full bg-slate-200" />
          <div className="mt-4 h-6 w-2/3 rounded-full bg-slate-200" />
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="h-28 rounded-[2rem] bg-slate-200" />
            <div className="h-28 rounded-[2rem] bg-slate-200" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-64 rounded-[2rem] bg-slate-200" />
          <div className="h-64 rounded-[2rem] bg-slate-200" />
        </div>
      </div>
    </div>
  )
}
