declare module '@/router.js' {
  export interface RouteMeta {
    auth: boolean;
    roles?: string[];
    permissions?: string[];
    title?: string;
    breadcrumbs?: { label: string; href?: string }[];
  }

  export function navigate(path: string, options?: { replace?: boolean }): void;
  export function getRouteMeta(name: string): RouteMeta;
  export function parseHash(): { name: string; params: Record<string, string> };
  export function onRouteChange(cb: (route: { name: string; params: Record<string, string> }) => void): () => void;
}
