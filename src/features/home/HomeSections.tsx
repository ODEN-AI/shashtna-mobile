import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import type { Catalog, ContentItem, Help, Loyalty, OrderDetail, OrderStage, Subscription } from '@/src/api/types';
import { openWeb } from '@/src/features/web/open';
import { startingPrice } from '@/src/lib/catalog';
import { API_BASE_URL } from '@/src/lib/config';
import { formatDate, formatPrice } from '@/src/lib/format';
import { Button } from '@/src/ui/Button';
import { Dial, Heading, Panel, Pill, Tile, type MIcon } from '@/src/ui/Kit';
import { Text } from '@/src/ui/Text';
import { colors, gradients, radius, rgba, space } from '@/src/ui/theme';

// --------------------------------------------------------------- helpers

export type Look = 'active' | 'expiring' | 'ended';

export function lookOf(subscription: Subscription): Look {
  if (subscription.state === 'EXPIRED' || subscription.state === 'SUSPENDED' || subscription.daysRemaining <= 0) return 'ended';
  if (subscription.state === 'EXPIRING') return 'expiring';
  return 'active';
}

/** Where «جدّد» goes: the package's lengths in renewal mode, else the store. */
export function renew(subscription: Subscription | null | undefined) {
  if (subscription?.packageSlug && subscription.canRenew) {
    router.push({ pathname: '/packages/[slug]', params: { slug: subscription.packageSlug, renew: String(subscription.id) } });
    return;
  }

  router.navigate('/packages');
}

const LOOK: Record<Look, { chip: string; title: string; color: string }> = {
  active: { chip: 'اشتراكك شغّال', title: 'اشتراكك مفعّل', color: colors.success },
  expiring: { chip: 'تنبيه انتهاء الاشتراك', title: 'اشتراكك ينتهي قريباً', color: colors.amber },
  ended: { chip: 'الاشتراك منتهي', title: 'اشتراكك منتهي', color: colors.dangerStrong },
};

// ------------------------------------------------------------ points bar

/** «رصيد المكافآت»: shown only while «نقاط شاشتنا» is switched on. */
export function PointsBar({ loyalty }: { loyalty: Loyalty | undefined }) {
  if (!loyalty?.enabled) return null;

  const redeemable = loyalty.rewards.some((reward) => reward.redeemable);

  return (
    <View style={[styles.points, { experimental_backgroundImage: `linear-gradient(90deg, ${gradients.warm.join(', ')})` }]} testID="points-bar">
      <View style={styles.row}>
        <Tile icon="stars" color={colors.amber} size={36} />
        <View>
          <Text variant="micro" color={colors.ink2}>
            رصيد المكافآت
          </Text>
          <Text variant="label" weight="bold" style={styles.nums}>
            {loyalty.balance.toLocaleString('en-US')} نقطة
          </Text>
        </View>
      </View>
      <Pressable
        onPress={() => openWeb('/points', 'نقاط شاشتنا')}
        accessibilityRole="button"
        style={({ pressed }) => [styles.pointsButton, pressed && { opacity: 0.85 }]}
      >
        <Text variant="micro" color={colors.onAmber}>
          {redeemable ? 'استبدل بشهر مجاني 🎁' : 'نقاطي'}
        </Text>
      </Pressable>
    </View>
  );
}

// --------------------------------------------------- subscription dial card

/** The subscription with its days-left dial, end date and the renew action. */
export function SubscriptionAlert({ subscription }: { subscription: Subscription }) {
  const look = lookOf(subscription);
  const meta = LOOK[look];
  const days = Math.max(0, subscription.daysRemaining);
  const body =
    look === 'expiring'
      ? `${subscription.packageName}. جدّد هسه حتى ما ينقطع عليك البث.`
      : look === 'ended'
        ? `${subscription.packageName}. رجّع اشتراكك وكمّل مشاهدتك.`
        : `${subscription.packageName}. نتمنالك مشاهدة ممتعة.`;

  return (
    <Panel style={styles.alert} testID="subscription-card">
      <View style={[styles.bloom, { backgroundColor: rgba(meta.color, 0.08) }]} pointerEvents="none" />
      <View style={styles.between}>
        <View style={styles.row}>
          <View style={[styles.liveDot, { backgroundColor: meta.color }]} />
          <Text variant="label" weight="bold" color={meta.color}>
            {meta.chip}
          </Text>
        </View>
        <Pill label={`${look === 'ended' ? 'انتهى في' : 'ينتهي في'} ${formatDate(subscription.expiryDate)}`} />
      </View>

      <View style={[styles.row, { gap: space.lg }]}>
        <Dial
          size={80}
          fraction={look === 'ended' ? 0 : subscription.remainingFraction}
          color={look === 'expiring' ? colors.amber : undefined}
          gradient={look === 'active' ? [colors.sky, colors.brand] : undefined}
        >
          <Text variant="heading" weight="bold" color={look === 'expiring' ? colors.amber : colors.ink} style={styles.dialNumber}>
            {days}
          </Text>
          <Text variant="micro" color={colors.ink2} style={styles.dialLabel}>
            يوم باقي
          </Text>
        </Dial>
        <View style={styles.flex}>
          <Text variant="label" weight="semibold" style={{ fontSize: 16 }}>
            {meta.title}
          </Text>
          <Text variant="caption" color={colors.ink2}>
            {body}
          </Text>
        </View>
      </View>

      <View style={styles.row}>
        <Button
          title={look === 'ended' ? 'رجّع اشتراكك' : 'جدّد اشتراكك هسه'}
          icon="refresh"
          variant={look === 'active' ? 'primary' : 'amber'}
          onPress={() => renew(subscription)}
          style={styles.flex}
          testID="home-renew"
        />
        <Button title="تفاصيل" variant="glass" compact onPress={() => router.navigate('/subscription')} style={styles.detailsButton} />
      </View>
    </Panel>
  );
}

