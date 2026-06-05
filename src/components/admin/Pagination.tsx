import Link from 'next/link'

interface PaginationProps {
  currentPage: number
  pageSize: number
  totalItems: number
  basePath: string
}

export default function Pagination({ currentPage, pageSize, totalItems, basePath }: PaginationProps) {
  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize))
  return (
    <div className="flex flex-col gap-3 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-600">
        Showing page {currentPage} of {pageCount}, {totalItems} total records.
      </p>
      <div className="flex flex-wrap gap-2">
        <Link
          href={`${basePath}?page=${Math.max(1, currentPage - 1)}`}
          className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
        >
          Previous
        </Link>
        <Link
          href={`${basePath}?page=${Math.min(pageCount, currentPage + 1)}`}
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Next
        </Link>
      </div>
    </div>
  )
}
