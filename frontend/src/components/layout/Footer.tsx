import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-[#0f172a]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-1">
            <span className="text-xl font-black tracking-wider text-white">
              CMP.<span className="text-blue-500">SHP</span>
            </span>
            <p className="mt-3 text-sm text-slate-400 leading-relaxed">
              Your one-stop shop for PC components. Build your dream machine with top-tier parts and expert compatibility checks.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Shop</h3>
            <ul className="mt-4 space-y-2">
              {['CPU', 'GPU', 'Motherboard', 'RAM', 'Storage'].map((cat) => (
                <li key={cat}>
                  <Link
                    href={`/shop?category=${cat}`}
                    className="text-sm text-slate-400 transition-colors hover:text-white"
                  >
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Tools */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Tools</h3>
            <ul className="mt-4 space-y-2">
              {[
                { href: '/pc-builder', label: 'PC Builder' },
                { href: '/shop', label: 'All Products' },
                { href: '/cart', label: 'My Cart' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Account</h3>
            <ul className="mt-4 space-y-2">
              {[
                { href: '/auth/login', label: 'Login' },
                { href: '/auth/register', label: 'Register' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} CMP.SHP. All rights reserved.
          </p>
          <p className="text-sm text-slate-500">
            Built with{' '}
            <span className="text-blue-500">Next.js</span> &{' '}
            <span className="text-blue-500">Supabase</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
