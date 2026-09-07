import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  LayoutDashboard,
  Users,
  CalendarRange,
  Clock3,
  Sun,
  Moon,
  LogOut,
  Wallet,
  Stethoscope,
  ClipboardList,
  FileText,
  Activity,
  ChevronRight,
  Menu,
  X,
  HeartPulse,
  Settings2,
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  currentView: string;
  setView: (view: string) => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  currentView,
  setView,
}) => {
  const [userEmail, setUserEmail] = useState('Cargando...');
  const [userRole, setUserRole] = useState('admin');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // =========================================================
  // TEMA
  // =========================================================

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as
      | 'light'
      | 'dark'
      | null;

    const systemTheme = window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches
      ? 'dark'
      : 'light';

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

  // =========================================================
  // USUARIO + RBAC
  // =========================================================

  useEffect(() => {
    const loadUserAndValidate = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session || !session.user) {
        setView('landing');
        return;
      }

      setUserEmail(session.user.email || '');

      const { data: perfilData, error: perfilError } = await supabase
        .from('perfiles')
        .select('rol')
        .eq('id', session.user.id)
        .single();

      console.log('PERFIL:', perfilData);

      const savedRole =
        !perfilError && perfilData ? perfilData.rol : 'admin';

      setUserRole(savedRole);

      console.log('SAVED ROLE:', savedRole);

      // Blindaje de seguridad inmediata para URLs prohibidas
      const currentPath = currentView;

      if (currentPath === 'medicos' && savedRole !== 'admin') {
        setView('dashboard');
      }
    };

    loadUserAndValidate();
  }, [currentView, setView]);

  useEffect(() => {
    console.log('ESTADO userRole:', userRole);
  }, [userRole]);

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleSignOut = async () => {
    await supabase.auth.signOut();

    localStorage.removeItem('user-role');
    localStorage.removeItem('user-email');

    setView('landing');
  };

  // =========================================================
  // MENÚ
  // =========================================================

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Inicio clínico',
      description: 'Resumen general',
      icon: LayoutDashboard,
      roles: ['admin', 'recepcionista', 'medico'],
    },
    {
      id: 'pacientes',
      label: 'Pacientes',
      description: 'Expedientes y pacientes',
      icon: Users,
      roles: ['admin', 'recepcionista', 'medico'],
    },
    {
      id: 'medicos',
      label: 'Médicos',
      description: 'Equipo clínico',
      icon: Stethoscope,
      roles: ['admin'],
    },
    {
      id: 'horarios',
      label: 'Horarios',
      description: 'Disponibilidad médica',
      icon: Clock3,
      roles: ['admin', 'recepcionista', 'medico'],
    },
    {
      id: 'citas',
      label: 'Citas',
      description: 'Agenda clínica',
      icon: CalendarRange,
      roles: ['admin', 'recepcionista', 'medico'],
    },
    {
      id: 'historia-clinica',
      label: 'Historia Clínica',
      description: 'Antecedentes y evolución',
      icon: FileText,
      roles: ['admin', 'medico'],
    },
    {
      id: 'plan-tratamiento',
      label: 'Plan de Tratamiento',
      description: 'Planes y consultas',
      icon: ClipboardList,
      roles: ['admin', 'medico'],
    },
    {
      id: 'tratamientos',
      label: 'Tratamientos',
      description: 'Catálogo clínico',
      icon: Activity,
      roles: ['admin', 'medico'],
    },
    {
      id: 'pagos',
      label: 'Pagos',
      description: 'Gestión financiera',
      icon: Wallet,
      roles: ['admin', 'recepcionista'],
    },
  ];

  const filteredMenuItems = menuItems.filter((item) =>
    item.roles.includes(userRole)
  );

  console.log('ROL ACTUAL:', userRole);
  console.log('MENU ITEMS:', filteredMenuItems);

  // =========================================================
  // CONFIGURACIÓN VISUAL DEL ROL
  // =========================================================

  const getRoleInfo = () => {
    switch (userRole) {
      case 'medico':
        return {
          label: 'Médico Especialista',
          shortLabel: 'Médico',
          color: 'text-emerald-400',
          dot: 'bg-emerald-400',
        };

      case 'recepcionista':
        return {
          label: 'Recepción Clínica',
          shortLabel: 'Recepción',
          color: 'text-amber-400',
          dot: 'bg-amber-400',
        };

      default:
        return {
          label: 'Administrador',
          shortLabel: 'Admin',
          color: 'text-cyan-400',
          dot: 'bg-cyan-400',
        };
    }
  };

  const roleInfo = getRoleInfo();

  // =========================================================
  // NAVEGACIÓN
  // =========================================================

  const handleNavigation = (view: string) => {
    setView(view);
    setSidebarOpen(false);
  };

  const getCurrentSection = () => {
    const currentItem = filteredMenuItems.find(
      (item) => item.id === currentView
    );

    return currentItem || filteredMenuItems[0];
  };

  const currentSection = getCurrentSection();

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="flex h-full w-full overflow-hidden bg-slate-50 text-slate-900 dark:bg-[#07111f] dark:text-slate-100 transition-colors duration-300">

      {/* =====================================================
          MOBILE HEADER
      ===================================================== */}

      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 shadow-sm">

        <button
          onClick={() => setSidebarOpen(true)}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <HeartPulse className="w-5 h-5 text-white" />
          </div>

          <div className="leading-tight">
            <p className="font-extrabold text-sm text-slate-900 dark:text-white">
              Clínica
            </p>
            <p className="text-[10px] font-semibold text-cyan-600 dark:text-cyan-400">
              SISTEMA CLÍNICO
            </p>
          </div>
        </div>

        <button
          onClick={toggleTheme}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Cambiar tema"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* =====================================================
          OVERLAY MOBILE
      ===================================================== */}

      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside
        className={`
          fixed lg:relative
          z-50 lg:z-auto
          top-0 left-0
          h-full
          w-[290px]
          bg-[#081321]
          text-white
          border-r border-slate-800/80
          shadow-2xl lg:shadow-none
          flex flex-col
          flex-shrink-0
          transition-transform duration-300 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >

        {/* -----------------------------------------------------
            BRAND
        ----------------------------------------------------- */}

        <div className="px-5 pt-5 pb-4 border-b border-slate-800/80">

          <div className="flex items-center justify-between">

            <button
              onClick={() => handleNavigation('dashboard')}
              className="flex items-center gap-3 text-left group"
            >
              <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-400 via-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-[1.03] transition-transform">

                <HeartPulse className="w-6 h-6 text-white" />

                <span className="absolute -right-1 -bottom-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-[3px] border-[#081321]" />
              </div>

              <div>
                <h1 className="text-[17px] font-extrabold tracking-tight text-white">
                  Clínica 920
                </h1>

                <p className="text-[10px] tracking-[0.18em] font-bold text-cyan-400 uppercase">
                  Sistema Clínico
                </p>
              </div>
            </button>

            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Cerrar menú"
            >
              <X className="w-5 h-5" />
            </button>

          </div>

          {/* Estado del sistema */}

          <div className="mt-4 flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-900/70 border border-slate-800/80">

            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </span>

              <span className="text-[11px] font-semibold text-slate-300">
                Sistema operativo
              </span>
            </div>

            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
              Online
            </span>

          </div>
        </div>

        {/* -----------------------------------------------------
            PERFIL
        ----------------------------------------------------- */}

        <div className="px-5 py-4 border-b border-slate-800/70">

          <div className="flex items-center gap-3">

            <div className="relative flex-shrink-0">

              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-sm font-extrabold text-white shadow-md">
                {userEmail.charAt(0).toUpperCase()}
              </div>

              <span
                className={`absolute -right-0.5 -bottom-0.5 w-3 h-3 rounded-full border-2 border-[#081321] ${roleInfo.dot}`}
              />

            </div>

            <div className="min-w-0 flex-1">

              <div className="flex items-center justify-between gap-2">

                <h2 className="font-bold text-sm text-slate-100 truncate">
                  {userEmail.split('@')[0]}
                </h2>

                <Settings2 className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />

              </div>

              <p className={`text-[11px] font-semibold mt-0.5 ${roleInfo.color}`}>
                {roleInfo.label}
              </p>

            </div>
          </div>
        </div>

        {/* -----------------------------------------------------
            NAVEGACIÓN
        ----------------------------------------------------- */}

        <nav className="flex-1 px-3 py-5 overflow-y-auto">

          <div className="px-3 mb-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">
              Navegación clínica
            </p>
          </div>

          <div className="space-y-1">

            {filteredMenuItems.map((item) => {

              const isActive = currentView === item.id;
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.id)}
                  className={`
                    relative w-full flex items-center gap-3
                    px-3 py-2.5
                    rounded-xl
                    text-left
                    group
                    transition-all duration-200
                    ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-500/15 via-blue-500/10 to-transparent text-white'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/70'
                    }
                  `}
                >

                  {/* Indicador lateral */}

                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.7)]" />
                  )}

                  <div
                    className={`
                      w-9 h-9
                      rounded-xl
                      flex items-center justify-center
                      flex-shrink-0
                      transition-all
                      ${
                        isActive
                          ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/15'
                          : 'bg-slate-900/70 text-slate-500 group-hover:bg-slate-800 group-hover:text-slate-200'
                      }
                    `}
                  >
                    <Icon className="w-[18px] h-[18px]" />
                  </div>

                  <div className="min-w-0 flex-1">

                    <p
                      className={`text-[13px] font-semibold truncate ${
                        isActive ? 'text-white' : ''
                      }`}
                    >
                      {item.label}
                    </p>

                    <p
                      className={`text-[10px] mt-0.5 truncate ${
                        isActive
                          ? 'text-cyan-300/70'
                          : 'text-slate-600 group-hover:text-slate-500'
                      }`}
                    >
                      {item.description}
                    </p>

                  </div>

                  <ChevronRight
                    className={`
                      w-4 h-4 flex-shrink-0 transition-all
                      ${
                        isActive
                          ? 'text-cyan-400 translate-x-0 opacity-100'
                          : 'text-slate-700 -translate-x-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0'
                      }
                    `}
                  />

                </button>
              );
            })}

          </div>

          {/* Separador visual */}

          <div className="my-5 mx-3 border-t border-slate-800/70" />

         

        </nav>

        {/* -----------------------------------------------------
            FOOTER SIDEBAR
        ----------------------------------------------------- */}

        <div className="px-3 pb-3 pt-2 border-t border-slate-800/70">

          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/5 transition-all group"
          >

            <div className="w-9 h-9 rounded-xl bg-slate-900 group-hover:bg-red-500/10 flex items-center justify-center transition-colors">
              <LogOut className="w-[17px] h-[17px]" />
            </div>

            <div className="text-left">
              <p className="text-xs font-bold">
                Cerrar sesión
              </p>
              <p className="text-[10px] text-slate-600 group-hover:text-red-400/60">
                Finalizar sesión segura
              </p>
            </div>

          </button>

          <div className="px-3 pt-2 pb-1 flex items-center justify-between">
            <span className="text-[9px] font-medium text-slate-700">
              Sistema Clínico
            </span>

            <span className="text-[9px] font-medium text-slate-700">
              v1.0
            </span>
          </div>

        </div>

      </aside>

      {/* =====================================================
          ÁREA PRINCIPAL
      ===================================================== */}

      <main className="flex-1 min-w-0 h-full overflow-y-auto bg-slate-50 dark:bg-[#07111f] transition-colors duration-300">

        {/* -----------------------------------------------------
            TOPBAR DESKTOP
        ----------------------------------------------------- */}

        <header className="hidden lg:flex sticky top-0 z-30 h-[72px] bg-white/90 dark:bg-[#07111f]/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/70 items-center justify-between px-8">

          <div className="flex items-center gap-3">

            <div className="w-9 h-9 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 flex items-center justify-center">
              {currentSection?.icon ? (
                React.createElement(currentSection.icon, {
                  className: 'w-[18px] h-[18px] text-cyan-600 dark:text-cyan-400',
                })
              ) : (
                <LayoutDashboard className="w-[18px] h-[18px] text-cyan-600 dark:text-cyan-400" />
              )}
            </div>

            <div className="flex items-center gap-2">

              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                Clínica
              </span>

              <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700" />

              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {currentSection?.label || 'Inicio clínico'}
              </span>

            </div>

          </div>

          <div className="flex items-center gap-5">

            {/* Estado */}

            <div className="flex items-center gap-2">

              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>

              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Sistema operativo
              </span>

            </div>

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />

            {/* Tema */}

            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-cyan-500 dark:hover:text-cyan-400 transition-all"
              aria-label="Cambiar tema"
            >
              {theme === 'dark' ? (
                <Sun className="w-[17px] h-[17px]" />
              ) : (
                <Moon className="w-[17px] h-[17px]" />
              )}
            </button>

            {/* Usuario */}

            <div className="flex items-center gap-2.5 pl-1">

              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-xs font-bold text-white">
                {userEmail.charAt(0).toUpperCase()}
              </div>

              <div className="hidden xl:block leading-tight">

                <p className="text-xs font-bold text-slate-700 dark:text-slate-200 max-w-[120px] truncate">
                  {userEmail.split('@')[0]}
                </p>

                <p className={`text-[9px] font-semibold ${roleInfo.color}`}>
                  {roleInfo.shortLabel}
                </p>

              </div>

            </div>

          </div>

        </header>

        {/* -----------------------------------------------------
            CONTENIDO
        ----------------------------------------------------- */}

        <div className="min-h-[calc(100%-72px)] p-4 sm:p-6 lg:p-8">

          {/* Barra superior móvil */}

          <div className="lg:hidden h-16" />

          {/* Contenedor clínico */}

          <div className="max-w-[1600px] mx-auto">

            {children}

          </div>

        </div>

      </main>

    </div>
  );
};