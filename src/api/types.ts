/**
 * Response models of the Shashtna backend (/api/mobile/*). They mirror the
 * server's shapes in src/server/mobile.ts of the website repository.
 */

export type Destination =
  | { kind: 'HOME' }
  | { kind: 'PLANS' }
  | { kind: 'PLAN'; slug: string }
  | { kind: 'ANNOUNCEMENT'; id: number }
  | { kind: 'ORDERS' }
  | { kind: 'ORDER'; id: number }
  | { kind: 'SUBSCRIPTIONS' }
  | { kind: 'SUBSCRIPTION'; id: number }
  | { kind: 'SUPPORT' }
  | { kind: 'TICKET'; id: string }
  | { kind: 'STATUS' }
  | { kind: 'NOTIFICATIONS' };

export type User = {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  role: string;
  isStaff: boolean;
  preferredContact: string | null;
  renewalReminders: boolean;
  marketingOptIn: boolean;
  createdAt: string;
};

export type Session = { token: string; expiresAt: number; user: User };

export type ServiceType = 'IPTV' | 'VIP' | 'DIGITAL';

export type CatalogDiscount = {
  id: number;
  kind: 'PERCENT' | 'AMOUNT';
  value: number;
  appliesToRenewals: boolean;
  endsAt: string | null;
  endsInDays: number | null;
  /** What a NEW order of this length costs after the discount (package part). */
  price: number;
  /** Renewal price after the discount, or null when renewals keep their price. */
  renewalPrice: number | null;
};

/** One length a package is sold in, with its own price (computed on the server). */
export type PackageOption = {
  id: number;
  durationMonths: number;
  durationLabel: string;
  price: number;
  renewalPrice: number;
  pointsEarned: number | null;
  discount: CatalogDiscount | null;
};

/** A section of the plans page: IPTV, VIP or a digital platform. */
export type PlanGroup = {
  id: number;
  slug: string;
  name: string;
  nameEn: string | null;
  description: string | null;
  descriptionEn: string | null;
  logoUrl: string | null;
  serviceType: ServiceType;
  delivery: 'SUBSCRIPTION' | 'CODE' | 'ACCOUNT' | 'CUSTOMER_EMAIL' | string;
  accent: string | null;
  surface: string | null;
  accentText: string | null;
  builtIn: boolean;
};

export type Package = {
  id: number;
  name: string;
  slug: string;
  serviceType: ServiceType;
  price: number;
  /** Older servers may not send these (additive fields). */
  renewalPrice?: number;
  options?: PackageOption[];
  groupId?: number | null;
  durationMonths: number;
  durationLabel: string;
  description: string;
  features: string[];
  notes: string | null;
  imageUrl: string | null;
  isPopular: boolean;
  requiresDevice: boolean;
};

export type VipDevice = {
  id: number;
  name: string;
  slug: string;
  price: number;
  description: string;
  features: string[];
  notes: string | null;
  imageUrl: string | null;
  packageIds: number[];
};

export type Catalog = { packages: Package[]; devices: VipDevice[]; currency: string; groups?: PlanGroup[] };

export type OrderStatus = 'SUBMITTED' | 'AWAITING_PAYMENT' | 'PAID' | 'FULFILLING' | 'COMPLETED' | 'CANCELLED' | 'REJECTED';

export type OrderStage = 'PACKAGE_SELECTED' | 'PAYMENT_PENDING' | 'UNDER_REVIEW' | 'PAID' | 'ACTIVATED' | 'CANCELLED' | 'REJECTED';

export type RequestType = 'NEW' | 'RENEW' | 'UPGRADE' | 'DEVICE_PURCHASE';

export type Order = {
  id: number;
  number: string;
  requestType: RequestType;
  requestTypeLabel: string;
  serviceType: string;
  serviceName: string;
  planSlug: string;
  price: number;
  durationMonths: number;
  durationLabel: string;
  deviceName: string | null;
  devicePrice: number | null;
  paymentMethod: string | null;
  paymentReference: string | null;
  customerNote: string | null;
  status: OrderStatus;
  statusLabel: string;
  statusHint: string;
  stage: OrderStage;
  needsPayment: boolean;
  isOpen: boolean;
  canCancel: boolean;
  proofUploadedAt: string | null;
  subscriptionId: number | null;
  createdAt: string;
  updatedAt: string;
};

export type JourneyStep = { key: 'SELECT' | 'PAY' | 'PROOF' | 'REVIEW'; label: string; state: 'done' | 'current' | 'upcoming' };

export type PaymentDetails = {
  transfer: { transferNumber: string; recipientName: string } | null;
  instructions: string | null;
};

export type OrderDetail = Order & {
  journey: JourneyStep[];
  payment: PaymentDetails;
  events: { id: number; action: string; summary: string; createdAt: string }[];
};

export type SubscriptionState = 'ACTIVE' | 'EXPIRING' | 'EXPIRED' | 'SUSPENDED';

export type Subscription = {
  id: number;
  serviceType: string;
  packageName: string;
  packageId: number | null;
  packageSlug: string | null;
  status: string;
  state: SubscriptionState;
  stateLabel: string;
  daysRemaining: number;
  remainingFraction: number;
  startDate: string;
  expiryDate: string;
  maxConnections: number;
  createdAt: string;
  canRenew: boolean;
  credentials: { username: string | null; password: string | null; macAddress: string | null; deviceId: string | null } | null;
};

