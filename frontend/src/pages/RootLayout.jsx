import React from 'react';
import { Outlet } from 'react-router-dom';
import { ThemeProvider } from '../contexts/ThemeContext';
import { AuthProvider } from '../contexts/AuthContext';

// NOTE: We are NOT rendering Navbar and Footer here anymore.
// They will be handled by the individual routes as needed.

const RootLayout = () => {
  return (
    // The providers now wrap the <Outlet />, which is where your pages will be rendered.
    <ThemeProvider>
        <AuthProvider>
            <Outlet />
        </AuthProvider>
    </ThemeProvider>
  );
};

export default RootLayout;