import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { AdminLayout } from './layouts/AdminLayout';
import { LandingPage } from './components/LandingPage';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import { DashboardPanel } from './components/DashboardPanel';
import { PacientesPanel } from './components/PacientesPanel';
import { MedicosPanel } from './components/MedicosPanel';
import { HorariosPanel } from './components/HorariosPanel';
import { CitasPanel } from './components/CitasPanel';
import { HistoriaClinicaPanel } from './components/HistoriaClinicaPanel';
import { TratamientosPanel } from './components/TratamientosPanel';
import { PagosPanel } from './components/PagosPanel';
import { Loader2 } from 'lucide-react';

export const App: React.FC = () => {
  const [view, setView] = useState<string>('loading');
  const [sessionChecked, setSessionChecked] = useState(false);
useEffect(() => {
  if (
    view !== 'loading' &&
    view !== 'landing' &&
    view !== 'login' &&
    view !== 'register'
  ) {
    localStorage.setItem('current-view', view);
  }
}, [view]);
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Control de sesión inicial
      if (session && session.user) {
  const savedView =
    localStorage.getItem('current-view') || 'dashboard';

  setView(savedView);
} else {
  setView('landing');
}
      setSessionChecked(true);
    };

    checkSession();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
  if (sessionChecked) {
    if (session) {
      const savedView =
        localStorage.getItem('current-view') || 'dashboard';

      setView(savedView);
    } else {
      setView('landing');
    }
  }
});

    return () => {
      subscription.unsubscribe();
    };
  }, [sessionChecked]);

  // Cargador de inicio
  if (view === 'loading') {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin h-12 w-12 text-cyan-500" />
          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Verificando sesión...</span>
        </div>
      </div>
    );
  }

  // Rutas públicas (Landing, Login y Registro)
  if (view === 'landing') {
    return <LandingPage setView={setView} />;
  }

  if (view === 'login') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-cyan-950 transition-colors duration-500 overflow-hidden relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[40%] -left-[20%] w-[80%] h-[80%] rounded-full bg-cyan-400/10 dark:bg-cyan-500/5 blur-[120px]"></div>
          <div className="absolute -bottom-[40%] -right-[20%] w-[80%] h-[80%] rounded-full bg-blue-400/10 dark:bg-blue-500/5 blur-[120px]"></div>
        </div>
        <div className="relative z-10 w-full max-w-md flex justify-center">
          <LoginForm onSuccess={() => setView('dashboard')} setView={setView} />
        </div>
      </div>
    );
  }

  if (view === 'register') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-cyan-950 transition-colors duration-500 overflow-hidden relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[40%] -left-[20%] w-[80%] h-[80%] rounded-full bg-cyan-400/10 dark:bg-cyan-500/5 blur-[120px]"></div>
          <div className="absolute -bottom-[40%] -right-[20%] w-[80%] h-[80%] rounded-full bg-blue-400/10 dark:bg-blue-500/5 blur-[120px]"></div>
        </div>
        <div className="relative z-10 w-full max-w-md flex justify-center">
          <RegisterForm onSuccess={() => setView('dashboard')} setView={setView} />
        </div>
      </div>
    );
  }

  // Rutas privadas (Administración) envueltas en AdminLayout
  return (
    <AdminLayout currentView={view} setView={setView}>
      {view === 'dashboard' && <DashboardPanel setView={setView} />}
      {view === 'pacientes' && <PacientesPanel />}
      {view === 'medicos' && <MedicosPanel />}
      {view === 'horarios' && <HorariosPanel />}
      {view === 'citas' && <CitasPanel />}
      {view === 'historia-clinica' && <HistoriaClinicaPanel />}
      {view === 'tratamientos' && <TratamientosPanel />}
      {view === 'pagos' && <PagosPanel />}
    </AdminLayout>
  );
};

export default App;
