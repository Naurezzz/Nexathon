import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import LandingNavbar from '../components/landing/LandingNavbar';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../config/supabase';

const plans = [
  {
    name: 'Free Trial',
    price: 0,
    label: '1 Month Trial',
    description: 'Limited access to core AI tools for initial evaluation.',
    features: [
      'Fraud & Compliance Checks: 20 /month',
      'Document Validation: 10 /month',
      'Phishing Detection: 20 /month',
      'Financial Risk Analysis: 5 /month',
      'AI Mentor Hub: 10 requests',
      'Basic Analytics Dashboard',
      'Email Support (48h)',
    ],
    button: 'Start Trial',
  },
  {
    name: 'Pro',
    price: 4499,
    label: '₹4,499 / 3 months',
    description: 'Enhanced limits with analytics and team-ready features.',
    features: [
      'All Free Trial features',
      'Up to 100 scans /month',
      '50 Document Validations',
      '20 Risk Analyses',
      '30 AI Mentor Requests',
      'Advanced Analytics',
      'Monthly Reports',
      'Priority Support (24h)',
      'Community Access',
    ],
    button: 'Get Pro',
  },
  {
    name: 'Enterprise',
    price: 7999,
    label: '₹7,999 / 3 months',
    description: 'Unlimited access, custom integrations, and dedicated support.',
    features: [
      'Unlimited Access to All Models',
      'Risk Network Mapper',
      'Custom AI Training',
      'ERP/CRM Integration',
      'Security Reports',
      'Dedicated Manager',
      '24/7 Premium Support',
      'Custom Onboarding',
    ],
    button: 'Get Enterprise',
  },
];

const NAVBAR_HEIGHT_PX = 80;
const MAX_FEATURES = Math.max(...plans.map((plan) => plan.features.length));

