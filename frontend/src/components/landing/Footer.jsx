import React from 'react';
import { Mail, Linkedin, Twitter, Github } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      id="contact"
      className="relative border-t border-border bg-background"
    >
      <div className="absolute inset-0 grid-pattern opacity-10" />

      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="grid md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white text-4xl font-bold shadow-[0_0_25px_#22c55e80]">
                A
              </div>
              <span className="text-2xl font-bold text-gradient">Aegis AI</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your intelligent shield against financial fraud and compliance
              risks. Powered by next-generation AI.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4 text-primary">
              Quick Links
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="/"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Home
                </a>
              </li>
              <li>
                <a
                  href="#features"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#contact"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold text-lg mb-4 text-primary">
              Services
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="#fraud-detection"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Fraud Detection
                </a>
              </li>
              <li>
                <a
                  href="#invoice-validation"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Invoice Validation
                </a>
              </li>
              <li>
                <a
                  href="#compliance-auditing"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Compliance Auditing
                </a>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h3 className="font-semibold text-lg mb-4 text-primary">Connect</h3>
            <div className="flex gap-3">
              <a
                href="mailto:contact@aegisai.com"
                className="w-12 h-12 rounded-lg bg-secondary hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-center border border-primary/30 hover:border-primary glow-green"
                aria-label="Email"
              >
                <Mail className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-12 h-12 rounded-lg bg-secondary hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-center border border-primary/30 hover:border-primary glow-green"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-12 h-12 rounded-lg bg-secondary hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-center border border-primary/30 hover:border-primary glow-green"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-12 h-12 rounded-lg bg-secondary hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-center border border-primary/30 hover:border-primary glow-green"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-border/50 mt-12 pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            © {currentYear}{' '}
            <span className="text-primary font-semibold">Aegis AI</span>. All
            rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
