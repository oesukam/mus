export enum DeliveryStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  IN_TRANSIT = 'IN_TRANSIT',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  FAILED_DELIVERY = 'FAILED_DELIVERY',
  RETURNED = 'RETURNED',
  CANCELLED = 'CANCELLED',
}

// Helper to get user-friendly status labels
export const DELIVERY_STATUS_LABELS: Record<DeliveryStatus, string> = {
  [DeliveryStatus.PENDING]: 'Pending',
  [DeliveryStatus.PROCESSING]: 'Processing',
  [DeliveryStatus.SHIPPED]: 'Shipped',
  [DeliveryStatus.IN_TRANSIT]: 'In Transit',
  [DeliveryStatus.OUT_FOR_DELIVERY]: 'Out for Delivery',
  [DeliveryStatus.DELIVERED]: 'Delivered',
  [DeliveryStatus.FAILED_DELIVERY]: 'Failed Delivery',
  [DeliveryStatus.RETURNED]: 'Returned',
  [DeliveryStatus.CANCELLED]: 'Cancelled',
};

// Status flow validation
export const VALID_STATUS_TRANSITIONS: Record<DeliveryStatus, DeliveryStatus[]> = {
  [DeliveryStatus.PENDING]: [
    DeliveryStatus.PROCESSING,
    DeliveryStatus.CANCELLED,
  ],
  [DeliveryStatus.PROCESSING]: [
    DeliveryStatus.SHIPPED,
    DeliveryStatus.CANCELLED,
  ],
  [DeliveryStatus.SHIPPED]: [
    DeliveryStatus.IN_TRANSIT,
    DeliveryStatus.FAILED_DELIVERY,
    DeliveryStatus.CANCELLED,
  ],
  [DeliveryStatus.IN_TRANSIT]: [
    DeliveryStatus.OUT_FOR_DELIVERY,
    DeliveryStatus.FAILED_DELIVERY,
  ],
  [DeliveryStatus.OUT_FOR_DELIVERY]: [
    DeliveryStatus.DELIVERED,
    DeliveryStatus.FAILED_DELIVERY,
  ],
  [DeliveryStatus.DELIVERED]: [],
  [DeliveryStatus.FAILED_DELIVERY]: [
    DeliveryStatus.OUT_FOR_DELIVERY,
    DeliveryStatus.RETURNED,
  ],
  [DeliveryStatus.RETURNED]: [],
  [DeliveryStatus.CANCELLED]: [],
};

export function isValidStatusTransition(
  currentStatus: DeliveryStatus,
  newStatus: DeliveryStatus,
): boolean {
  return VALID_STATUS_TRANSITIONS[currentStatus]?.includes(newStatus) ?? false;
}

export function getStatusLabel(status: DeliveryStatus): string {
  return DELIVERY_STATUS_LABELS[status] || status;
}
