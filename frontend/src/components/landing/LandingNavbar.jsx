import React, { useState, useEffect } from 'react';
import { Menu, X, ChevronDown, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabase';

const LandingNavbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const services = [
    { name: 'Fraud Invoice Detection', href: '/' },
    { name: 'Compliance Contract Audit', href: '/' },
    { name: 'AI Document Verifier', href: '/' },
    { name: 'Financial Risk Prediction', href: '/' },
    { name: 'Cyber Threat Analyzer', href: '/' },
    { name: 'Risk Network Mapper', href: '/' },
    { name: 'AegisAI Mentor ', href: '/' },
  ];

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    getUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-border">
      <div className="max-w-7xl mx-auto px-6 md:px-2">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <a href="/" className="flex items-center space-x-2 group">
            <div className="w-9 h-9 bg-gradient-to-br from-[#028355] to-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
              <Shield className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-xl md:text-2xl font-bold text-gradient">
              Aegis AI
            </span>
          </a>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-10">
            <a
              href="/"
              className="text-base md:text-lg text-foreground hover:text-primary transition-colors font-medium"
            >
              Home
            </a>

            {/* Services Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsServicesOpen(!isServicesOpen)}
                className="flex items-center text-base md:text-lg text-foreground hover:text-primary transition-colors font-medium focus:outline-none"
              >
                Services <ChevronDown className="ml-1 h-4 w-4 md:h-5 md:w-5" />
              </button>
              {isServicesOpen && (
                <div className="absolute top-full left-0 mt-2 bg-popover/95 backdrop-blur-xl shadow-lg rounded-xl p-1 transition-all duration-300">
                  {services.map((service) => (
                    <a
                      key={service.name}
                      href={service.href}
                      className="block px-4 py-2 text-sm md:text-base rounded-lg transition-all duration-300 hover:bg-primary/10 hover:text-primary hover:scale-[1.02] cursor-pointer"
                      onClick={() => setIsServicesOpen(false)}
                    >
                      {service.name}
                    </a>
                  ))}
                </div>
              )}
            </div>

            <a
              href="/pricing"
              className="text-base md:text-lg text-foreground hover:text-primary transition-colors font-medium"
            >
              Pricing
            </a>

            <a
              href="/contact"
              className="text-base md:text-lg text-foreground hover:text-primary transition-colors font-medium"
            >
              Contact
            </a>

            {user ? (
              <button
                className="text-base md:text-lg px-5 py-2 glow-green bg-emerald-700 hover:bg-emerald-800 transition-all duration-200"
                onClick={() => navigate('/dashboard')}
              >
                Dashboard
              </button>
            ) : (
              <button
                className="text-base md:text-lg px-5 py-2 glow-green bg-emerald-700 hover:bg-emerald-800 transition-all duration-200"
                onClick={() => navigate('/login')}
              >
                Sign In
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-foreground"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden flex flex-col space-y-4 py-4 px-4 border-t border-border bg-background/95 backdrop-blur-md rounded-b-xl animate-fade-in-up">
            <a
              href="/"
              className="block text-base text-foreground hover:text-primary font-medium transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Home
            </a>

            <div>
              <p className="text-sm font-semibold text-primary mb-2">
                Services
              </p>
              <div className="space-y-2">
                {services.map((service) => (
                  <a
                    key={service.name}
                    href={service.href}
                    className="block pl-4 text-sm text-foreground hover:text-primary transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    {service.name}
                  </a>
                ))}
              </div>
            </div>

            <a
              href="/pricing"
              className="block text-base text-foreground hover:text-primary font-medium transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Pricing
            </a>

            <a
              href="/contact"
              className="block text-base text-foreground hover:text-primary font-medium transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Contact
            </a>

            {user ? (
              <button
                className="w-full text-base md:text-lg py-2 bg-emerald-700 hover:bg-emerald-800 glow-green transition-all duration-200"
                onClick={() => {
                  navigate('/dashboard');
                  setIsOpen(false);
                }}
              >
                Dashboard
              </button>
            ) : (
              <button
                className="w-full text-base md:text-lg py-2 bg-emerald-700 hover:bg-emerald-800 glow-green transition-all duration-200"
                onClick={() => {
                  navigate('/login');
                  setIsOpen(false);
                }}
              >
                Sign In
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default LandingNavbar;
