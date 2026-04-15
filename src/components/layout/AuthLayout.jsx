import { motion } from 'framer-motion';
import { CheckCircle2, BarChart3, Users, Zap, Shield, Clock } from 'lucide-react';

const features = [
  { icon: BarChart3, title: 'Tableaux de bord', desc: 'Visualisez vos projets en temps réel' },
  { icon: Users, title: 'Collaboration', desc: 'Travaillez en équipe efficacement' },
  { icon: Zap, title: 'Automations', desc: 'Automatisez vos workflows' },
  { icon: Shield, title: 'Permissions', desc: 'Contrôle d\'accès granulaire' },
  { icon: Clock, title: 'Time Tracking', desc: 'Suivez le temps par tâche' },
];

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex bg-surface-950">
      {/* Subtle background for right panel */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,rgba(0,85,204,0.06),transparent_50%)]" />
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_right,rgba(29,122,252,0.04),transparent_50%)]" />
      </div>

      {/* Left Panel -- Branding */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgMGg2MHY2MEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0zMCAwdjYwTTYwIDMwSDAiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCBmaWxsPSJ1cmwoI2cpIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIi8+PC9zdmc+')] opacity-40" />

        <motion.div
          className="absolute top-20 right-20 w-72 h-72 rounded-full bg-white/5 blur-3xl"
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-32 left-16 w-56 h-56 rounded-full bg-primary-400/10 blur-3xl"
          animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 6, repeat: Infinity, delay: 2 }}
        />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3"
          >
            <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
            </div>
            <span className="font-semibold text-xl text-white tracking-tight">
              GesProjet
            </span>
          </motion.div>

          {/* Hero text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="max-w-lg"
          >
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-[1.15] tracking-tight mb-5">
              Gérez vos projets
              <br />
              avec clarté et
              <br />
              <span className="text-primary-200/70">efficacité.</span>
            </h1>

            <p className="text-lg text-white/50 leading-relaxed max-w-md mb-10">
              Planifiez, suivez et livrez vos projets en équipe.
              Sprints, tableaux, temps passé — tout en un seul endroit.
            </p>

            <div className="space-y-3">
              {features.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.08 }}
                  className="flex items-center gap-3 group"
                >
                  <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center group-hover:bg-white/15 transition-colors">
                    <feature.icon className="w-[18px] h-[18px] text-white/70" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-white/90">{feature.title}</span>
                    <span className="text-sm text-white/40 ml-2">{feature.desc}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Bottom badge */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="flex items-center gap-2 text-white/30 text-sm"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Utilisé par des équipes dans toute l'entreprise</span>
          </motion.div>
        </div>
      </div>

      {/* Right Panel -- Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12 relative">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="w-full max-w-[420px]"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
