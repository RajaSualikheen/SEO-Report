import React from 'react';
import { Outlet } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import Navbar from './navbar';
import Footer from './footer';

const Root = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        {/* The Navbar now lives here, consuming the contexts directly */}
        <Navbar />
        <main>
          {/* The <Outlet> will render the specific page component (Home, Contact, etc.) */}
          <Outlet />
        </main>
        <Footer />
      </ThemeProvider>
    </AuthProvider>
  );
};

export default Root;