import React from 'react';
import {
  ShieldCheck,
  FileCheck,
  ClipboardList,
  ActivitySquare,
  Link2Off,
  BarChart3,
} from 'lucide-react';

const features = [
  {
    icon: ShieldCheck,
    title: 'Fraud Invoice Detection',
    description:
      'Detect fraudulent or tampered invoices instantly using AI-powered anomaly detection and precision-driven analytics.',
  },
  {
    icon: ClipboardList,
    title: 'Compliance Contract Audit',
    description:
      'Ensure every contract adheres to legal and compliance norms with automated contract audits and intelligent validation.',
  },
  {
    icon: FileCheck,
    title: 'AI Document Verifier',
    description:
      'Validate and verify business documents securely, reducing manual review time and ensuring authenticity.',
  },
  {
    icon: ActivitySquare,
    title: 'Financial Risk Prediction',
    description:
      'Predict financial risks with adaptive AI models that monitor transactions, vendors, and spending patterns.',
  },
  {
    icon: Link2Off,
    title: 'Cyber Threat Analyzer',
    description:
      'Protect your organization from phishing and malicious links with real-time AI scanning and analysis.',
  },
  {
    icon: BarChart3,
    title: 'Risk Network Mapper',
    description:
      'Visualize interconnected risks across departments with dynamic graph intelligence and contextual insights.',
  },
];

const Features = () => {
  return (
    <section
      id="features"
      className="relative py-28 px-6 md:px-12 lg:px-20 overflow-hidden"
    >
      {/* Background Effects */}
      <div className="absolute inset-0 grid-pattern opacity-10" />
      <div className="absolute top-1/3 left-1/4 w-[20rem] h-[20rem] bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 right-1/4 w-[20rem] h-[20rem] bg-primary-glow/10 rounded-full blur-3xl" />

      <div className="container mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-20">
          <span className="px-4 py-1.5 bg-secondary/40 backdrop-blur-md border border-primary/30 rounded-full text-sm font-medium text-primary tracking-wide">
            Core Capabilities
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold mt-6 mb-4 leading-tight">
            Enterprise-Grade <span className="text-gradient">AI Solutions</span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto font-light">
            Redefining security, compliance, and intelligence through
            next-generation AI.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-14">
          {features.map((feature, index) => (
            <div
              key={index}
              className="relative h-full overflow-hidden border border-primary/25 bg-card/60 backdrop-blur-md hover:border-primary/60 transition-all duration-300 group shadow-md hover:shadow-primary/20 hover:-translate-y-2 rounded-xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10 flex flex-col items-start gap-3 p-6">
                <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-all duration-300 glow-green">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg md:text-xl font-semibold tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-sm md:text-base leading-relaxed text-foreground/90">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-20">
          <p className="text-lg text-foreground/80 mb-6 font-light">
            Ready to secure your financial ecosystem?
          </p>
          <button className="px-8 py-3 bg-primary text-primary-foreground rounded-full font-medium text-lg glow-green-strong hover:bg-emerald-700 transition-all hover:scale-105">
            Get Started Today
          </button>
        </div>
      </div>
    </section>
  );
};

export default Features;
