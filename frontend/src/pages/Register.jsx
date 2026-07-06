import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Mail, Lock, User, Building, Eye, EyeOff, AlertCircle, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';

function Register() {
  const [formData, setFormData] = useState({
    fullName: '',
    companyName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'company_user'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await signUp(formData.email, formData.password, {
        fullName: formData.fullName,
        companyName: formData.companyName,
        role: formData.role
      });
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      setError(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#e9edf4] flex items-center justify-center px-4 py-12 font-['SF_Pro_Display',_'Inter',_system-ui,_sans-serif]">
      
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
          <p className="text-[#000e00]/60">Create your account</p>
        </div>

        {/* Register Card */}
        <div className="bg-white rounded-3xl shadow-lg border border-[#000e00]/5 p-8">
          
          <h2 className="text-2xl font-bold text-[#000e00] mb-6">Get Started</h2>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
              <AlertCircle size={20} className="text-red-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
              <p className="text-sm text-red-700 leading-relaxed">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-[#028355]/10 border border-[#028355]/20 rounded-2xl flex items-start gap-3">
              <CheckCircle2 size={20} className="text-[#028355] mt-0.5 flex-shrink-0" strokeWidth={2} />
              <p className="text-sm text-[#028355] leading-relaxed">Account created! Redirecting to dashboard...</p>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-[#000e00]/70 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#000e00]/40" strokeWidth={2} />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="John Doe"
                  required
                  className="w-full pl-12 pr-4 py-3.5 bg-[#e9edf4] border border-[#000e00]/0 rounded-2xl 
                           text-[#000e00] placeholder:text-[#000e00]/40 focus:outline-none focus:ring-2 
                           focus:ring-[#028355]/20 focus:bg-white transition-all duration-200"
                />
              </div>
            </div>

            {/* Company Name */}
            <div>
              <label className="block text-sm font-medium text-[#000e00]/70 mb-2">
                Company Name
              </label>
              <div className="relative">
                <Building size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#000e00]/40" strokeWidth={2} />
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="Your Company Ltd"
                  required
                  className="w-full pl-12 pr-4 py-3.5 bg-[#e9edf4] border border-[#000e00]/0 rounded-2xl 
                           text-[#000e00] placeholder:text-[#000e00]/40 focus:outline-none focus:ring-2 
                           focus:ring-[#028355]/20 focus:bg-white transition-all duration-200"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-[#000e00]/70 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#000e00]/40" strokeWidth={2} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@company.com"
                  required
                  className="w-full pl-12 pr-4 py-3.5 bg-[#e9edf4] border border-[#000e00]/0 rounded-2xl 
                           text-[#000e00] placeholder:text-[#000e00]/40 focus:outline-none focus:ring-2 
                           focus:ring-[#028355]/20 focus:bg-white transition-all duration-200"
                />
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-[#000e00]/70 mb-2">
                Account Type
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-4 py-3.5 bg-[#e9edf4] border border-[#000e00]/0 rounded-2xl 
                         text-[#000e00] focus:outline-none focus:ring-2 focus:ring-[#028355]/20 
                         focus:bg-white transition-all duration-200"
              >
                <option value="company_user">Company User</option>
                <option value="company_admin">Company Admin</option>
                <option value="government_official">Government Official</option>
              </select>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-[#000e00]/70 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#000e00]/40" strokeWidth={2} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
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

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-[#000e00]/70 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#000e00]/40" strokeWidth={2} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="w-full pl-12 pr-4 py-3.5 bg-[#e9edf4] border border-[#000e00]/0 rounded-2xl 
                           text-[#000e00] placeholder:text-[#000e00]/40 focus:outline-none focus:ring-2 
                           focus:ring-[#028355]/20 focus:bg-white transition-all duration-200"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#028355] hover:bg-[#028355]/90 text-white font-semibold rounded-2xl
                       shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 
                       disabled:cursor-not-allowed flex items-center justify-center gap-2.5 mt-6"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" strokeWidth={2.5} />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
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
              <span className="px-4 bg-white text-[#000e00]/50">Already have an account?</span>
            </div>
          </div>

          {/* Sign In Link */}
          <button
            onClick={() => navigate('/login')}
            className="w-full py-4 bg-[#e9edf4] hover:bg-[#000e00]/5 text-[#000e00] font-semibold rounded-2xl
                     border border-[#000e00]/10 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <span>Sign In Instead</span>
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-[#000e00]/40 mt-8">
          By creating an account, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}

export default Register;
