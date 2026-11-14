import { WebPage } from '@/src/features/web/WebPage';

/**
 * «المتجر»: the website's plans page inside the app — every service, length,
 * discount and digital platform exactly as the website sells them today.
 */
export default function StoreTab() {
  return <WebPage path="/plans" bar={false} />;
}
