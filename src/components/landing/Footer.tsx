export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white py-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-lg font-semibold text-slate-950">BillingFlow</p>
          <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">
            Build predictable recurring revenue with a lightweight billing experience designed for fast-moving teams.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Product</p>
            <nav className="mt-4 space-y-3 text-sm text-slate-600">
              <a href="#features" className="block hover:text-slate-950">Features</a>
              <a href="#pricing" className="block hover:text-slate-950">Pricing</a>
              <a href="#faq" className="block hover:text-slate-950">FAQ</a>
            </nav>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Resources</p>
            <nav className="mt-4 space-y-3 text-sm text-slate-600">
              <a href="#" className="block hover:text-slate-950">Documentation</a>
              <a href="#" className="block hover:text-slate-950">Support</a>
            </nav>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Company</p>
            <nav className="mt-4 space-y-3 text-sm text-slate-600">
              <a href="#" className="block hover:text-slate-950">About</a>
              <a href="#" className="block hover:text-slate-950">Contact</a>
            </nav>
          </div>
        </div>
      </div>
      <div className="mt-10 border-t border-slate-200 py-6 text-center text-sm text-slate-500">
        © 2026 BillingFlow. All rights reserved.
      </div>
    </footer>
  )
}
