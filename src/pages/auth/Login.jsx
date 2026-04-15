import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focused, setFocused] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await login(formData.email, formData.password);
      
      if (result.user?.mustChangePassword) {
        toast.success('Veuillez définir votre nouveau mot de passe');
        navigate('/change-password');
      } else {
        toast.success('Connexion réussie !');
        navigate('/');
      }
    } catch (error) {
      toast.error(
        error.response?.data?.error || 'Erreur lors de la connexion'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* Mobile logo */}
      <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
        <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
        </div>
        <span className="font-semibold text-xl text-surface-100 tracking-tight">
          GesProjet
        </span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h2 className="text-[28px] font-bold text-surface-100 tracking-tight mb-2">
          Se connecter
        </h2>
        <p className="text-surface-400 text-[15px]">
          Accédez à votre espace de gestion de projet
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email */}
        <div>
          <label className="block text-[13px] font-medium text-surface-300 mb-2 tracking-wide uppercase">
            Adresse email
          </label>
          <div className="relative">
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              onFocus={() => setFocused('email')}
              onBlur={() => setFocused(null)}
              placeholder="vous@entreprise.com"
              className={`w-full px-4 py-3.5 bg-surface-900 border rounded-xl text-surface-100 text-[15px]
                placeholder-surface-500/60 transition-all duration-200 outline-none
                ${focused === 'email' 
                  ? 'border-primary-500 ring-[3px] ring-primary-500/10' 
                  : 'border-surface-700/80 hover:border-surface-600'
                }`}
              required
              autoComplete="email"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-[13px] font-medium text-surface-300 mb-2 tracking-wide uppercase">
            Mot de passe
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              onFocus={() => setFocused('password')}
              onBlur={() => setFocused(null)}
              placeholder="Entrez votre mot de passe"
              className={`w-full px-4 py-3.5 pr-12 bg-surface-900 border rounded-xl text-surface-100 text-[15px]
                placeholder-surface-500/60 transition-all duration-200 outline-none
                ${focused === 'password' 
                  ? 'border-primary-500 ring-[3px] ring-primary-500/10' 
                  : 'border-surface-700/80 hover:border-surface-600'
                }`}
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-surface-500 hover:text-surface-300 hover:bg-surface-800 transition-colors"
            >
              {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
            </button>
          </div>
        </div>

        {/* Submit */}
        <motion.button
          type="submit"
          disabled={isLoading || !formData.email || !formData.password}
          whileTap={{ scale: 0.985 }}
          className="relative w-full py-3.5 rounded-xl font-semibold text-[15px] text-white
            bg-primary-600 hover:bg-primary-500 active:bg-primary-700
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200 shadow-lg shadow-primary-600/20 hover:shadow-primary-500/30
            flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <span>Continuer</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </motion.button>
      </form>

      {/* Divider */}
      <div className="relative my-7">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-surface-800" />
        </div>
      </div>

      {/* Footer */}
      <p className="text-center text-surface-500 text-sm">
        Plateforme sécurisée de gestion de projet
      </p>
    </div>
  );
}
