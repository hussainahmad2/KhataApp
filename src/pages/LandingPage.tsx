import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthModal } from '../components/Auth/AuthModal';
import {
  ChartBarIcon,
  DocumentTextIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

export function LandingPage() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  const features = [
    {
      icon: ChartBarIcon,
      title: 'Financial Dashboard',
      description: 'Get real-time insights into your business performance with comprehensive charts and analytics.',
    },
    {
      icon: DocumentTextIcon,
      title: 'Invoice Management',
      description: 'Create, send, and track invoices with automatic calculations and PDF generation.',
    },
    {
      icon: UsersIcon,
      title: 'Customer & Vendor Management',
      description: 'Maintain detailed records of your customers and vendors with balance tracking.',
    },
    {
      icon: CurrencyDollarIcon,
      title: 'Payment Tracking',
      description: 'Track payments, manage credit limits, and maintain accurate account balances.',
    },
    {
      icon: ShieldCheckIcon,
      title: 'Secure & Reliable',
      description: 'Bank-level security with encrypted data storage and secure authentication.',
    },
    {
      icon: ClockIcon,
      title: 'Payment Reminders',
      description: 'Never miss a payment with automated reminders and due date notifications.',
    },
  ];

  const openAuthModal = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">AsaanKhaata</h1>
              <span className="ml-2 text-sm text-gray-500">by HH Developers</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => openAuthModal('signin')}
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => openAuthModal('signup')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Simplify Your
            <span className="text-blue-600"> Accounting</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            AsaanKhaata is a comprehensive accounting solution designed to streamline your business finances. 
            Manage customers, vendors, invoices, and reports all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => openAuthModal('signup')}
              className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-blue-700 transition-all duration-200 transform hover:scale-105"
            >
              Start Free Trial
            </button>
            <button
              onClick={() => openAuthModal('signin')}
              className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-lg text-lg font-medium hover:bg-blue-50 transition-all duration-200"
            >
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Manage Your Business
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Powerful features designed to help you maintain accurate financial records and grow your business.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-gray-50 p-8 rounded-xl hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1">
                <feature.icon className="h-12 w-12 text-blue-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-blue-100 mb-8 text-lg">
            Join thousands of businesses already using AsaanKhaata to manage their finances.
          </p>
          <button
            onClick={() => openAuthModal('signup')}
            className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-medium hover:bg-gray-50 transition-all duration-200 transform hover:scale-105"
          >
            Get Started Today
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-white text-lg font-semibold mb-2">AsaanKhaata</h3>
            <p className="text-gray-400 mb-4">
              Developed by HH Developers
            </p>
            <a
              href="mailto:hussainahmadbilal@gmail.com"
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              hussainahmadbilal@gmail.com
            </a>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        mode={authMode}
      />
    </div>
  );
}