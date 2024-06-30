/* prettier-ignore-start */

/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file is auto-generated by TanStack Router

import { createFileRoute } from '@tanstack/react-router'

// Import Routes

import { Route as rootRoute } from './routes/__root'

// Create Virtual Routes

const LobbyLazyImport = createFileRoute('/lobby')()
const InstanceLazyImport = createFileRoute('/instance')()
const IndexLazyImport = createFileRoute('/')()

// Create/Update Routes

const LobbyLazyRoute = LobbyLazyImport.update({
  path: '/lobby',
  getParentRoute: () => rootRoute,
} as any).lazy(() => import('./routes/lobby.lazy').then((d) => d.Route))

const InstanceLazyRoute = InstanceLazyImport.update({
  path: '/instance',
  getParentRoute: () => rootRoute,
} as any).lazy(() => import('./routes/instance.lazy').then((d) => d.Route))

const IndexLazyRoute = IndexLazyImport.update({
  path: '/',
  getParentRoute: () => rootRoute,
} as any).lazy(() => import('./routes/index.lazy').then((d) => d.Route))

// Populate the FileRoutesByPath interface

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      id: '/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof IndexLazyImport
      parentRoute: typeof rootRoute
    }
    '/instance': {
      id: '/instance'
      path: '/instance'
      fullPath: '/instance'
      preLoaderRoute: typeof InstanceLazyImport
      parentRoute: typeof rootRoute
    }
    '/lobby': {
      id: '/lobby'
      path: '/lobby'
      fullPath: '/lobby'
      preLoaderRoute: typeof LobbyLazyImport
      parentRoute: typeof rootRoute
    }
  }
}

// Create and export the route tree

export const routeTree = rootRoute.addChildren({
  IndexLazyRoute,
  InstanceLazyRoute,
  LobbyLazyRoute,
})

/* prettier-ignore-end */

/* ROUTE_MANIFEST_START
{
  "routes": {
    "__root__": {
      "filePath": "__root.tsx",
      "children": [
        "/",
        "/instance",
        "/lobby"
      ]
    },
    "/": {
      "filePath": "index.lazy.tsx"
    },
    "/instance": {
      "filePath": "instance.lazy.tsx"
    },
    "/lobby": {
      "filePath": "lobby.lazy.tsx"
    }
  }
}
ROUTE_MANIFEST_END */
