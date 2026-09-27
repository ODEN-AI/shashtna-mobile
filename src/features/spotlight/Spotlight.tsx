import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState, type ComponentProps } from 'react';
import { Animated, Linking, Pressable, StyleSheet, View } from 'react-native';

import type { Catalog, ContentItem, Dashboard } from '@/src/api/types';
import { useRequireAuth } from '@/src/auth/useRequireAuth';
import { useAmbientMotion, useReducedMotion } from '@/src/hooks/useReducedMotion';
import { memberSlides, promoCandidates, refreshPlan, rotate, type MemberSlide, type PromoPlan, type SpotlightItem, type SpotlightTarget } from '@/src/lib/spotlight';
import { Button } from '@/src/ui/Button';
import { gradientStyle, linear, radial, RGB } from '@/src/ui/gradient';
import { GradientSurface } from '@/src/ui/GradientSurface';
import { ProgressDots } from '@/src/ui/ProgressDots';
import { Text } from '@/src/ui/Text';
import { colors, gradients, motion, radius, space, toneColor } from '@/src/ui/theme';

import { ProductVisual } from '../ProductVisual';
import { loadSpotlightSession, memberLaunch, promoPlanFor } from './session';

type IconName = ComponentProps<typeof Ionicons>['name'];

/** Opens a spotlight target: in-app route (asking guests to sign in when needed) or an admin-provided link. */
function useOpenTarget() {
  const { go } = useRequireAuth();

  return useCallback(
    (target: SpotlightTarget | null) => {
      if (!target) return;
      if (target.externalUrl) {
        void Linking.openURL(target.externalUrl);
        return;
      }
      if (!target.href) return;
      if (target.requiresAuth) go(target.href);
      else router.push(target.href);
    },
    [go],
  );
}

/** Fade + rise on mount; the gradient behind slowly breathes (both off under reduced motion). */
function useEntrance(key: string) {
  const reduced = useReducedMotion();
  const [value] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (reduced) {
      value.setValue(1);
      return;
    }
    value.setValue(0);
    Animated.timing(value, { toValue: 1, duration: motion.slow, useNativeDriver: true }).start();
  }, [key, reduced, value]);

  return { opacity: value, transform: [{ translateY: value.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] };
}

function Breathing() {
  const active = useAmbientMotion();
  const [value] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!active) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(value, { toValue: 1, duration: motion.story, useNativeDriver: true }),
        Animated.timing(value, { toValue: 0, duration: motion.story, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, value]);

  return <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.breath, { opacity: value }]} />;
}

// ---------------------------------------------------------------- promotion

/**
 * Promotional Spotlight for guests, expired and not-yet-subscribed customers.
 * The plan is fixed for the launch; its items follow live data.
 */
export function PromoSpotlight({ offers, catalog }: { offers: ContentItem[] | undefined; catalog: Catalog | undefined }) {
  const candidates = useMemo(() => promoCandidates({ offers, catalog }), [offers, catalog]);
  const ready = offers !== undefined && catalog !== undefined;
  const [plan, setPlan] = useState<PromoPlan | null>(null);

  useEffect(() => {
    if (!ready || plan) return;
    let cancelled = false;
    void loadSpotlightSession().then((current) => {
      if (!cancelled) setPlan(promoPlanFor(current, candidates));
    });
    return () => {
      cancelled = true;
    };
  }, [ready, plan, candidates]);

  const live = plan ? refreshPlan(plan, candidates) : null;

  if (!live || live.mode === 'none') return null;

  return live.mode === 'single' ? <SingleStory item={live.items[0]} /> : <Campaign items={live.items} />;
}

function SingleStory({ item }: { item: SpotlightItem }) {
  const open = useOpenTarget();
  const entrance = useEntrance(item.key);

  return (
    <GradientSurface stops={item.kind === 'offer' ? gradients.heroDeep : gradients.hero} style={styles.story} testID="promo-spotlight">
      <Breathing />
      <View pointerEvents="none" style={styles.shape} />
      <Animated.View style={[styles.storyBody, entrance]}>
        <View style={styles.storyTop}>
          <View style={{ flex: 1, gap: space.sm }}>
            <View style={styles.eyebrow}>
              <Text variant="caption" weight="bold" color={colors.inkOnLight}>
                {item.eyebrow}
              </Text>
            </View>
            <Text variant="hero" numberOfLines={3} style={styles.storyTitle}>
              {item.title}
            </Text>
          </View>
          <ProductVisual imageUrl={item.imageUrl} kind={item.kind} serviceType={item.serviceType} size={104} floating />
        </View>
        {item.body ? (
          <Text color={colors.ice} numberOfLines={2}>
            {item.body}
          </Text>
        ) : null}
        <View style={styles.storyFooter}>
          {item.price ? (
            <View style={{ flex: 1 }}>
              <Text variant="heading" numberOfLines={1}>
                {item.price}
              </Text>
              {item.meta ? (
                <Text variant="caption" color={colors.ice} numberOfLines={1}>
                  {item.meta}
                </Text>
              ) : null}
            </View>
          ) : (
            <View style={{ flex: 1 }} />
          )}
          <Button title={item.cta} variant="light" compact iconEnd="arrow-back" onPress={() => open(item.target)} testID="promo-cta" />
        </View>
      </Animated.View>
    </GradientSurface>
  );
}

