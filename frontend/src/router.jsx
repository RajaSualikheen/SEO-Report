// src/router.jsx
import React from "react";
import Home from "./pages/Home";
import Report from "./pages/Report";
import Login from "./pages/login";
import Register from "./pages/register";
import Dashboard from "./pages/dashboard";
import Features from "./pages/feature";
import Pricing from "./pages/Pricing";
import Contact from "./pages/Contact";
import RootLayout from "./pages/RootLayout";
import Root from "./components/Root"; 
import { BrowserRouter, createBrowserRouter, RouterProvider } from "react-router-dom";
const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    children: [
  {
    index: true,
    element: <Home />,
  },
  {
    path: "/report",
    element: <Report />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
                path: "/report/:reportId",
                element: <Report />,
            },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/dashboard",
    element: <Dashboard />,
  },
  {
    path: "/features",
    element: <Features />,
  },
  {
    path: "/pricing",
    element: <Pricing />,
  },
  {
    path: "/contact",
    element: <Contact />,
  }
],
  }
]);

const AppRouter = () => {
  return <RouterProvider router={router} />;
};

export default AppRouter;