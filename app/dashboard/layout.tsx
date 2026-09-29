import type { ReactNode } from 'react'
import { DashboardNav } from './nav'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <DashboardNav />
      {children}
    </>
  )
}
