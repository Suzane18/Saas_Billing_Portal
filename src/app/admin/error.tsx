'use client'

export default function AdminError({ error }: { error: Error }) {
  console.error(error)

  return (
    <div className="min-h-[60vh] rounded-[2rem] border border-rose-200 bg-rose-50 p-10 text-center shadow-sm">
      <p className="text-lg font-semibold text-rose-900">Admin page failed to load.</p>
      <p className="mt-3 text-sm text-rose-700">Please try again or check your server logs for details.</p>
    </div>
  )
}
