"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Shield, UserPlus, Pencil, Trash2, Eye, EyeOff, Loader2 } from "lucide-react"

type AdminUser = {
  id: number
  email: string
  name: string
  role: string
  created_at: string
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`
}

// ユーザー追加・編集フォーム
function UserFormDialog({
  mode,
  user,
  currentUserId,
  trigger,
}: {
  mode: "add" | "edit"
  user?: AdminUser
  currentUserId: number
  trigger: React.ReactNode
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [role, setRole] = useState(user?.role ?? "admin")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const form = e.currentTarget
    const data = new FormData(form)
    const body: Record<string, string> = {
      name: data.get("name") as string,
      role,
    }
    if (mode === "add") {
      body.email = data.get("email") as string
      body.password = data.get("password") as string
    } else {
      const pw = data.get("password") as string
      if (pw) body.password = pw
    }

    const url = mode === "add" ? "/api/admin/users" : `/api/admin/users/${user!.id}`
    const method = mode === "add" ? "POST" : "PATCH"

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const json = await res.json()
      setError(json.error ?? "エラーが発生しました")
      setLoading(false)
      return
    }

    setOpen(false)
    router.refresh()
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-foreground">
            {mode === "add" ? "管理者ユーザーを追加" : "ユーザー情報を編集"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">名前</Label>
            <Input
              id="name"
              name="name"
              defaultValue={user?.name ?? ""}
              placeholder="山田 太郎"
              required
              className="rounded-xl"
            />
          </div>

          {mode === "add" && (
            <div className="space-y-1.5">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="admin@example.com"
                required
                className="rounded-xl"
              />
            </div>
          )}

          {mode === "edit" && (
            <div className="space-y-1.5">
              <Label>メールアドレス</Label>
              <Input value={user?.email} disabled className="rounded-xl bg-muted text-muted-foreground" />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="password">
              {mode === "add" ? "パスワード" : "新しいパスワード（変更する場合のみ）"}
            </Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder={mode === "add" ? "8文字以上" : "変更しない場合は空欄"}
                required={mode === "add"}
                minLength={mode === "add" ? 8 : undefined}
                className="rounded-xl pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>権限</Label>
            <Select value={role} onValueChange={setRole}
              disabled={mode === "edit" && user?.id === currentUserId}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">管理者</SelectItem>
                <SelectItem value="super_admin">スーパー管理者</SelectItem>
              </SelectContent>
            </Select>
            {mode === "edit" && user?.id === currentUserId && (
              <p className="text-xs text-muted-foreground">自分自身の権限は変更できません</p>
            )}
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-2">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => setOpen(false)}
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-brand-green hover:bg-brand-green/90 text-white rounded-xl"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : mode === "add" ? "追加する" : "保存する"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// 削除確認ダイアログ
function DeleteUserDialog({ user, currentUserId }: { user: AdminUser; currentUserId: number }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" })
    router.refresh()
    setLoading(false)
  }

  if (user.id === currentUserId) return null

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:bg-destructive/10 rounded-xl"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>ユーザーを削除しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            <strong>{user.name}</strong>（{user.email}）を削除します。この操作は取り消せません。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-xl">キャンセル</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-destructive hover:bg-destructive/90 rounded-xl"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "削除する"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// メインコンポーネント
export default function AdminUserManagement({
  users,
  currentUserId,
  isSuperAdmin,
}: {
  users: AdminUser[]
  currentUserId: number
  isSuperAdmin: boolean
}) {
  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-foreground">管理者ユーザー</h1>
          <p className="text-muted-foreground mt-1">管理画面へのアクセス権を持つユーザー一覧</p>
        </div>
        {isSuperAdmin && (
          <UserFormDialog
            mode="add"
            currentUserId={currentUserId}
            trigger={
              <Button className="bg-brand-green hover:bg-brand-green/90 text-white rounded-xl gap-2">
                <UserPlus className="w-4 h-4" />
                ユーザー追加
              </Button>
            }
          />
        )}
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="p-5 border-b border-border flex items-center gap-2">
          <Shield className="w-5 h-5 text-brand-green" />
          <h2 className="font-bold text-foreground">管理者一覧</h2>
          <span className="text-sm text-muted-foreground ml-auto">{users.length}人</span>
        </div>

        <div className="divide-y divide-border">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-5 hover:bg-muted/20 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-brand-green/20 flex items-center justify-center font-black text-brand-green text-lg">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-foreground">{user.name}</p>
                    {user.id === currentUserId && (
                      <Badge variant="outline" className="text-xs px-2 py-0">
                        あなた
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  className={
                    user.role === "super_admin"
                      ? "bg-brand-gold/20 text-brand-dark border-brand-gold/30"
                      : "bg-blue-100 text-blue-800 border-blue-200"
                  }
                >
                  <Shield className="w-3 h-3 mr-1" />
                  {user.role === "super_admin" ? "スーパー管理者" : "管理者"}
                </Badge>
                <span className="text-xs text-muted-foreground hidden sm:block">
                  {formatDate(user.created_at)}
                </span>
                {isSuperAdmin && (
                  <>
                    <UserFormDialog
                      mode="edit"
                      user={user}
                      currentUserId={currentUserId}
                      trigger={
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      }
                    />
                    <DeleteUserDialog user={user} currentUserId={currentUserId} />
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 p-5 bg-muted/50 rounded-2xl border border-border">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-brand-green mt-0.5 shrink-0" />
          <div>
            <p className="font-bold text-foreground text-sm mb-1">セキュリティについて</p>
            <p className="text-sm text-muted-foreground">
              スーパー管理者のみ、ユーザーの追加・編集・削除が可能です。パスワードはbcryptで安全にハッシュ化されて保存されます。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
