"use client"

import ShippingForm from "./ShippingForm"

interface Props {
  pledgeId: number
  rewardTitle: string
}

export default function ShippingFormWithNotify({ pledgeId, rewardTitle }: Props) {
  const handleComplete = () => {
    // カスタムイベントで親（SuccessPageClient）に通知
    window.dispatchEvent(new CustomEvent("shipping-complete"))
  }

  return <ShippingForm pledgeId={pledgeId} rewardTitle={rewardTitle} onComplete={handleComplete} />
}
