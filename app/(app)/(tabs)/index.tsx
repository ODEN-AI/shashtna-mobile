import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Catalog } from '@/src/api/types';
import { useAuth } from '@/src/auth/AuthProvider';
import { ContactCard, NoSubscription, OfferHighlight, OrderMini, PointsBar, QuickServices, SubscriptionAlert } from '@/src/features/home/HomeSections';
import { IncidentBanner } from '@/src/features/IncidentBanner';
import { PushPrompt } from '@/src/features/PushPrompt';
import { optionsOf, priceOf } from '@/src/lib/catalog';
import { firstName, formatPrice } from '@/src/lib/format';
import { useCatalog, useDashboard, useHelp, useLoyalty, useServiceStatus } from '@/src/query/hooks';
import { BrandMark } from '@/src/ui/BrandMark';
import { Button } from '@/src/ui/Button';
import { Heading, Panel, Pill, Tile, type MIcon } from '@/src/ui/Kit';
import { QueryBoundary } from '@/src/ui/QueryBoundary';
import { Screen } from '@/src/ui/Screen';
import { Notice } from '@/src/ui/States';
import { Text } from '@/src/ui/Text';
import { colors, hitSlop, radius, rgba, space } from '@/src/ui/theme';

/** «الرئيسية» (Stitch home dashboard): greeting, points, the subscription dial, the open order, services, offers, contact. */
export default function HomeScreen() {
  const { status } = useAuth();
  return status === 'signedIn' ? <CustomerHome /> : <GuestHome />;
}

function TopBar({ vip, unread, guest }: { vip?: boolean; unread?: number; guest?: boolean }) {
  return (
    <View style={styles.topBar}>
      <View style={styles.row}>
        <BrandMark size={32} />
        <Text variant="heading" weight="bold">
          شاشتنا
        </Text>
      </View>
      <View style={styles.row}>
        {vip ? <Pill label="VIP" icon="stars" color={colors.goldLight} background={rgba(colors.amberDeep, 0.2)} style={styles.vipChip} /> : null}
        {guest ? (
          <Button title="دخول" variant="glass" compact icon="person" onPress={() => router.push('/login')} testID="guest-login-top" />
        ) : (
          <Pressable
            onPress={() => router.push('/notifications')}
            hitSlop={hitSlop}
            accessibilityRole="button"
            accessibilityLabel={unread ? `التنبيهات، ${unread} جديدة` : 'التنبيهات'}
            style={styles.bell}
            testID="home-bell"
          >
            <MaterialIcons name="notifications" size={22} color={colors.ink2} />
            {unread ? <View style={styles.bellDot} /> : null}
          </Pressable>
        )}
      </View>
    </View>
  );
}

// ----------------------------------------------------------------- customer

