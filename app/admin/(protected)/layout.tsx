import { redirect } from "next/navigation"
import { getAdminSession } from "@/lib/auth"
import AdminSidebar from "@/components/admin/AdminSidebar"

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession()
  if (!session) redirect("/admin/login")

  return (
    <div className="min-h-screen flex bg-muted">
      <AdminSidebar admin={session} />
      <main className="flex-1 min-w-0 overflow-auto">
        {children}
      </main>
    </div>
  )
}
