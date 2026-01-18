import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, Shield, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { authApi } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';

export default function ChangePassword() {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Password strength requirements
  const requirements = [
    { label: 'Au moins 6 caractères', test: (p) => p.length >= 6 },
    { label: 'Une lettre majuscule', test: (p) => /[A-Z]/.test(p) },
    { label: 'Une lettre minuscule', test: (p) => /[a-z]/.test(p) },
    { label: 'Un chiffre', test: (p) => /\d/.test(p) },
  ];

  const passwordStrength = requirements.filter(r => r.test(newPassword)).length;
  const passwordsMatch = newPassword === confirmPassword && newPassword.length > 0;
  const isValid = passwordStrength >= 2 && newPassword.length >= 6 && passwordsMatch;

  const getStrengthColor = () => {
    if (passwordStrength <= 1) return 'bg-red-500';
    if (passwordStrength <= 2) return 'bg-orange-500';
    if (passwordStrength <= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthLabel = () => {
    if (passwordStrength <= 1) return 'Faible';
    if (passwordStrength <= 2) return 'Moyen';
    if (passwordStrength <= 3) return 'Fort';
    return 'Très fort';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;

    setLoading(true);
    setError('');

    try {
      await authApi.changeTempPassword({ newPassword });
      setSuccess(true);
      
      // Update user state to remove mustChangePassword flag
      if (user) {
        setUser({ ...user, mustChangePassword: false });
      }
      
      // Redirect after success
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors du changement de mot de passe');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-surface-900 via-surface-900 to-primary-900/20 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card p-8 max-w-md w-full text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle2 className="w-10 h-10 text-green-400" />
          </motion.div>
          <h2 className="text-2xl font-bold text-surface-100 mb-2">Mot de passe modifié !</h2>
          <p className="text-surface-400 mb-4">Votre nouveau mot de passe a été enregistré avec succès.</p>
          <p className="text-sm text-surface-500">Redirection en cours...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-900 via-surface-900 to-primary-900/20 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-8 max-w-md w-full"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-primary-400" />
          </div>
          <h1 className="text-2xl font-bold text-surface-100 mb-2">
            Changez votre mot de passe
          </h1>
          <p className="text-surface-400">
            Pour des raisons de sécurité, vous devez définir un nouveau mot de passe avant de continuer.
          </p>
        </div>

        {/* Alert */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-400">Mot de passe temporaire</p>
            <p className="text-amber-400/70 mt-1">
              Votre compte a été créé avec un mot de passe temporaire. Définissez un mot de passe personnel pour sécuriser votre compte.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-2">
              Nouveau mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-11 pr-11 py-3 bg-surface-800 border border-surface-700 rounded-lg focus:outline-none focus:border-primary-500 text-surface-100"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Password strength */}
            {newPassword && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-surface-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(passwordStrength / 4) * 100}%` }}
                      className={`h-full ${getStrengthColor()} transition-colors`}
                    />
                  </div>
                  <span className={`text-xs font-medium ${
                    passwordStrength <= 1 ? 'text-red-400' :
                    passwordStrength <= 2 ? 'text-orange-400' :
                    passwordStrength <= 3 ? 'text-yellow-400' : 'text-green-400'
                  }`}>
                    {getStrengthLabel()}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  {requirements.map((req, i) => (
                    <div 
                      key={i}
                      className={`flex items-center gap-1.5 text-xs ${
                        req.test(newPassword) ? 'text-green-400' : 'text-surface-500'
                      }`}
                    >
                      {req.test(newPassword) ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5" />
                      )}
                      {req.label}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-2">
              Confirmer le mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500" />
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full pl-11 pr-11 py-3 bg-surface-800 border rounded-lg focus:outline-none text-surface-100 ${
                  confirmPassword && !passwordsMatch 
                    ? 'border-red-500 focus:border-red-500' 
                    : passwordsMatch 
                      ? 'border-green-500 focus:border-green-500'
                      : 'border-surface-700 focus:border-primary-500'
                }`}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300"
              >
                {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {confirmPassword && !passwordsMatch && (
              <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5" />
                Les mots de passe ne correspondent pas
              </p>
            )}
            {passwordsMatch && (
              <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Les mots de passe correspondent
              </p>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!isValid || loading}
            className="w-full py-3 bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-500 hover:to-purple-500 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                />
                Enregistrement...
              </>
            ) : (
              <>
                <Shield className="w-5 h-5" />
                Définir mon mot de passe
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
