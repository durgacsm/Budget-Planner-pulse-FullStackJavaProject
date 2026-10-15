import { mockApi } from './mock';
import { realApi } from './real';

export const USE_MOCK = String(import.meta.env.VITE_USE_MOCK ?? 'true') !== 'false';
export const api = USE_MOCK ? mockApi : realApi;
