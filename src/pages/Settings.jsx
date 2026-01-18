import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, Lock, Bell, Palette, Save, Check, Moon, Sun, Monitor,
  Mail, MessageSquare, AlertTriangle, CheckCircle, Globe, Volume2
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { userApi, authApi } from '../lib/api';
import toast from 'react-hot-toast';

export default function Settings() {
  const { user, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    mentionNotifications: true,
    taskAssigned: true,
    taskCompleted: true,
    comments: true,
    deadlineReminder: true,
    weeklyDigest: false,
  });

  // Appearance settings
  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: 'dark',
    accentColor: '#6366f1',
    fontSize: 'medium',
    compactMode: false,
    animations: true,
  });

  // Load settings from localStorage
  useEffect(() => {
    const savedNotifs = localStorage.getItem('notificationSettings');
    if (savedNotifs) {
      try {
        setNotificationSettings(JSON.parse(savedNotifs));
      } catch (e) {}
    }
    
    const savedAppearance = localStorage.getItem('appearanceSettings');
    if (savedAppearance) {
      try {
        setAppearanceSettings(JSON.parse(savedAppearance));
      } catch (e) {}
    }
  }, []);

  const tabs = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'security', label: 'Sécurité', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Apparence', icon: Palette },
  ];

  const handleProfileSave = async () => {
    setIsLoading(true);
    try {
      const response = await userApi.updateProfile(profileData);
      updateUser(response.data);
      toast.success('Profil mis à jour');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success('Mot de passe modifié');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      toast.error(
        error.response?.data?.error || 'Erreur lors du changement de mot de passe'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationSave = () => {
    localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));
    toast.success('Préférences de notifications enregistrées');
  };

  const handleAppearanceSave = () => {
    localStorage.setItem('appearanceSettings', JSON.stringify(appearanceSettings));
    // Apply theme changes
    document.documentElement.style.setProperty('--accent-color', appearanceSettings.accentColor);
    toast.success('Préférences d\'apparence enregistrées');
  };

  const accentColors = [
    { name: 'Indigo', value: '#6366f1' },
    { name: 'Violet', value: '#8b5cf6' },
    { name: 'Rose', value: '#ec4899' },
    { name: 'Cyan', value: '#06b6d4' },
    { name: 'Émeraude', value: '#10b981' },
    { name: 'Ambre', value: '#f59e0b' },
    { name: 'Rouge', value: '#ef4444' },
  ];

  const NotificationToggle = ({ label, description, icon: Icon, checked, onChange }) => (
    <div className="flex items-center justify-between py-4 border-b border-surface-700/50 last:border-0">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-surface-800 flex items-center justify-center">
          <Icon className="w-5 h-5 text-surface-400" />
        </div>
        <div>
          <p className="font-medium text-surface-200">{label}</p>
          <p className="text-sm text-surface-500">{description}</p>
        </div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          checked ? 'bg-primary-500' : 'bg-surface-700'
        }`}
      >
        <motion.div
          animate={{ x: checked ? 24 : 2 }}
          className="absolute top-1 w-4 h-4 bg-white rounded-full"
        />
      </button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-display font-bold text-surface-100">
          Paramètres
        </h1>
        <p className="text-surface-400">
          Gérez votre compte et vos préférences
        </p>
      </motion.div>

      <div className="flex gap-8">
        {/* Sidebar */}
        <nav className="w-48 space-y-1 flex-shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === tab.id
                  ? 'bg-primary-600/20 text-primary-400'
                  : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeTab === 'profile' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card"
            >
              <h2 className="text-xl font-semibold text-surface-100 mb-6">
                Informations du profil
              </h2>

              <div className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="avatar w-20 h-20 text-2xl">
                    {user?.firstName?.[0]}
                    {user?.lastName?.[0]}
                  </div>
                  <div>
                    <p className="font-medium text-surface-100">
                      Photo de profil
                    </p>
                    <p className="text-sm text-surface-500 mb-2">
                      JPG, PNG ou GIF. Max 2MB.
                    </p>
                    <button className="btn btn-secondary text-sm py-2">
                      Changer
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-surface-300 mb-2">
                      Prénom
                    </label>
                    <input
                      type="text"
                      value={profileData.firstName}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          firstName: e.target.value,
                        })
                      }
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-300 mb-2">
                      Nom
                    </label>
                    <input
                      type="text"
                      value={profileData.lastName}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          lastName: e.target.value,
                        })
                      }
                      className="input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={user?.email}
                    disabled
                    className="input bg-surface-800/30 text-surface-500"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleProfileSave}
                    disabled={isLoading}
                    className="btn btn-primary"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Enregistrer</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'security' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card"
            >
              <h2 className="text-xl font-semibold text-surface-100 mb-6">
                Changer le mot de passe
              </h2>

              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-2">
                    Mot de passe actuel
                  </label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        currentPassword: e.target.value,
                      })
                    }
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-2">
                    Nouveau mot de passe
                  </label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        newPassword: e.target.value,
                      })
                    }
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-2">
                    Confirmer le mot de passe
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="input"
                  />
                </div>

                <div className="pt-4">
                  <button
                    onClick={handlePasswordChange}
                    disabled={isLoading}
                    className="btn btn-primary"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Changer le mot de passe</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'notifications' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card"
            >
              <h2 className="text-xl font-semibold text-surface-100 mb-6">
                Préférences de notifications
              </h2>

              <div className="space-y-1">
                <NotificationToggle
                  label="Notifications par email"
                  description="Recevez des emails pour les mises à jour importantes"
                  icon={Mail}
                  checked={notificationSettings.emailNotifications}
                  onChange={(v) => setNotificationSettings({ ...notificationSettings, emailNotifications: v })}
                />
                <NotificationToggle
                  label="Notifications push"
                  description="Notifications en temps réel dans l'application"
                  icon={Bell}
                  checked={notificationSettings.pushNotifications}
                  onChange={(v) => setNotificationSettings({ ...notificationSettings, pushNotifications: v })}
                />
                <NotificationToggle
                  label="Mentions"
                  description="Quand quelqu'un vous mentionne dans un commentaire"
                  icon={MessageSquare}
                  checked={notificationSettings.mentionNotifications}
                  onChange={(v) => setNotificationSettings({ ...notificationSettings, mentionNotifications: v })}
                />
                <NotificationToggle
                  label="Tâches assignées"
                  description="Quand une tâche vous est assignée"
                  icon={User}
                  checked={notificationSettings.taskAssigned}
                  onChange={(v) => setNotificationSettings({ ...notificationSettings, taskAssigned: v })}
                />
                <NotificationToggle
                  label="Tâches terminées"
                  description="Quand une tâche que vous suivez est terminée"
                  icon={CheckCircle}
                  checked={notificationSettings.taskCompleted}
                  onChange={(v) => setNotificationSettings({ ...notificationSettings, taskCompleted: v })}
                />
                <NotificationToggle
                  label="Rappels d'échéance"
                  description="Rappels pour les tâches dont l'échéance approche"
                  icon={AlertTriangle}
                  checked={notificationSettings.deadlineReminder}
                  onChange={(v) => setNotificationSettings({ ...notificationSettings, deadlineReminder: v })}
                />
                <NotificationToggle
                  label="Résumé hebdomadaire"
                  description="Recevez un résumé de votre activité chaque semaine"
                  icon={Globe}
                  checked={notificationSettings.weeklyDigest}
                  onChange={(v) => setNotificationSettings({ ...notificationSettings, weeklyDigest: v })}
                />
              </div>

              <div className="flex justify-end mt-6">
                <button onClick={handleNotificationSave} className="btn btn-primary">
                  <Save className="w-4 h-4" />
                  <span>Enregistrer</span>
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'appearance' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* Theme */}
              <div className="card">
                <h2 className="text-xl font-semibold text-surface-100 mb-6">
                  Thème
                </h2>
                
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { id: 'light', label: 'Clair', icon: Sun },
                    { id: 'dark', label: 'Sombre', icon: Moon },
                    { id: 'system', label: 'Système', icon: Monitor },
                  ].map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => setAppearanceSettings({ ...appearanceSettings, theme: theme.id })}
                      className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                        appearanceSettings.theme === theme.id
                          ? 'border-primary-500 bg-primary-500/10'
                          : 'border-surface-700 hover:border-surface-600'
                      }`}
                    >
                      <theme.icon className={`w-6 h-6 ${
                        appearanceSettings.theme === theme.id ? 'text-primary-400' : 'text-surface-400'
                      }`} />
                      <span className={
                        appearanceSettings.theme === theme.id ? 'text-primary-400' : 'text-surface-400'
                      }>{theme.label}</span>
                      {appearanceSettings.theme === theme.id && (
                        <Check className="w-4 h-4 text-primary-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Accent Color */}
              <div className="card">
                <h2 className="text-xl font-semibold text-surface-100 mb-6">
                  Couleur d'accent
                </h2>
                
                <div className="flex flex-wrap gap-3">
                  {accentColors.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setAppearanceSettings({ ...appearanceSettings, accentColor: color.value })}
                      className={`w-12 h-12 rounded-xl transition-all relative ${
                        appearanceSettings.accentColor === color.value
                          ? 'ring-2 ring-offset-2 ring-offset-surface-900'
                          : 'hover:scale-110'
                      }`}
                      style={{ 
                        backgroundColor: color.value,
                        ringColor: color.value,
                      }}
                      title={color.name}
                    >
                      {appearanceSettings.accentColor === color.value && (
                        <Check className="w-5 h-5 text-white absolute inset-0 m-auto" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Other settings */}
              <div className="card">
                <h2 className="text-xl font-semibold text-surface-100 mb-6">
                  Options d'affichage
                </h2>

                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium text-surface-200">Mode compact</p>
                      <p className="text-sm text-surface-500">Réduit l'espacement pour afficher plus de contenu</p>
                    </div>
                    <button
                      onClick={() => setAppearanceSettings({ ...appearanceSettings, compactMode: !appearanceSettings.compactMode })}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        appearanceSettings.compactMode ? 'bg-primary-500' : 'bg-surface-700'
                      }`}
                    >
                      <motion.div
                        animate={{ x: appearanceSettings.compactMode ? 24 : 2 }}
                        className="absolute top-1 w-4 h-4 bg-white rounded-full"
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium text-surface-200">Animations</p>
                      <p className="text-sm text-surface-500">Activer les animations et transitions</p>
                    </div>
                    <button
                      onClick={() => setAppearanceSettings({ ...appearanceSettings, animations: !appearanceSettings.animations })}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        appearanceSettings.animations ? 'bg-primary-500' : 'bg-surface-700'
                      }`}
                    >
                      <motion.div
                        animate={{ x: appearanceSettings.animations ? 24 : 2 }}
                        className="absolute top-1 w-4 h-4 bg-white rounded-full"
                      />
                    </button>
                  </div>

                  <div className="py-3">
                    <p className="font-medium text-surface-200 mb-2">Taille du texte</p>
                    <div className="flex gap-2">
                      {['small', 'medium', 'large'].map((size) => (
                        <button
                          key={size}
                          onClick={() => setAppearanceSettings({ ...appearanceSettings, fontSize: size })}
                          className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                            appearanceSettings.fontSize === size
                              ? 'bg-primary-500/20 text-primary-400'
                              : 'bg-surface-800 text-surface-400 hover:text-surface-200'
                          }`}
                        >
                          {size === 'small' ? 'Petit' : size === 'medium' ? 'Normal' : 'Grand'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-6">
                  <button onClick={handleAppearanceSave} className="btn btn-primary">
                    <Save className="w-4 h-4" />
                    <span>Enregistrer</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
