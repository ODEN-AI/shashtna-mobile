import type { AccountState, Incident, OrderStage, SubscriptionState, TicketStatus } from '@/src/api/types';
import type { Tone } from '@/src/ui/theme';

/** Customer-facing labels and colours for the backend's state machines. */

export const ORDER_STAGE: Record<OrderStage, { label: string; tone: Tone; icon: string }> = {
  PACKAGE_SELECTED: { label: 'تم اختيار الباقة', tone: 'neutral', icon: 'cart-outline' },
  PAYMENT_PENDING: { label: 'بانتظار الدفع', tone: 'warning', icon: 'wallet-outline' },
  UNDER_REVIEW: { label: 'قيد مراجعة الدفع', tone: 'info', icon: 'hourglass-outline' },
  PAID: { label: 'تم الدفع — قيد التفعيل', tone: 'brand', icon: 'flash-outline' },
  ACTIVATED: { label: 'تم التفعيل', tone: 'success', icon: 'checkmark-circle-outline' },
  CANCELLED: { label: 'ملغي', tone: 'neutral', icon: 'close-circle-outline' },
  REJECTED: { label: 'مرفوض', tone: 'danger', icon: 'alert-circle-outline' },
};

export const SUBSCRIPTION_STATE: Record<SubscriptionState, { label: string; tone: Tone }> = {
  ACTIVE: { label: 'نشط', tone: 'success' },
  EXPIRING: { label: 'ينتهي قريبًا', tone: 'warning' },
  EXPIRED: { label: 'منتهي', tone: 'danger' },
  SUSPENDED: { label: 'موقوف', tone: 'neutral' },
};

export const ACCOUNT_STATE: Record<AccountState, { title: string; tone: Tone }> = {
  ACTIVE: { title: 'اشتراكك شغّال', tone: 'success' },
  EXPIRING: { title: 'اشتراكك ينتهي قريبًا', tone: 'warning' },
  EXPIRED: { title: 'اشتراكك منتهي', tone: 'danger' },
  PENDING: { title: 'طلبك قيد التنفيذ', tone: 'brand' },
  NONE: { title: 'ما عندك اشتراك بعد', tone: 'neutral' },
};

export const TICKET_STATUS: Record<TicketStatus, { label: string; tone: Tone }> = {
  OPEN: { label: 'مفتوحة', tone: 'warning' },
  IN_PROGRESS: { label: 'قيد المعالجة', tone: 'info' },
  CLOSED: { label: 'مغلقة', tone: 'neutral' },
};

export const INCIDENT_STATUS: Record<Incident['status'], { label: string; tone: Tone; icon: string }> = {
  OUTAGE: { label: 'عطل', tone: 'danger', icon: 'close-circle' },
  DEGRADED: { label: 'أداء متأثر', tone: 'warning', icon: 'warning' },
  MAINTENANCE: { label: 'صيانة', tone: 'info', icon: 'construct' },
  RESOLVED: { label: 'تم الحل', tone: 'success', icon: 'checkmark-circle' },
};

export const COMPONENT_LABEL: Record<string, string> = {
  ALL: 'كل الخدمات',
  IPTV: 'IPTV',
  VIP: 'VIP',
  PLAYER: 'Shashtna Player',
  WEBSITE: 'الموقع',
};

/** Notification categories (types written by the backend). */
export const NOTIFICATION_TYPE: Record<string, { label: string; icon: string; tone: Tone }> = {
  ORDER_STATUS: { label: 'تحديث الطلب', icon: 'receipt-outline', tone: 'brand' },
  PAYMENT_UPDATE: { label: 'تحديث الدفع', icon: 'wallet-outline', tone: 'info' },
  SUBSCRIPTION_ACTIVATED: { label: 'تفعيل الاشتراك', icon: 'checkmark-circle-outline', tone: 'success' },
  SUBSCRIPTION_RENEWED: { label: 'تجديد الاشتراك', icon: 'refresh-circle-outline', tone: 'success' },
  RENEWAL_REMINDER: { label: 'قرب انتهاء الاشتراك', icon: 'time-outline', tone: 'warning' },
  SUBSCRIPTION_EXPIRED: { label: 'انتهاء الاشتراك', icon: 'alert-circle-outline', tone: 'danger' },
  TICKET_REPLY: { label: 'الدعم الفني', icon: 'chatbubbles-outline', tone: 'info' },
  ANNOUNCEMENT: { label: 'إعلان', icon: 'megaphone-outline', tone: 'glow' },
  OFFER: { label: 'عرض', icon: 'pricetag-outline', tone: 'glow' },
  SERVICE_STATUS: { label: 'حالة الخدمة', icon: 'construct-outline', tone: 'warning' },
  MESSAGE: { label: 'رسالة', icon: 'mail-outline', tone: 'neutral' },
};

export function notificationType(type: string) {
  return NOTIFICATION_TYPE[type] ?? NOTIFICATION_TYPE.MESSAGE;
}
