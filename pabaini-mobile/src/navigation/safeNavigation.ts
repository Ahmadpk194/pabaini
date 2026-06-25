import { Href } from 'expo-router';

let globalCurrentPath = '';
let isNavigating = false;
let navigationTimeout: ReturnType<typeof setTimeout> | null = null;

export function setGlobalCurrentPath(path: string) {
  globalCurrentPath = path;
}

export function getGlobalCurrentPath() {
  return globalCurrentPath;
}

function resolvePathname(href: Href): string {
  if (typeof href === 'string') {
    return href.split('?')[0];
  }
  if (href && typeof href === 'object' && href.pathname) {
    return href.pathname;
  }
  return '';
}

/**
 * Safely push a new route onto the navigation stack.
 * Protects against rapid multiple taps and duplicate route pushes.
 */
export function safeRouterPush(router: { push: (href: Href) => void }, href: Href) {
  if (isNavigating) {
    console.log('[SafeNavigation] Push blocked - navigation is locked.');
    return;
  }

  const targetPath = resolvePathname(href);
  if (targetPath && targetPath === globalCurrentPath) {
    console.log(`[SafeNavigation] Push blocked - duplicate route: ${targetPath}`);
    return;
  }

  isNavigating = true;
  router.push(href);

  if (navigationTimeout) clearTimeout(navigationTimeout);

  navigationTimeout = setTimeout(() => {
    isNavigating = false;
  }, 500); // 500ms lock window
}

/**
 * Safely replace the current route on the navigation stack.
 * Protects against rapid multiple taps and duplicate route replaces.
 */
export function safeRouterReplace(router: { replace: (href: Href) => void }, href: Href) {
  if (isNavigating) {
    console.log('[SafeNavigation] Replace blocked - navigation is locked.');
    return;
  }

  const targetPath = resolvePathname(href);
  if (targetPath && targetPath === globalCurrentPath) {
    console.log(`[SafeNavigation] Replace blocked - duplicate route: ${targetPath}`);
    return;
  }

  isNavigating = true;
  router.replace(href);

  if (navigationTimeout) clearTimeout(navigationTimeout);

  navigationTimeout = setTimeout(() => {
    isNavigating = false;
  }, 500); // 500ms lock window
}
