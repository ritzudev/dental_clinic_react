import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Sun, 
  Moon, 
  Calendar, 
  FileText, 
  Users, 
  ArrowRight, 
  Stethoscope
} from 'lucide-react';

interface LandingPageProps {
  setView: (view: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ setView }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Inicialización de tema
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

  // Alternar tema
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

  // Verificar estado de sesión activa
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
          setIsLoggedIn(true);
        }
      } catch (e) {
        console.error('Error al verificar sesión:', e);
      }
    };
    checkSession();
  }, []);

  const handlePrimaryClick = () => {
    if (isLoggedIn) {
      setView('dashboard');
    } else {
      setView('login');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100 flex flex-col justify-between transition-colors duration-500 overflow-x-hidden animated-bg relative">
      
      {/* Círculos difuminados de fondo premium */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[30%] -left-[10%] w-[60%] h-[60%] rounded-full bg-cyan-400/10 dark:bg-cyan-500/5 blur-[120px]"></div>
        <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-blue-400/10 dark:bg-blue-500/5 blur-[120px]"></div>
      </div>

      {/* HEADER / NAVBAR */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
            <Stethoscope className="w-5 h-5" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-slate-800 dark:text-white">Clínica Dental</span>
        </div>

        <div className="flex items-center gap-4">
          {/* Alternador de Tema Flotante */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/60 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-cyan-500 dark:hover:text-cyan-400 shadow-md active:scale-95 transition-all cursor-pointer"
            aria-label="Alternar tema"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>

          {/* Botón de acceso rápido */}
          <button
            onClick={handlePrimaryClick}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold border active:scale-95 transition-all cursor-pointer shadow-sm ${
              isLoggedIn 
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white border-transparent' 
                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900/60 text-slate-700 dark:text-slate-300'
            }`}
          >
            {isLoggedIn ? 'Ir al Panel' : 'Iniciar Sesión'}
          </button>
        </div>
      </header>

      {/* HERO SECTION */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-6 py-12 md:py-24 flex flex-col items-center text-center space-y-8 flex-1 justify-center">
        
        {/* Insignia Tecnológica */}
        <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-cyan-500/10 dark:bg-cyan-500/5 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping"></span>
          Odontología Digital e Inteligente
        </span>

        {/* Título Hero Principal */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-800 dark:text-white max-w-4xl leading-tight">
          Tu salud dental en manos de la <span className="bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 bg-clip-text text-transparent">innovación</span>
        </h1>

        {/* Subtítulo */}
        <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
          Accede a tratamientos personalizados, agenda tus citas de forma ágil e interactúa con nuestro equipo de profesionales dentales desde una sola plataforma.
        </p>

        {/* Botón de Llamado a la Acción (CTA) */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-xs sm:max-w-md">
          <button
            onClick={handlePrimaryClick}
            className="w-full sm:w-auto flex justify-center items-center gap-2 py-4 px-8 rounded-2xl text-base font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-lg shadow-cyan-500/20 active:scale-98 transition-all cursor-pointer"
          >
            {isLoggedIn ? 'Ir al Panel de Control' : 'Acceso al Portal Clínico'}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Tarjetas de Servicios Rápidos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mt-12 md:mt-20">
          {/* Card 1: Agenda Dental */}
          <div className="p-6 rounded-2xl bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/60 dark:border-slate-800 shadow-md flex flex-col items-center text-center hover:scale-[1.03] transition-all duration-300 group hover:border-cyan-500/30 dark:hover:border-cyan-500/20">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 text-cyan-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">Agenda Dental</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Reserva y consulta tus horarios de atención con absoluta facilidad.</p>
          </div>

          {/* Card 2: Historial Clínico */}
          <div className="p-6 rounded-2xl bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/60 dark:border-slate-800 shadow-md flex flex-col items-center text-center hover:scale-[1.03] transition-all duration-300 group hover:border-blue-500/30 dark:hover:border-blue-500/20">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Historial Clínico</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Tus datos y tratamientos odontológicos resguardados con total privacidad.</p>
          </div>

          {/* Card 3: Profesionales */}
          <div className="p-6 rounded-2xl bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/60 dark:border-slate-800 shadow-md flex flex-col items-center text-center hover:scale-[1.03] transition-all duration-300 group hover:border-indigo-500/30 dark:hover:border-indigo-500/20">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Profesionales</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Conéctate con especialistas certificados y con la mejor reputación médica.</p>
          </div>
        </div>

      </main>

      {/* FOOTER */}
      <footer className="relative z-20 w-full max-w-7xl mx-auto px-6 py-8 border-t border-slate-200/40 dark:border-slate-900 text-center text-sm text-slate-400">
        Clínica Dental © 2026. Todos los derechos reservados.
      </footer>
    </div>
  );
};
