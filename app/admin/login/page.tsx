import { redirect } from "next/navigation"
import { getAdminSession } from "@/lib/auth"
import AdminLoginForm from "@/components/admin/AdminLoginForm"
import { Leaf } from "lucide-react"

export default async function AdminLoginPage() {
  const session = await getAdminSession()
  if (session) redirect("/admin")

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-gold rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Leaf className="w-8 h-8 text-brand-dark" />
          </div>
          <h1 className="text-2xl font-black text-white">管理画面</h1>
          <p className="text-white/60 text-sm mt-1">管理画面</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-bold text-foreground mb-6">ログイン</h2>
          <AdminLoginForm />
        </div>

        <p className="text-center text-white/40 text-xs mt-6">
          クラウドファンディング &copy; Admin System
        </p>
      </div>
    </div>
  )
}
