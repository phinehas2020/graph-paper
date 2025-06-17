'use client';

import { useServiceWorker } from '@/hooks/use-service-worker';

export default function ServiceWorkerRegister() {
  useServiceWorker();
  return null;
}
