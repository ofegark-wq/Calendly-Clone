'use client'

import { useState } from 'react'
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
  const [open, setOpen] = useState(false)

  function isActive(item: (typeof NAV_ITEMS)[number]) {
    return item.exact ? pathname === item.href : pathname.startsWith(item.href)
  }

  return (
    <nav className="sticky top-0 z-10 border-b border-zinc-200 bg-zinc-50/95 backdrop-blur dark:border-zinc-800 dark:bg-black/95">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4">
        {/* Desktop/tablet: horizontal links, underline on the active page */}
        <ul className="hidden gap-6 md:flex">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`inline-block border-b-2 py-4 text-sm font-medium ${
                  isActive(item)
                    ? 'border-black text-black dark:border-white dark:text-white'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <form action={signOutAction} className="hidden md:block">
          <button
            type="submit"
            className="text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            Log out
          </button>
        </form>

        {/* Mobile: hamburger button that opens a vertical menu */}
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          className="py-4 text-zinc-600 md:hidden dark:text-zinc-300"
        >
          {open ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>

      {open && (
        <div className="border-t border-zinc-200 md:hidden dark:border-zinc-800">
          <ul className="flex flex-col">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`block border-l-4 px-4 py-3 text-sm font-medium ${
                    isActive(item)
                      ? 'border-black bg-zinc-100 text-black dark:border-white dark:bg-zinc-900 dark:text-white'
                      : 'border-transparent text-zinc-500 dark:text-zinc-400'
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <form action={signOutAction} className="border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="submit"
              onClick={() => setOpen(false)}
              className="block w-full border-l-4 border-transparent px-4 py-3 text-left text-sm font-medium text-zinc-500 dark:text-zinc-400"
            >
              Log out
            </button>
          </form>
        </div>
      )}
    </nav>
  )
}