/** Before the first subscription (or for a guest): one clear next step. */
export function NoSubscription({ pending }: { pending?: boolean }) {
  return (
    <Panel style={styles.alert} testID="empty-card">
      <View style={[styles.row, { gap: space.lg }]}>
        <Dial size={80} fraction={0}>
          <MaterialIcons name="live-tv" size={28} color={colors.ink3} />
        </Dial>
        <View style={styles.flex}>
          <Text variant="label" weight="semibold" style={{ fontSize: 16 }}>
            {pending ? 'طلبك بالطريق' : 'ما عندك اشتراك بعد'}
          </Text>
          <Text variant="caption" color={colors.ink2}>
            {pending ? 'أول ما يتفعّل اشتراكك، تشوف هنا كم يوم باقي وتجدد بضغطة.' : 'اختار باقتك، وبعد التفعيل تشوف هنا كم يوم باقي وتجدد بضغطة.'}
          </Text>
        </View>
      </View>
      {!pending ? <Button title="تصفح الباقات" icon="apps" onPress={() => router.navigate('/packages')} testID="home-renew" /> : null}
    </Panel>
  );
}

// ---------------------------------------------------------- order mini card

const STAGE_SHARE: Partial<Record<OrderStage, number>> = { PACKAGE_SELECTED: 0.15, PAYMENT_PENDING: 0.25, UNDER_REVIEW: 0.6, PAID: 0.85, ACTIVATED: 1 };

const STAGE_LINE: Partial<Record<OrderStage, string>> = {
  PACKAGE_SELECTED: 'حوّل المبلغ وارفع صورة الحوالة حتى نبدأ',
  PAYMENT_PENDING: 'حوّل المبلغ وارفع صورة الحوالة حتى نبدأ',
  UNDER_REVIEW: 'فريقنا يدقق الحوالة يدوياً هسه',
  PAID: 'تأكد الدفع، فريقنا يفعّل اشتراكك',
  ACTIVATED: 'تفعّل اشتراكك',
};

/** «طلب …» pill: what is happening to the open order, and the way to follow it. */
export function OrderMini({ order }: { order: OrderDetail }) {
  const share = STAGE_SHARE[order.stage] ?? 0;
  const open = () => router.push(`/orders/${order.id}`);

  return (
    <Panel tone="low" style={styles.order} testID="order-track">
      <View style={styles.between}>
        <View style={[styles.row, styles.flex]}>
          <View style={styles.orderIcon}>
            <MaterialIcons name="hourglass-top" size={16} color={colors.sky} />
          </View>
          <View style={styles.flex}>
            <Text variant="label" weight="semibold" numberOfLines={1} style={{ fontSize: 16 }}>
              طلب {order.serviceName}
            </Text>
            <Text variant="caption" color={colors.sky} numberOfLines={2}>
              {STAGE_LINE[order.stage] ?? order.statusHint}
            </Text>
          </View>
        </View>
        <Pressable onPress={open} accessibilityRole="button" style={styles.follow}>
          <Text variant="micro" color={colors.ink} style={{ fontSize: 12 }}>
            تابع طلبك
          </Text>
        </Pressable>
      </View>
      <View style={styles.track}>
        <View style={[styles.trackFill, { width: `${Math.round(share * 100)}%` }]} />
      </View>
      <View style={styles.between}>
        <Text variant="micro" color={colors.ink2}>
          {order.number}
        </Text>
        <Text variant="micro" color={colors.ink2} style={styles.nums}>
          {formatPrice(order.price)}
        </Text>
      </View>
      {order.needsPayment ? <Button title="ادفع وارفع صورة الحوالة" icon="cloud-upload" onPress={open} testID="order-pay" /> : null}
    </Panel>
  );
}