function CustomerHome() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  // Arriving from checkout: /?order=<id>&created=1 (same as the website).
  const params = useLocalSearchParams<{ order?: string; created?: string }>();
  const highlight = Number(params.order) || null;
  const query = useDashboard(highlight);
  const catalog = useCatalog();
  const help = useHelp();
  const loyalty = useLoyalty();
  const justCreated = Boolean(highlight) && params.created === '1' && query.data?.currentOrder?.id === highlight;

  const refresh = () => {
    void query.refetch();
    void loyalty.refetch();
    void catalog.refetch();
  };

  return (
    <Screen edges={[]} tabBar contentStyle={[styles.content, { paddingTop: insets.top + space.sm }]} refreshing={query.isRefetching} onRefresh={refresh}>
      <TopBar vip={query.data?.primarySubscription?.serviceType === 'VIP'} unread={query.data?.unreadNotifications} />

      <QueryBoundary query={query} rows={3} variant="hero">
        {(data) => {
          const sub = data.primarySubscription;
          const order = data.currentOrder?.isOpen ? data.currentOrder : null;
          const name = firstName(data.user.name || user?.name || '');

          return (
            <>
              <Text variant="title" weight="bold" testID="home-greeting">
                يا هلا بيك{name ? `، ${name}` : ''} 👋
              </Text>

              {justCreated ? (
                <Notice tone="success" icon="checkmark-circle">
                  {order?.needsPayment ? 'وصلنا طلبك. الخطوة الجاية: حوّل المبلغ وارفع صورة الحوالة.' : 'وصلنا طلبك. تكدر تتابعه من هنا.'}
                </Notice>
              ) : null}

              <PointsBar loyalty={loyalty.data} />

              {data.incidents.length ? <IncidentBanner incidents={data.incidents} /> : null}

              {sub ? <SubscriptionAlert subscription={sub} /> : <NoSubscription pending={Boolean(order)} />}

              {data.subscriptionsCount > 1 ? (
                <Pressable onPress={() => router.navigate('/subscription')} accessibilityRole="button" hitSlop={hitSlop} style={styles.more}>
                  <Text variant="label" color={colors.brandInk}>
                    عندك {data.subscriptionsCount} اشتراكات · شوفها كلها
                  </Text>
                </Pressable>
              ) : null}

              {order ? <OrderMini order={order} /> : null}

              <QuickServices catalog={catalog.data} />

              <OfferHighlight offers={data.offers} />

              <PushPrompt />

              <ContactCard support={help.data?.support} />
            </>
          );
        }}
      </QueryBoundary>
    </Screen>
  );
}

// -------------------------------------------------------------------- guest

const REASONS: { icon: MIcon; color: string; title: string; body: string }[] = [
  { icon: 'payments', color: colors.amber, title: 'تدفع بالدينار العراقي', body: 'تحويل يدوي بالسوبر كي أو الحوالة، وترفع صورة الوصل من التطبيق.' },
  { icon: 'verified-user', color: colors.sky, title: 'فريق يفعّل بنفسه', body: 'كل حوالة يدققها فريقنا ويفعّل اشتراكك، وتتابع طلبك خطوة بخطوة.' },
  { icon: 'support-agent', color: colors.brandInk, title: 'دعم عراقي متواصل', body: 'تواصل ويانا بالواتساب أو التيليجرام أو التطبيق، ونرد عليك.' },
];

