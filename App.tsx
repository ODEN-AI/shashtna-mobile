// App.tsx
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import {
  ActivityIndicator,
  Alert,
  I18nManager,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

const API_BASE_URL = 'https://shashtna.netlify.app';
const STORAGE_AUTH_TOKEN_KEY = '@shashtna_auth_token_v1';

function resolveMediaUrl(
  value?: string | null,
) {
  const raw = String(value ?? '').trim();

  if (!raw) {
    return '';
  }

  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }

  return `${API_BASE_URL}${
    raw.startsWith('/') ? raw : `/${raw}`
  }`;
}
const STORAGE_READ_NOTIFICATIONS_KEY = '@shashtna_read_notifications';

async function getStoredAuthToken() {
  return SecureStore.getItemAsync(STORAGE_AUTH_TOKEN_KEY);
}

async function clearStoredAuthToken() {
  try {
    await SecureStore.deleteItemAsync(STORAGE_AUTH_TOKEN_KEY);
  } catch (error) {
    console.log('Auth token cleanup error:', error);
  }
}

async function authenticatedFetch(
  path: string,
  init: RequestInit = {},
) {
  const token = await getStoredAuthToken();

  if (!token) {
    throw new Error('AUTH_REQUIRED');
  }

  const headers = new Headers(init.headers ?? {});
  headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(
    `${API_BASE_URL}${path}`,
    {
      ...init,
      headers,
    },
  );

  if (response.status === 401) {
    await clearStoredAuthToken();
  }

  return response;
}

type Package = {
  id: number;
  name: string;
  slug: string;
  serviceType: string;
  price: number;
  durationMonths: number;
  durationLabel: string;
  description: string;
  specifications: string;
  notes?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
};

type Device = {
  id: number;
  name: string;
  slug: string;
  serviceType: string;
  price: number;
  description: string;
  specifications: string;
  notes?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
};

type AppItem = {
  id: number;
  name: string;
  slug: string;
  description: string;
  platform: string;
  version?: string | null;
  downloadUrl: string;
  imageUrl?: string | null;
  instructions?: string | null;
  notes?: string | null;
  isActive: boolean;
};

type Subscription = {
  id: number;
  serviceType?: string;
  username?: string | null;
  password?: string | null;
  macAddress?: string | null;
  deviceId?: string | null;
  status?: string;
  packageName?: string | null;
  startDate?: string | null;
  expiryDate?: string | null;
  connections?: number;
  maxConnections?: number;
};

type OrderRequest = {
  id: number;
  planSlug?: string | null;
  serviceType?: string | null;
  serviceName?: string | null;
  requestType?: string | null;
  price?: number | null;
  durationMonths?: number | null;
  durationLabel?: string | null;
  bonusYears?: number | null;
  deviceId?: string | null;
  deviceName?: string | null;
  devicePrice?: number | null;
  contactMethod?: string | null;
  status?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type Receipt = {
  id: number;
  receiptNumber?: string | null;
  serviceName?: string | null;
  price?: number | null;
  durationMonths?: number | null;
  durationLabel?: string | null;
  status?: string | null;
  createdAt?: string | null;
  subscriptionId?: number | null;
};

type User = {
  id: number;
  name: string;
  phone: string;
  role?: string;
};

type AppNotification = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  date?: string | null;
  action?: 'ACCOUNT' | 'ORDERS' | 'SUPPORT' | 'RECEIPTS';
  actionId?: string;
};



type SupportMessage = {
  id: string;
  sender: 'CUSTOMER' | 'ADMIN';
  senderName: string;
  message: string;
  createdAt: string;
};

type SupportTicket = {
  id: string;
  userId: number;
  subject: string;
  category: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
  messages: SupportMessage[];
};

type ServiceFilter =
  | 'ALL'
  | 'IPTV'
  | 'VIP'
  | 'DEVICES'
  | 'APPS';

type Tab =
  | 'home'
  | 'services'
  | 'orders'
  | 'support'
  | 'account';

