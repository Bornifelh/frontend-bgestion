import infratexLogo from '../../assets/infratex-logo.png';

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ backgroundColor: '#F4F5F7' }}>
      <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-[#173D68]/10 to-transparent" />

      <div className="relative z-10 w-full max-w-[400px] px-4">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img src={infratexLogo} alt="Infratex" className="w-16 h-16 rounded-xl shadow-lg mb-3" />
          <span className="text-2xl font-bold text-[#173D68]">GesProjet</span>
          <span className="text-xs text-gray-400 mt-1">by Infratex</span>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
          {children}
        </div>

        {/* Footer */}
        <p className="text-center text-gray-400 text-xs mt-6">
          Plateforme de gestion de projet collaborative
        </p>
      </div>
    </div>
  );
}