function Campaign({ items }: { items: SpotlightItem[] }) {
  const open = useOpenTarget();
  const entrance = useEntrance(items.map((item) => item.key).join('|'));

  return (
    <GradientSurface stops={gradients.heroDeep} style={styles.campaign} testID="promo-campaign">
      <Breathing />
      <Animated.View style={[{ gap: space.md }, entrance]}>
        <View>
          <Text variant="caption" weight="bold" color={colors.ice}>
            تشكيلة شاشتنا
          </Text>
          <Text variant="title">اختار اللي يناسبك</Text>
        </View>
        <View style={styles.grid}>
          {items.map((item) => (
            <Pressable
              key={item.key}
              onPress={() => open(item.target)}
              accessibilityRole="button"
              accessibilityLabel={[item.title, item.price, item.meta].filter(Boolean).join('، ')}
              style={({ pressed }) => [styles.tile, items.length === 2 && styles.tileWide, pressed && { opacity: 0.85 }]}
            >
              <ProductVisual imageUrl={item.imageUrl} kind={item.kind} serviceType={item.serviceType} size={48} />
              <Text variant="label" numberOfLines={2}>
                {item.title}
              </Text>
              {item.price ? (
                <Text variant="caption" weight="bold" color={colors.ice} numberOfLines={1}>
                  {item.price}
                </Text>
              ) : null}
            </Pressable>
          ))}
        </View>
      </Animated.View>
    </GradientSurface>
  );
}

// ------------------------------------------------------------------ members

/** Member Spotlight — for active subscribers: renewal, offers, upgrade, news, status. */
export function MemberSpotlight({ dashboard, catalog }: { dashboard: Dashboard; catalog: Catalog | undefined }) {
  const open = useOpenTarget();
  const active = useAmbientMotion();
  const [launch, setLaunch] = useState<number | null>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void loadSpotlightSession().then((current) => !cancelled && setLaunch(memberLaunch(current)));
    return () => {
      cancelled = true;
    };
  }, []);

  const slides = useMemo(() => rotate(memberSlides(dashboard, catalog), launch ?? 0), [dashboard, catalog, launch]);
  const count = slides.length;
  const slide: MemberSlide | undefined = slides[index % Math.max(count, 1)];
  const entrance = useEntrance(slide?.key ?? 'none');

  useEffect(() => {
    if (!active || count < 2) return;
    const timer = setInterval(() => setIndex((current) => (current + 1) % count), motion.story);
    return () => clearInterval(timer);
  }, [active, count]);

  if (launch === null || !slide) return null;

  const accent = toneColor[slide.tone];

  return (
    <GradientSurface stops={gradients.heroDeep} style={styles.member} testID="member-spotlight">
      <Animated.View style={[styles.memberBody, entrance]}>
        <View style={styles.memberTop}>
          <View style={[styles.memberIcon, { borderColor: `${accent}66` }]}>
            <Ionicons name={slide.icon as IconName} size={22} color={accent} />
          </View>
          <Text variant="caption" weight="bold" color={colors.ice} style={{ flex: 1 }} numberOfLines={1}>
            {slide.eyebrow}
          </Text>
        </View>
        <Text variant="heading" numberOfLines={2}>
          {slide.title}
        </Text>
        {slide.body ? (
          <Text variant="caption" color={colors.ink2} numberOfLines={2}>
            {slide.body}
          </Text>
        ) : null}
        <View style={styles.memberFooter}>
          <ProgressDots count={count} index={index % count} onSelect={setIndex} label="البطاقة" />
          {slide.cta ? <Button title={slide.cta} variant="glass" compact onPress={() => open(slide.target)} /> : null}
        </View>
      </Animated.View>
    </GradientSurface>
  );
}

const styles = StyleSheet.create({
  breath: { ...gradientStyle(radial(RGB.sky, 0.45, '100% 100%', '70%')) },
  story: { minHeight: 250 },
  shape: {
    position: 'absolute',
    width: 230,
    height: 230,
    top: -40,
    end: -60,
    borderRadius: 64,
    transform: [{ rotate: '24deg' }],
    ...gradientStyle(linear(160, ['rgba(203, 233, 253, 0.22)', 'rgba(203, 233, 253, 0.04)'])),
  },
  storyBody: { padding: space.xl, gap: space.md },
  storyTop: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  storyTitle: { fontSize: 30, lineHeight: 40 },
  eyebrow: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.pill, backgroundColor: colors.ice },
  storyFooter: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginTop: space.xs },
  campaign: { padding: space.xl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  tile: {
    flexBasis: '47%',
    flexGrow: 1,
    gap: space.xs,
    padding: space.md,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(1, 6, 25, 0.28)',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderTopColor: colors.glassEdge,
    minHeight: 130,
  },
  tileWide: { flexBasis: '45%' },
  member: { minHeight: 170 },
  memberBody: { padding: space.lg, gap: space.sm },
  memberTop: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  memberIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(1, 6, 25, 0.3)',
    borderWidth: 1,
  },
  memberFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.sm, gap: space.md },
});
