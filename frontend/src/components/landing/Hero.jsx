import React from 'react';
import { ArrowRight, ChevronDown, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Hero = () => {
  const navigate = useNavigate();

  const scrollToFeatures = () => {
    const featuresSection = document.getElementById('features');
    featuresSection?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-28 md:pt-12 px-6 overflow-hidden">
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 grid-pattern opacity-20" />

      {/* Gradient Overlays */}
      <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-primary/20 to-transparent blur-3xl" />
      <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-gradient-to-tl from-primary/20 to-transparent blur-3xl" />

      {/* Content */}
      <div className="container mx-auto relative z-10">
        <div className="max-w-5xl mx-auto text-center space-y-10 md:space-y-12">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2 bg-secondary/40 backdrop-blur-md border border-primary/30 rounded-full">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm md:text-base font-semibold text-primary">
              Next-Gen AI Security
            </span>
          </div>

          {/* Title */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold leading-tight tracking-tight">
            <span className="text-gradient">Aegis AI</span>
          </h1>

          {/* Subheading */}
          <p className="text-lg sm:text-xl md:text-2xl text-foreground/90 max-w-3xl mx-auto font-light">
            Your intelligent shield against financial fraud and compliance risks
          </p>

          {/* Description */}
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            Harness the power of advanced artificial intelligence to detect
            fraud, validate invoices, and automate compliance — in real-time.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
            <button
              className="group glow-green-strong text-lg md:text-xl px-6 md:px-8 py-5 md:py-6 font-semibold hover:bg-emerald-700 flex items-center"
              onClick={() => navigate('/login')}
            >
              Try It Now
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={scrollToFeatures}
              className="border-primary/50 hover:bg-primary/10 hover:text-white text-lg md:text-xl px-6 md:px-8 py-5 md:py-6 font-semibold flex items-center"
            >
              Show More
              <ChevronDown className="ml-2 h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
