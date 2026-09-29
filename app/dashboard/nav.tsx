'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOutAction } from '@/lib/actions/auth'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', exact: true },
  { href: '/dashboard/event-types', label: 'Event types' },
  { href: '/dashboard/availability', label: 'Availability' },
  { href: '/dashboard/bookings', label: 'Bookings' },
]

export function DashboardNav() {
  const pathname = usePathname()

  return (
    <nav className="sticky top-0 z-10 border-b border-zinc-200 bg-zinc-50/95 backdrop-blur dark:border-zinc-800 dark:bg-black/95">
      <div className="mx-auto flex max-w-2xl items-center gap-6 overflow-x-auto whitespace-nowrap px-4">
        <ul className="flex shrink-0 gap-6">
          {NAV_ITEMS.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href)
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`inline-block border-b-2 py-4 text-sm font-medium ${
                    isActive
                      ? 'border-black text-black dark:border-white dark:text-white'
                      : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
        <form action={signOutAction} className="ml-auto shrink-0">
          <button
            type="submit"
            className="text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            Log out
          </button>
        </form>
      </div>
    </nav>
  )
}