export default function App() {
  const [activeTab, setActiveTab] =
    useState<Tab>('home');

  const [packages, setPackages] = useState<Package[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [apps, setApps] = useState<AppItem[]>([]);
  const [subscriptions, setSubscriptions] =
    useState<Subscription[]>([]);

  const [selectedSubscription, setSelectedSubscription] =
    useState<Subscription | null>(null);

  const [selectedDevice, setSelectedDevice] =
    useState<Device | null>(null);

  const [selectedApp, setSelectedApp] =
    useState<AppItem | null>(null);

  const [orders, setOrders] =
    useState<OrderRequest[]>([]);

  const [receipts, setReceipts] =
    useState<Receipt[]>([]);

  const [loadingReceipts, setLoadingReceipts] =
    useState(false);

  const [loadingOrders, setLoadingOrders] =
    useState(false);

  const [serviceFilter, setServiceFilter] =
    useState<ServiceFilter>('ALL');

  const [user, setUser] = useState<User | null>(null);
  const [restoringUser, setRestoringUser] = useState(true);

  const [showAccountSettings, setShowAccountSettings] =
    useState(false);

  const [editName, setEditName] = useState('');
  const [currentPassword, setCurrentPassword] =
    useState('');
  const [newPassword, setNewPassword] =
    useState('');
  const [confirmNewPassword, setConfirmNewPassword] =
    useState('');

  const [settingsLoading, setSettingsLoading] =
    useState(false);

  const [settingsError, setSettingsError] =
    useState('');

  const [settingsSuccess, setSettingsSuccess] =
    useState('');

  const [loadingServices, setLoadingServices] =
    useState(false);

  const [loadingSubscriptions, setLoadingSubscriptions] =
    useState(false);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] = useState('');

  const [expandedFaq, setExpandedFaq] =
    useState<number | null>(null);

  const [supportCategory, setSupportCategory] =
    useState('general');

  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [loadingSupportTickets, setLoadingSupportTickets] = useState(false);
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [selectedSupportTicket, setSelectedSupportTicket] = useState<SupportTicket | null>(null);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketReply, setTicketReply] = useState('');
  const [ticketLoading, setTicketLoading] = useState(false);
  const [ticketError, setTicketError] = useState('');
  const [ticketSuccess, setTicketSuccess] = useState('');

  const [showLogin, setShowLogin] =
    useState(false);

  const [phone, setPhone] = useState('');
  const [password, setPassword] =
    useState('');

  const [loginLoading, setLoginLoading] =
    useState(false);

  const [loginError, setLoginError] =
    useState('');

  const [showNotifications, setShowNotifications] =
    useState(false);

  const [readNotificationIds, setReadNotificationIds] =
    useState<string[]>([]);

  const loadServices = useCallback(async () => {
    try {
      setError('');
      setLoadingServices(true);

      const controller = new AbortController();

      const timeout = setTimeout(
        () => controller.abort(),
        10000,
      );

      const [packagesResponse, devicesResponse, appsResponse] =
        await Promise.all([
          fetch(`${API_BASE_URL}/api/packages`, {
            headers: {
              Accept: 'application/json',
            },
            signal: controller.signal,
          }),

          fetch(`${API_BASE_URL}/api/devices`, {
            headers: {
              Accept: 'application/json',
            },
            signal: controller.signal,
          }),

          fetch(`${API_BASE_URL}/api/apps`, {
            headers: {
              Accept: 'application/json',
            },
            signal: controller.signal,
          }),
        ]);

      clearTimeout(timeout);

      if (!packagesResponse.ok) {
        throw new Error(
          `Packages HTTP ${packagesResponse.status}`,
        );
      }

      if (!devicesResponse.ok) {
        throw new Error(
          `Devices HTTP ${devicesResponse.status}`,
        );
      }

      const packagesData =
        await packagesResponse.json();

      const devicesData =
        await devicesResponse.json();

      let appsData: AppItem[] = [];

      if (appsResponse.ok) {
        try {
          const parsedApps = await appsResponse.json();
          appsData = Array.isArray(parsedApps) ? (parsedApps as AppItem[]) : [];
        } catch {
          appsData = [];
        }
      } else {
        console.log(
          `Apps endpoint unavailable: HTTP ${appsResponse.status}`,
        );
      }

      setPackages(
        Array.isArray(packagesData)
          ? packagesData
          : [],
      );

      setDevices(
        Array.isArray(devicesData)
          ? devicesData
          : [],
      );

      setApps(
        Array.isArray(appsData)
          ? appsData
          : [],
      );
    } catch (err) {
      console.log('Services error:', err);
      setError(
        'تعذر تحميل الخدمات حاليًا',
      );
    } finally {
      setLoadingServices(false);
      setRefreshing(false);
    }
  }, []);

  const loadSubscriptions = useCallback(
    async (userId: number) => {
      try {
        setLoadingSubscriptions(true);

        const response = await authenticatedFetch(
          '/api/mobile/subscriptions',
          {
            headers: {
              Accept: 'application/json',
            },
          },
        );

        if (!response.ok) {
          throw new Error(
            `Subscriptions HTTP ${response.status}`,
          );
        }

        const data =
          await response.json();

        setSubscriptions(
          Array.isArray(data) ? data : [],
        );
      } catch (err) {
        console.log(
          'Subscriptions error:',
          err,
        );

        setSubscriptions([]);
      } finally {
        setLoadingSubscriptions(false);
      }
    },
    [],
  );

  const loadOrders = useCallback(
    async (userId: number) => {
      try {
        setLoadingOrders(true);

        const response = await authenticatedFetch(
          '/api/mobile/subscription-requests',
          {
            headers: {
              Accept: 'application/json',
            },
          },
        );

        if (!response.ok) {
          throw new Error(
            `Orders HTTP ${response.status}`,
          );
        }

        const data = await response.json();

        setOrders(
          Array.isArray(data)
            ? data
            : Array.isArray(data?.requests)
              ? data.requests
              : [],
        );
      } catch (err) {
        console.log('Orders error:', err);
        setOrders([]);
      } finally {
        setLoadingOrders(false);
      }
    },
    [],
  );

  const loadReceipts = useCallback(
    async (userId: number) => {
      try {
        setLoadingReceipts(true);

        const response = await authenticatedFetch(
          '/api/mobile/receipts',
          { headers: { Accept: 'application/json' } },
        );

        if (!response.ok) {
          throw new Error(`Receipts HTTP ${response.status}`);
        }

        const data = await response.json();
        setReceipts(
          Array.isArray(data)
            ? data
            : Array.isArray(data?.receipts)
              ? data.receipts
              : [],
        );
      } catch (err) {
        console.log('Receipts error:', err);
        setReceipts([]);
      } finally {
        setLoadingReceipts(false);
      }
    },
    [],
  );



  const loadSupportTickets = useCallback(
    async (userId: number) => {
      try {
        setLoadingSupportTickets(true);

        const response = await authenticatedFetch(
          '/api/mobile/support/tickets',
          {
            headers: { Accept: 'application/json' },
          },
        );

        if (!response.ok) {
          throw new Error('Support tickets HTTP ' + response.status);
        }

        const data = await response.json();
        setSupportTickets(
          Array.isArray(data?.tickets) ? data.tickets : [],
        );
      } catch (err) {
        console.log('Support tickets error:', err);
        setSupportTickets([]);
      } finally {
        setLoadingSupportTickets(false);
      }
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;

    const restoreReadNotifications = async () => {
      try {
        const saved = await AsyncStorage.getItem(
          STORAGE_READ_NOTIFICATIONS_KEY,
        );

        if (!saved) {
          return;
        }

        const parsed = JSON.parse(saved);

        if (
          !cancelled &&
          Array.isArray(parsed) &&
          parsed.every((item) => typeof item === 'string')
        ) {
          setReadNotificationIds(parsed);
        }
      } catch (err) {
        console.log('Read notifications restore error:', err);
      }
    };

    restoreReadNotifications();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const restoreUser = async () => {
      try {
        const token = await getStoredAuthToken();

        if (!token) {
          return;
        }

        const response = await authenticatedFetch('/api/auth/me', {
          headers: {
            Accept: 'application/json',
          },
        });

        if (!response.ok) {
          await clearStoredAuthToken();
          return;
        }

        const data = await response.json();
        const account = data?.user;

        if (
          account &&
          Number.isFinite(Number(account.id)) &&
          typeof account.name === 'string' &&
          typeof account.phone === 'string'
        ) {
          const restoredUser: User = {
            id: Number(account.id),
            name: account.name,
            phone: account.phone,
            role: typeof account.role === 'string' ? account.role : undefined,
          };

          if (!cancelled) {
            setUser(restoredUser);
            setActiveTab('account');
            await Promise.all([
              loadSubscriptions(restoredUser.id),
              loadOrders(restoredUser.id),
              loadReceipts(restoredUser.id),
              loadSupportTickets(restoredUser.id),
            ]);
          }
        } else {
          await clearStoredAuthToken();
        }
      } catch (err) {
        console.log('Restore user error:', err);
        await clearStoredAuthToken();
      } finally {
        if (!cancelled) {
          setRestoringUser(false);
        }
      }
    };
    restoreUser();

    return () => {
      cancelled = true;
    };
  }, [loadOrders, loadReceipts, loadSubscriptions, loadSupportTickets]);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  useEffect(() => {
    if (activeTab === 'support' && user) {
      void loadSupportTickets(user.id);
    }
  }, [activeTab, user, loadSupportTickets]);

  useEffect(() => {
    if (!user) {
      return;
    }

    let cancelled = false;

    const syncAccountData = async () => {
      if (cancelled) {
        return;
      }

      try {
        const sessionResponse = await authenticatedFetch(
          '/api/auth/me',
          {
            headers: {
              Accept: 'application/json',
            },
          },
        );

        if (!sessionResponse.ok) {
          await clearStoredAuthToken();

          if (!cancelled) {
            setUser(null);
            setSubscriptions([]);
            setOrders([]);
            setReceipts([]);
            setSupportTickets([]);
            setActiveTab('home');
          }

          return;
        }

        const data = await sessionResponse.json();
        const account = data?.user;

        if (
          !account ||
          Number(account.id) !== Number(user.id)
        ) {
          await clearStoredAuthToken();

          if (!cancelled) {
            setUser(null);
            setSubscriptions([]);
            setOrders([]);
            setReceipts([]);
            setSupportTickets([]);
            setActiveTab('home');
          }

          return;
        }

        await Promise.all([
          loadSubscriptions(user.id),
          loadOrders(user.id),
          loadReceipts(user.id),
          loadSupportTickets(user.id),
        ]);
      } catch (err) {
        console.log(
          'Background account refresh error:',
          err,
        );
      }
    };

    const interval = setInterval(
      syncAccountData,
      45_000,
    );

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [
    user,
    loadOrders,
    loadReceipts,
    loadSubscriptions,
    loadSupportTickets,
  ]);

  const refresh = () => {
    setRefreshing(true);

    loadServices();

    if (user) {
      loadSubscriptions(user.id);
      loadOrders(user.id);
      loadReceipts(user.id);
      loadSupportTickets(user.id);
    }
  };

  const handleLogin = async () => {
    setLoginError('');

    const cleanPhone = phone.trim();

    if (!cleanPhone) {
      setLoginError('اكتب رقم الهاتف.');
      return;
    }

    if (!password) {
      setLoginError('اكتب كلمة المرور.');
      return;
    }

    try {
      setLoginLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/api/auth/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            phone: cleanPhone,
            password,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            'رقم الهاتف أو كلمة المرور غير صحيحة.',
        );
      }

      const token = String(data?.token ?? '').trim();
      const account = data?.user ?? data;

      if (!token) {
        throw new Error(
          'تعذر إنشاء جلسة آمنة للحساب. حاول مرة أخرى.',
        );
      }

      const loggedUser: User = {
        id: Number(account.id),
        name: account.name,
        phone: account.phone,
        role: account.role,
      };

      if (!loggedUser.id || !loggedUser.name || !loggedUser.phone) {
        throw new Error('بيانات الحساب المستلمة غير صالحة.');
      }

      await SecureStore.setItemAsync(
        STORAGE_AUTH_TOKEN_KEY,
        token,
      );

      setUser(loggedUser);
      setPhone('');
      setPassword('');
      setLoginError('');
      setShowLogin(false);
      setActiveTab('account');

      await Promise.all([
        loadSubscriptions(loggedUser.id),
        loadOrders(loggedUser.id),
        loadReceipts(loggedUser.id),
        loadSupportTickets(loggedUser.id),
      ]);
    } catch (err) {
      console.log('Login error:', err);

      setLoginError(
        err instanceof Error
          ? err.message
          : 'حدث خطأ أثناء تسجيل الدخول.',
      );
    } finally {
      setLoginLoading(false);
    }
  };
  const handleLogout = () => {
    Alert.alert(
      'تسجيل الخروج',
      'هل تريد تسجيل الخروج من الحساب؟',
      [
        {
          text: 'إلغاء',
          style: 'cancel',
        },
        {
          text: 'تسجيل الخروج',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearStoredAuthToken();
              await AsyncStorage.removeItem('@shashtna_user');
            } catch (err) {
              console.log('Logout storage error:', err);
            }

            setUser(null);
            setSubscriptions([]);
            setOrders([]);
            setReceipts([]);
            setActiveTab('home');
          },
        },
      ],
    );
  };

  const openAccountSettings = () => {
    if (!user) return;

    setEditName(user.name);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setSettingsError('');
    setSettingsSuccess('');
    setShowAccountSettings(true);
  };

  const handleSaveAccountSettings = async () => {
    if (!user) return;

    setSettingsError('');
    setSettingsSuccess('');

    const cleanName = editName.trim();

    if (!cleanName) {
      setSettingsError('اكتب اسمك.');
      return;
    }

    const changingPassword =
      !!currentPassword ||
      !!newPassword ||
      !!confirmNewPassword;

    if (changingPassword && !currentPassword) {
      setSettingsError('اكتب كلمة المرور الحالية.');
      return;
    }

    if (changingPassword && !newPassword) {
      setSettingsError('اكتب كلمة المرور الجديدة.');
      return;
    }

    if (newPassword && newPassword.length < 6) {
      setSettingsError(
        'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل.',
      );
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setSettingsError('تأكيد كلمة المرور غير مطابق.');
      return;
    }

    try {
      setSettingsLoading(true);

      const response = await authenticatedFetch(
        '/api/mobile/account/profile',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            name: cleanName,
            ...(changingPassword
              ? {
                  currentPassword,
                  newPassword,
                }
              : {}),
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            'تعذر تحديث بيانات الحساب.',
        );
      }

      const updatedUser: User = {
        id: Number(data.user.id),
        name: data.user.name,
        phone: data.user.phone,
        role: data.user.role,
      };

      setUser(updatedUser);

      setEditName(updatedUser.name);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');

      setSettingsSuccess(
        'تم تحديث بيانات حسابك بنجاح.',
      );
    } catch (err) {
      console.log(
        'Account settings error:',
        err,
      );

      setSettingsError(
        err instanceof Error
          ? err.message
          : 'حدث خطأ أثناء تحديث الحساب.',
      );
    } finally {
      setSettingsLoading(false);
    }
  };

  const getRequestTypeLabel = (value?: string | null) => {
    switch (String(value ?? '').toUpperCase()) {
      case 'RENEW':
        return 'تجديد';
      case 'DEVICE_PURCHASE':
        return 'شراء جهاز';
      case 'NEW':
        return 'اشتراك جديد';
      default:
        return value || 'طلب';
    }
  };

  const getOrderStatusLabel = (value?: string | null) => {
    switch (String(value ?? '').toUpperCase()) {
      case 'PENDING':
        return 'قيد المراجعة';
      case 'CONFIRMED':
        return 'تم التأكيد';
      case 'PREPARING':
        return 'قيد التجهيز';
      case 'SHIPPED':
        return 'تم الشحن';
      case 'DELIVERED':
        return 'مكتمل';
      case 'CANCELLED':
      case 'CANCELED':
        return 'ملغي';
      default:
        return value || 'غير محدد';
    }
  };

  const getReceiptStatusLabel = (value?: string | null) => {
    switch (String(value ?? '').toUpperCase()) {
      case 'PAID':
        return 'مدفوع';
      case 'PENDING':
        return 'قيد الانتظار';
      case 'CANCELLED':
      case 'CANCELED':
        return 'ملغي';
      default:
        return value || 'غير محدد';
    }
  };



  const getSupportStatusLabel = (value?: string | null) => {
    switch (String(value ?? '').toUpperCase()) {
      case 'OPEN':
        return 'مفتوحة';
      case 'IN_PROGRESS':
        return 'قيد المعالجة';
      case 'CLOSED':
        return 'مغلقة';
      default:
        return value || 'غير محدد';
    }
  };

  const getSupportStatusStyle = (value?: string | null) => {
    switch (String(value ?? '').toUpperCase()) {
      case 'CLOSED':
        return styles.supportTicketStatusClosed;
      case 'IN_PROGRESS':
        return styles.supportTicketStatusProgress;
      default:
        return styles.supportTicketStatusOpen;
    }
  };

  const getOrderStatusStyle = (value?: string | null) => {
    switch (String(value ?? '').toUpperCase()) {
      case 'CONFIRMED':
      case 'DELIVERED':
        return styles.orderStatusSuccess;
      case 'CANCELLED':
      case 'CANCELED':
        return styles.orderStatusCancelled;
      case 'PREPARING':
      case 'SHIPPED':
        return styles.orderStatusInfo;
      default:
        return styles.orderStatusPending;
    }
  };

  const formatPrice = (
    price: number,
  ) => {
    return `${price.toLocaleString(
      'en-US',
    )} د.ع`;
  };

  const formatDate = (
    value?: string | null,
  ) => {
    if (!value) {
      return 'غير محدد';
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
      return value;
    }

    return date.toLocaleDateString(
      'ar-IQ',
      {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      },
    );
  };

  const notificationItems = useMemo<AppNotification[]>(() => {
    const items: AppNotification[] = [];

    if (!user) {
      items.push({
        id: 'guest-login-tip',
        icon: 'person-circle-outline',
        title: 'سجّل دخولك إلى شاشتنا',
        message: 'من حسابك تقدر تتابع اشتراكاتك وطلباتك وإيصالاتك.',
        action: 'ACCOUNT',
      });

      return items;
    }

    items.push({
      id: `welcome-${user.id}`,
      icon: 'sparkles-outline',
      title: `أهلًا ${user.name}`,
      message: 'حسابك جاهز، ومن هنا تقدر تتابع كل تفاصيل اشتراكاتك.',
      action: 'ACCOUNT',
    });

    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    const oneDay = 24 * 60 * 60 * 1000;

    subscriptions.forEach((subscription) => {
      if (
        !subscription.expiryDate ||
        String(subscription.status || '').toUpperCase() !== 'ACTIVE'
      ) {
        return;
      }

      const expiry = new Date(subscription.expiryDate).getTime();

      if (!Number.isFinite(expiry)) {
        return;
      }

      const difference = expiry - now;

      if (difference <= 0) {
        items.push({
          id: `subscription-expired-${subscription.id}-${subscription.expiryDate}`,
          icon: 'alert-circle-outline',
          title: 'اشتراك منتهي',
          message: `${subscription.packageName || 'اشتراكك'} انتهى بتاريخ ${formatDate(subscription.expiryDate)}.`,
          date: subscription.expiryDate,
          action: 'ACCOUNT',
        });
      } else if (difference <= sevenDays) {
        const daysLeft = Math.max(
          1,
          Math.ceil(difference / oneDay),
        );

        const timeLabel =
          daysLeft === 1
            ? 'خلال يوم واحد'
            : `خلال ${daysLeft} أيام`;

        items.push({
          id: `subscription-expiring-${subscription.id}-${subscription.expiryDate}`,
          icon: daysLeft === 1 ? 'warning-outline' : 'time-outline',
          title:
            daysLeft === 1
              ? 'اشتراكك ينتهي غدًا'
              : 'اشتراكك ينتهي قريبًا',
          message: `${subscription.packageName || 'اشتراكك'} ينتهي ${timeLabel} بتاريخ ${formatDate(subscription.expiryDate)}.`,
          date: subscription.expiryDate,
          action: 'ACCOUNT',
        });
      }
    });

    orders.forEach((order) => {
      const status = String(
        order.status || 'PENDING',
      ).toUpperCase();

      const statusMap: Record<
        string,
        {
          title: string;
          message: string;
          icon: keyof typeof Ionicons.glyphMap;
        }
      > = {
        PENDING: {
          title: 'طلب قيد المراجعة',
          message: `طلبك #${order.id} وصلنا وننتظر مراجعته.`,
          icon: 'time-outline',
        },
        CONFIRMED: {
          title: 'تم تأكيد طلبك',
          message: `تم تأكيد الطلب #${order.id}.`,
          icon: 'checkmark-circle-outline',
        },
        PREPARING: {
          title: 'جاري تجهيز طلبك',
          message: `الطلب #${order.id} قيد التجهيز حاليًا.`,
          icon: 'construct-outline',
        },
        SHIPPED: {
          title: 'تم شحن طلبك',
          message: `الطلب #${order.id} تم تحويله للشحن.`,
          icon: 'car-outline',
        },
        DELIVERED: {
          title: 'اكتمل طلبك',
          message: `تم إكمال الطلب #${order.id} بنجاح.`,
          icon: 'checkmark-done-circle-outline',
        },
        CANCELLED: {
          title: 'تم إلغاء الطلب',
          message: `الطلب #${order.id} تم إلغاؤه.`,
          icon: 'close-circle-outline',
        },
      };

      const mapped = statusMap[status];

      if (mapped) {
        items.push({
          id: `order-${order.id}-${status}-${order.updatedAt || order.createdAt || ''}`,
          icon: mapped.icon,
          title: mapped.title,
          message: mapped.message,
          date: order.updatedAt || order.createdAt,
          action: 'ORDERS',
        });
      }
    });

    supportTickets.forEach((ticket) => {
      const lastAdminMessage = [...(ticket.messages || [])]
        .reverse()
        .find((message) => message.sender === 'ADMIN');

      if (lastAdminMessage) {
        items.push({
          id:
            'support-ticket-reply-' +
            ticket.id +
            '-' +
            lastAdminMessage.id,
          icon: 'headset-outline',
          title: 'رد جديد من الدعم',
          message:
            ticket.subject +
            ': ' +
            lastAdminMessage.message,
          date: lastAdminMessage.createdAt,
          action: 'SUPPORT',
          actionId: ticket.id,
        });
      }
    });

    if (receipts.length > 0) {
      const latestReceipt = receipts[0];

      items.push({
        id: `receipt-${latestReceipt.id}-${latestReceipt.createdAt || ''}`,
        icon: 'document-text-outline',
        title: 'إيصال متوفر',
        message: latestReceipt.receiptNumber
          ? `إيصالك رقم ${latestReceipt.receiptNumber} متوفر ضمن حسابك.`
          : 'عندك إيصال جديد متوفر ضمن حسابك.',
        date: latestReceipt.createdAt,
        action: 'RECEIPTS',
      });
    }

    return items.sort((a, b) => {
      const aTime = a.date
        ? new Date(a.date).getTime()
        : 0;
      const bTime = b.date
        ? new Date(b.date).getTime()
        : 0;

      return bTime - aTime;
    });
  }, [
    user,
    subscriptions,
    orders,
    receipts,
    supportTickets,
  ]);

  const unreadNotificationCount = useMemo(() => {
    return notificationItems.filter(
      (item) => !readNotificationIds.includes(item.id),
    ).length;
  }, [notificationItems, readNotificationIds]);

  const openNotifications = () => {
    setShowNotifications(true);
  };

  const persistReadNotificationIds = async (
    ids: string[],
  ) => {
    try {
      await AsyncStorage.setItem(
        STORAGE_READ_NOTIFICATIONS_KEY,
        JSON.stringify(ids),
      );
    } catch (err) {
      console.log(
        'Save read notifications error:',
        err,
      );
    }
  };

  const markNotificationRead = async (
    notificationId: string,
  ) => {
    if (
      readNotificationIds.includes(
        notificationId,
      )
    ) {
      return;
    }

    const next = [
      ...readNotificationIds,
      notificationId,
    ];

    setReadNotificationIds(next);
    await persistReadNotificationIds(next);
  };

  const handleNotificationPress = async (
    item: AppNotification,
  ) => {
    await markNotificationRead(item.id);
    setShowNotifications(false);

    switch (item.action) {
      case 'SUPPORT': {
        const ticket = item.actionId
          ? supportTickets.find(
              (entry) => entry.id === item.actionId,
            )
          : null;

        if (ticket) {
          setSelectedSupportTicket(ticket);
          setTicketReply('');
          setTicketError('');
          setTicketSuccess('');
        }

        setActiveTab('support');
        break;
      }

      case 'ORDERS':
        setActiveTab('orders');
        break;

      case 'RECEIPTS':
      case 'ACCOUNT':
      default:
        setActiveTab('account');
        break;
    }
  };

  const markAllNotificationsRead = async () => {
    const ids = notificationItems.map(
      (item) => item.id,
    );

    setReadNotificationIds(ids);
    await persistReadNotificationIds(ids);
  };

  const renderNotifications = () => (
    <Modal
      visible={showNotifications}
      transparent
      animationType="slide"
      onRequestClose={() => setShowNotifications(false)}
    >
      <View style={styles.notificationsOverlay}>
        <SafeAreaView style={styles.notificationsSheet}>
          <View style={styles.notificationsHeader}>
            <View style={styles.notificationsHeaderText}>
              <Text style={styles.notificationsTitle}>
                الإشعارات
              </Text>

              <Text style={styles.notificationsSubtitle}>
                آخر التحديثات الخاصة بحسابك
              </Text>
            </View>

            <TouchableOpacity
              style={styles.notificationsClose}
              onPress={() => setShowNotifications(false)}
            >
              <Ionicons
                name="close"
                size={23}
                color="#64748B"
              />
            </TouchableOpacity>
          </View>

          {notificationItems.length > 0 && unreadNotificationCount > 0 && (
            <TouchableOpacity
              style={styles.notificationsMarkAll}
              onPress={markAllNotificationsRead}
            >
              <Ionicons
                name="checkmark-done-outline"
                size={17}
                color="#2563EB"
              />

              <Text style={styles.notificationsMarkAllText}>
                تعليم الكل كمقروء
              </Text>
            </TouchableOpacity>
          )}

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.notificationsContent}
          >
            {notificationItems.length === 0 ? (
              <View style={styles.notificationsEmpty}>
                <View style={styles.notificationsEmptyIcon}>
                  <Ionicons
                    name="notifications-off-outline"
                    size={35}
                    color="#2563EB"
                  />
                </View>

                <Text style={styles.notificationsEmptyTitle}>
                  ماكو إشعارات حاليًا
                </Text>

                <Text style={styles.notificationsEmptyText}>
                  أي تحديث جديد عن اشتراكك أو طلباتك راح يظهر هنا.
                </Text>
              </View>
            ) : (
              notificationItems.map((item) => {
                const unread = !readNotificationIds.includes(item.id);

                return (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.82}
                    onPress={() => {
                      void handleNotificationPress(item);
                    }}
                    style={[
                      styles.notificationCard,
                      unread && styles.notificationCardUnread,
                    ]}
                  >
                    <View
                      style={[
                        styles.notificationIcon,
                        unread && styles.notificationIconUnread,
                      ]}
                    >
                      <Ionicons
                        name={item.icon}
                        size={22}
                        color={unread ? '#2563EB' : '#64748B'}
                      />
                    </View>

                    <View style={styles.notificationContent}>
                      <View style={styles.notificationTitleRow}>
                        <Text style={styles.notificationTitleText}>
                          {item.title}
                        </Text>

                        {unread && (
                          <View style={styles.notificationUnreadDot} />
                        )}
                      </View>

                      <Text style={styles.notificationMessage}>
                        {item.message}
                      </Text>

                      {!!item.date && (
                        <Text style={styles.notificationDate}>
                          {formatDate(item.date)}
                        </Text>
                      )}
                    </View>

                    <Ionicons
                      name="chevron-back"
                      size={17}
                      color="#94A3B8"
                    />
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );

  const filteredPackages = useMemo(() => {
    if (
      serviceFilter === 'ALL'
    ) {
      return packages;
    }

    if (
      serviceFilter === 'DEVICES' ||
      serviceFilter === 'APPS'
    ) {
      return [];
    }

    return packages.filter(
      (item) =>
        item.serviceType?.toUpperCase() ===
        serviceFilter,
    );
  }, [
    packages,
    serviceFilter,
  ]);

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerLogo}>
        <View style={styles.logoIcon}>
          <Ionicons
            name="tv-outline"
            size={22}
            color="#FFFFFF"
          />
        </View>

        <View>
          <Text style={styles.logoText}>
            شاشتنا
          </Text>

          <Text
            style={styles.logoSubtitle}
          >
            كل الترفيه بشاشة واحدة
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.notificationButton}
        onPress={openNotifications}
        activeOpacity={0.8}
      >
        <Ionicons
          name="notifications-outline"
          size={22}
          color="#0F172A"
        />

        {unreadNotificationCount > 0 && (
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationBadgeText}>
              {unreadNotificationCount > 9
                ? '9+'
                : String(unreadNotificationCount)}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderHero = () => (
    <View style={styles.hero}>
      <View style={styles.heroGlowOne} />
      <View style={styles.heroGlowTwo} />

      <View style={styles.heroContent}>
        <View style={styles.heroBadge}>
          <Ionicons
            name="sparkles"
            size={14}
            color="#DCEBFF"
          />

          <Text
            style={styles.heroBadgeText}
          >
            أهلاً بك في شاشتنا
          </Text>
        </View>

        <Text style={styles.heroTitle}>
          كل الترفيه
          {'\n'}
          <Text
            style={
              styles.heroTitleAccent
            }
          >
            بشاشة واحدة
          </Text>
        </Text>

        <Text
          style={styles.heroDescription}
        >
          اشتراكاتك، خدماتك، أجهزتك وطلباتك
          {'\n'}
          كلها بمكان واحد.
        </Text>

        <TouchableOpacity
          style={styles.heroButton}
          onPress={() => {
            setServiceFilter('ALL');
            setActiveTab('services');
          }}
        >
          <Text
            style={styles.heroButtonText}
          >
            استكشف الخدمات
          </Text>

          <Ionicons
            name="arrow-back"
            size={18}
            color="#0F172A"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.heroTv}>
        <Ionicons
          name="tv"
          size={86}
          color="rgba(255,255,255,0.92)"
        />

        <View
          style={styles.heroTvGlow}
        >
          <Ionicons
            name="play"
            size={28}
            color="rgba(255,255,255,0.95)"
          />
        </View>
      </View>
    </View>
  );

  const renderServiceCards = () => (
    <View style={styles.section}>
      <View
        style={styles.sectionHeader}
      >
        <View>
          <Text
            style={styles.sectionTitle}
          >
            خدماتنا
          </Text>

          <Text
            style={styles.sectionSubtitle}
          >
            كل خدمات شاشتنا بمكان واحد
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => {
            setServiceFilter('ALL');
            setActiveTab('services');
          }}
        >
          <Text style={styles.seeAll}>
            عرض الكل
          </Text>
        </TouchableOpacity>
      </View>

      <View
        style={styles.servicesGrid}
      >
        <TouchableOpacity
          style={styles.serviceCard}
          onPress={() => {
            setServiceFilter('IPTV');
            setActiveTab('services');
          }}
        >
          <View
            style={[
              styles.serviceIcon,
              styles.blueIcon,
            ]}
          >
            <Ionicons
              name="play-circle-outline"
              size={28}
              color="#2563EB"
            />
          </View>

          <Text
            style={styles.serviceTitle}
          >
            IPTV
          </Text>

          <Text
            style={styles.serviceDescription}
          >
            قنوات ومحتوى ترفيهي
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.serviceCard}
          onPress={() => {
            setServiceFilter('VIP');
            setActiveTab('services');
          }}
        >
          <View
            style={[
              styles.serviceIcon,
              styles.purpleIcon,
            ]}
          >
            <Ionicons
              name="star-outline"
              size={28}
              color="#7C3AED"
            />
          </View>

          <Text
            style={styles.serviceTitle}
          >
            VIP
          </Text>

          <Text
            style={styles.serviceDescription}
          >
            خدمات VIP المميزة
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.serviceCard}
          onPress={() => {
            setServiceFilter('DEVICES');
            setActiveTab('services');
          }}
        >
          <View
            style={[
              styles.serviceIcon,
              styles.cyanIcon,
            ]}
          >
            <Ionicons
              name="hardware-chip-outline"
              size={28}
              color="#0891B2"
            />
          </View>

          <Text
            style={styles.serviceTitle}
          >
            الأجهزة
          </Text>

          <Text
            style={styles.serviceDescription}
          >
            أجهزة متوافقة مع خدماتنا
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.serviceCard}
          onPress={() => {
            setServiceFilter('APPS');
            setActiveTab('services');
          }}
        >
          <View
            style={[
              styles.serviceIcon,
              styles.greenIcon,
            ]}
          >
            <Ionicons
              name="apps-outline"
              size={28}
              color="#059669"
            />
          </View>

          <Text
            style={styles.serviceTitle}
          >
            التطبيقات
          </Text>

          <Text
            style={styles.serviceDescription}
          >
            تطبيقات المشاهدة والدعم
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPackageCard = (
    item: Package,
  ) => (
    <TouchableOpacity
      key={item.id}
      style={styles.packageCard}
      activeOpacity={0.85}
      onPress={() => {
        setServiceFilter(
          item.serviceType?.toUpperCase() ===
            'VIP'
            ? 'VIP'
            : 'IPTV',
        );

        setActiveTab('services');
      }}
    >
      <View style={styles.packageTop}>
        <View
          style={styles.packageIcon}
        >
          <Ionicons
            name={
              item.serviceType?.toUpperCase() ===
              'VIP'
                ? 'star-outline'
                : 'play-outline'
            }
            size={25}
            color="#2563EB"
          />
        </View>

        <View
          style={styles.packageInfo}
        >
          <Text
            style={styles.packageName}
          >
            {item.name}
          </Text>

          <Text
            style={styles.packageDuration}
          >
            {item.durationLabel ||
              `${item.durationMonths} أشهر`}
          </Text>
        </View>

        <View
          style={styles.packagePrice}
        >
          <Text
            style={styles.priceNumber}
          >
            {formatPrice(item.price)}
          </Text>

          <Text
            style={styles.priceLabel}
          >
            السعر
          </Text>
        </View>
      </View>

      {!!item.description && (
        <Text
          style={
            styles.packageDescription
          }
          numberOfLines={2}
        >
          {item.description}
        </Text>
      )}

      <View
        style={styles.packageBottom}
      >
        <View
          style={styles.packageService}
        >
          <View
            style={styles.statusDot}
          />

          <Text
            style={
              styles.packageServiceText
            }
          >
            {item.serviceType}
          </Text>
        </View>

        <View
          style={styles.detailsButton}
        >
          <Text
            style={styles.detailsText}
          >
            التفاصيل
          </Text>

          <Ionicons
            name="arrow-back"
            size={15}
            color="#2563EB"
          />
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderHomePackages = () => (
    <View style={styles.section}>
      <View
        style={styles.sectionHeader}
      >
        <View>
          <Text
            style={styles.sectionTitle}
          >
            الباقات
          </Text>

          <Text
            style={styles.sectionSubtitle}
          >
            الباقات المتوفرة حاليًا
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => {
            setServiceFilter('ALL');
            setActiveTab('services');
          }}
        >
          <Text style={styles.seeAll}>
            عرض الكل
          </Text>
        </TouchableOpacity>
      </View>

      {loadingServices ? (
        <LoadingBox />
      ) : error ? (
        <ErrorBox
          message={error}
          onRetry={loadServices}
        />
      ) : packages.length === 0 ? (
        <EmptyBox
          text="ماكو باقات متوفرة حاليًا"
        />
      ) : (
        packages
          .slice(0, 4)
          .map((item) =>
            renderPackageCard(item),
          )
      )}
    </View>
  );

  const openSupportContact = async () => {
    const url = `${API_BASE_URL}/contact`;

    try {
      await Linking.openURL(url);
    } catch (err) {
      console.log('Support contact error:', err);
      Alert.alert(
        'الدعم الفني',
        'تعذر فتح صفحة التواصل حاليًا.',
      );
    }
  };



  const resetTicketForm = () => {
    setTicketSubject('');
    setTicketMessage('');
    setTicketError('');
    setTicketSuccess('');
  };

  const openCreateTicket = () => {
    if (!user) {
      setShowLogin(true);
      return;
    }

    resetTicketForm();
    setShowCreateTicket(true);
  };

  const openSupportTicket = (ticket: SupportTicket) => {
    setSelectedSupportTicket(ticket);
    setTicketReply('');
    setTicketError('');
    setTicketSuccess('');
  };

  const handleCreateSupportTicket = async () => {
    if (!user) {
      setShowLogin(true);
      return;
    }

    const subject = ticketSubject.trim();
    const message = ticketMessage.trim();

    if (!subject) {
      setTicketError('اكتب عنوان للمشكلة.');
      return;
    }

    if (!message) {
      setTicketError('اكتب تفاصيل المشكلة.');
      return;
    }

    try {
      setTicketLoading(true);
      setTicketError('');
      setTicketSuccess('');

      const response = await authenticatedFetch(
        '/api/mobile/support/tickets',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            subject,
            category: supportCategory,
            message,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.error || data?.message || 'تعذر إنشاء التذكرة.',
        );
      }

      setShowCreateTicket(false);
      resetTicketForm();
      await loadSupportTickets(user.id);
      setActiveTab('support');
    } catch (err) {
      console.log('Create support ticket error:', err);
      setTicketError(
        err instanceof Error
          ? err.message
          : 'حدث خطأ أثناء إنشاء التذكرة.',
      );
    } finally {
      setTicketLoading(false);
    }
  };

  const handleSupportTicketReply = async () => {
    if (!user || !selectedSupportTicket) {
      return;
    }

    const message = ticketReply.trim();

    if (!message) {
      setTicketError('اكتب ردك أولًا.');
      return;
    }

    try {
      setTicketLoading(true);
      setTicketError('');
      setTicketSuccess('');

      const response = await authenticatedFetch(
        '/api/mobile/support/tickets/' + encodeURIComponent(selectedSupportTicket.id),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            action: 'REPLY',
            message,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.error || data?.message || 'تعذر إرسال الرد.',
        );
      }

      setSelectedSupportTicket(data.ticket);
      setTicketReply('');
      setTicketSuccess('تم إرسال ردك.');
      await loadSupportTickets(user.id);
    } catch (err) {
      console.log('Support ticket reply error:', err);
      setTicketError(
        err instanceof Error
          ? err.message
          : 'حدث خطأ أثناء إرسال الرد.',
      );
    } finally {
      setTicketLoading(false);
    }
  };

  const handleCloseSupportTicket = async () => {
    if (!user || !selectedSupportTicket) {
      return;
    }

    try {
      setTicketLoading(true);
      setTicketError('');
      setTicketSuccess('');

      const response = await authenticatedFetch(
        '/api/mobile/support/tickets/' + encodeURIComponent(selectedSupportTicket.id),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            action: 'CLOSE',
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.error || data?.message || 'تعذر إغلاق التذكرة.',
        );
      }

      setSelectedSupportTicket(data.ticket);
      setTicketSuccess('تم إغلاق التذكرة.');
      await loadSupportTickets(user.id);
    } catch (err) {
      console.log('Close support ticket error:', err);
      setTicketError(
        err instanceof Error
          ? err.message
          : 'حدث خطأ أثناء إغلاق التذكرة.',
      );
    } finally {
      setTicketLoading(false);
    }
  };

  const renderSupportTicketModals = () => (
    <>
      <Modal
        visible={showCreateTicket}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!ticketLoading) {
            setShowCreateTicket(false);
          }
        }}
      >
        <View style={styles.supportTicketOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.supportTicketKeyboard}
          >
            <View style={styles.supportTicketModal}>
              <View style={styles.supportTicketHeader}>
                <View style={styles.supportTicketHeaderText}>
                  <Text style={styles.supportTicketTitle}>فتح تذكرة دعم</Text>
                  <Text style={styles.supportTicketSubtitle}>
                    اكتب المشكلة بالتفصيل حتى نتابعها معك.
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.supportTicketClose}
                  disabled={ticketLoading}
                  onPress={() => setShowCreateTicket(false)}
                >
                  <Ionicons name="close" size={22} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.supportTicketContent}
              >
                <Text style={styles.supportTicketLabel}>عنوان المشكلة</Text>
                <TextInput
                  style={styles.supportTicketInput}
                  value={ticketSubject}
                  onChangeText={setTicketSubject}
                  placeholder="مثلاً: مشكلة في تفعيل الاشتراك"
                  placeholderTextColor="#94A3B8"
                  textAlign="right"
                />

                <Text style={styles.supportTicketLabel}>التفاصيل</Text>
                <TextInput
                  style={[styles.supportTicketInput, styles.supportTicketTextArea]}
                  value={ticketMessage}
                  onChangeText={setTicketMessage}
                  placeholder="اكتب تفاصيل المشكلة هنا..."
                  placeholderTextColor="#94A3B8"
                  textAlign="right"
                  multiline
                  textAlignVertical="top"
                />

                <View style={styles.supportTicketCategoryNotice}>
                  <Ionicons name="pricetag-outline" size={18} color="#2563EB" />
                  <Text style={styles.supportTicketCategoryNoticeText}>
                    النوع: {supportCategory === 'subscription' ? 'مشكلة اشتراك' : supportCategory === 'device' ? 'مشكلة جهاز' : 'استفسار عام'}
                  </Text>
                </View>

                {ticketError ? (
                  <Text style={styles.supportTicketError}>{ticketError}</Text>
                ) : null}

                <TouchableOpacity
                  style={[styles.supportTicketPrimaryButton, ticketLoading && styles.supportTicketButtonDisabled]}
                  disabled={ticketLoading}
                  onPress={handleCreateSupportTicket}
                >
                  {ticketLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.supportTicketPrimaryText}>إرسال التذكرة</Text>
                      <Ionicons name="send-outline" size={19} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Modal
        visible={Boolean(selectedSupportTicket)}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!ticketLoading) {
            setSelectedSupportTicket(null);
          }
        }}
      >
        <View style={styles.supportTicketOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.supportTicketKeyboard}
          >
            <View style={styles.supportTicketModal}>
              {selectedSupportTicket ? (
                <>
                  <View style={styles.supportTicketHeader}>
                    <View style={styles.supportTicketHeaderText}>
                      <Text style={styles.supportTicketTitle} numberOfLines={2}>
                        {selectedSupportTicket.subject}
                      </Text>
                      <View style={styles.supportTicketStatusRow}>
                        <View style={[styles.supportTicketStatusBadge, getSupportStatusStyle(selectedSupportTicket.status)]}>
                          <Text style={styles.supportTicketStatusText}>
                            {getSupportStatusLabel(selectedSupportTicket.status)}
                          </Text>
                        </View>
                        <Text style={styles.supportTicketMeta}>#{selectedSupportTicket.id.slice(0, 8)}</Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.supportTicketClose}
                      disabled={ticketLoading}
                      onPress={() => setSelectedSupportTicket(null)}
                    >
                      <Ionicons name="close" size={22} color="#64748B" />
                    </TouchableOpacity>
                  </View>

                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.supportConversationContent}
                  >
                    {(selectedSupportTicket.messages || []).map((message) => {
                      const admin = message.sender === 'ADMIN';

                      return (
                        <View
                          key={message.id}
                          style={[
                            styles.supportMessageBubble,
                            admin ? styles.supportMessageAdmin : styles.supportMessageCustomer,
                          ]}
                        >
                          <View style={styles.supportMessageHeader}>
                            <Text style={styles.supportMessageSender}>
                              {admin ? 'دعم شاشتنا' : 'أنت'}
                            </Text>
                            <Text style={styles.supportMessageDate}>
                              {formatDate(message.createdAt)}
                            </Text>
                          </View>
                          <Text style={styles.supportMessageText}>{message.message}</Text>
                        </View>
                      );
                    })}

                    {selectedSupportTicket.status !== 'CLOSED' ? (
                      <>
                        <Text style={styles.supportTicketLabel}>ردك</Text>
                        <TextInput
                          style={[styles.supportTicketInput, styles.supportTicketTextArea]}
                          value={ticketReply}
                          onChangeText={setTicketReply}
                          placeholder="اكتب ردك هنا..."
                          placeholderTextColor="#94A3B8"
                          textAlign="right"
                          multiline
                          textAlignVertical="top"
                        />

                        {ticketError ? (
                          <Text style={styles.supportTicketError}>{ticketError}</Text>
                        ) : null}

                        {ticketSuccess ? (
                          <Text style={styles.supportTicketSuccess}>{ticketSuccess}</Text>
                        ) : null}

                        <TouchableOpacity
                          style={[styles.supportTicketPrimaryButton, ticketLoading && styles.supportTicketButtonDisabled]}
                          disabled={ticketLoading}
                          onPress={handleSupportTicketReply}
                        >
                          {ticketLoading ? (
                            <ActivityIndicator color="#FFFFFF" />
                          ) : (
                            <>
                              <Text style={styles.supportTicketPrimaryText}>إرسال الرد</Text>
                              <Ionicons name="send-outline" size={19} color="#FFFFFF" />
                            </>
                          )}
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.supportTicketSecondaryButton}
                          disabled={ticketLoading}
                          onPress={handleCloseSupportTicket}
                        >
                          <Ionicons name="checkmark-done-outline" size={18} color="#DC2626" />
                          <Text style={styles.supportTicketSecondaryText}>إغلاق التذكرة</Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <View style={styles.supportTicketClosedNotice}>
                        <Ionicons name="lock-closed-outline" size={18} color="#64748B" />
                        <Text style={styles.supportTicketClosedText}>
                          هذه التذكرة مغلقة. افتح تذكرة جديدة إذا احتجت مساعدة أخرى.
                        </Text>
                      </View>
                    )}
                  </ScrollView>
                </>
              ) : null}
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );

  const renderSupportScreen = () => {
    const faqItems = [
      {
        icon: 'tv-outline' as keyof typeof Ionicons.glyphMap,
        question: 'شلون أتابع اشتراكي؟',
        answer: 'من قسم حسابي راح تشوف اشتراكاتك الحالية وتاريخ الانتهاء وتفاصيل كل اشتراك.',
      },
      {
        icon: 'wifi-outline' as keyof typeof Ionicons.glyphMap,
        question: 'الخدمة ما تشتغل عندي، شسوي؟',
        answer: 'تأكد أولًا من اتصال الإنترنت والجهاز، وبعدها افتح حسابك وتحقق من حالة الاشتراك. إذا المشكلة مستمرة تواصل ويانا.',
      },
      {
        icon: 'hardware-chip-outline' as keyof typeof Ionicons.glyphMap,
        question: 'أريد أشتري جهاز، شلون؟',
        answer: 'افتح الخدمات، اختار الأجهزة، شوف الجهاز المناسب، وبعدها أرسل طلب الشراء من التطبيق.',
      },
      {
        icon: 'lock-closed-outline' as keyof typeof Ionicons.glyphMap,
        question: 'نسيت كلمة المرور، شلون أغيرها؟',
        answer: 'من صفحة الحساب افتح إعدادات الحساب، وبعدها تقدر تغيّر كلمة المرور باستخدام كلمة المرور الحالية.',
      },
    ];

    const categories = [
      { id: 'general', label: 'استفسار عام', icon: 'help-circle-outline' as keyof typeof Ionicons.glyphMap },
      { id: 'subscription', label: 'مشكلة اشتراك', icon: 'tv-outline' as keyof typeof Ionicons.glyphMap },
      { id: 'device', label: 'مشكلة جهاز', icon: 'hardware-chip-outline' as keyof typeof Ionicons.glyphMap },
    ];

    return (
      <ScrollView
        style={styles.page}
        contentContainerStyle={styles.supportPageContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>الدعم الفني</Text>
          <Text style={styles.pageSubtitle}>
            كل ما تحتاجه للمساعدة والتواصل مع فريق شاشتنا.
          </Text>
        </View>

        <View style={styles.supportStatusCard}>
          <View style={styles.supportStatusIcon}>
            <Ionicons
              name="headset-outline"
              size={24}
              color="#FFFFFF"
            />
          </View>

          <View style={styles.supportStatusContent}>
            <View style={styles.supportStatusTitleRow}>
              <Text style={styles.supportStatusTitle}>فريق شاشتنا</Text>
              <View style={styles.supportOnlineBadge}>
                <View style={styles.supportOnlineDot} />
                <Text style={styles.supportOnlineText}>متاح</Text>
              </View>
            </View>
            <Text style={styles.supportStatusText}>
              الدعم متوفر يوميًا من 9 صباحًا إلى 11 مساءً.
            </Text>
          </View>
        </View>

        <View style={styles.supportSection}>
          <Text style={styles.supportSectionTitle}>نوع المشكلة</Text>
          <Text style={styles.supportSectionHint}>اختار الأقرب لمشكلتك قبل التواصل.</Text>

          <View style={styles.supportCategoryGrid}>
            {categories.map((category) => {
              const active = supportCategory === category.id;

              return (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.supportCategoryCard,
                    active && styles.supportCategoryCardActive,
                  ]}
                  onPress={() => setSupportCategory(category.id)}
                  activeOpacity={0.78}
                >
                  <View
                    style={[
                      styles.supportCategoryIcon,
                      active && styles.supportCategoryIconActive,
                    ]}
                  >
                    <Ionicons
                      name={category.icon}
                      size={22}
                      color={active ? '#FFFFFF' : '#2563EB'}
                    />
                  </View>
                  <Text
                    style={[
                      styles.supportCategoryText,
                      active && styles.supportCategoryTextActive,
                    ]}
                  >
                    {category.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.supportContactCard}>
          <View style={styles.supportContactGlow} />
          <View style={styles.supportContactTop}>
            <View style={styles.supportContactIcon}>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={24}
                color="#2563EB"
              />
            </View>

            <View style={styles.supportContactContent}>
              <Text style={styles.supportContactTitle}>تحتاج مساعدة مباشرة؟</Text>
              <Text style={styles.supportContactText}>
                افتح صفحة التواصل وأرسل مشكلتك لفريق شاشتنا، واذكر نوع المشكلة اللي اخترته.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.supportContactButton}
            onPress={openSupportContact}
            activeOpacity={0.8}
          >
            <Text style={styles.supportContactButtonText}>تواصل مع الدعم</Text>
            <Ionicons name="arrow-back" size={19} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {user ? (
          <View style={styles.supportAccountCard}>
            <View style={styles.supportAccountIcon}>
              <Ionicons
                name="person-circle-outline"
                size={28}
                color="#2563EB"
              />
            </View>
            <View style={styles.supportAccountContent}>
              <Text style={styles.supportAccountTitle}>بيانات حسابك</Text>
              <Text style={styles.supportAccountText}>
                {user.name} • {user.phone}
              </Text>
              <Text style={styles.supportAccountText}>
                الاشتراكات الحالية: {subscriptions.length}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.supportAccountCard}>
            <View style={styles.supportAccountIcon}>
              <Ionicons
                name="person-outline"
                size={25}
                color="#2563EB"
              />
            </View>
            <View style={styles.supportAccountContent}>
              <Text style={styles.supportAccountTitle}>سجّل دخولك</Text>
              <Text style={styles.supportAccountText}>
                تسجيل الدخول يساعد فريق الدعم على معرفة حسابك واشتراكاتك بشكل أسرع.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.supportLoginSmallButton}
              onPress={() => setShowLogin(true)}
            >
              <Text style={styles.supportLoginSmallButtonText}>دخول</Text>
            </TouchableOpacity>
          </View>
        )}



        <View style={styles.supportTicketsSection}>
          <View style={styles.supportTicketsHeader}>
            <View style={styles.supportTicketsHeaderText}>
              <Text style={styles.supportSectionTitle}>تذاكري</Text>
              <Text style={styles.supportSectionHint}>
                تابع مشاكلك وردود فريق شاشتنا من داخل التطبيق.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.supportNewTicketButton}
              onPress={openCreateTicket}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={19} color="#FFFFFF" />
              <Text style={styles.supportNewTicketButtonText}>تذكرة جديدة</Text>
            </TouchableOpacity>
          </View>

          {!user ? (
            <View style={styles.supportTicketsLoginBox}>
              <Ionicons name="lock-closed-outline" size={22} color="#2563EB" />
              <Text style={styles.supportTicketsLoginText}>
                سجّل الدخول حتى تقدر تفتح تذكرة وتتابعها من التطبيق.
              </Text>
            </View>
          ) : loadingSupportTickets ? (
            <LoadingBox />
          ) : supportTickets.length === 0 ? (
            <View style={styles.supportTicketsEmpty}>
              <View style={styles.supportTicketsEmptyIcon}>
                <Ionicons name="headset-outline" size={27} color="#2563EB" />
              </View>
              <Text style={styles.supportTicketsEmptyTitle}>ما عندك تذاكر حاليًا</Text>
              <Text style={styles.supportTicketsEmptyText}>
                افتح تذكرة من هنا إذا عندك مشكلة أو استفسار يحتاج متابعة.
              </Text>
            </View>
          ) : (
            supportTickets.map((ticket) => {
              const lastMessage = ticket.messages?.[ticket.messages.length - 1];
              const adminReply = ticket.messages?.some((message) => message.sender === 'ADMIN');

              return (
                <TouchableOpacity
                  key={ticket.id}
                  style={styles.supportTicketListCard}
                  onPress={() => openSupportTicket(ticket)}
                  activeOpacity={0.82}
                >
                  <View style={styles.supportTicketListIcon}>
                    <Ionicons
                      name={adminReply ? 'chatbubbles-outline' : 'chatbubble-outline'}
                      size={22}
                      color="#2563EB"
                    />
                  </View>

                  <View style={styles.supportTicketListContent}>
                    <View style={styles.supportTicketListTopRow}>
                      <Text style={styles.supportTicketListTitle} numberOfLines={1}>
                        {ticket.subject}
                      </Text>
                      <View style={[styles.supportTicketStatusBadge, getSupportStatusStyle(ticket.status)]}>
                        <Text style={styles.supportTicketStatusText}>
                          {getSupportStatusLabel(ticket.status)}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.supportTicketListPreview} numberOfLines={2}>
                      {lastMessage?.message || 'لا توجد رسائل.'}
                    </Text>
                    <Text style={styles.supportTicketListDate}>
                      آخر تحديث: {formatDate(ticket.updatedAt)}
                    </Text>
                  </View>

                  <Ionicons name="chevron-back" size={18} color="#94A3B8" />
                </TouchableOpacity>
              );
            })
          )}
        </View>

        <View style={styles.supportFaqSection}>
          <View style={styles.supportFaqHeader}>
            <Text style={styles.supportSectionTitle}>الأسئلة الشائعة</Text>
            <Text style={styles.supportSectionHint}>حلول سريعة قبل التواصل</Text>
          </View>

          {faqItems.map((item, index) => {
            const expanded = expandedFaq === index;

            return (
              <View key={item.question} style={styles.supportFaqItem}>
                <TouchableOpacity
                  style={styles.supportFaqButton}
                  onPress={() =>
                    setExpandedFaq(expanded ? null : index)
                  }
                  activeOpacity={0.78}
                >
                  <View style={styles.supportFaqIcon}>
                    <Ionicons
                      name={item.icon}
                      size={20}
                      color="#2563EB"
                    />
                  </View>

                  <Text style={styles.supportFaqQuestion}>{item.question}</Text>

                  <Ionicons
                    name={expanded ? 'chevron-up' : 'chevron-down'}
                    size={19}
                    color="#64748B"
                  />
                </TouchableOpacity>

                {expanded ? (
                  <Text style={styles.supportFaqAnswer}>{item.answer}</Text>
                ) : null}
              </View>
            );
          })}
        </View>

        <View style={styles.supportNote}>
          <Ionicons
            name="information-circle-outline"
            size={19}
            color="#2563EB"
          />
          <Text style={styles.supportNoteText}>
            عند التواصل، اذكر رقم طلبك أو اسم الاشتراك إذا كانت المشكلة مرتبطة بطلب أو اشتراك معيّن.
          </Text>
        </View>

        <View style={styles.footerSpace} />
      </ScrollView>
    );
  };

  const renderSupport = () => (
    <View
      style={styles.supportCard}
    >
      <View
        style={styles.supportIcon}
      >
        <Ionicons
          name="headset-outline"
          size={27}
          color="#FFFFFF"
        />
      </View>

      <View
        style={styles.supportContent}
      >
        <Text
          style={styles.supportTitle}
        >
          تحتاج مساعدة؟
        </Text>

        <Text
          style={styles.supportText}
        >
          فريق شاشتنا جاهز يساعدك بأي وقت.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.supportButton}
        onPress={() => setActiveTab('support')}
        activeOpacity={0.78}
      >
        <Ionicons
          name="chatbubble-ellipses-outline"
          size={20}
          color="#2563EB"
        />
      </TouchableOpacity>
    </View>
  );

  const renderHome = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={
        styles.scrollContent
      }
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refresh}
          tintColor="#2563EB"
        />
      }
    >
      {renderHeader()}
      {renderHero()}
      {renderServiceCards()}
      {renderHomePackages()}
      {renderSupport()}

      <View
        style={styles.footerSpace}
      />
    </ScrollView>
  );

  const renderFilter = (
    value: ServiceFilter,
    label: string,
    icon: keyof typeof Ionicons.glyphMap,
  ) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        serviceFilter === value &&
          styles.filterButtonActive,
      ]}
      onPress={() =>
        setServiceFilter(value)
      }
    >
      <Ionicons
        name={icon}
        size={16}
        color={
          serviceFilter === value
            ? '#FFFFFF'
            : '#64748B'
        }
      />

      <Text
        style={[
          styles.filterText,
          serviceFilter === value &&
            styles.filterTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderDevices = () => {
    if (
      serviceFilter !== 'DEVICES'
    ) {
      return null;
    }

    if (devices.length === 0) {
      return (
        <EmptyBox
          text="ماكو أجهزة متوفرة حاليًا"
        />
      );
    }

    return (
      <View>
        {devices.map((device) => (
          <TouchableOpacity
            key={device.id}
            style={styles.productCard}
            activeOpacity={0.85}
            onPress={() => setSelectedDevice(device)}
          >
            <View
              style={styles.productIcon}
            >
              <Ionicons
                name="hardware-chip-outline"
                size={28}
                color="#0891B2"
              />
            </View>

            <View
              style={styles.productInfo}
            >
              <Text
                style={styles.productName}
              >
                {device.name}
              </Text>

              <Text
                style={
                  styles.productDescription
                }
                numberOfLines={2}
              >
                {device.description ||
                  'جهاز متوفر من شاشتنا'}
              </Text>

              <Text
                style={styles.productPrice}
              >
                {formatPrice(
                  device.price,
                )}
              </Text>
            </View>

            <Ionicons
              name="chevron-back"
              size={20}
              color="#94A3B8"
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderApps = () => {
    if (
      serviceFilter !== 'APPS'
    ) {
      return null;
    }

    if (apps.length === 0) {
      return (
        <EmptyBox
          text="ماكو تطبيقات متوفرة حاليًا"
        />
      );
    }

    return (
      <View>
        {apps.map((app) => (
          <TouchableOpacity
            key={app.id}
            style={styles.productCard}
            activeOpacity={0.85}
            onPress={() => setSelectedApp(app)}
          >
            <View
              style={[
                styles.productIcon,
                styles.greenProductIcon,
              ]}
            >
              {app.imageUrl ? (
                <Image
                  source={{
                    uri: resolveMediaUrl(
                      app.imageUrl,
                    ),
                  }}
                  style={styles.productImage}
                  resizeMode="contain"
                />
              ) : (
                <Ionicons
                  name="apps-outline"
                  size={28}
                  color="#059669"
                />
              )}
            </View>

            <View
              style={styles.productInfo}
            >
              <Text
                style={styles.productName}
              >
                {app.name}
              </Text>

              <Text
                style={
                  styles.productDescription
                }
                numberOfLines={2}
              >
                {app.description ||
                  'تطبيق متوفر من شاشتنا'}
              </Text>

              <Text
                style={styles.platformText}
              >
                {app.platform}
                {app.version
                  ? ` • ${app.version}`
                  : ''}
              </Text>
            </View>

            <Ionicons
              name="chevron-back"
              size={20}
              color="#94A3B8"
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderServicesPage = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={
        styles.servicesPageContent
      }
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refresh}
          tintColor="#2563EB"
        />
      }
    >
      <View
        style={
          styles.servicesPageHeader
        }
      >
        <Text
          style={
            styles.servicesPageTitle
          }
        >
          الخدمات
        </Text>

        <Text
          style={
            styles.servicesPageSubtitle
          }
        >
          اختار الخدمة اللي تريدها
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.filtersRow
        }
      >
        {renderFilter(
          'ALL',
          'الكل',
          'apps-outline',
        )}

        {renderFilter(
          'IPTV',
          'IPTV',
          'play-circle-outline',
        )}

        {renderFilter(
          'VIP',
          'VIP',
          'star-outline',
        )}

        {renderFilter(
          'DEVICES',
          'الأجهزة',
          'hardware-chip-outline',
        )}

        {renderFilter(
          'APPS',
          'التطبيقات',
          'phone-portrait-outline',
        )}
      </ScrollView>

      {loadingServices ? (
        <LoadingBox />
      ) : error ? (
        <ErrorBox
          message={error}
          onRetry={loadServices}
        />
      ) : (
        <>
          {serviceFilter !==
            'DEVICES' &&
            serviceFilter !==
              'APPS' && (
              <View>
                <View
                  style={styles.listHeader}
                >
                  <Text
                    style={
                      styles.listTitle
                    }
                  >
                    {serviceFilter ===
                    'ALL'
                      ? 'كل الباقات'
                      : serviceFilter ===
                          'VIP'
                        ? 'باقات VIP'
                        : 'باقات IPTV'}
                  </Text>

                  <Text
                    style={
                      styles.countText
                    }
                  >
                    {
                      filteredPackages.length
                    }{' '}
                    باقة
                  </Text>
                </View>

                {filteredPackages.length ===
                0 ? (
                  <EmptyBox
                    text="ماكو باقات بهذا القسم حاليًا"
                  />
                ) : (
                  filteredPackages.map(
                    (item) =>
                      renderPackageCard(
                        item,
                      ),
                  )
                )}
              </View>
            )}

          {renderDevices()}
          {renderApps()}
        </>
      )}

      <View
        style={styles.footerSpace}
      />
    </ScrollView>
  );

  const renderSubscriptionCard = (
    subscription: Subscription,
  ) => {
    const active =
      subscription.status?.toUpperCase() ===
      'ACTIVE';

    return (
      <TouchableOpacity
        key={subscription.id}
        style={
          styles.subscriptionCard
        }
        activeOpacity={0.85}
        onPress={() =>
          setSelectedSubscription(subscription)
        }
      >
        <View
          style={
            styles.subscriptionHeader
          }
        >
          <View
            style={
              styles.subscriptionIcon
            }
          >
            <Ionicons
              name="tv-outline"
              size={25}
              color="#2563EB"
            />
          </View>

          <View
            style={
              styles.subscriptionInfo
            }
          >
            <Text
              style={
                styles.subscriptionName
              }
            >
              {subscription.packageName ||
                subscription.serviceType ||
                'اشتراك'}
            </Text>

            <View
              style={
                styles.subscriptionStatus
              }
            >
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor:
                      active
                        ? '#22C55E'
                        : '#94A3B8',
                  },
                ]}
              />

              <Text
                style={
                  styles.subscriptionStatusText
                }
              >
                {active
                  ? 'نشط'
                  : subscription.status ||
                    'غير نشط'}
              </Text>
            </View>
          </View>
        </View>

        <View
          style={
            styles.subscriptionDivider
          }
        />

        <View
          style={
            styles.subscriptionRow
          }
        >
          <Text
            style={
              styles.subscriptionValue
            }
          >
            {formatDate(
              subscription.expiryDate,
            )}
          </Text>

          <Text
            style={
              styles.subscriptionLabel
            }
          >
            تاريخ الانتهاء
          </Text>
        </View>

        {subscription.username && (
          <View
            style={
              styles.subscriptionRow
            }
          >
            <Text
              style={
                styles.subscriptionValue
              }
            >
              {subscription.username}
            </Text>

            <Text
              style={
                styles.subscriptionLabel
              }
            >
              اسم المستخدم
            </Text>
          </View>
        )}

        {subscription.macAddress && (
          <View
            style={
              styles.subscriptionRow
            }
          >
            <Text
              style={
                styles.subscriptionValue
              }
            >
              {subscription.macAddress}
            </Text>

            <Text
              style={
                styles.subscriptionLabel
              }
            >
              MAC Address
            </Text>
          </View>
        )}

        {subscription.maxConnections && (
          <View
            style={
              styles.subscriptionRow
            }
          >
            <Text
              style={
                styles.subscriptionValue
              }
            >
              {subscription.connections ||
                0}{' '}
              /{' '}
              {
                subscription.maxConnections
              }
            </Text>

            <Text
              style={
                styles.subscriptionLabel
              }
            >
              الاتصالات
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };


  const renderSubscriptionDetails = () => {
    if (!selectedSubscription) return null;

    const subscription = selectedSubscription;
    const active = subscription.status?.toUpperCase() === 'ACTIVE';

    const rows = [
      ['نوع الخدمة', subscription.serviceType || '—'],
      ['الباقة', subscription.packageName || '—'],
      ['تاريخ البداية', formatDate(subscription.startDate)],
      ['تاريخ الانتهاء', formatDate(subscription.expiryDate)],
      ['اسم المستخدم', subscription.username || '—'],
      ['كلمة المرور', subscription.password || '—'],
      ['MAC Address', subscription.macAddress || '—'],
      ['Device ID', subscription.deviceId || '—'],
      ['الاتصالات', subscription.maxConnections != null ? `${subscription.connections || 0} / ${subscription.maxConnections}` : '—'],
    ];

    return (
      <Modal
        visible={selectedSubscription !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedSubscription(null)}
      >
        <View style={styles.subscriptionModalOverlay}>
          <View style={styles.subscriptionModal}>
            <View style={styles.subscriptionModalHeader}>
              <View style={styles.subscriptionModalTitleArea}>
                <View style={styles.subscriptionModalIcon}>
                  <Ionicons name="tv-outline" size={24} color="#2563EB" />
                </View>
                <View style={styles.subscriptionModalTitleText}>
                  <Text style={styles.subscriptionModalTitle} numberOfLines={1}>
                    {subscription.packageName || subscription.serviceType || 'اشتراكي'}
                  </Text>
                  <View style={styles.subscriptionModalStatusRow}>
                    <View style={[styles.statusDot, { backgroundColor: active ? '#22C55E' : '#94A3B8' }]} />
                    <Text style={styles.subscriptionModalStatusText}>
                      {active ? 'الاشتراك نشط' : subscription.status || 'غير نشط'}
                    </Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                style={styles.subscriptionModalClose}
                onPress={() => setSelectedSubscription(null)}
              >
                <Ionicons name="close" size={23} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.subscriptionModalContent}
            >
              <View style={styles.subscriptionInfoNotice}>
                <Ionicons name="information-circle-outline" size={20} color="#2563EB" />
                <Text style={styles.subscriptionInfoNoticeText}>
                  هذه بيانات اشتراكك الحالية كما هي مسجلة في شاشتنا.
                </Text>
              </View>

              {rows.map(([label, value]) => (
                <View key={label} style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{label}</Text>
                  <Text style={styles.detailValue} selectable>{value}</Text>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.subscriptionModalDone}
              onPress={() => setSelectedSubscription(null)}
            >
              <Text style={styles.subscriptionModalDoneText}>تم</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const renderDeviceDetails = () => {
    if (!selectedDevice) {
      return null;
    }

    return (
      <Modal
        visible={selectedDevice !== null}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setSelectedDevice(null)
        }
      >
        <View style={styles.productModalOverlay}>
          <View style={styles.productModal}>
            <View style={styles.productModalHeader}>
              <View style={styles.productModalTitleArea}>
                <View style={styles.productModalIcon}>
                  {selectedDevice.imageUrl ? (
                    <Image
                      source={{
                        uri: resolveMediaUrl(
                          selectedDevice.imageUrl,
                        ),
                      }}
                      style={styles.productModalImage}
                      resizeMode="contain"
                    />
                  ) : (
                    <Ionicons
                      name="hardware-chip-outline"
                      size={24}
                      color="#0891B2"
                    />
                  )}
                </View>

                <View style={styles.productModalTitleText}>
                  <Text
                    style={styles.productModalTitle}
                    numberOfLines={2}
                  >
                    {selectedDevice.name}
                  </Text>

                  <Text style={styles.productModalSubtitle}>
                    {selectedDevice.serviceType || 'جهاز'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.productModalClose}
                onPress={() =>
                  setSelectedDevice(null)
                }
              >
                <Ionicons
                  name="close"
                  size={23}
                  color="#64748B"
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={
                styles.productModalContent
              }
            >
              {!!selectedDevice.description && (
                <View style={styles.productModalSection}>
                  <Text style={styles.productModalSectionTitle}>
                    الوصف
                  </Text>

                  <Text style={styles.productModalBody}>
                    {selectedDevice.description}
                  </Text>
                </View>
              )}

              {!!selectedDevice.specifications && (
                <View style={styles.productModalSection}>
                  <Text style={styles.productModalSectionTitle}>
                    المواصفات
                  </Text>

                  <Text style={styles.productModalBody}>
                    {selectedDevice.specifications}
                  </Text>
                </View>
              )}

              {!!selectedDevice.notes && (
                <View style={styles.productModalNotice}>
                  <Ionicons
                    name="information-circle-outline"
                    size={19}
                    color="#2563EB"
                  />

                  <Text style={styles.productModalNoticeText}>
                    {selectedDevice.notes}
                  </Text>
                </View>
              )}

              <View style={styles.productModalPriceBox}>
                <Text style={styles.productModalPriceLabel}>
                  السعر
                </Text>

                <Text style={styles.productModalPrice}>
                  {formatPrice(
                    selectedDevice.price,
                  )}{' '}
                  د.ع
                </Text>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.productModalDone}
              onPress={() =>
                setSelectedDevice(null)
              }
            >
              <Text style={styles.productModalDoneText}>
                تم
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const renderAppDetails = () => {
    if (!selectedApp) {
      return null;
    }

    const downloadUrl =
      resolveMediaUrl(
        selectedApp.downloadUrl,
      );

    return (
      <Modal
        visible={selectedApp !== null}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setSelectedApp(null)
        }
      >
        <View style={styles.productModalOverlay}>
          <View style={styles.productModal}>
            <View style={styles.productModalHeader}>
              <View style={styles.productModalTitleArea}>
                <View
                  style={[
                    styles.productModalIcon,
                    styles.greenProductIcon,
                  ]}
                >
                  {selectedApp.imageUrl ? (
                    <Image
                      source={{
                        uri: resolveMediaUrl(
                          selectedApp.imageUrl,
                        ),
                      }}
                      style={styles.productModalImage}
                      resizeMode="contain"
                    />
                  ) : (
                    <Ionicons
                      name="apps-outline"
                      size={24}
                      color="#059669"
                    />
                  )}
                </View>

                <View style={styles.productModalTitleText}>
                  <Text
                    style={styles.productModalTitle}
                    numberOfLines={2}
                  >
                    {selectedApp.name}
                  </Text>

                  <Text style={styles.productModalSubtitle}>
                    {selectedApp.platform}
                    {selectedApp.version
                      ? ` • ${selectedApp.version}`
                      : ''}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.productModalClose}
                onPress={() =>
                  setSelectedApp(null)
                }
              >
                <Ionicons
                  name="close"
                  size={23}
                  color="#64748B"
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={
                styles.productModalContent
              }
            >
              {!!selectedApp.description && (
                <View style={styles.productModalSection}>
                  <Text style={styles.productModalSectionTitle}>
                    الوصف
                  </Text>

                  <Text style={styles.productModalBody}>
                    {selectedApp.description}
                  </Text>
                </View>
              )}

              {!!selectedApp.instructions && (
                <View style={styles.productModalSection}>
                  <Text style={styles.productModalSectionTitle}>
                    طريقة الاستخدام
                  </Text>

                  <Text style={styles.productModalBody}>
                    {selectedApp.instructions}
                  </Text>
                </View>
              )}

              {!!selectedApp.notes && (
                <View style={styles.productModalNotice}>
                  <Ionicons
                    name="information-circle-outline"
                    size={19}
                    color="#2563EB"
                  />

                  <Text style={styles.productModalNoticeText}>
                    {selectedApp.notes}
                  </Text>
                </View>
              )}

              <View style={styles.productModalTechRow}>
                <View style={styles.productModalTechBox}>
                  <Text style={styles.productModalTechLabel}>
                    المنصة
                  </Text>

                  <Text style={styles.productModalTechValue}>
                    {selectedApp.platform || '—'}
                  </Text>
                </View>

                <View style={styles.productModalTechBox}>
                  <Text style={styles.productModalTechLabel}>
                    الإصدار
                  </Text>

                  <Text style={styles.productModalTechValue}>
                    {selectedApp.version || '—'}
                  </Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.productModalActions}>
              <TouchableOpacity
                style={[
                  styles.productModalDownload,
                  !downloadUrl &&
                    styles.productModalDownloadDisabled,
                ]}
                disabled={!downloadUrl}
                onPress={async () => {
                  if (!downloadUrl) {
                    return;
                  }

                  try {
                    await Linking.openURL(
                      downloadUrl,
                    );
                  } catch (err) {
                    console.log(
                      'App download open error:',
                      err,
                    );

                    Alert.alert(
                      'التطبيق',
                      'تعذر فتح رابط التحميل حاليًا.',
                    );
                  }
                }}
              >
                <Ionicons
                  name="download-outline"
                  size={19}
                  color="#FFFFFF"
                />

                <Text
                  style={
                    styles.productModalDownloadText
                  }
                >
                  {downloadUrl
                    ? 'تحميل التطبيق'
                    : 'رابط التحميل غير متوفر'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.productModalDone}
                onPress={() =>
                  setSelectedApp(null)
                }
              >
                <Text style={styles.productModalDoneText}>
                  إغلاق
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderLoginScreen = () => (
    <KeyboardAvoidingView
      style={
        styles.loginContainer
      }
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : undefined
      }
    >
      <ScrollView
        contentContainerStyle={
          styles.loginScroll
        }
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          style={
            styles.loginBackButton
          }
          onPress={() =>
            setShowLogin(false)
          }
        >
          <Ionicons
            name="arrow-forward"
            size={22}
            color="#0F172A"
          />
        </TouchableOpacity>

        <View
          style={styles.loginLogo}
        >
          <Ionicons
            name="tv-outline"
            size={42}
            color="#FFFFFF"
          />
        </View>

        <Text
          style={styles.loginTitle}
        >
          تسجيل الدخول
        </Text>

        <Text
          style={
            styles.loginSubtitle
          }
        >
          ادخل إلى حسابك في شاشتنا
        </Text>

        <View
          style={styles.inputGroup}
        >
          <Text
            style={styles.inputLabel}
          >
            رقم الهاتف
          </Text>

          <View
            style={styles.inputWrapper}
          >
            <Ionicons
              name="call-outline"
              size={19}
              color="#64748B"
            />

            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="07xxxxxxxxx"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
              autoCapitalize="none"
              textAlign="right"
            />
          </View>
        </View>

        <View
          style={styles.inputGroup}
        >
          <Text
            style={styles.inputLabel}
          >
            كلمة المرور
          </Text>

          <View
            style={styles.inputWrapper}
          >
            <Ionicons
              name="lock-closed-outline"
              size={19}
              color="#64748B"
            />

            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="كلمة المرور"
              placeholderTextColor="#94A3B8"
              secureTextEntry
              textAlign="right"
            />
          </View>
        </View>

        {!!loginError && (
          <View
            style={styles.loginError}
          >
            <Ionicons
              name="alert-circle-outline"
              size={19}
              color="#DC2626"
            />

            <Text
              style={
                styles.loginErrorText
              }
            >
              {loginError}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.loginButton,
            loginLoading &&
              styles.loginButtonDisabled,
          ]}
          onPress={handleLogin}
          disabled={loginLoading}
        >
          {loginLoading ? (
            <ActivityIndicator
              color="#FFFFFF"
            />
          ) : (
            <>
              <Text
                style={
                  styles.loginButtonText
                }
              >
                تسجيل الدخول
              </Text>

              <Ionicons
                name="arrow-back"
                size={19}
                color="#FFFFFF"
              />
            </>
          )}
        </TouchableOpacity>

        <Text
          style={
            styles.loginBottomText
          }
        >
          استخدم نفس بيانات حسابك الموجودة
          في موقع شاشتنا.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const renderAccount = () => {
    if (!user) {
      return (
        <ScrollView
          contentContainerStyle={
            styles.accountGuest
          }
        >
          <View
            style={
              styles.accountGuestIcon
            }
          >
            <Ionicons
              name="person-outline"
              size={42}
              color="#2563EB"
            />
          </View>

          <Text
            style={
              styles.accountGuestTitle
            }
          >
            حسابك في شاشتنا
          </Text>

          <Text
            style={
              styles.accountGuestText
            }
          >
            سجل الدخول حتى تشوف اشتراكاتك
            وبيانات حسابك وطلباتك.
          </Text>

          <TouchableOpacity
            style={
              styles.accountLoginButton
            }
            onPress={() =>
              setShowLogin(true)
            }
          >
            <Text
              style={
                styles.accountLoginButtonText
              }
            >
              تسجيل الدخول
            </Text>

            <Ionicons
              name="arrow-back"
              size={19}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          <View
            style={styles.accountHint}
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={20}
              color="#2563EB"
            />

            <Text
              style={
                styles.accountHintText
              }
            >
              استخدم نفس حساب موقع شاشتنا
            </Text>
          </View>
        </ScrollView>
      );
    }

    return (
      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.accountContent
        }
        refreshControl={
          <RefreshControl
            refreshing={
              loadingSubscriptions
            }
            onRefresh={() => {
              loadSubscriptions(user.id);
              loadOrders(user.id);
              loadReceipts(user.id);
            }}
            tintColor="#2563EB"
          />
        }
      >
        <View
          style={styles.profileCard}
        >
          <View
            style={styles.profileAvatar}
          >
            <Text
              style={
                styles.profileAvatarText
              }
            >
              {user.name
                ?.charAt(0)
                ?.toUpperCase() || 'ش'}
            </Text>
          </View>

          <View
            style={styles.profileInfo}
          >
            <Text
              style={styles.profileName}
            >
              {user.name}
            </Text>

            <Text
              style={styles.profilePhone}
            >
              {user.phone}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.profileSettings}
            onPress={openAccountSettings}
            activeOpacity={0.75}
          >
            <Ionicons
              name="settings-outline"
              size={21}
              color="#64748B"
            />
          </TouchableOpacity>
        </View>

        <View
          style={styles.accountSection}
        >
          <View
            style={styles.accountSectionHeader}
          >
            <Text
              style={
                styles.accountSectionTitle
              }
            >
              اشتراكاتي
            </Text>

            <Text
              style={
                styles.subscriptionCount
              }
            >
              {subscriptions.length}
            </Text>
          </View>

          {loadingSubscriptions ? (
            <LoadingBox />
          ) : subscriptions.length ===
            0 ? (
            <View
              style={
                styles.noSubscription
              }
            >
              <Ionicons
                name="tv-outline"
                size={32}
                color="#94A3B8"
              />

              <Text
                style={
                  styles.noSubscriptionText
                }
              >
                ما عندك اشتراكات حاليًا
              </Text>

              <TouchableOpacity
                style={
                  styles.browseButton
                }
                onPress={() => {
                  setServiceFilter(
                    'ALL',
                  );
                  setActiveTab(
                    'services',
                  );
                }}
              >
                <Text
                  style={
                    styles.browseButtonText
                  }
                >
                  تصفح الباقات
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            subscriptions.map(
              renderSubscriptionCard,
            )
          )}
        </View>

        <View style={styles.accountSection}>
          <View style={styles.accountSectionHeader}>
            <Text style={styles.accountSectionTitle}>إيصالاتي</Text>
            <Text style={styles.subscriptionCount}>{receipts.length}</Text>
          </View>

          {loadingReceipts ? (
            <LoadingBox />
          ) : receipts.length === 0 ? (
            <View style={styles.noSubscription}>
              <Ionicons name="document-text-outline" size={32} color="#94A3B8" />
              <Text style={styles.noSubscriptionText}>ما عندك إيصالات حاليًا</Text>
            </View>
          ) : (
            receipts.map((receipt) => (
              <View key={receipt.id} style={styles.receiptCard}>
                <View style={styles.receiptHeader}>
                  <View style={styles.receiptIcon}>
                    <Ionicons name="document-text-outline" size={21} color="#2563EB" />
                  </View>
                  <View style={styles.receiptInfo}>
                    <Text style={styles.receiptName} numberOfLines={1}>
                      {receipt.serviceName || 'إيصال شاشتنا'}
                    </Text>
                    <Text style={styles.receiptNumber}>
                      {receipt.receiptNumber ? `رقم الإيصال: ${receipt.receiptNumber}` : `رقم الإيصال: #${receipt.id}`}
                    </Text>
                  </View>
                  <View style={styles.receiptPaidBadge}>
                    <Text style={styles.receiptPaidText}>
                      {getReceiptStatusLabel(receipt.status)}
                    </Text>
                  </View>
                </View>

                <View style={styles.orderDivider} />

                <View style={styles.orderRow}>
                  <Text style={styles.orderLabel}>المبلغ</Text>
                  <Text style={styles.orderValue}>{formatPrice(Number(receipt.price || 0))}</Text>
                </View>

                {receipt.durationLabel ? (
                  <View style={styles.orderRow}>
                    <Text style={styles.orderLabel}>المدة</Text>
                    <Text style={styles.orderValue}>{receipt.durationLabel}</Text>
                  </View>
                ) : null}

                <View style={styles.orderRow}>
                  <Text style={styles.orderLabel}>التاريخ</Text>
                  <Text style={styles.orderValue}>{formatDate(receipt.createdAt)}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons
            name="log-out-outline"
            size={20}
            color="#DC2626"
          />

          <Text
            style={styles.logoutText}
          >
            تسجيل الخروج
          </Text>
        </TouchableOpacity>

        <View
          style={styles.footerSpace}
        />
      </ScrollView>
    );
  };

  const renderPlaceholder = (
    icon: keyof typeof Ionicons.glyphMap,
    title: string,
    description: string,
  ) => (
    <View
      style={
        styles.placeholderScreen
      }
    >
      <View
        style={styles.placeholderIcon}
      >
        <Ionicons
          name={icon}
          size={40}
          color="#2563EB"
        />
      </View>

      <Text
        style={styles.placeholderTitle}
      >
        {title}
      </Text>

      <Text
        style={
          styles.placeholderDescription
        }
      >
        {description}
      </Text>

      <View
        style={
          styles.comingSoonBadge
        }
      >
        <Text
          style={styles.comingSoonText}
        >
          قريبًا
        </Text>
      </View>
    </View>
  );

  const renderOrders = () => {
    if (!user) {
      return (
        <View style={styles.emptyPage}>
          <Ionicons name="receipt-outline" size={46} color="#2563EB" />
          <Text style={styles.emptyPageTitle}>سجّل دخولك أولًا</Text>
          <Text style={styles.emptyPageText}>حتى تقدر تشوف طلباتك وحالتها.</Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setShowLogin(true)}
          >
            <Text style={styles.primaryButtonText}>تسجيل الدخول</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.page}
        contentContainerStyle={styles.pageContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor="#2563EB"
          />
        }
      >
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>طلباتي</Text>
          <Text style={styles.pageSubtitle}>تابع طلبات الاشتراك والأجهزة من مكان واحد.</Text>
        </View>

        {loadingOrders ? (
          <View style={styles.ordersLoading}>
            <ActivityIndicator size="small" color="#2563EB" />
            <Text style={styles.ordersLoadingText}>جاري تحميل الطلبات...</Text>
          </View>
        ) : orders.length === 0 ? (
          <View style={styles.emptyPage}>
            <View style={styles.emptyIcon}>
              <Ionicons name="receipt-outline" size={34} color="#2563EB" />
            </View>
            <Text style={styles.emptyPageTitle}>ما عندك طلبات حاليًا</Text>
            <Text style={styles.emptyPageText}>لما تسوي طلب اشتراك أو شراء جهاز راح يظهر هنا.</Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => setActiveTab('services')}
            >
              <Text style={styles.primaryButtonText}>تصفح الخدمات</Text>
            </TouchableOpacity>
          </View>
        ) : (
          orders.map((order) => (
            <View key={order.id} style={styles.orderCard}>
              <View style={styles.orderTopRow}>
                <View style={styles.orderIcon}>
                  <Ionicons
                    name={order.requestType === 'DEVICE_PURCHASE' ? 'hardware-chip-outline' : 'receipt-outline'}
                    size={22}
                    color="#2563EB"
                  />
                </View>
                <View style={styles.orderTitleArea}>
                  <Text style={styles.orderTitle} numberOfLines={1}>
                    {order.serviceName || 'طلب شاشتنا'}
                  </Text>
                  <Text style={styles.orderType}>
                    {getRequestTypeLabel(order.requestType)}
                  </Text>
                </View>
                <View style={[styles.orderStatus, getOrderStatusStyle(order.status)]}>
                  <Text style={styles.orderStatusText}>
                    {getOrderStatusLabel(order.status)}
                  </Text>
                </View>
              </View>

              <View style={styles.orderDivider} />

              <View style={styles.orderRow}>
                <Text style={styles.orderLabel}>السعر</Text>
                <Text style={styles.orderValue}>
                  {formatPrice(Number(order.price || 0))}
                </Text>
              </View>

              {order.durationLabel ? (
                <View style={styles.orderRow}>
                  <Text style={styles.orderLabel}>المدة</Text>
                  <Text style={styles.orderValue}>{order.durationLabel}</Text>
                </View>
              ) : null}

              {order.deviceName ? (
                <View style={styles.orderRow}>
                  <Text style={styles.orderLabel}>الجهاز</Text>
                  <Text style={styles.orderValue} numberOfLines={1}>
                    {order.deviceName}
                  </Text>
                </View>
              ) : null}

              <View style={styles.orderRow}>
                <Text style={styles.orderLabel}>تاريخ الطلب</Text>
                <Text style={styles.orderValue}>{formatDate(order.createdAt)}</Text>
              </View>

              <Text style={styles.orderNumber}>رقم الطلب: #{order.id}</Text>
            </View>
          ))
        )}
      </ScrollView>
    );
  };

  const renderContent = () => {
    if (restoringUser) {
      return (
        <View style={styles.restoreScreen}>
          <View style={styles.restoreLogo}>
            <Ionicons
              name="tv-outline"
              size={34}
              color="#FFFFFF"
            />
          </View>

          <Text style={styles.restoreText}>
            جاري تحميل حسابك...
          </Text>
        </View>
      );
    }

    if (showLogin) {
      return renderLoginScreen();
    }

    switch (activeTab) {
      case 'services':
        return renderServicesPage();

      case 'orders':
        return renderOrders();

      case 'support':
        return renderSupportScreen();

      case 'account':
        return renderAccount();

      default:
        return renderHome();
    }
  };

  return (
    <SafeAreaView
      style={styles.container}
    >
      {renderSubscriptionDetails()}
      {renderDeviceDetails()}
      {renderAppDetails()}
      {renderNotifications()}
      {renderSupportTicketModals()}

      <Modal
        visible={showAccountSettings}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!settingsLoading) {
            setShowAccountSettings(false);
          }
        }}
      >
        <View style={styles.accountSettingsOverlay}>
          <KeyboardAvoidingView
            behavior={
              Platform.OS === 'ios'
                ? 'padding'
                : undefined
            }
            style={styles.accountSettingsKeyboard}
          >
            <View style={styles.accountSettingsModal}>
              <View style={styles.accountSettingsHeader}>
                <View style={styles.accountSettingsHeaderText}>
                  <Text style={styles.accountSettingsTitle}>
                    إعدادات الحساب
                  </Text>

                  <Text style={styles.accountSettingsSubtitle}>
                    عدّل بيانات حسابك من هنا
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.accountSettingsClose}
                  disabled={settingsLoading}
                  onPress={() =>
                    setShowAccountSettings(false)
                  }
                >
                  <Ionicons
                    name="close"
                    size={22}
                    color="#64748B"
                  />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={
                  styles.accountSettingsContent
                }
              >
                <View style={styles.settingsProfileIcon}>
                  <Ionicons
                    name="person-outline"
                    size={28}
                    color="#2563EB"
                  />
                </View>

                <View style={styles.settingsField}>
                  <Text style={styles.settingsLabel}>
                    الاسم
                  </Text>

                  <View style={styles.settingsInputWrapper}>
                    <Ionicons
                      name="person-outline"
                      size={18}
                      color="#64748B"
                    />

                    <TextInput
                      style={styles.settingsInput}
                      value={editName}
                      onChangeText={setEditName}
                      placeholder="اسمك"
                      placeholderTextColor="#94A3B8"
                      textAlign="right"
                      editable={!settingsLoading}
                    />
                  </View>
                </View>

                <View style={styles.settingsField}>
                  <Text style={styles.settingsLabel}>
                    رقم الهاتف
                  </Text>

                  <View
                    style={[
                      styles.settingsInputWrapper,
                      styles.settingsInputDisabled,
                    ]}
                  >
                    <Ionicons
                      name="call-outline"
                      size={18}
                      color="#94A3B8"
                    />

                    <TextInput
                      style={[
                        styles.settingsInput,
                        styles.settingsInputTextDisabled,
                      ]}
                      value={user?.phone || ''}
                      editable={false}
                      textAlign="right"
                    />
                  </View>

                  <Text style={styles.settingsHint}>
                    رقم الهاتف لا يمكن تغييره من التطبيق.
                  </Text>
                </View>

                <View style={styles.settingsDivider} />

                <Text style={styles.settingsSectionTitle}>
                  تغيير كلمة المرور
                </Text>

                <Text style={styles.settingsSectionHint}>
                  إذا ما تريد تغيرها، اترك الحقول فارغة.
                </Text>

                <View style={styles.settingsField}>
                  <Text style={styles.settingsLabel}>
                    كلمة المرور الحالية
                  </Text>

                  <View style={styles.settingsInputWrapper}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={18}
                      color="#64748B"
                    />

                    <TextInput
                      style={styles.settingsInput}
                      value={currentPassword}
                      onChangeText={setCurrentPassword}
                      placeholder="كلمة المرور الحالية"
                      placeholderTextColor="#94A3B8"
                      secureTextEntry
                      textAlign="right"
                      editable={!settingsLoading}
                    />
                  </View>
                </View>

                <View style={styles.settingsField}>
                  <Text style={styles.settingsLabel}>
                    كلمة المرور الجديدة
                  </Text>

                  <View style={styles.settingsInputWrapper}>
                    <Ionicons
                      name="lock-open-outline"
                      size={18}
                      color="#64748B"
                    />

                    <TextInput
                      style={styles.settingsInput}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      placeholder="6 أحرف على الأقل"
                      placeholderTextColor="#94A3B8"
                      secureTextEntry
                      textAlign="right"
                      editable={!settingsLoading}
                    />
                  </View>
                </View>

                <View style={styles.settingsField}>
                  <Text style={styles.settingsLabel}>
                    تأكيد كلمة المرور الجديدة
                  </Text>

                  <View style={styles.settingsInputWrapper}>
                    <Ionicons
                      name="shield-checkmark-outline"
                      size={18}
                      color="#64748B"
                    />

                    <TextInput
                      style={styles.settingsInput}
                      value={confirmNewPassword}
                      onChangeText={setConfirmNewPassword}
                      placeholder="أعد كتابة كلمة المرور"
                      placeholderTextColor="#94A3B8"
                      secureTextEntry
                      textAlign="right"
                      editable={!settingsLoading}
                    />
                  </View>
                </View>

                {!!settingsError && (
                  <View style={styles.settingsError}>
                    <Ionicons
                      name="alert-circle-outline"
                      size={19}
                      color="#DC2626"
                    />

                    <Text style={styles.settingsErrorText}>
                      {settingsError}
                    </Text>
                  </View>
                )}

                {!!settingsSuccess && (
                  <View style={styles.settingsSuccess}>
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={19}
                      color="#059669"
                    />

                    <Text style={styles.settingsSuccessText}>
                      {settingsSuccess}
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[
                    styles.settingsSaveButton,
                    settingsLoading &&
                      styles.settingsSaveButtonDisabled,
                  ]}
                  onPress={handleSaveAccountSettings}
                  disabled={settingsLoading}
                >
                  {settingsLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.settingsSaveText}>
                        حفظ التغييرات
                      </Text>

                      <Ionicons
                        name="checkmark"
                        size={19}
                        color="#FFFFFF"
                      />
                    </>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <StatusBar style="dark" />

      <View style={styles.main}>
        {renderContent()}
      </View>

      {!showLogin && (
        <View
          style={styles.bottomNav}
        >
          <BottomTab
            icon="home-outline"
            activeIcon="home"
            label="الرئيسية"
            active={
              activeTab === 'home'
            }
            onPress={() =>
              setActiveTab('home')
            }
          />

          <BottomTab
            icon="grid-outline"
            activeIcon="grid"
            label="الخدمات"
            active={
              activeTab ===
              'services'
            }
            onPress={() =>
              setActiveTab('services')
            }
          />

          <BottomTab
            icon="receipt-outline"
            activeIcon="receipt"
            label="طلباتي"
            active={
              activeTab === 'orders'
            }
            onPress={() =>
              setActiveTab('orders')
            }
          />

          <BottomTab
            icon="headset-outline"
            activeIcon="headset"
            label="الدعم"
            active={
              activeTab === 'support'
            }
            onPress={() =>
              setActiveTab('support')
            }
          />

          <BottomTab
            icon="person-outline"
            activeIcon="person"
            label="حسابي"
            active={
              activeTab ===
              'account'
            }
            onPress={() =>
              setActiveTab('account')
            }
          />
        </View>
      )}
    </SafeAreaView>
  );
}

type BottomTabProps = {
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
  label: string;
  active: boolean;
  onPress: () => void;
};

function BottomTab({
  icon,
  activeIcon,
  label,
  active,
  onPress,
}: BottomTabProps) {
  return (
    <TouchableOpacity
      style={styles.bottomTab}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons
        name={
          active
            ? activeIcon
            : icon
        }
        size={22}
        color={
          active
            ? '#2563EB'
            : '#64748B'
        }
      />

      <Text
        style={[
          styles.bottomTabText,
          active &&
            styles.bottomTabTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function LoadingBox() {
  return (
    <View
      style={styles.loadingBox}
    >
      <ActivityIndicator
        size="small"
        color="#2563EB"
      />

      <Text
        style={styles.loadingText}
      >
        جاري تحميل البيانات...
      </Text>
    </View>
  );
}

function ErrorBox({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <View
      style={styles.errorBox}
    >
      <Ionicons
        name="cloud-offline-outline"
        size={28}
        color="#64748B"
      />

      <Text
        style={styles.errorText}
      >
        {message}
      </Text>

      <TouchableOpacity
        style={styles.retryButton}
        onPress={onRetry}
      >
        <Text
          style={styles.retryText}
        >
          إعادة المحاولة
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function EmptyBox({
  text,
}: {
  text: string;
}) {
  return (
    <View
      style={styles.emptyBox}
    >
      <Ionicons
        name="cube-outline"
        size={32}
        color="#94A3B8"
      />

      <Text
        style={styles.emptyText}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  main: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 24,
  },

  servicesPageContent: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 24,
  },

  header: {
    height: 68,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    marginBottom: 12,
  },

  headerLogo: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  logoIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent:
      'center',
    marginLeft: 10,
  },

  logoText: {
    fontSize: 21,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'right',
  },

  logoSubtitle: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
    textAlign: 'right',
  },

  notificationButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent:
      'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  notificationBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    lineHeight: 11,
  },

  notificationsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.34)',
    justifyContent: 'flex-end',
  },

  notificationsSheet: {
    maxHeight: '82%',
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },

  notificationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },

  notificationsHeaderText: {
    flex: 1,
  },

  notificationsTitle: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'right',
  },

  notificationsSubtitle: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 4,
    textAlign: 'right',
  },

  notificationsClose: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },

  notificationsMarkAll: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 18,
    paddingTop: 13,
    paddingBottom: 4,
  },

  notificationsMarkAllText: {
    color: '#2563EB',
    fontSize: 11,
    fontWeight: '800',
    marginRight: 6,
  },

  notificationsContent: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 24,
  },

  notificationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 10,
  },

  notificationCardUnread: {
    borderColor: '#BFDBFE',
    backgroundColor: '#F8FBFF',
  },

  notificationIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },

  notificationIconUnread: {
    backgroundColor: '#EFF6FF',
  },

  notificationContent: {
    flex: 1,
  },

  notificationTitleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },

  notificationTitleText: {
    flex: 1,
    color: '#0F172A',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '900',
    textAlign: 'right',
  },

  notificationUnreadDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#2563EB',
    marginRight: 8,
  },

  notificationMessage: {
    color: '#475569',
    fontSize: 11,
    lineHeight: 18,
    marginTop: 5,
    textAlign: 'right',
  },

  notificationDate: {
    color: '#94A3B8',
    fontSize: 9,
    marginTop: 7,
    textAlign: 'right',
  },

  notificationsEmpty: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 50,
  },

  notificationsEmptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },

  notificationsEmptyTitle: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
  },

  notificationsEmptyText: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 300,
  },

  hero: {
    minHeight: 245,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#0F2A52',
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },

  heroGlowOne: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 100,
    backgroundColor:
      'rgba(59,130,246,0.25)',
    top: -80,
    left: -60,
  },

  heroGlowTwo: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 100,
    backgroundColor:
      'rgba(14,165,233,0.18)',
    bottom: -90,
    right: -40,
  },

  heroContent: {
    flex: 1,
    zIndex: 2,
  },

  heroBadge: {
    alignSelf:
      'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor:
      'rgba(255,255,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },

  heroBadgeText: {
    color: '#E2ECFF',
    fontSize: 11,
    fontWeight: '600',
    marginRight: 5,
  },

  heroTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    textAlign: 'right',
  },

  heroTitleAccent: {
    color: '#7DD3FC',
  },

  heroDescription: {
    color: '#CBD5E1',
    fontSize: 12,
    lineHeight: 19,
    marginTop: 9,
    textAlign: 'right',
  },

  heroButton: {
    alignSelf:
      'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor:
      '#FFFFFF',
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 13,
    marginTop: 17,
  },

  heroButtonText: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 8,
  },

  heroTv: {
    width: 105,
    height: 125,
    alignItems:
      'center',
    justifyContent:
      'center',
    marginRight: 8,
  },

  heroTvGlow: {
    position: 'absolute',
    width: 55,
    height: 55,
    borderRadius: 30,
    backgroundColor:
      'rgba(96,165,250,0.35)',
    alignItems:
      'center',
    justifyContent:
      'center',
  },

  section: {
    marginBottom: 27,
  },

  page: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  pageContent: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 32,
  },

  supportPageContent: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 36,
  },

  pageHeader: {
    marginBottom: 18,
  },

  pageTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'right',
  },

  pageSubtitle: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 20,
    color: '#64748B',
    textAlign: 'right',
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems: 'center',
    marginBottom: 13,
  },

  sectionTitle: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'right',
  },

  sectionSubtitle: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 3,
    textAlign: 'right',
  },

  seeAll: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '700',
  },

  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent:
      'space-between',
  },

  serviceCard: {
    width: '48%',
    backgroundColor:
      '#FFFFFF',
    borderRadius: 20,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor:
      '#E2E8F0',
  },

  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems:
      'center',
    justifyContent:
      'center',
    marginBottom: 11,
  },

  blueIcon: {
    backgroundColor:
      '#EFF6FF',
  },

  purpleIcon: {
    backgroundColor:
      '#F5F3FF',
  },

  cyanIcon: {
    backgroundColor:
      '#ECFEFF',
  },

  greenIcon: {
    backgroundColor:
      '#ECFDF5',
  },

  serviceTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'right',
  },

  serviceDescription: {
    color: '#64748B',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
    textAlign: 'right',
  },

  loadingBox: {
    minHeight: 105,
    backgroundColor:
      '#FFFFFF',
    borderRadius: 20,
    alignItems:
      'center',
    justifyContent:
      'center',
    borderWidth: 1,
    borderColor:
      '#E2E8F0',
  },

  loadingText: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 9,
  },

  errorBox: {
    backgroundColor:
      '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    alignItems:
      'center',
    borderWidth: 1,
    borderColor:
      '#E2E8F0',
  },

  errorText: {
    color: '#475569',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },

  retryButton: {
    backgroundColor:
      '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
    marginTop: 12,
  },

  retryText: {
    color: '#2563EB',
    fontSize: 11,
    fontWeight: '700',
  },

  emptyBox: {
    backgroundColor:
      '#FFFFFF',
    borderRadius: 20,
    padding: 25,
    alignItems:
      'center',
    borderWidth: 1,
    borderColor:
      '#E2E8F0',
    marginBottom: 10,
  },

  emptyText: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },

  packageCard: {
    backgroundColor:
      '#FFFFFF',
    borderRadius: 21,
    padding: 16,
    marginBottom: 11,
    borderWidth: 1,
    borderColor:
      '#E2E8F0',
  },

  packageTop: {
    flexDirection: 'row',
    alignItems:
      'center',
  },

  packageIcon: {
    width: 47,
    height: 47,
    borderRadius: 15,
    backgroundColor:
      '#EFF6FF',
    alignItems:
      'center',
    justifyContent:
      'center',
    marginLeft: 11,
  },

  packageInfo: {
    flex: 1,
  },

  packageName: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'right',
  },

  packageDuration: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 4,
    textAlign: 'right',
  },

  packagePrice: {
    alignItems:
      'flex-end',
  },

  priceNumber: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '800',
  },

  priceLabel: {
    color: '#94A3B8',
    fontSize: 9,
    marginTop: 2,
  },

  packageDescription: {
    color: '#64748B',
    fontSize: 10,
    lineHeight: 16,
    marginTop: 12,
    textAlign: 'right',
  },

  packageBottom: {
    flexDirection: 'row',
    alignItems:
      'center',
    justifyContent:
      'space-between',
    marginTop: 13,
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor:
      '#F1F5F9',
  },

  packageService: {
    flexDirection: 'row',
    alignItems:
      'center',
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor:
      '#22C55E',
    marginLeft: 5,
  },

  packageServiceText: {
    color: '#64748B',
    fontSize: 10,
  },

  detailsButton: {
    flexDirection: 'row',
    alignItems:
      'center',
  },

  detailsText: {
    color: '#2563EB',
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 5,
  },

  productCard: {
    backgroundColor:
      '#FFFFFF',
    borderRadius: 21,
    padding: 16,
    marginBottom: 11,
    borderWidth: 1,
    borderColor:
      '#E2E8F0',
    flexDirection: 'row',
    alignItems:
      'center',
  },

  productIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    backgroundColor:
      '#ECFEFF',
    alignItems:
      'center',
    justifyContent:
      'center',
    marginLeft: 12,
  },

  greenProductIcon: {
    backgroundColor:
      '#ECFDF5',
  },

  productInfo: {
    flex: 1,
  },

  productName: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'right',
  },

  productDescription: {
    color: '#64748B',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 4,
    textAlign: 'right',
  },

  productPrice: {
    color: '#0891B2',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 6,
    textAlign: 'right',
  },

  platformText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 6,
    textAlign: 'right',
  },

  productImage: {
    width: 42,
    height: 42,
    borderRadius: 12,
  },

  productModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },

  productModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '88%',
    paddingTop: 18,
    paddingHorizontal: 18,
    paddingBottom: 18,
  },

  productModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },

  productModalTitleArea: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  productModalIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    backgroundColor: '#ECFEFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 11,
  },

  productModalImage: {
    width: 42,
    height: 42,
    borderRadius: 13,
  },

  productModalTitleText: {
    flex: 1,
  },

  productModalTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'right',
  },

  productModalSubtitle: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 5,
    textAlign: 'right',
  },

  productModalClose: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  productModalContent: {
    paddingTop: 14,
    paddingBottom: 10,
  },

  productModalSection: {
    marginBottom: 16,
  },

  productModalSectionTitle: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'right',
    marginBottom: 7,
  },

  productModalBody: {
    color: '#475569',
    fontSize: 11,
    lineHeight: 19,
    textAlign: 'right',
  },

  productModalNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
  },

  productModalNoticeText: {
    flex: 1,
    color: '#475569',
    fontSize: 10,
    lineHeight: 17,
    textAlign: 'right',
    marginRight: 8,
  },

  productModalPriceBox: {
    backgroundColor: '#ECFEFF',
    borderRadius: 17,
    padding: 14,
    alignItems: 'center',
    marginBottom: 4,
  },

  productModalPriceLabel: {
    color: '#64748B',
    fontSize: 10,
    marginBottom: 4,
  },

  productModalPrice: {
    color: '#0891B2',
    fontSize: 19,
    fontWeight: '900',
  },

  productModalTechRow: {
    flexDirection: 'row',
    marginTop: 2,
    marginBottom: 8,
  },

  productModalTechBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 15,
    padding: 12,
    marginLeft: 6,
  },

  productModalTechBoxLast: {
    marginLeft: 0,
  },

  productModalTechLabel: {
    color: '#94A3B8',
    fontSize: 9,
    textAlign: 'right',
    marginBottom: 5,
  },

  productModalTechValue: {
    color: '#1E293B',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'right',
  },

  productModalActions: {
    gap: 9,
  },

  productModalDownload: {
    height: 50,
    borderRadius: 15,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },

  productModalDownloadDisabled: {
    backgroundColor: '#94A3B8',
  },

  productModalDownloadText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 7,
  },

  productModalDone: {
    height: 48,
    borderRadius: 15,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },

  productModalDoneText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  servicesPageHeader: {
    marginBottom: 17,
  },

  servicesPageTitle: {
    color: '#0F172A',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'right',
  },

  servicesPageSubtitle: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
  },

  filtersRow: {
    paddingBottom: 18,
    flexDirection: 'row',
  },

  filterButton: {
    height: 42,
    paddingHorizontal: 15,
    borderRadius: 14,
    backgroundColor:
      '#FFFFFF',
    borderWidth: 1,
    borderColor:
      '#E2E8F0',
    flexDirection: 'row',
    alignItems:
      'center',
    marginLeft: 8,
  },

  filterButtonActive: {
    backgroundColor:
      '#2563EB',
    borderColor:
      '#2563EB',
  },

  filterText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    marginRight: 6,
  },

  filterTextActive: {
    color: '#FFFFFF',
  },

  listHeader: {
    flexDirection: 'row',
    alignItems:
      'center',
    justifyContent:
      'space-between',
    marginBottom: 12,
  },

  listTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'right',
  },

  countText: {
    color: '#64748B',
    fontSize: 10,
  },

  supportStatusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    marginBottom: 16,
  },

  supportStatusIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },

  supportStatusContent: {
    flex: 1,
  },

  supportStatusTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },

  supportStatusTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'right',
  },

  supportOnlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: '#ECFDF5',
  },

  supportOnlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
    marginLeft: 5,
  },

  supportOnlineText: {
    color: '#16A34A',
    fontSize: 9,
    fontWeight: '800',
  },

  supportStatusText: {
    color: '#64748B',
    fontSize: 10,
    lineHeight: 17,
    marginTop: 5,
    textAlign: 'right',
  },

  supportSection: {
    marginBottom: 16,
  },

  supportSectionTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'right',
  },

  supportSectionHint: {
    color: '#64748B',
    fontSize: 10,
    lineHeight: 16,
    marginTop: 3,
    textAlign: 'right',
  },

  supportCategoryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },

  supportCategoryCard: {
    width: '31.5%',
    minHeight: 102,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },

  supportCategoryCardActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },

  supportCategoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 9,
  },

  supportCategoryIconActive: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },

  supportCategoryText: {
    color: '#0F172A',
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
  },

  supportCategoryTextActive: {
    color: '#FFFFFF',
  },

  supportContactCard: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    borderRadius: 24,
    padding: 17,
    marginBottom: 16,
  },

  supportContactGlow: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 70,
    backgroundColor: 'rgba(37,99,235,0.32)',
    top: -70,
    left: -40,
  },

  supportContactTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  supportContactIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },

  supportContactContent: {
    flex: 1,
  },

  supportContactTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'right',
  },

  supportContactText: {
    color: '#CBD5E1',
    fontSize: 10,
    lineHeight: 17,
    marginTop: 4,
    textAlign: 'right',
  },

  supportContactButton: {
    marginTop: 14,
    minHeight: 45,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  supportContactButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 8,
  },

  supportAccountCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 18,
  },

  supportAccountIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 11,
  },

  supportAccountContent: {
    flex: 1,
  },

  supportAccountTitle: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'right',
  },

  supportAccountText: {
    color: '#64748B',
    fontSize: 10,
    lineHeight: 16,
    marginTop: 3,
    textAlign: 'right',
  },

  supportLoginSmallButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 11,
    marginLeft: 8,
  },

  supportLoginSmallButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },



  supportTicketsSection: {
    marginBottom: 18,
  },

  supportTicketsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  supportTicketsHeaderText: {
    flex: 1,
    paddingRight: 10,
  },

  supportNewTicketButton: {
    backgroundColor: '#2563EB',
    borderRadius: 13,
    minHeight: 40,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  supportNewTicketButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 5,
  },

  supportTicketsLoginBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },

  supportTicketsLoginText: {
    flex: 1,
    color: '#475569',
    fontSize: 10,
    lineHeight: 17,
    textAlign: 'right',
    marginLeft: 10,
  },

  supportTicketsEmpty: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
    alignItems: 'center',
  },

  supportTicketsEmptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  supportTicketsEmptyTitle: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },

  supportTicketsEmptyText: {
    color: '#64748B',
    fontSize: 10,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 5,
  },

  supportTicketListCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 13,
    marginBottom: 9,
    flexDirection: 'row',
    alignItems: 'center',
  },

  supportTicketListIcon: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },

  supportTicketListContent: {
    flex: 1,
  },

  supportTicketListTopRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 7,
  },

  supportTicketListTitle: {
    flex: 1,
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'right',
  },

  supportTicketListPreview: {
    color: '#64748B',
    fontSize: 10,
    lineHeight: 16,
    marginTop: 5,
    textAlign: 'right',
  },

  supportTicketListDate: {
    color: '#94A3B8',
    fontSize: 8,
    marginTop: 5,
    textAlign: 'right',
  },

  supportTicketStatusBadge: {
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },

  supportTicketStatusOpen: {
    backgroundColor: '#EFF6FF',
  },

  supportTicketStatusProgress: {
    backgroundColor: '#FEF3C7',
  },

  supportTicketStatusClosed: {
    backgroundColor: '#F1F5F9',
  },

  supportTicketStatusText: {
    color: '#475569',
    fontSize: 8,
    fontWeight: '800',
  },

  supportTicketOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.38)',
    justifyContent: 'flex-end',
  },

  supportTicketKeyboard: {
    width: '100%',
  },

  supportTicketModal: {
    maxHeight: '88%',
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },

  supportTicketHeader: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 13,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  supportTicketHeaderText: {
    flex: 1,
    paddingRight: 8,
  },

  supportTicketTitle: {
    color: '#0F172A',
    fontSize: 19,
    lineHeight: 25,
    fontWeight: '900',
    textAlign: 'right',
  },

  supportTicketSubtitle: {
    color: '#64748B',
    fontSize: 10,
    lineHeight: 17,
    marginTop: 4,
    textAlign: 'right',
  },

  supportTicketClose: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },

  supportTicketContent: {
    padding: 18,
    paddingBottom: 32,
  },

  supportConversationContent: {
    padding: 18,
    paddingBottom: 30,
  },

  supportTicketLabel: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'right',
    marginBottom: 7,
    marginTop: 5,
  },

  supportTicketInput: {
    minHeight: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 15,
    paddingHorizontal: 13,
    paddingVertical: 11,
    color: '#0F172A',
    fontSize: 11,
    marginBottom: 13,
  },

  supportTicketTextArea: {
    minHeight: 120,
  },

  supportTicketCategoryNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    padding: 11,
    marginBottom: 13,
  },

  supportTicketCategoryNoticeText: {
    flex: 1,
    color: '#475569',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'right',
    marginLeft: 8,
  },

  supportTicketError: {
    color: '#DC2626',
    fontSize: 10,
    lineHeight: 16,
    textAlign: 'right',
    marginBottom: 10,
  },

  supportTicketSuccess: {
    color: '#16A34A',
    fontSize: 10,
    lineHeight: 16,
    textAlign: 'right',
    marginBottom: 10,
  },

  supportTicketPrimaryButton: {
    minHeight: 48,
    borderRadius: 15,
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  supportTicketPrimaryText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 7,
  },

  supportTicketButtonDisabled: {
    opacity: 0.65,
  },

  supportTicketSecondaryButton: {
    minHeight: 46,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FECACA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 9,
  },

  supportTicketSecondaryText: {
    color: '#DC2626',
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 6,
  },

  supportTicketStatusRow: {
    marginTop: 8,
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },

  supportTicketMeta: {
    color: '#94A3B8',
    fontSize: 8,
    marginRight: 8,
  },

  supportMessageBubble: {
    borderRadius: 17,
    padding: 13,
    marginBottom: 10,
    borderWidth: 1,
  },

  supportMessageCustomer: {
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
    marginRight: 18,
  },

  supportMessageAdmin: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    marginLeft: 18,
  },

  supportMessageHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },

  supportMessageSender: {
    color: '#0F172A',
    fontSize: 9,
    fontWeight: '800',
  },

  supportMessageDate: {
    color: '#94A3B8',
    fontSize: 8,
  },

  supportMessageText: {
    color: '#334155',
    fontSize: 10,
    lineHeight: 18,
    textAlign: 'right',
  },

  supportTicketClosedNotice: {
    backgroundColor: '#F1F5F9',
    borderRadius: 15,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },

  supportTicketClosedText: {
    flex: 1,
    color: '#64748B',
    fontSize: 10,
    lineHeight: 17,
    textAlign: 'right',
    marginLeft: 8,
  },

  supportFaqSection: {
    marginBottom: 14,
  },

  supportFaqHeader: {
    marginBottom: 9,
  },

  supportFaqItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 9,
    overflow: 'hidden',
  },

  supportFaqButton: {
    minHeight: 62,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  supportFaqIcon: {
    width: 37,
    height: 37,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },

  supportFaqQuestion: {
    flex: 1,
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'right',
  },

  supportFaqAnswer: {
    color: '#64748B',
    fontSize: 10,
    lineHeight: 18,
    textAlign: 'right',
    paddingHorizontal: 13,
    paddingBottom: 13,
  },

  supportNote: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 2,
  },

  supportNoteText: {
    flex: 1,
    color: '#475569',
    fontSize: 9,
    lineHeight: 16,
    textAlign: 'right',
    marginLeft: 9,
  },

  supportCard: {
    backgroundColor:
      '#EFF6FF',
    borderRadius: 22,
    padding: 15,
    flexDirection: 'row',
    alignItems:
      'center',
    borderWidth: 1,
    borderColor:
      '#DBEAFE',
  },

  supportIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor:
      '#2563EB',
    alignItems:
      'center',
    justifyContent:
      'center',
    marginLeft: 11,
  },

  supportContent: {
    flex: 1,
  },

  supportTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'right',
  },

  supportText: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 3,
    textAlign: 'right',
  },

  supportButton: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor:
      '#FFFFFF',
    alignItems:
      'center',
    justifyContent:
      'center',
  },

  footerSpace: {
    height: 25,
  },

  bottomNav: {
    height: 73,
    backgroundColor:
      '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor:
      '#E2E8F0',
    flexDirection: 'row',
    alignItems:
      'center',
    justifyContent:
      'space-around',
    paddingHorizontal: 7,
  },

  bottomTab: {
    flex: 1,
    height: 60,
    alignItems:
      'center',
    justifyContent:
      'center',
  },

  bottomTabText: {
    color: '#64748B',
    fontSize: 8,
    marginTop: 5,
    fontWeight: '600',
  },

  bottomTabTextActive: {
    color: '#2563EB',
    fontWeight: '800',
  },

  placeholderScreen: {
    flex: 1,
    alignItems:
      'center',
    justifyContent:
      'center',
    paddingHorizontal: 35,
  },

  placeholderIcon: {
    width: 85,
    height: 85,
    borderRadius: 28,
    backgroundColor:
      '#EFF6FF',
    alignItems:
      'center',
    justifyContent:
      'center',
    marginBottom: 18,
  },

  emptyPage: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 28,
    alignItems: 'center',
    marginTop: 12,
  },

  emptyIcon: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  emptyPageTitle: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },

  emptyPageText: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 300,
  },

  primaryButton: {
    backgroundColor: '#2563EB',
    borderRadius: 14,
    paddingHorizontal: 22,
    paddingVertical: 12,
    marginTop: 18,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  ordersLoading: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 24,
    alignItems: 'center',
    marginTop: 12,
  },

  ordersLoadingText: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 10,
  },

  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginTop: 12,
  },

  orderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  orderIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  orderTitleArea: {
    flex: 1,
    marginHorizontal: 11,
  },

  orderTitle: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
  },

  orderType: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 4,
  },

  orderStatus: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 10,
  },

  orderStatusPending: {
    backgroundColor: '#FFF7ED',
  },

  orderStatusInfo: {
    backgroundColor: '#EFF6FF',
  },

  orderStatusSuccess: {
    backgroundColor: '#ECFDF5',
  },

  orderStatusCancelled: {
    backgroundColor: '#FEF2F2',
  },

  orderStatusText: {
    color: '#475569',
    fontSize: 9,
    fontWeight: '800',
  },

  orderDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 13,
  },

  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },

  orderLabel: {
    color: '#94A3B8',
    fontSize: 10,
  },

  orderValue: {
    color: '#334155',
    fontSize: 10,
    fontWeight: '700',
    maxWidth: '65%',
    textAlign: 'left',
  },

  orderNumber: {
    color: '#CBD5E1',
    fontSize: 9,
    marginTop: 10,
    textAlign: 'left',
  },

  placeholderTitle: {
    color: '#0F172A',
    fontSize: 24,
    fontWeight: '800',
  },

  placeholderDescription: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
  },

  comingSoonBadge: {
    marginTop: 18,
    backgroundColor:
      '#EFF6FF',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
  },

  comingSoonText: {
    color: '#2563EB',
    fontSize: 11,
    fontWeight: '800',
  },

  loginContainer: {
    flex: 1,
    backgroundColor:
      '#F8FAFC',
  },

  loginScroll: {
    flexGrow: 1,
    paddingHorizontal: 25,
    paddingTop: 20,
    paddingBottom: 35,
    justifyContent:
      'center',
  },

  loginBackButton: {
    position: 'absolute',
    top: 18,
    right: 22,
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor:
      '#FFFFFF',
    borderWidth: 1,
    borderColor:
      '#E2E8F0',
    alignItems:
      'center',
    justifyContent:
      'center',
  },

  loginLogo: {
    width: 82,
    height: 82,
    borderRadius: 27,
    backgroundColor:
      '#2563EB',
    alignItems:
      'center',
    justifyContent:
      'center',
    alignSelf:
      'center',
    marginBottom: 20,
  },

  loginTitle: {
    color: '#0F172A',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
  },

  loginSubtitle: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 30,
  },

  inputGroup: {
    marginBottom: 16,
  },

  inputLabel: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: 7,
  },

  inputWrapper: {
    height: 54,
    backgroundColor:
      '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor:
      '#E2E8F0',
    flexDirection: 'row',
    alignItems:
      'center',
    paddingHorizontal: 15,
  },

  input: {
    flex: 1,
    height: '100%',
    color: '#0F172A',
    fontSize: 13,
    marginRight: 10,
  },

  loginError: {
    backgroundColor:
      '#FEF2F2',
    borderWidth: 1,
    borderColor:
      '#FECACA',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems:
      'center',
    marginBottom: 15,
  },

  loginErrorText: {
    flex: 1,
    color: '#B91C1C',
    fontSize: 11,
    lineHeight: 17,
    marginRight: 8,
    textAlign: 'right',
  },

  loginButton: {
    height: 55,
    borderRadius: 16,
    backgroundColor:
      '#2563EB',
    alignItems:
      'center',
    justifyContent:
      'center',
    flexDirection: 'row',
    marginTop: 4,
  },

  loginButtonDisabled: {
    opacity: 0.7,
  },

  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    marginLeft: 9,
  },

  loginBottomText: {
    color: '#94A3B8',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 18,
    lineHeight: 17,
  },

  accountGuest: {
    flexGrow: 1,
    alignItems:
      'center',
    justifyContent:
      'center',
    paddingHorizontal: 28,
    paddingBottom: 40,
  },

  accountGuestIcon: {
    width: 90,
    height: 90,
    borderRadius: 30,
    backgroundColor:
      '#EFF6FF',
    alignItems:
      'center',
    justifyContent:
      'center',
    marginBottom: 20,
  },

  accountGuestTitle: {
    color: '#0F172A',
    fontSize: 24,
    fontWeight: '800',
  },

  accountGuestText: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 9,
    maxWidth: 290,
  },

  accountLoginButton: {
    height: 53,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor:
      '#2563EB',
    flexDirection: 'row',
    alignItems:
      'center',
    justifyContent:
      'center',
    marginTop: 23,
  },

  accountLoginButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 8,
  },

  accountHint: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems:
      'center',
  },

  accountHintText: {
    color: '#64748B',
    fontSize: 10,
    marginRight: 6,
  },

  accountContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 30,
  },

  profileCard: {
    backgroundColor:
      '#FFFFFF',
    borderRadius: 23,
    padding: 17,
    flexDirection: 'row',
    alignItems:
      'center',
    borderWidth: 1,
    borderColor:
      '#E2E8F0',
    marginBottom: 22,
  },

  profileAvatar: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor:
      '#2563EB',
    alignItems:
      'center',
    justifyContent:
      'center',
    marginLeft: 12,
  },

  profileAvatarText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },

  profileInfo: {
    flex: 1,
  },

  profileName: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'right',
  },

  profilePhone: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 4,
    textAlign: 'right',
  },

  profileSettings: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor:
      '#F8FAFC',
    alignItems:
      'center',
    justifyContent:
      'center',
  },

  accountSettingsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },

  accountSettingsKeyboard: {
    width: '100%',
    maxHeight: '92%',
  },

  accountSettingsModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 18,
    paddingHorizontal: 18,
    paddingBottom: 18,
  },

  accountSettingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },

  accountSettingsHeaderText: {
    flex: 1,
  },

  accountSettingsTitle: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'right',
  },

  accountSettingsSubtitle: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 4,
    textAlign: 'right',
  },

  accountSettingsClose: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  accountSettingsContent: {
    paddingTop: 17,
    paddingBottom: 10,
  },

  settingsProfileIcon: {
    width: 62,
    height: 62,
    borderRadius: 21,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 18,
  },

  settingsField: {
    marginBottom: 14,
  },

  settingsLabel: {
    color: '#334155',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: 7,
  },

  settingsInputWrapper: {
    height: 52,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },

  settingsInput: {
    flex: 1,
    height: '100%',
    color: '#0F172A',
    fontSize: 12,
    marginRight: 9,
  },

  settingsInputDisabled: {
    backgroundColor: '#F8FAFC',
  },

  settingsInputTextDisabled: {
    color: '#94A3B8',
  },

  settingsHint: {
    color: '#94A3B8',
    fontSize: 9,
    marginTop: 5,
    textAlign: 'right',
  },

  settingsDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 8,
  },

  settingsSectionTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'right',
    marginBottom: 3,
  },

  settingsSectionHint: {
    color: '#94A3B8',
    fontSize: 9,
    textAlign: 'right',
    marginBottom: 13,
  },

  settingsError: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 13,
    padding: 11,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  settingsErrorText: {
    flex: 1,
    color: '#B91C1C',
    fontSize: 10,
    lineHeight: 16,
    marginRight: 7,
    textAlign: 'right',
  },

  settingsSuccess: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 13,
    padding: 11,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  settingsSuccessText: {
    flex: 1,
    color: '#047857',
    fontSize: 10,
    lineHeight: 16,
    marginRight: 7,
    textAlign: 'right',
  },

  settingsSaveButton: {
    height: 52,
    borderRadius: 15,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 3,
  },

  settingsSaveButtonDisabled: {
    opacity: 0.7,
  },

  settingsSaveText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 8,
  },

  accountSection: {
    marginBottom: 20,
  },

  accountSectionHeader: {
    flexDirection: 'row',
    alignItems:
      'center',
    justifyContent:
      'space-between',
    marginBottom: 12,
  },

  accountSectionTitle: {
    color: '#0F172A',
    fontSize: 19,
    fontWeight: '800',
    textAlign: 'right',
  },

  subscriptionCount: {
    minWidth: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor:
      '#EFF6FF',
    color: '#2563EB',
    textAlign: 'center',
    textAlignVertical:
      'center',
    fontSize: 11,
    fontWeight: '800',
    paddingTop: 5,
  },

  subscriptionCard: {
    backgroundColor:
      '#FFFFFF',
    borderRadius: 21,
    padding: 16,
    borderWidth: 1,
    borderColor:
      '#E2E8F0',
    marginBottom: 11,
  },

  subscriptionHeader: {
    flexDirection: 'row',
    alignItems:
      'center',
  },

  subscriptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor:
      '#EFF6FF',
    alignItems:
      'center',
    justifyContent:
      'center',
    marginLeft: 11,
  },

  subscriptionInfo: {
    flex: 1,
  },

  subscriptionName: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'right',
  },

  subscriptionStatus: {
    flexDirection: 'row',
    alignItems:
      'center',
    marginTop: 5,
  },

  subscriptionStatusText: {
    color: '#64748B',
    fontSize: 10,
    marginRight: 4,
  },

  subscriptionDivider: {
    height: 1,
    backgroundColor:
      '#F1F5F9',
    marginVertical: 13,
  },

  subscriptionRow: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems:
      'center',
    paddingVertical: 5,
  },

  subscriptionLabel: {
    color: '#94A3B8',
    fontSize: 10,
  },

  subscriptionValue: {
    color: '#334155',
    fontSize: 10,
    fontWeight: '700',
    maxWidth: '65%',
    textAlign: 'left',
  },


  subscriptionModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },

  subscriptionModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '88%',
    paddingTop: 18,
    paddingHorizontal: 18,
    paddingBottom: 18,
  },

  subscriptionModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },

  subscriptionModalTitleArea: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  subscriptionModalIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 11,
  },

  subscriptionModalTitleText: {
    flex: 1,
  },

  subscriptionModalTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'right',
  },

  subscriptionModalStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },

  subscriptionModalStatusText: {
    color: '#64748B',
    fontSize: 11,
    marginRight: 5,
  },

  subscriptionModalClose: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  subscriptionModalContent: {
    paddingTop: 14,
    paddingBottom: 10,
  },

  subscriptionInfoNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },

  subscriptionInfoNoticeText: {
    flex: 1,
    color: '#475569',
    fontSize: 11,
    lineHeight: 18,
    textAlign: 'right',
    marginRight: 8,
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },

  detailLabel: {
    color: '#94A3B8',
    fontSize: 11,
    marginLeft: 14,
  },

  detailValue: {
    flex: 1,
    color: '#1E293B',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'left',
  },

  subscriptionModalDone: {
    height: 48,
    borderRadius: 15,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },

  subscriptionModalDoneText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  noSubscription: {
    backgroundColor:
      '#FFFFFF',
    borderRadius: 21,
    borderWidth: 1,
    borderColor:
      '#E2E8F0',
    padding: 28,
    alignItems:
      'center',
  },

  noSubscriptionText: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 9,
  },

  browseButton: {
    backgroundColor:
      '#EFF6FF',
    paddingHorizontal: 17,
    paddingVertical: 9,
    borderRadius: 12,
    marginTop: 13,
  },

  browseButtonText: {
    color: '#2563EB',
    fontSize: 11,
    fontWeight: '800',
  },

  receiptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 11,
  },

  receiptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  receiptIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  receiptInfo: {
    flex: 1,
    marginHorizontal: 11,
  },

  receiptName: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'right',
  },

  receiptNumber: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 4,
    textAlign: 'right',
  },

  receiptPaidBadge: {
    backgroundColor: '#ECFDF5',
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  receiptPaidText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '800',
  },

  logoutButton: {
    height: 52,
    borderRadius: 16,
    backgroundColor:
      '#FEF2F2',
    borderWidth: 1,
    borderColor:
      '#FECACA',
    alignItems:
      'center',
    justifyContent:
      'center',
    flexDirection: 'row',
  },

  logoutText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '800',
    marginRight: 7,
  },
  restoreScreen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  restoreLogo: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  restoreText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },

});