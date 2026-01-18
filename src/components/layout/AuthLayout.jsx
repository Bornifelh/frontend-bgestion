import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex bg-surface-950 bg-grid">
      {/* Background effects */}
      <div className="fixed inset-0 bg-gradient-radial pointer-events-none" />
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-primary-600/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] pointer-events-none" />

      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-12 relative">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center shadow-glow">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <span className="font-display font-bold text-4xl gradient-text">
              GesProjet
            </span>
          </div>

          <h1 className="text-5xl font-display font-bold text-surface-100 leading-tight mb-6">
            Gérez vos projets
            <br />
            <span className="gradient-text">simplement et efficacement</span>
          </h1>

          <p className="text-lg text-surface-400 leading-relaxed max-w-md">
            Une plateforme moderne de gestion de projet pour organiser, 
            collaborer et suivre vos tâches en temps réel.
          </p>

          {/* Features */}
          <div className="mt-12 grid grid-cols-2 gap-6">
            {[
              { icon: '📋', title: 'Tableaux personnalisables' },
              { icon: '👥', title: 'Collaboration temps réel' },
              { icon: '📊', title: 'Vues multiples' },
              { icon: '🔔', title: 'Notifications intelligentes' },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="flex items-center gap-3 p-4 rounded-xl bg-surface-900/50 border border-surface-800"
              >
                <span className="text-2xl">{feature.icon}</span>
                <span className="text-sm font-medium text-surface-300">
                  {feature.title}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
