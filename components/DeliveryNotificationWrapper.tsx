import { useGlobalDeliveryNotifications } from '../hooks/useGlobalDeliveryNotifications';

export function DeliveryNotificationWrapper() {
  useGlobalDeliveryNotifications();
  return null;
}

