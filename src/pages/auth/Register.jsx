import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';

export default function Register() {
  const navigate = useNavigate();
  const register = useAuthStore((state) => state.register);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setIsLoading(true);

    try {
      await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
      });
      toast.success('Compte créé avec succès !');
      navigate('/');
    } catch (error) {
      toast.error(
        error.response?.data?.error || 'Erreur lors de l\'inscription'
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
          Créer un compte
        </h2>
        <p className="text-surface-400">
          Rejoignez GesProjet et boostez votre productivité
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-2">
              Prénom
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                placeholder="Jean"
                className="input pl-12"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-2">
              Nom
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) =>
                setFormData({ ...formData, lastName: e.target.value })
              }
              placeholder="Dupont"
              className="input"
              required
            />
          </div>
        </div>

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

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium text-surface-300 mb-2">
            Confirmer le mot de passe
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              placeholder="••••••••"
              className="input pl-12"
              required
            />
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
              <span>Créer mon compte</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </motion.button>
      </form>

      {/* Login link */}
      <p className="text-center text-surface-400 mt-6">
        Déjà un compte ?{' '}
        <Link
          to="/login"
          className="text-primary-400 hover:text-primary-300 font-medium"
        >
          Se connecter
        </Link>
      </p>
    </div>
  );
}
