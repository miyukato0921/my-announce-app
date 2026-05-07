"use client"

import ShopSuccessShippingForm from "./ShopSuccessShippingForm"

interface Props {
  orderId: number
}

export default function ShopSuccessShippingFormWithNotify({ orderId }: Props) {
  const handleComplete = () => {
    // カスタムイベントで親に通知
    window.dispatchEvent(new CustomEvent("shop-shipping-complete"))
  }

  return <ShopSuccessShippingForm orderId={orderId} onComplete={handleComplete} />
}
