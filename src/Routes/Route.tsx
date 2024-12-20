import React from "react";
import { Suspense, lazy } from "react";
const RDashBoard = lazy(() => import("../Dashboard/RDashBoard"));
const App = lazy(() => import("../App"));



export const MainRoutes = () => {
  return (
    [
      {
        label: "App",
        link: '',
        type: true,
        component: () => (
          <Suspense fallback={<><span>Loading...</span></>}>
            <App />
          </Suspense>
        )
      },

      {
        label: "Dashboard",
        link: 'project/:projectName',
        component: () => (
          <Suspense fallback={<><span>Loading...</span></>}>
            <RDashBoard />
          </Suspense>
        )
      }
    ]
  )
}
