import sql from "@/lib/db"
import { getAdminSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import AdminUserManagement from "@/components/admin/AdminUserManagement"

export default async function UsersPage() {
  const session = await getAdminSession()
  if (!session) redirect("/admin/login")

  const users = await sql`
    SELECT id, email, name, role, created_at
    FROM admins
    ORDER BY created_at DESC
  `

  return (
    <AdminUserManagement
      users={users as any[]}
      currentUserId={session.id}
      isSuperAdmin={session.role === "super_admin"}
    />
  )
}
