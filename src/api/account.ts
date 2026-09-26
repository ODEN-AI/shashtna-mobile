import { request } from './client';
import type { Catalog, Content, ContentItem, Dashboard, Help, ServiceStatus } from './types';

export const dashboardApi = {
  get: () => request<Dashboard>('/api/mobile/dashboard'),
};

export const catalogApi = {
  get: () => request<Catalog>('/api/mobile/catalog', { auth: false }),
};

export const contentApi = {
  list: () => request<Content>('/api/mobile/content', { auth: false }),
  get: (id: number) => request<{ item: ContentItem }>(`/api/mobile/content/${id}`, { auth: false }),
};

export const statusApi = {
  get: () => request<ServiceStatus>('/api/mobile/status', { auth: false }),
};

export const helpApi = {
  get: () => request<Help>('/api/mobile/help', { auth: false }),
};