// --------------------------------------------------------- quick services

type Service = { key: string; title: string; body: string; cta: string; icon: MIcon; chip: string | null; tone: 'default' | 'vip' | 'player'; onPress: () => void };

/** «خدمات شاشتنا السريعة»: the four ways in, with real starting prices from the catalogue. */
export function QuickServices({ catalog }: { catalog: Catalog | undefined }) {
  const iptv = startingPrice(catalog, 'IPTV');
  const vip = startingPrice(catalog, 'VIP');
  const platforms = startingPrice(catalog, 'DIGITAL');

  const items: Service[] = [
    {
      key: 'iptv',
      title: 'اشتراكات IPTV',
      body: 'قنوات مباشرة وأفلام ومسلسلات على شاشتك أو موبايلك',
      cta: 'تصفح الباقات',
      icon: 'connected-tv',
      chip: iptv !== null ? `من ${formatPrice(iptv)}` : null,
      tone: 'default',
      onPress: () => router.navigate({ pathname: '/packages', params: { service: 'IPTV' } }),
    },
    {
      key: 'vip',
      title: 'باقات VIP + جهاز',
      body: 'اشتراك VIP لثلاث أشهر ويا جهاز متوافق',
      cta: 'اطلب هسه',
      icon: 'developer-board',
      chip: vip !== null ? 'VIP' : null,
      tone: 'vip',
      onPress: () => router.navigate({ pathname: '/packages', params: { service: 'VIP' } }),
    },
    ...(platforms !== null
      ? [
          {
            key: 'platforms',
            title: 'المنصات الرقمية',
            body: 'اشتراكات وأكواد لمنصات المشاهدة والألعاب',
            cta: 'عرض المنصات',
            icon: 'redeem' as MIcon,
            chip: `من ${formatPrice(platforms)}`,
            tone: 'default' as const,
            onPress: () => router.navigate({ pathname: '/packages', params: { service: 'DIGITAL' } }),
          },
        ]
      : []),
    {
      key: 'player',
      title: 'Shashtna Player',
      body: 'تطبيق المشاهدة مالتنا للتلفزيون والموبايل',
      cta: 'تحميل التطبيق',
      icon: 'play-circle-filled',
      chip: 'مجاني',
      tone: 'player',
      onPress: () => void Linking.openURL(`${API_BASE_URL}/apps`).catch(() => undefined),
    },
  ];

  return (
    <View style={styles.section}>
      <Heading title="خدمات شاشتنا السريعة" />
      <View style={styles.grid} testID="quick-services">
        {items.map((item) => {
          const vipTone = item.tone === 'vip';
          const accent = vipTone ? colors.amber : colors.brandInk;

          return (
            <Panel
              key={item.key}
              tone={vipTone ? 'deep' : 'default'}
              onPress={item.onPress}
              accessibilityLabel={item.title}
              testID={`service-${item.key}`}
              style={[styles.service, item.tone === 'player' && styles.player]}
            >
              <View style={styles.between}>
                {item.tone === 'player' ? (
                  <Tile icon={item.icon} color={colors.onBrand} background={colors.brand} />
                ) : (
                  <Tile icon={item.icon} color={accent} background={vipTone ? rgba(colors.amber, 0.1) : undefined} />
                )}
                {item.chip ? <Pill label={item.chip} color={accent} background={vipTone ? rgba(colors.amberDeep, 0.3) : colors.surface3} /> : null}
              </View>
              <View>
                <Text variant="label" weight="bold" color={vipTone ? colors.amber : colors.ink} style={{ fontSize: 16 }}>
                  {item.title}
                </Text>
                <Text variant="caption" color={colors.ink2}>
                  {item.body}
                </Text>
              </View>
              <View style={styles.row}>
                <Text variant="micro" color={vipTone ? colors.amber : item.tone === 'player' ? colors.brandInk : colors.brandInk} style={{ fontSize: 12 }}>
                  {item.cta}
                </Text>
                <MaterialIcons name={item.key === 'player' ? 'download' : 'arrow-back'} size={16} color={accent} />
              </View>
            </Panel>
          );
        })}
      </View>
    </View>
  );
}

// --------------------------------------------------------------- offers

/** The newest offer from Admin → Content, as a large image card. */
export function OfferHighlight({ offers }: { offers: ContentItem[] }) {
  const offer = offers[0];

  if (!offer) return null;

  return (
    <View style={styles.section}>
      <Heading title="عروض شاشتنا" icon="local-fire-department" action={offers.length > 1 ? 'كل العروض' : undefined} onAction={() => router.push('/notifications')} />
      <Panel onPress={() => router.push(`/content/${offer.id}`)} accessibilityLabel={offer.title} style={styles.offer} testID="offer-highlight">
        {offer.imageUrl ? <Image source={offer.imageUrl} style={styles.offerImage} contentFit="cover" /> : null}
        <View style={styles.offerBody}>
          <Text variant="heading" weight="bold">
            {offer.title}
          </Text>
          {offer.description ? (
            <Text variant="caption" color={colors.ink2} numberOfLines={3}>
              {offer.description}
            </Text>
          ) : null}
        </View>
      </Panel>
    </View>
  );
}

