import {
  createMemoryHistory,
  createRootRouteWithContext,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { HomeView } from "./home-view";
import { RootView } from "./root-view";
import { QueryClient } from "@tanstack/react-query";

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div style={{ padding: 24, fontFamily: "-apple-system, sans-serif" }}>
      <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Er ging iets mis</h1>
      <p style={{ color: "#757575", fontSize: 13 }}>{error.message}</p>
    </div>
  );
}

const rootRoute = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  component: RootView,
  errorComponent: ErrorFallback,
  notFoundComponent: () => {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-secondary">Route not found</p>
      </div>
    );
  },
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomeView,
  staticData: {
    title: "Home",
  },
});

const routeTree = rootRoute.addChildren([homeRoute]);

const queryClient = new QueryClient();

const router = createRouter({
  routeTree,
  history: createMemoryHistory(),
  defaultPreloadStaleTime: 0,
  scrollRestoration: true,
  context: {
    queryClient,
  },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
  interface StaticDataRouteOption {
    title?: string;
    component?: any;
  }
}

export { router, queryClient };
