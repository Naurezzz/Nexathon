import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      navigate('/dashboard');
    } catch (error) {
      setError(error.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#e9edf4] flex items-center justify-center px-4 font-['SF_Pro_Display',_'Inter',_system-ui,_sans-serif]">
      
      {/* Decorative Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#028355]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md">
        
        {/* Logo & Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#028355] to-emerald-600 rounded-2xl mb-4 shadow-lg">
            <Shield size={32} className="text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-4xl font-bold text-[#000e00] mb-2">AEGIS AI</h1>
          <p className="text-[#000e00]/60">Sign in to your account</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-lg border border-[#000e00]/5 p-8">
          
          <h2 className="text-2xl font-bold text-[#000e00] mb-6">Welcome Back</h2>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
              <AlertCircle size={20} className="text-red-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
              <p className="text-sm text-red-700 leading-relaxed">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-[#000e00]/70 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#000e00]/40" strokeWidth={2} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  className="w-full pl-12 pr-4 py-3.5 bg-[#e9edf4] border border-[#000e00]/0 rounded-2xl 
                           text-[#000e00] placeholder:text-[#000e00]/40 focus:outline-none focus:ring-2 
                           focus:ring-[#028355]/20 focus:bg-white transition-all duration-200"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-[#000e00]/70 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#000e00]/40" strokeWidth={2} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-12 pr-12 py-3.5 bg-[#e9edf4] border border-[#000e00]/0 rounded-2xl 
                           text-[#000e00] placeholder:text-[#000e00]/40 focus:outline-none focus:ring-2 
                           focus:ring-[#028355]/20 focus:bg-white transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#000e00]/40 hover:text-[#000e00] transition-colors"
                >
                  {showPassword ? <EyeOff size={20} strokeWidth={2} /> : <Eye size={20} strokeWidth={2} />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded border-[#000e00]/20 text-[#028355] focus:ring-[#028355]/20" 
                />
                <span className="text-[#000e00]/70 group-hover:text-[#000e00] transition-colors">Remember me</span>
              </label>
              <button
                type="button"
                className="text-[#028355] hover:text-[#028355]/80 font-medium transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#028355] hover:bg-[#028355]/90 text-white font-semibold rounded-2xl
                       shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 
                       disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" strokeWidth={2.5} />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={20} strokeWidth={2.5} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#000e00]/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-[#000e00]/50">New to AEGIS AI?</span>
            </div>
          </div>

          {/* Sign Up Link */}
          <button
            onClick={() => navigate('/register')}
            className="w-full py-4 bg-[#e9edf4] hover:bg-[#000e00]/5 text-[#000e00] font-semibold rounded-2xl
                     border border-[#000e00]/10 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <span>Create Account</span>
          </button>
        </div>

        {/* Demo Accounts */}
        <div className="mt-6 p-5 bg-white/60 backdrop-blur-sm border border-[#000e00]/5 rounded-2xl">
          <p className="text-xs font-semibold text-[#000e00]/70 mb-3">Demo Accounts:</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#000e00]/60">Company User:</span>
              <code className="px-2 py-1 bg-[#e9edf4] rounded text-[#000e00]/70 font-mono">demo@company.com / demo123</code>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#000e00]/60">Government:</span>
              <code className="px-2 py-1 bg-[#e9edf4] rounded text-[#000e00]/70 font-mono">gov@rbi.gov.in / gov123</code>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-[#000e00]/40 mt-8">
          © 2025 AEGIS AI. Secure financial fraud detection platform.
        </p>
      </div>
    </div>
  );
}

export default Login;
