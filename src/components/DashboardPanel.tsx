import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Calendar, Clock, ArrowRight, UserCheck, Loader2 } from 'lucide-react';

interface CitaHoy {
  id: number;
  fecha: string;
  hora: string;
  especialidad: string;
  motivo_consulta: string;
  estado: string;
  pacientes?: {
    nombres: string;
    apellidos: string;
  };
}

interface DashboardPanelProps {
  setView: (view: string) => void;
}

export const DashboardPanel: React.FC<DashboardPanelProps> = ({ setView }) => {
  const [userEmail, setUserEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Indicadores reales
  const [totalPacientes, setTotalPacientes] = useState(0);
  const [citasPendientes, setCitasPendientes] = useState(0);
  const [totalMedicos, setTotalMedicos] = useState(0);
  const [citasDeHoyCount, setCitasDeHoyCount] = useState(0);
  
  // Citas de hoy o próximas citas
  const [citasHoy, setCitasHoy] = useState<CitaHoy[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserEmail(session.user.email || '');
      }
      await fetchStats();
      setIsLoading(false);
    };
    loadData();
  }, []);

  const fetchStats = async () => {
    try {
      // 1. Obtener total de pacientes activos
      const { count: pacCount } = await supabase
        .from('pacientes')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'Activo');
      
      if (pacCount !== null) setTotalPacientes(pacCount);

      // 2. Obtener citas pendientes
      const { count: pendingCount } = await supabase
        .from('citas')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'pendiente');

      if (pendingCount !== null) setCitasPendientes(pendingCount);

      // 3. Obtener médicos activos
      const { count: medCount } = await supabase
        .from('medicos')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'Activo');

      if (medCount !== null) setTotalMedicos(medCount);

      // 4. Obtener citas de hoy y próximas
      const hoyStr = new Date().toISOString().split('T')[0];

      // Cuenta de hoy
      const { count: todayCount } = await supabase
        .from('citas')
        .select('*', { count: 'exact', head: true })
        .eq('fecha', hoyStr);
      
      if (todayCount !== null) setCitasDeHoyCount(todayCount);

      // Listado de citas de hoy
      const { data: citasData, error: citasError } = await supabase
        .from('citas')
        .select('*, pacientes(nombres, apellidos)')
        .eq('fecha', hoyStr)
        .order('hora', { ascending: true });

      if (!citasError && citasData && citasData.length > 0) {
        setCitasHoy(citasData as unknown as CitaHoy[]);
      } else {
        // Fallback: próximas 5 citas
        const { data: proximasData } = await supabase
          .from('citas')
          .select('*, pacientes(nombres, apellidos)')
          .gte('fecha', hoyStr)
          .order('fecha', { ascending: true })
          .order('hora', { ascending: true })
          .limit(5);
        
        setCitasHoy((proximasData || []) as unknown as CitaHoy[]);
      }
    } catch (err) {
      console.error('Error al cargar estadísticas del dashboard:', err);
    }
  };

  const formatFecha = (fStr: string) => {
    const [year, month, day] = fStr.split('-');
    return `${day}/${month}/${year}`;
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin h-12 w-12 text-cyan-500" />
          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Cargando panel dinámico...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 flex-1 w-full max-w-7xl mx-auto">
      {/* Banner de Bienvenida Premium */}
      <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-indigo-500/10 dark:from-cyan-950/40 dark:via-blue-950/40 dark:to-slate-900 border border-cyan-500/20 dark:border-cyan-500/10 shadow-md">
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white">
          ¡Panel de Control Clínico!
        </h2>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          Hola, <strong className="text-cyan-600 dark:text-cyan-400 font-bold">{userEmail}</strong>. El sistema está sincronizado en tiempo real con Supabase. Actualmente hay <strong className="text-slate-800 dark:text-white">{citasPendientes} citas pendientes</strong> de confirmación.
        </p>
      </div>

      {/* Tarjetas de Estadísticas Reales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Tarjeta 1: Pacientes */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Pacientes Registrados</span>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-cyan-50 text-cyan-600 border border-cyan-200 dark:bg-cyan-950/30 dark:text-cyan-400 dark:border-cyan-500/10">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-800 dark:text-white">{totalPacientes}</span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Total activos</span>
          </div>
        </div>

        {/* Tarjeta 2: Citas Pendientes */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Citas por Confirmar</span>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-500/10">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-800 dark:text-white">{citasPendientes}</span>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">Pendientes 🟡</span>
          </div>
        </div>

        {/* Tarjeta 3: Médicos */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Personal Médico</span>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-indigo-50 text-indigo-600 border border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-500/10">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-800 dark:text-white">{totalMedicos}</span>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Especialistas</span>
          </div>
        </div>

        {/* Tarjeta 4: Citas de Hoy */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Citas del Día (Hoy)</span>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-500/10">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-800 dark:text-white">{citasDeHoyCount}</span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Agendadas hoy</span>
          </div>
        </div>
      </div>

      {/* Citas y Consultas del Día / Próximas */}
      <div className="rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all duration-300">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Citas y Consultas del Día o Próximas</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Monitoreo y agenda clínica sincronizada.</p>
          </div>
          <button 
            onClick={() => setView('citas')} 
            className="text-xs font-bold py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition cursor-pointer flex items-center gap-1"
          >
            Ver todas las citas <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/30 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase border-b border-slate-200 dark:border-slate-800">
                <th className="p-4 pl-6">Paciente</th>
                <th className="p-4 text-center">Fecha</th>
                <th className="p-4 text-center">Hora</th>
                <th className="p-4">Tratamiento/Especialidad</th>
                <th className="p-4 pr-6 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {citasHoy.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 dark:text-slate-500 italic">
                    No hay citas agendadas para hoy ni próximas citas en agenda.
                  </td>
                </tr>
              ) : (
                citasHoy.map((apt) => (
                  <tr key={apt.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 pl-6 font-bold text-slate-800 dark:text-slate-200">
                      {apt.pacientes?.nombres} {apt.pacientes?.apellidos}
                    </td>
                    <td className="p-4 text-center font-bold text-slate-500 dark:text-slate-400">{formatFecha(apt.fecha)}</td>
                    <td className="p-4 text-center font-mono font-bold text-slate-600 dark:text-slate-400">{apt.hora.slice(0, 5)}</td>
                    <td className="p-4 font-semibold text-slate-700 dark:text-slate-300">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 text-xs font-bold">
                        {apt.especialidad}
                      </span>
                      {apt.motivo_consulta && (
                        <span className="block text-xs font-normal text-slate-400 dark:text-slate-500 mt-0.5 truncate max-w-xs">
                          Motivo: {apt.motivo_consulta}
                        </span>
                      )}
                    </td>
                    <td className="p-4 pr-6 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black border ${
                        apt.estado === 'atendida' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-500/10' :
                        apt.estado === 'confirmada' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-500/10' :
                        apt.estado === 'pendiente' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-500/10' :
                        'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-500/10'
                      }`}>
                        {apt.estado.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
