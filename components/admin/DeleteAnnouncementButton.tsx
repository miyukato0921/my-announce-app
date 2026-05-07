"use client"

interface Props {
  action: () => Promise<void>
}

export default function DeleteAnnouncementButton({ action }: Props) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("このお知らせを削除しますか？")) e.preventDefault()
      }}
      className="mt-6"
    >
      <button
        type="submit"
        className="w-full py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
      >
        このお知らせを削除する
      </button>
    </form>
  )
}
