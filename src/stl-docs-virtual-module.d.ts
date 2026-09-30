declare module "virtual:stl-docs-virtual-module" {
  export const TABS: ReadonlyArray<{
    label: string;
    link: string;
    hidden?: boolean;
    sidebar?: unknown[];
  }>;
  export const HEADER_LINKS: ReadonlyArray<{
    label: string;
    link: string;
    variant?: string;
    attrs?: Record<string, string>;
  }>;
}
