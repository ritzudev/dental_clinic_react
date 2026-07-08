import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  LayoutDashboard, 
  Users, 
  ShieldAlert, 
  CalendarRange, 
  Clock3, 
  Sun, 
  Moon, 
  LogOut,
  Wallet
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  currentView: string;
  setView: (view: string) => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ 
  children, 
  currentView, 
  setView 
}) => {
  const [userEmail, setUserEmail] = useState('Cargando...');
  const [userRole, setUserRole] = useState('admin');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Inicializador de tema dinámico
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const activeTheme = savedTheme || systemTheme;
    
    setTheme(activeTheme);
    if (activeTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Cargar usuario y verificar roles (RBAC)
  useEffect(() => {
    const loadUserAndValidate = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !session.user) {
        setView('landing'); // Redirección SPA al landing en lugar de recarga de página
        return;
      }

      setUserEmail(session.user.email || '');
      const savedRole = localStorage.getItem('user-role') || 'admin';
      setUserRole(savedRole);

      // Blindaje de seguridad inmediata para URLs prohibidas
      const currentPath = currentView;
      if (currentPath === 'medicos' && savedRole !== 'admin') {
        setView('dashboard');
      } else if (currentPath === 'pacientes' && savedRole === 'medico') {
        setView('dashboard');
      }
    };

    loadUserAndValidate();
  }, [currentView, setView]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('user-role');
    localStorage.removeItem('user-email');
    setView('landing'); // Transición SPA directa a la landing page
  };

  // Definir elementos de menú permitidos por rol
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'recepcionista', 'medico'] },
    { id: 'pacientes', label: 'Pacientes', icon: Users, roles: ['admin', 'recepcionista'] },
    { id: 'medicos', label: 'Médicos', icon: ShieldAlert, roles: ['admin'] },
    { id: 'horarios', label: 'Horarios', icon: Clock3, roles: ['admin', 'recepcionista', 'medico'] },
    { id: 'citas', label: 'Citas', icon: CalendarRange, roles: ['admin', 'recepcionista', 'medico'] },

    { id: 'historia-clinica', label: 'Historia Clínica', icon: ShieldAlert, roles: ['admin', 'medico'] },
    { id: 'tratamientos', label: 'Tratamientos', icon: ShieldAlert, roles: ['admin', 'medico'] },
    { id: 'pagos', label: 'Pagos', icon: Wallet, roles: ['admin', 'recepcionista'] }
  ];

  const filteredMenuItems = menuItems.filter(item => item.roles.includes(userRole));
  console.log("ROL ACTUAL:", userRole);
console.log("MENU ITEMS:", filteredMenuItems);

  return (
    <div className="flex h-full w-full overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-300">
      {/* SIDEBAR */}
      <aside className="w-72 bg-gradient-to-b from-slate-900 via-blue-950 to-slate-950 border-r border-slate-800 text-white shadow-2xl flex flex-col flex-shrink-0">
        
        {/* LOGO */}
        <div className="p-6 border-b border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-6 h-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z"
                ></path>
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-wide text-white">
                Clínica
              </h1>
              <p className="text-cyan-400 text-xs font-semibold">Sistema Médico</p>
            </div>
          </div>

          {/* Alternador de tema */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl border border-slate-800 hover:border-cyan-500/30 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 active:scale-95 transition-all cursor-pointer"
            aria-label="Cambiar tema"
          >
            {theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
          </button>
        </div>

        {/* PERFIL */}
        <div className="px-6 py-5 border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-lg font-bold text-white shadow-md">
              {userEmail.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <h2 className="font-bold text-sm text-slate-200 truncate">
                {userEmail.split('@')[0]}
              </h2>
              {userRole === 'admin' && (
                <p className="text-cyan-400 text-xs font-semibold">Administrador</p>
              )}
              {userRole === 'medico' && (
                <p className="text-emerald-400 text-xs font-semibold">Médico Especialista</p>
              )}
              {userRole === 'recepcionista' && (
                <p className="text-amber-400 text-xs font-semibold">Recepción Clínica</p>
              )}
            </div>
          </div>
        </div>

        {/* MENÚ DE NAVEGACIÓN */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {filteredMenuItems.map((item) => {
            const isActive = currentView === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group cursor-pointer ${
                  isActive
                    ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold shadow-md shadow-cyan-500/10"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-semibold">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* CERRAR SESIÓN */}
        <div className="px-4 py-2 border-t border-slate-800/60">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold border border-slate-800 hover:border-red-500/30 hover:bg-red-500/10 text-slate-400 hover:text-red-400 active:scale-[0.98] transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 bg-slate-50 dark:bg-slate-950 p-8 overflow-y-auto flex flex-col transition-colors duration-300">
        {children}
      </main>
    </div>
  );
};
