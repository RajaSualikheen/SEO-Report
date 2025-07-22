import React from 'react';
import { Search, FileText, Code, BriefcaseBusiness, Home, Info } from 'lucide-react';
import { motion } from 'framer-motion'; 

export default function Footer() {
  return (
<footer className="bg-gray-800 text-white py-8 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} CrestNova.Sol. All rights reserved.</p>
          <p className="mt-2">Built with <span className="text-red-500">&hearts;</span> by CrestNova.Sol Team</p>
        </div>
      </footer>
    );  }