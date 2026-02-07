import { OrderDetailContent } from "@/components/order-detail-content"

export default async function OrderDetailPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params

  return <OrderDetailContent orderNumber={orderNumber} />
}
