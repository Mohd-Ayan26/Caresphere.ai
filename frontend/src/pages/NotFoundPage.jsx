// src/pages/NotFoundPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-electric-subtle flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md">
        <div className="text-9xl font-display text-blue-200 mb-4">404</div>
        <h1 className="font-display text-3xl text-gray-900 mb-3">Page Not Found</h1>
        <p className="text-gray-500 mb-8">
          The page you're looking for doesn't exist. It may have been moved or the URL is incorrect.
        </p>
        <div className="flex gap-4 justify-center">
          <Link to="/" className="btn-secondary px-6">
            <Home className="w-4 h-4" /> Go Home
          </Link>
          <button onClick={() => window.history.back()} className="btn-primary px-6">
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
        </div>
      </motion.div>
    </div>
  );
}
