import { OrderTrackingContent } from "@/components/order-tracking-content"

export default async function OrderTrackingPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>
}) {
  const { orderNumber } = await params

  return <OrderTrackingContent orderNumber={orderNumber} />
}
