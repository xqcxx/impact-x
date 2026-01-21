import { Link, useLocation } from 'react-router-dom';
import { WalletConnect } from './WalletConnect';
import { Zap, Home, PlusCircle, User, Menu, X } from 'lucide-react';
import { useState } from 'react';

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { path: '/', label: 'Campaigns', icon: Home },
    { path: '/create', label: 'Create', icon: PlusCircle },
    { path: '/my-campaigns', label: 'My Campaigns', icon: User },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen relative">
      {/* Floating Glass Navbar */}
      <header className="glass-nav px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <span className="text-xl font-heading font-bold text-primary-400">Impact-X</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                  isActive(path)
                    ? 'bg-primary-500/15 text-primary-400 font-medium'
                    : 'text-dark-300 hover:text-dark-100 hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-body">{label}</span>
              </Link>
            ))}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            <WalletConnect />
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-dark-300 hover:text-dark-100 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden mt-4 pt-4 border-t border-white/10">
            <div className="flex flex-col gap-2">
              {navLinks.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive(path)
                      ? 'bg-primary-500/15 text-primary-400 font-medium'
                      : 'text-dark-300 hover:text-dark-100 hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-body">{label}</span>
                </Link>
              ))}
            </div>
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12">
        {children}
      </main>

      {/* Footer */}
      <footer className="glass-card mx-4 mb-4 mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-dark-900" />
              </div>
              <span className="font-heading font-medium text-dark-100">Impact-X</span>
              <span className="text-dark-600">|</span>
              <span className="text-sm text-dark-400">Cross-chain crowdfunding for Bitcoin builders</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-dark-500">
              <span>Powered by</span>
              <span className="badge-primary">Circle xReserve</span>
              <span className="text-dark-600">&</span>
              <span className="badge-secondary">Stacks</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
