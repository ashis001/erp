"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from 'react';
import { loginUser } from '@/lib/actions';
import { useRouter } from 'next/navigation';
import { Loader2, Eye, EyeOff, Lock, User } from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);

    const result = await loginUser(formData);

    setIsLoading(false);

    if (result.error) {
      setError(result.error);
    } else if (result.success && result.user) {
      localStorage.setItem('currentUser', result.user.id.toString());
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100">
        {/* Floating geometric shapes */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-orange-200/30 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-amber-200/40 rounded-full blur-lg animate-bounce"></div>
        <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-orange-300/20 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-20 right-1/3 w-28 h-28 bg-amber-300/30 rounded-full blur-xl animate-bounce"></div>
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,165,0,0.3) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>
      </div>
      
      {/* Main Container */}
      <div className="relative z-10 min-h-screen flex">
        
        {/* Left Side - Enhanced Illustration */}
        <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12">
          <div className="max-w-lg">
            {/* Enhanced Illustration SVG */}
            <div className="relative">
              <svg width="500" height="400" viewBox="0 0 500 400" className="w-full h-auto drop-shadow-2xl">
                {/* Background elements */}
                <defs>
                  <linearGradient id="phoneGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f97316" />
                    <stop offset="100%" stopColor="#ea580c" />
                  </linearGradient>
                  <linearGradient id="screenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="100%" stopColor="#f8fafc" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge> 
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                
                {/* Phone mockup with gradient */}
                <rect x="150" y="60" width="200" height="280" rx="25" fill="url(#phoneGradient)" filter="url(#glow)"/>
                <rect x="165" y="85" width="170" height="230" rx="15" fill="url(#screenGradient)"/>
                
                {/* Screen content - Dashboard mockup */}
                <circle cx="250" cy="120" r="20" fill="#f97316"/>
                <text x="250" y="127" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">GM</text>
                
                {/* Dashboard elements */}
                <rect x="185" y="150" width="130" height="12" rx="6" fill="#fed7aa"/>
                <rect x="185" y="170" width="100" height="12" rx="6" fill="#fdba74"/>
                <rect x="185" y="190" width="110" height="12" rx="6" fill="#fb923c"/>
                
                {/* Charts representation */}
                <rect x="185" y="220" width="40" height="30" rx="4" fill="#f97316" opacity="0.8"/>
                <rect x="235" y="210" width="40" height="40" rx="4" fill="#ea580c" opacity="0.8"/>
                <rect x="285" y="225" width="40" height="25" rx="4" fill="#c2410c" opacity="0.8"/>
                
                {/* Person illustration - more detailed */}
                <circle cx="380" cy="140" r="25" fill="#fed7aa"/>
                <rect x="365" y="165" width="30" height="50" rx="15" fill="#f97316"/>
                <rect x="355" y="180" width="50" height="40" rx="20" fill="#1f2937"/>
                
                {/* Laptop */}
                <rect x="80" y="200" width="120" height="80" rx="8" fill="#374151"/>
                <rect x="90" y="210" width="100" height="60" rx="4" fill="#f8fafc"/>
                <rect x="100" y="220" width="80" height="4" rx="2" fill="#f97316"/>
                <rect x="100" y="230" width="60" height="4" rx="2" fill="#fdba74"/>
                <rect x="100" y="240" width="70" height="4" rx="2" fill="#fb923c"/>
                
                {/* Floating elements with animation effect */}
                <circle cx="100" cy="100" r="12" fill="#10b981" opacity="0.7"/>
                <circle cx="400" cy="250" r="8" fill="#f59e0b" opacity="0.7"/>
                <circle cx="120" cy="320" r="10" fill="#8b5cf6" opacity="0.6"/>
                <rect x="350" y="80" width="20" height="20" rx="10" fill="#ec4899" opacity="0.6"/>
                
                {/* Decorative plants */}
                <ellipse cx="60" cy="350" rx="15" ry="30" fill="#22c55e" opacity="0.6"/>
                <ellipse cx="450" cy="320" rx="12" ry="25" fill="#16a34a" opacity="0.6"/>
              </svg>
              
              {/* Floating badges */}
              <div className="absolute top-4 right-4 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg animate-bounce">
                Live Dashboard
              </div>
              <div className="absolute bottom-8 left-4 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg animate-pulse">
                Real-time Data
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Side - Enhanced Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            
            {/* Logo Section - Enhanced */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center mb-6">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg flex items-center justify-center">
                      <span className="text-white font-bold text-lg">GM</span>
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-400 rounded-full border-2 border-white animate-pulse"></div>
                  </div>
                  <div className="text-left">
                    <span className="text-lg font-bold text-gray-800 tracking-wide">GOVINDA MART</span>
                    <p className="text-xs text-gray-500 font-medium">Inventory Management</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Login Card - Enhanced */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/50 p-8 relative overflow-hidden">
              
              {/* Decorative background pattern */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-100 to-transparent rounded-full blur-3xl opacity-50"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-amber-100 to-transparent rounded-full blur-2xl opacity-40"></div>
              
              {/* Welcome Header */}
              <div className="mb-8 relative z-10">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">Welcome back</h2>
                <p className="text-gray-600">Sign in to access your dashboard</p>
              </div>
              
              {/* Login Form */}
              <div className="space-y-6 relative z-10">
                
                {/* Email Field */}
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                    Email Address
                  </label>
                  <div className="relative group">
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 bg-gray-50/50 focus:bg-white hover:border-orange-300 group-hover:shadow-md"
                      placeholder="Enter your email address"
                      required
                    />
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-orange-500 transition-colors duration-300" />
                  </div>
                </div>
                
                {/* Password Field */}
                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                    Password
                  </label>
                  <div className="relative group">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-14 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 bg-gray-50/50 focus:bg-white hover:border-orange-300 group-hover:shadow-md"
                      placeholder="Enter your password"
                      required
                    />
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-orange-500 transition-colors duration-300" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors duration-300 p-1"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
                
                {/* Error Message */}
                {error && (
                  <div className="p-4 bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-xl animate-shake">
                    <p className="text-sm text-red-600 text-center font-medium">{error}</p>
                  </div>
                )}
                
                {/* Sign In Button */}
                <Button
                  onClick={handleLogin}
                  disabled={isLoading}
                  className="w-full h-14 bg-gradient-to-r from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                      <span>Signing you in...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="mr-3 h-5 w-5" />
                      <span>Sign in to Dashboard</span>
                    </>
                  )}
                </Button>
                
                
              </div>
              
            </div>
            
            {/* Footer */}
            <div className="text-center mt-8">
              <p className="text-sm text-gray-500 font-medium">
                © 2025 Govinda Mart. All rights reserved.
              </p>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