// --------------------------------------------------------------- contact

/** «تواصل ويانا مباشرة»: hours and channels from Admin → Settings. */
export function ContactCard({ support }: { support: Help['support'] | undefined }) {
  if (!support || !(support.whatsapp || support.telegram || support.phone)) return null;

  const open = (url: string) => void Linking.openURL(url).catch(() => undefined);
  const phone = support.phone?.replace(/[^\d+]/g, '');

  return (
    <Panel style={styles.contact} testID="contact-card">
      <View style={styles.between}>
        <View style={[styles.row, styles.flex]}>
          <Tile icon="support-agent" color={colors.sky} />
          <View style={styles.flex}>
            <Text variant="label" weight="bold" style={{ fontSize: 16 }}>
              تواصل ويانا مباشرة
            </Text>
            <Text variant="micro" color={colors.ink2}>
              فريقنا حاضر يساعدك
            </Text>
          </View>
        </View>
        {support.hours ? <Pill label={support.hours} color={colors.amber} background={colors.canvasDeep} /> : null}
      </View>
      <View style={styles.channels}>
        {support.whatsapp ? <Channel icon="chat" title="واتساب شاشتنا" onPress={() => open(support.whatsapp!)} /> : null}
        {support.telegram ? <Channel icon="send" title="تيليجرام" onPress={() => open(support.telegram!)} /> : null}
      </View>
      {phone ? (
        <Pressable onPress={() => open(`tel:${phone}`)} accessibilityRole="button" accessibilityLabel={`اتصال ${support.phone}`} style={styles.hotline}>
          <View style={styles.row}>
            <MaterialIcons name="phone-in-talk" size={20} color={colors.amber} />
            <Text variant="label" weight="semibold">
              اتصل بينا
            </Text>
          </View>
          <Text variant="heading" weight="bold" color={colors.amber} style={[styles.nums, { writingDirection: 'ltr' }]}>
            {support.phone}
          </Text>
        </Pressable>
      ) : null}
    </Panel>
  );
}

function Channel({ icon, title, onPress }: { icon: MIcon; title: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={title} style={({ pressed }) => [styles.channel, pressed && { opacity: 0.85 }]}>
      <Tile icon={icon} color={colors.amber} size={32} />
      <Text variant="label" weight="semibold" style={styles.flex} numberOfLines={1}>
        {title}
      </Text>
      <MaterialIcons name="chevron-left" size={20} color={colors.ink2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  nums: { fontVariant: ['tabular-nums'] },
  section: { gap: space.sm },
  points: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: space.md,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
  },
  pointsButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: space.md, paddingVertical: 6, borderRadius: radius.sm, backgroundColor: colors.amber },
  alert: { gap: space.lg, overflow: 'hidden' },
  bloom: { position: 'absolute', top: -48, start: -48, width: 144, height: 144, borderRadius: 72 },
  liveDot: { width: 10, height: 10, borderRadius: 5 },
  dialNumber: { lineHeight: 22, fontVariant: ['tabular-nums'] },
  dialLabel: { lineHeight: 12 },
  detailsButton: { paddingHorizontal: space.lg, minHeight: 52 },
  order: { gap: space.md, padding: 14 },
  orderIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: rgba('#00759F', 0.3) },
  follow: { paddingHorizontal: space.md, paddingVertical: 6, borderRadius: radius.sm, backgroundColor: colors.surface3, minHeight: 44, justifyContent: 'center' },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.surface3, overflow: 'hidden' },
  trackFill: { height: '100%', borderRadius: 3, backgroundColor: colors.sky },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  service: { width: '48%', flexGrow: 1, gap: space.md, padding: 14, justifyContent: 'space-between' },
  player: { experimental_backgroundImage: `linear-gradient(225deg, ${rgba(colors.brand, 0.2)}, ${colors.surface})` },
  offer: { padding: 0, overflow: 'hidden' },
  offerImage: { width: '100%', aspectRatio: 16 / 9, backgroundColor: colors.surface2 },
  offerBody: { padding: space.lg, gap: space.xs },
  contact: { gap: 14 },
  channels: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  channel: {
    flexGrow: 1,
    flexBasis: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    padding: space.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface2,
    minHeight: 56,
  },
  hotline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: space.md,
    borderRadius: radius.lg,
    backgroundColor: colors.canvasDeep,
    minHeight: 56,
  },
});
