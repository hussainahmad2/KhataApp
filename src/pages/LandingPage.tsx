import React, { useState } from 'react';
import icon from "../assets/icon.png";
import { Link } from 'react-router-dom';
import { AuthModal } from '../components/Auth/AuthModal';
import {
  ChartBarIcon,
  DocumentTextIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

export function LandingPage() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  const features = [
    {
      icon: ChartBarIcon,
      title: 'Financial Dashboard',
      description: 'Get real-time insights into your business performance with comprehensive charts and analytics.',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: DocumentTextIcon,
      title: 'Invoice Management',
      description: 'Create, send, and track invoices with automatic calculations and PDF generation.',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: UsersIcon,
      title: 'Customer & Vendor Management',
      description: 'Maintain detailed records of your customers and vendors with balance tracking.',
      color: 'from-orange-500 to-red-500',
    },
    {
      icon: CurrencyDollarIcon,
      title: 'Payment Tracking',
      description: 'Track payments, manage credit limits, and maintain accurate account balances.',
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: ShieldCheckIcon,
      title: 'Secure & Reliable',
      description: 'Bank-level security with encrypted data storage and secure authentication.',
      color: 'from-indigo-500 to-blue-500',
    },
    {
      icon: ClockIcon,
      title: 'Payment Reminders',
      description: 'Never miss a payment with automated reminders and due date notifications.',
      color: 'from-yellow-500 to-orange-500',
    },
  ];

  const benefits = [
    'No credit card required',
    'Free 30-day trial',
    'Cancel anytime',
    '24/7 customer support',
  ];

  const openAuthModal = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-lg shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-3">
              <img 
                src={`${process.env.PUBLIC_URL}/icon.png`} 
                alt="AsaanKhaata Logo" 
                className="w-10 h-10 rounded-lg"
              />
                <h1 className="text-xl font-bold text-gray-900">AsaanKhaata</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => openAuthModal('signin')}
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors px-4 py-2"
              >
                Sign In
              </button>
              <button
                onClick={() => openAuthModal('signup')}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-lg shadow-blue-500/30"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"></div>
        <div className="absolute top-20 right-0 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full mb-6">
                <span className="text-sm font-semibold">✨ Simple. Powerful. Efficient.</span>
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                Simplify Your
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> Business</span>
                <br />Accounting
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                AsaanKhaata helps you manage invoices, track payments, and maintain customer records—all in one powerful platform. Focus on growing your business while we handle the numbers.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <button
                  onClick={() => openAuthModal('signup')}
                  className="group bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40 transform hover:-translate-y-1 flex items-center justify-center"
                >
                  Start Free Trial
                  <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
              <div className="flex flex-wrap gap-6 justify-center lg:justify-start">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                    <span className="text-gray-600 text-sm">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl transform rotate-6 opacity-10"></div>
              <img
                src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&h=600&fit=crop"
                alt="Business accounting dashboard"
                className="relative rounded-3xl shadow-2xl w-full h-auto transform hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { number: '10K+', label: 'Active Users' },
              { number: '50K+', label: 'Invoices Generated' },
              { number: '99.9%', label: 'Uptime' },
              { number: '24/7', label: 'Support' },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Powerful features designed to streamline your accounting workflow and help your business grow faster.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="group bg-white p-8 rounded-2xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200"
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
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

      {/* Visual Feature Showcase */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-20">
            <div>
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Beautiful Dashboards That Tell Your Story
              </h3>
              <p className="text-lg text-gray-600 mb-6">
                Visualize your business performance with intuitive charts and real-time analytics. Make data-driven decisions with confidence.
              </p>
              <ul className="space-y-4">
                {['Real-time financial insights', 'Customizable reports', 'Revenue tracking', 'Expense management'].map((item, index) => (
                  <li key={index} className="flex items-center space-x-3">
                    <CheckCircleIcon className="w-6 h-6 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop"
                alt="Analytics dashboard"
                className="rounded-2xl shadow-2xl w-full h-auto"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 relative">
              <img
                src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop"
                alt="Invoice management"
                className="rounded-2xl shadow-2xl w-full h-auto"
              />
            </div>
            <div className="order-1 lg:order-2">
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Professional Invoicing Made Easy
              </h3>
              <p className="text-lg text-gray-600 mb-6">
                Create stunning invoices in seconds, send them with one click, and get paid faster. Track everything from creation to payment.
              </p>
              <ul className="space-y-4">
                {['Custom invoice templates', 'Automatic calculations', 'PDF generation', 'Payment tracking'].map((item, index) => (
                  <li key={index} className="flex items-center space-x-3">
                    <CheckCircleIcon className="w-6 h-6 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600"></div>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl text-blue-100 mb-10 leading-relaxed">
            Join thousands of businesses already using AsaanKhaata to streamline their accounting and focus on what matters most—growth.
          </p>
          <button
            onClick={() => openAuthModal('signup')}
            className="bg-white text-blue-600 px-10 py-5 rounded-xl text-lg font-bold hover:bg-gray-50 transition-all duration-200 shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 inline-flex items-center"
          >
            Start Your Free Trial
            <ArrowRightIcon className="w-5 h-5 ml-2" />
          </button>
          <p className="text-blue-100 mt-6">No credit card required • Free for 30 days</p>
        </div>
      </section>

      {/* Footer */}
     <footer className="bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center space-x-3 mb-4">
              {/* Logo Implementation */}
              <img
                src={`${process.env.PUBLIC_URL}/icon.png`}
                alt="AsaanKhaata Logo"
                className="w-10 h-10 rounded-lg"
              />
              <h3 className="text-white text-xl font-bold">AsaanKhaata</h3>
            </div>
            <p className="text-gray-400">
              Simplifying accounting for businesses everywhere.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Pricing
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Security
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info and Image */}
          <div className="relative">
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <p className="text-gray-400 mb-2">Developed by HA Developers</p>
            <a
              href="mailto:hussainahmadbilal@gmail.com"
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              hussainahmadbilal@gmail.com
            </a>

            {/* Hussain Image - Hidden on small screens, shown on large */}
            <div className="hidden lg:block absolute top-0 -right-44">
              <img
                src={`${process.env.PUBLIC_URL}/hussain.jpg`}
                alt="Hussain Ahmad Bilal"
                className="w-40 h-auto rounded-xl shadow-2xl ring-2 ring-blue-500/50"
              />
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 pt-8 text-center">
          <p className="text-gray-400">
            © 2025 AsaanKhaata. All rights reserved.
          </p>
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