/** Guest home (Stitch welcome): what Shashtna is, why customers choose it, and the packages on sale. */
function GuestHome() {
  const insets = useSafeAreaInsets();
  const status = useServiceStatus();
  const catalog = useCatalog();

  return (
    <Screen
      edges={[]}
      tabBar
      contentStyle={[styles.content, { paddingTop: insets.top + space.sm }]}
      refreshing={catalog.isRefetching}
      onRefresh={() => {
        void catalog.refetch();
        void status.refetch();
      }}
    >
      <TopBar guest />
      {status.data?.active.length ? <IncidentBanner incidents={status.data.active} /> : null}

      <Panel tone="low" style={styles.hero} testID="guest-welcome">
        <View style={[styles.glow, styles.glowBlue]} pointerEvents="none" />
        <View style={[styles.glow, styles.glowAmber]} pointerEvents="none" />
        <Text variant="hero" weight="bold" center>
          أهلاً بيك في عالم شاشتنا ✨
        </Text>
        <Text variant="body" color={colors.ink2} center>
          قنواتك المباشرة، أفلامك ومسلسلاتك، ومنصاتك المفضلة، بمكان واحد وبالدينار العراقي.
        </Text>
      </Panel>

      <View style={styles.section}>
        <Heading title="ليش تختار شاشتنا؟" />
        {REASONS.map((reason) => (
          <Panel key={reason.title} style={styles.reason}>
            <Tile icon={reason.icon} color={reason.color} size={44} />
            <View style={styles.flex}>
              <Text variant="label" weight="bold" style={{ fontSize: 16 }}>
                {reason.title}
              </Text>
              <Text variant="caption" color={colors.ink2}>
                {reason.body}
              </Text>
            </View>
          </Panel>
        ))}
      </View>

      <GuestPackages catalog={catalog.data} />

      <Button title="تصفح الباقات واشترك هسه" icon="rocket" onPress={() => router.navigate('/packages')} testID="guest-store" />
      <View style={styles.links}>
        <Pressable onPress={() => router.push('/login')} accessibilityRole="button" hitSlop={hitSlop} testID="guest-login">
          <Text variant="label" color={colors.ink2} style={styles.underline}>
            عندك حساب؟ سجّل دخولك
          </Text>
        </Pressable>
        <Text variant="label" color={colors.ink3}>
          ·
        </Text>
        <Pressable onPress={() => router.push('/register')} accessibilityRole="button" hitSlop={hitSlop} testID="guest-register">
          <Text variant="label" color={colors.ink2} style={styles.underline}>
            حساب جديد
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}

/** «باقات مصممة لكل احتياج»: up to three real packages, each from its shortest length's price. */
function GuestPackages({ catalog }: { catalog: Catalog | undefined }) {
  const picks = (catalog?.packages ?? []).slice(0, 3);

  if (!picks.length) return null;

  return (
    <View style={styles.section}>
      <Heading title="باقات مصممة لكل احتياج" action="اختر لتبدأ" />
      {picks.map((pkg) => {
        const first = optionsOf(pkg)[0];
        const price = priceOf(first);
        const vip = pkg.serviceType === 'VIP';

        return (
          <Panel
            key={pkg.slug}
            onPress={() => router.push({ pathname: '/packages/[slug]', params: { slug: pkg.slug } })}
            accessibilityLabel={pkg.name}
            style={[styles.pick, pkg.isPopular && styles.popular]}
            testID={`guest-package-${pkg.slug}`}
          >
            {pkg.isPopular ? <Pill label="الأكثر طلباً 🔥" color={colors.onAmber} background={colors.amber} style={styles.popularChip} /> : null}
            <View style={[styles.durationTile, { backgroundColor: vip ? colors.amber : colors.brand }]}>
              <Text variant="label" weight="bold" color={vip ? colors.onAmber : colors.onBrand}>
                {vip ? 'VIP' : first.durationMonths >= 12 ? `${first.durationMonths / 12}Y` : `${first.durationMonths}M`}
              </Text>
            </View>
            <View style={styles.flex}>
              <Text variant="label" weight="bold" numberOfLines={1} style={{ fontSize: 16 }}>
                {pkg.name}
              </Text>
              <Text variant="caption" color={colors.ink2} numberOfLines={1}>
                {first.durationLabel}
              </Text>
            </View>
            <View style={styles.priceCol}>
              <Text variant="title" weight="bold" color={colors.brandInk} style={styles.nums}>
                {formatPrice(price.now).replace(' د.ع', '')}
              </Text>
              <Text variant="micro" color={colors.ink2}>
                د.ع
              </Text>
            </View>
          </Panel>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: space.lg, gap: space.xl },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  nums: { fontVariant: ['tabular-nums'] },
  section: { gap: space.sm },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 56 },
  vipChip: { alignSelf: 'center', paddingVertical: 4 },
  bell: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  bellDot: { position: 'absolute', top: 10, start: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.dangerStrong, borderWidth: 2, borderColor: colors.canvasDeep },
  more: { alignSelf: 'flex-start', minHeight: 32, justifyContent: 'center', marginTop: -space.md },
  hero: { gap: space.sm, padding: space.xl, overflow: 'hidden' },
  glow: { position: 'absolute', width: 192, height: 192, borderRadius: 96 },
  glowBlue: { top: -48, start: -48, backgroundColor: rgba(colors.brand, 0.12) },
  glowAmber: { bottom: -40, end: -40, backgroundColor: rgba(colors.amberDeep, 0.1) },
  reason: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  pick: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  popular: { backgroundColor: colors.surface2, marginTop: space.sm },
  popularChip: { position: 'absolute', top: -10, end: space.lg },
  durationTile: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  priceCol: { alignItems: 'flex-end' },
  links: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: space.md, marginTop: -space.sm },
  underline: { textDecorationLine: 'underline' },
});
