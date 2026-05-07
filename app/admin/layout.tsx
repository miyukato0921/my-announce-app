export const metadata = {
  title: "管理画面",
}

// This layout is a passthrough.
// Authentication is handled by app/admin/(protected)/layout.tsx for protected pages.
// The login page at /admin/login has its own standalone layout.
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
