import { defineRouteMiddleware } from "@astrojs/starlight/route-data";
import { flattenSidebarSingleChildGroups } from "./lib/flatten-sidebar-single-child-groups";

/**
 * Starlight route middleware runs after `locals.starlightRoute` is set and can mutate it before
 * the layout renders. Single-link groups become one clickable row (group label + destination).
 */
export const onRequest = defineRouteMiddleware(async (context, next) => {
  await next();

  try {
    const route = context.locals.starlightRoute;
    if (route) {
      // Set siteTitleHref to point the logo at the main Tiger Data website
      route.siteTitleHref = "https://www.tigerdata.com";
      // The Starlight config stores each documentation tab in an internal wrapper
      // group. Select the wrapper matching the current URL, then expose only that
      // tab's entries as the page sidebar.
      const pathname = context.url.pathname.replace(import.meta.env.BASE_URL.replace(/\/$/, ""), "");
      const tabGroups = route.sidebar.filter(
        (entry) => entry.type === "group" && entry.label.startsWith("__DOCS_TAB__")
      );
      const activeTab = tabGroups.find((entry) => {
        if (entry.type !== "group") return false;
        const match = entry.label.match(/^__DOCS_TAB__(.*?)__(.*)$/);
        const tabPath = match?.[1];
        return tabPath && (pathname === tabPath || pathname.startsWith(`${tabPath}/`));
      });
      if (activeTab?.type === "group") {
        route.sidebar = activeTab.entries;
      }
      // Flatten single-child sidebar groups
      if (route.sidebar?.length) {
        route.sidebar = flattenSidebarSingleChildGroups(route.sidebar);
      }
    }
  } catch {
    // starlightRoute may not be available during prerender of non-Starlight pages (e.g., 404)
  }
});