export type Receipt = {
  id: number;
  receiptNumber: string;
  serviceName: string;
  price: number;
  durationLabel: string;
  status: string;
  createdAt: string;
};

export type SubscriptionDetail = {
  subscription: Subscription;
  orders: Order[];
  receipts: Receipt[];
  events: { id: number; summary: string; createdAt: string }[];
};

export type ContentItem = {
  id: number;
  kind: 'OFFER' | 'ANNOUNCEMENT';
  title: string;
  description: string | null;
  imageUrl: string | null;
  style: string;
  placement: string;
  priority: number;
  startsAt: string | null;
  endsAt: string | null;
  updatedAt: string;
  cta: { label: string; destination: Destination | null; externalUrl: string | null } | null;
};

export type Content = { offers: ContentItem[]; announcements: ContentItem[] };

export type Incident = {
  id: number;
  title: string;
  message: string;
  status: 'DEGRADED' | 'OUTAGE' | 'MAINTENANCE' | 'RESOLVED';
  component: string;
  startsAt: string;
  resolvedAt: string | null;
  updatedAt: string;
  upcoming: boolean;
};

export type ServiceStatus = { overall: 'OPERATIONAL' | 'DEGRADED' | 'OUTAGE'; active: Incident[]; resolved: Incident[] };

export type AccountState = 'ACTIVE' | 'EXPIRING' | 'EXPIRED' | 'PENDING' | 'NONE';

export type NextAction = {
  kind: 'PAY_ORDER' | 'WAIT_REVIEW' | 'WAIT_ACTIVATION' | 'RENEW' | 'CHOOSE_PLAN';
  title: string;
  body: string;
  orderId?: number;
  subscriptionId?: number;
};

export type Dashboard = {
  user: User;
  accountState: AccountState;
  primarySubscription: Subscription | null;
  subscriptionsCount: number;
  /** The order to follow: just created, else newest open — with payment details. */
  currentOrder: OrderDetail | null;
  openOrdersCount: number;
  nextAction: NextAction | null;
  unreadNotifications: number;
  offers: ContentItem[];
  announcements: ContentItem[];
  incidents: Incident[];
  hasPackages: boolean;
  recentActivity: { id: number; summary: string; entityType: string; entityId: string | null; createdAt: string }[];
  generatedAt: string;
};

export type AppNotification = {
  id: number;
  type: string;
  title: string;
  body: string;
  imageUrl: string | null;
  destination: Destination | null;
  readAt: string | null;
  createdAt: string;
};

export type NotificationPage = { notifications: AppNotification[]; unread: number; nextCursor: number | null };

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'CLOSED';

export type TicketSummary = {
  id: string;
  subject: string;
  category: string;
  status: TicketStatus;
  statusLabel: string;
  lastSender: 'CUSTOMER' | 'ADMIN';
  lastMessage: string | null;
  createdAt: string;
  updatedAt: string;
  context: { orderId?: number; subscriptionId?: number; app?: string; device?: string; topic?: string } | null;
};

export type Ticket = TicketSummary & {
  messages: { id: string; sender: 'CUSTOMER' | 'ADMIN'; senderName: string | null; message: string; createdAt: string }[];
};

export type Help = {
  faq: { id: string; topic: string; question: string; answer: string }[];
  troubleshooting: { id: string; category: string; title: string; symptoms: string; steps: string[] }[];
  categories: { value: string; label: string }[];
  support: { hours: string | null; telegram: string | null; whatsapp: string | null; facebook: string | null; phone: string | null };
};

export type ContactOption = 'TELEGRAM' | 'WHATSAPP' | 'FACEBOOK' | 'PHONE';

export type CheckoutDevice = { id: number; name: string; price: number; description: string; imageUrl: string | null };

/** The order confirmation, resolved by the same service as the website checkout. */
export type Checkout = {
  mode: RequestType;
  customer: { name: string; phone: string };
  plan: {
    slug: string;
    /** The length being ordered (null = the default one). */
    optionId?: number | null;
    name: string;
    serviceType: ServiceType;
    price: number;
    durationLabel: string;
    description: string;
    features: string[];
    imageUrl: string | null;
  } | null;
  device: CheckoutDevice | null;
  devices: CheckoutDevice[];
  initialDeviceId: number | null;
  subscription: { id: number; packageName: string } | null;
  contactOptions: ContactOption[];
  initialContact: ContactOption;
};

export type LoyaltyReward = {
  key: string;
  months: number;
  cost: number;
  worth: number;
  redeemable: boolean;
  problem: { code: string; messageAr: string; messageEn: string; until: string | null } | null;
};

/** «نقاط شاشتنا». While the program is off the server sends only `enabled: false`. */
export type Loyalty =
  | { enabled: false }
  | {
      enabled: true;
      status: string;
      balance: number;
      available: number;
      pending: number;
      nextUnlockAt: string | null;
      expiresOn: string | null;
      progress: { target: number; current: number; messageAr: string; messageEn: string };
      openRewardOrderId: number | null;
      rewards: LoyaltyReward[];
    };