const PricingPage = ({ mode = 'default' }) => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const isDashboardMode = mode === 'dashboard';

  // ✅ Get current user plan
  const currentPlan = user?.user_metadata?.plan || 'none';

  // 🧠 Helper to get button text based on user's current plan
  const getButtonLabel = (planName) => {
    if (currentPlan === planName) return 'Current Plan';

    if (currentPlan === 'none') return plans.find((p) => p.name === planName)?.button;

    if (currentPlan === 'Free Trial' && planName === 'Pro') return 'Upgrade to Pro';
    if (currentPlan === 'Free Trial' && planName === 'Enterprise')
      return 'Upgrade to Enterprise';
    if (currentPlan === 'Pro' && planName === 'Enterprise') return 'Upgrade to Enterprise';

    return 'Current Plan';
  };

  // 🧾 Handle Payment or Free Plan Activation
  const handlePayment = async (plan) => {
    if (!user) {
      toast.error('Please log in to continue with the payment.');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    // 🟢 Free plan (activate directly)
    if (plan.price === 0) {
      try {
        await supabase.auth.updateUser({ data: { plan: plan.name } });
        toast.success('Free trial activated successfully!');

        // ✅ Update plan in your backend database
        const token = (await user.getIdToken?.()) || user.access_token;
        await fetch('http://localhost:4000/api/usage/update-plan', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ newPlan: plan.name }),
        });

        setTimeout(() => navigate('/dashboard'), 2000);
      } catch (error) {
        console.error('❌ Error activating free trial:', error);
        toast.error('Something went wrong. Please try again later.');
      }
      return;
    }

    // 💳 Paid Plans
    setLoading(true);
    try {
      console.log(plan.price);
      const response = await fetch('http://localhost:4000/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: plan.price }),
      });

      const data = await response.json();

      if (data.orderId) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => {
          const options = {
            key: 'rzp_test_RZ0PAQ8H3wbM1t',
            amount: plan.price * 100,
            currency: 'INR',
            name: 'AEGIS AI',
            description: `${plan.name} Plan Subscription`,
            order_id: data.orderId,
            handler: async (response) => {
              toast.success('Payment Successful! Verifying...');

              const verifyPayload = {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                userId: user.id,
                plan: plan.name,
              };

              const verifyRes = await fetch('http://localhost:4000/api/razorpay/verify-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(verifyPayload),
              });

              const verifyData = await verifyRes.json();

              if (verifyData.status === 'success') {
                // ✅ Update Supabase plan
                await supabase.auth.updateUser({ data: { plan: plan.name } });

                // ✅ Also update backend usage plan
                const token = (await user.getIdToken?.()) || user.access_token;
                await fetch('http://localhost:4000/api/usage/update-plan', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({ newPlan: plan.name }),
                });

                toast.success(`${plan.name} plan activated!`);
                setTimeout(() => navigate('/dashboard'), 2000);
              } else {
                toast.error('Payment verification failed. Please contact support.');
              }
            },
            prefill: {
              name: user?.user_metadata?.full_name || 'User',
              email: user?.email || '',
              contact: '9999999999',
            },
            theme: { color: '#028355' },
          };

          const paymentObject = new window.Razorpay(options);
          paymentObject.open();
          setLoading(false);
        };

        document.body.appendChild(script);
      } else {
        toast.error('Error creating order.');
        setLoading(false);
      }
    } catch (error) {
      console.error('🔥 Payment flow error:', error);
      toast.error('Something went wrong. Try again later.');
      setLoading(false);
    }
  };

  return (
    <div
      className={`${
        isDashboardMode
          ? "bg-[#e9edf4] min-h-screen font-['SF_Pro_Display',_'Inter',_system-ui,_sans-serif] px-6 sm:px-8 lg:px-10 py-8 sm:py-12"
          : "relative min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white font-['Inter',_sans-serif]"
      }`}
    >
      {!isDashboardMode && <LandingNavbar />}

      <div
        className="w-full flex flex-col items-center justify-center px-6 md:px-10"
        style={{
          paddingTop: isDashboardMode ? '' : `${NAVBAR_HEIGHT_PX}px`,
          minHeight: isDashboardMode ? '' : `calc(100vh - ${NAVBAR_HEIGHT_PX}px)`,
        }}
      >
        <h1
          className={`text-4xl md:text-5xl font-bold text-center mb-3 ${
            isDashboardMode
              ? 'text-[#000e00]'
              : 'bg-gradient-to-r from-green-400 to-teal-500 bg-clip-text text-transparent'
          }`}
        >
          Pricing Plans
        </h1>

        <p
          className={`text-center max-w-3xl mx-auto mb-10 text-sm md:text-base leading-relaxed ${
            isDashboardMode ? 'text-[#000e00]/70' : 'text-gray-300'
          }`}
        >
          Choose the perfect plan for your business needs. Unlock AI-powered compliance,
          validation, and financial intelligence with scalable access.
        </p>

        {/* ✅ Plans Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl">
          {plans.map((plan, index) => {
            const buttonLabel = getButtonLabel(plan.name);
            const isCurrentPlan = currentPlan === plan.name;
            const isUpgrade = buttonLabel.toLowerCase().includes('upgrade');

            return (
              <div
                key={plan.name}
                className={`rounded-2xl shadow-xl transition-all duration-300 p-8 flex flex-col justify-between border 
                  ${
                    isCurrentPlan
                      ? 'border-emerald-500 bg-emerald-50'
                      : isDashboardMode
                      ? 'bg-white border-[#000e00]/10 hover:shadow-lg'
                      : 'border-white/10 backdrop-blur-xl bg-white/10 hover:bg-white/15 hover:shadow-[0_0_15px_#22c55e25]'
                  }`}
              >
                <div>
                  <h2
                    className={`text-2xl font-semibold mb-2 ${
                      isDashboardMode ? 'text-[#028355]' : 'text-emerald-400'
                    }`}
                  >
                    {plan.name}
                  </h2>
                  <p
                    className={`text-xl font-bold mb-3 ${
                      isDashboardMode ? 'text-[#000e00]' : 'text-white'
                    }`}
                  >
                    {plan.label}
                  </p>
                  <p
                    className={`text-sm mb-4 ${
                      isDashboardMode ? 'text-[#000e00]/70' : 'text-gray-400'
                    }`}
                  >
                    {plan.description}
                  </p>
                  <ul
                    className={`mb-6 text-left space-y-2 text-sm ${
                      isDashboardMode ? 'text-[#000e00]/80' : 'text-gray-200'
                    }`}
                  >
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <svg
                          className={`w-4 h-4 mt-[3px] flex-shrink-0 ${
                            isDashboardMode ? 'text-[#028355]' : 'text-emerald-400'
                          }`}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          ></path>
                        </svg>
                        <span>{feature}</span>
                      </li>
                    ))}
                    {Array.from({
                      length: MAX_FEATURES - plan.features.length,
                    }).map((_, i) => (
                      <li key={i} style={{ visibility: 'hidden' }}>
                        blank
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  className={`w-full py-3 rounded-xl font-semibold transition-all text-sm ${
                    isCurrentPlan
                      ? 'bg-gray-400 cursor-not-allowed text-white'
                      : isUpgrade
                      ? 'text-white bg-amber-500 hover:bg-amber-600'
                      : isDashboardMode
                      ? 'text-white bg-[#028355] hover:bg-[#028355]/90'
                      : 'text-white bg-emerald-500 hover:bg-emerald-600'
                  }`}
                  type="button"
                  onClick={() => handlePayment(plan)}
                  disabled={loading || isCurrentPlan}
                >
                  {loading ? 'Processing...' : buttonLabel}
                </button>
              </div>
            );
          })}
        </div>

        <p
          className={`m-10 text-center max-w-2xl mx-auto text-sm md:text-base ${
            isDashboardMode ? 'text-[#000e00]/50' : 'text-gray-500'
          }`}
        >
          *Custom pricing available for government and large enterprise clients. Contact us for
          tailored quotes and onboarding.
        </p>
      </div>
    </div>
  );
};

export default PricingPage;
