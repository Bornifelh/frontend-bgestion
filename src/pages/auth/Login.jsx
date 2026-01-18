import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await login(formData.email, formData.password);
      
      // Vérifier si l'utilisateur doit changer son mot de passe
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
    <div className="card gradient-border">
      {/* Mobile logo */}
      <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <span className="font-display font-bold text-2xl gradient-text">
          GesProjet
        </span>
      </div>

      <div className="text-center mb-8">
        <h2 className="text-2xl font-display font-bold text-surface-100 mb-2">
          Content de vous revoir !
        </h2>
        <p className="text-surface-400">
          Connectez-vous pour accéder à vos projets
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-surface-300 mb-2">
            Adresse email
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="vous@exemple.com"
              className="input pl-12"
              required
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-surface-300 mb-2">
            Mot de passe
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              placeholder="••••••••"
              className="input pl-12 pr-12"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Submit */}
        <motion.button
          type="submit"
          disabled={isLoading}
          whileTap={{ scale: 0.98 }}
          className="btn btn-primary w-full py-3.5"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <span>Se connecter</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </motion.button>
      </form>

      {/* Register link
      <p className="text-center text-surface-400 mt-6">
        Pas encore de compte ?{' '}
        <Link
          to="/register"
          className="text-primary-400 hover:text-primary-300 font-medium"
        >
          Créer un compte
        </Link>
      </p> */}
    </div>
  );
}
