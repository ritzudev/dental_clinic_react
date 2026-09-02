import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  Users,
  Calendar,
  Clock,
  ArrowRight,
  UserCheck,
  Loader2,
  Plus,
  ClipboardList,
  FileText,
  Stethoscope,
  Activity,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  CalendarDays,
} from 'lucide-react';

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

export const DashboardPanel: React.FC<DashboardPanelProps> = ({
  setView,
}) => {
  const [userEmail, setUserEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // =====================================================
  // INDICADORES REALES
  // =====================================================

  const [totalPacientes, setTotalPacientes] = useState(0);
  const [citasPendientes, setCitasPendientes] = useState(0);
  const [totalMedicos, setTotalMedicos] = useState(0);
  const [citasDeHoyCount, setCitasDeHoyCount] = useState(0);

  const [citasHoy, setCitasHoy] = useState<CitaHoy[]>([]);

  // =====================================================
  // CARGAR DASHBOARD
  // =====================================================

  useEffect(() => {
    const loadData = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        setUserEmail(session.user.email || '');
      }

      await fetchStats();
      setIsLoading(false);
    };

    loadData();
  }, []);

  // =====================================================
  // ESTADÍSTICAS
  // =====================================================

  const fetchStats = async () => {
    try {
      // 1. PACIENTES ACTIVOS
      const { count: pacCount } = await supabase
        .from('pacientes')
        .select('*', {
          count: 'exact',
          head: true,
        })
        .eq('estado', 'Activo');

      if (pacCount !== null) {
        setTotalPacientes(pacCount);
      }

      // 2. CITAS PENDIENTES
      const { count: pendingCount } = await supabase
        .from('citas')
        .select('*', {
          count: 'exact',
          head: true,
        })
        .eq('estado', 'pendiente');

      if (pendingCount !== null) {
        setCitasPendientes(pendingCount);
      }

      // 3. MÉDICOS ACTIVOS
      const { count: medCount } = await supabase
        .from('medicos')
        .select('*', {
          count: 'exact',
          head: true,
        })
        .eq('estado', 'Activo');

      if (medCount !== null) {
        setTotalMedicos(medCount);
      }

      // 4. FECHA ACTUAL
      const hoyStr = new Date().toISOString().split('T')[0];

      // 5. CITAS DE HOY
      const { count: todayCount } = await supabase
        .from('citas')
        .select('*', {
          count: 'exact',
          head: true,
        })
        .eq('fecha', hoyStr);

      if (todayCount !== null) {
        setCitasDeHoyCount(todayCount);
      }

      // 6. LISTADO DE CITAS DE HOY
      const {
        data: citasData,
        error: citasError,
      } = await supabase
        .from('citas')
        .select('*, pacientes(nombres, apellidos)')
        .eq('fecha', hoyStr)
        .order('hora', {
          ascending: true,
        });

      if (!citasError && citasData && citasData.length > 0) {
        setCitasHoy(citasData as unknown as CitaHoy[]);
      } else {
        // FALLBACK: PRÓXIMAS 5 CITAS
        const { data: proximasData } = await supabase
          .from('citas')
          .select('*, pacientes(nombres, apellidos)')
          .gte('fecha', hoyStr)
          .order('fecha', {
            ascending: true,
          })
          .order('hora', {
            ascending: true,
          })
          .limit(5);

        setCitasHoy(
          (proximasData || []) as unknown as CitaHoy[]
        );
      }
    } catch (err) {
      console.error(
        'Error al cargar estadísticas del dashboard:',
        err
      );
    }
  };

  // =====================================================
  // FORMATO DE FECHA
  // =====================================================

  const formatFecha = (fStr: string) => {
    const [year, month, day] = fStr.split('-');

    return `${day}/${month}/${year}`;
  };

  // =====================================================
  // NOMBRE DEL USUARIO
  // =====================================================

  const getNombreUsuario = () => {
    if (!userEmail) return 'Profesional';

    return userEmail
      .split('@')[0]
      .split(/[._-]/)
      .map(
        (parte) =>
          parte.charAt(0).toUpperCase() + parte.slice(1)
      )
      .join(' ');
  };

  // =====================================================
  // ESTADO DE CITA
  // =====================================================

  const getEstadoConfig = (estado: string) => {
    switch (estado) {
      case 'atendida':
        return {
          label: 'Atendida',
          className:
            'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900',
          icon: CheckCircle2,
        };

      case 'confirmada':
        return {
          label: 'Confirmada',
          className:
            'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900',
          icon: CheckCircle2,
        };

      case 'pendiente':
        return {
          label: 'Pendiente',
          className:
            'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900',
          icon: AlertCircle,
        };

      default:
        return {
          label: estado || 'Sin estado',
          className:
            'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900',
          icon: AlertCircle,
        };
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-cyan-50 dark:bg-cyan-950/30 flex items-center justify-center">
            <Loader2 className="animate-spin h-7 w-7 text-cyan-500" />
          </div>

          <div className="text-center">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
              Preparando su panel clínico
            </p>

            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Sincronizando información...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // INTERFAZ
  // =====================================================

  return (
    <div className="w-full max-w-[1500px] mx-auto space-y-6 pb-8">

      {/* =================================================
          CABECERA CLÍNICA
      ================================================= */}

      <section className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">

        {/* Decoración */}
        <div className="absolute right-0 top-0 w-72 h-72 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative p-6 md:p-8">

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

            <div>

              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-900">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Sistema operativo
                </span>
              </div>

              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Buenos días, {getNombreUsuario()}
              </h1>

              <p className="mt-2 text-sm md:text-base text-slate-500 dark:text-slate-400 max-w-2xl">
                Bienvenido al centro de gestión clínica.
                Desde aquí puede consultar la agenda,
                pacientes y seguimiento de tratamientos.
              </p>

            </div>

            <div className="flex items-center gap-3 shrink-0">

              <div className="hidden sm:flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">

                <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-950/50 flex items-center justify-center">
                  <CalendarDays className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                </div>

                <div>
                  <p className="text-[11px] uppercase tracking-wide font-bold text-slate-400">
                    Hoy
                  </p>

                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    {new Date().toLocaleDateString(
                      'es-ES',
                      {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                      }
                    )}
                  </p>
                </div>

              </div>

            </div>

          </div>

        </div>
      </section>


      {/* =================================================
          INDICADORES
      ================================================= */}

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

        {/* PACIENTES */}

        <div className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-cyan-200 dark:hover:border-cyan-900 transition-all">

          <div className="flex items-start justify-between">

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Pacientes activos
              </p>

              <p className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white">
                {totalPacientes}
              </p>

              <p className="mt-1 text-xs font-medium text-slate-400">
                Registrados en la clínica
              </p>
            </div>

            <div className="w-11 h-11 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            </div>

          </div>

          <button
            onClick={() => setView('pacientes')}
            className="mt-4 flex items-center gap-1 text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:gap-2 transition-all cursor-pointer"
          >
            Ver pacientes
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

        </div>


        {/* CITAS HOY */}

        <div className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-900 transition-all">

          <div className="flex items-start justify-between">

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Agenda de hoy
              </p>

              <p className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white">
                {citasDeHoyCount}
              </p>

              <p className="mt-1 text-xs font-medium text-slate-400">
                Citas programadas
              </p>
            </div>

            <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>

          </div>

          <button
            onClick={() => setView('citas')}
            className="mt-4 flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:gap-2 transition-all cursor-pointer"
          >
            Abrir agenda
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

        </div>


        {/* PENDIENTES */}

        <div className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-amber-200 dark:hover:border-amber-900 transition-all">

          <div className="flex items-start justify-between">

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Pendientes
              </p>

              <p className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white">
                {citasPendientes}
              </p>

              <p className="mt-1 text-xs font-medium text-slate-400">
                Citas por confirmar
              </p>
            </div>

            <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>

          </div>

          <button
            onClick={() => setView('citas')}
            className="mt-4 flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 hover:gap-2 transition-all cursor-pointer"
          >
            Revisar pendientes
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

        </div>


        {/* PROFESIONALES */}

        <div className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-900 transition-all">

          <div className="flex items-start justify-between">

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Profesionales
              </p>

              <p className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white">
                {totalMedicos}
              </p>

              <p className="mt-1 text-xs font-medium text-slate-400">
                Médicos activos
              </p>
            </div>

            <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center group-hover:scale-105 transition-transform">
              <UserCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>

          </div>

          <div className="mt-4 flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400">
            <Activity className="w-3.5 h-3.5" />
            Equipo clínico
          </div>

        </div>

      </section>


      {/* =================================================
          ACCIONES RÁPIDAS
      ================================================= */}

      <section>

        <div className="flex items-center justify-between mb-4">

          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Acciones clínicas
            </h2>

            <p className="text-xs text-slate-400 mt-1">
              Accesos rápidos para la gestión diaria
            </p>
          </div>

        </div>


        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

          {/* PACIENTE */}

          <button
            onClick={() => setView('pacientes')}
            className="group text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-cyan-400 dark:hover:border-cyan-700 hover:shadow-md transition-all cursor-pointer"
          >

            <div className="flex items-center justify-between">

              <div className="w-11 h-11 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 flex items-center justify-center">
                <Plus className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              </div>

              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-cyan-500 group-hover:translate-x-1 transition-all" />

            </div>

            <h3 className="mt-4 font-bold text-slate-800 dark:text-white">
              Gestionar pacientes
            </h3>

            <p className="mt-1 text-xs text-slate-400">
              Registrar y consultar pacientes
            </p>

          </button>


          {/* CITAS */}

          <button
            onClick={() => setView('citas')}
            className="group text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-blue-400 dark:hover:border-blue-700 hover:shadow-md transition-all cursor-pointer"
          >

            <div className="flex items-center justify-between">

              <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>

              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />

            </div>

            <h3 className="mt-4 font-bold text-slate-800 dark:text-white">
              Gestionar citas
            </h3>

            <p className="mt-1 text-xs text-slate-400">
              Revisar y organizar la agenda
            </p>

          </button>


          {/* HISTORIA */}

          <button
            onClick={() => setView('historia-clinica')}
            className="group text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-emerald-400 dark:hover:border-emerald-700 hover:shadow-md transition-all cursor-pointer"
          >

            <div className="flex items-center justify-between">

              <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center">
                <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>

              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />

            </div>

            <h3 className="mt-4 font-bold text-slate-800 dark:text-white">
              Historia clínica
            </h3>

            <p className="mt-1 text-xs text-slate-400">
              Consultar información clínica
            </p>

          </button>


          {/* PLAN */}

          <button
            onClick={() => setView('plan-tratamiento')}
            className="group text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-violet-400 dark:hover:border-violet-700 hover:shadow-md transition-all cursor-pointer"
          >

            <div className="flex items-center justify-between">

              <div className="w-11 h-11 rounded-xl bg-violet-50 dark:bg-violet-950/40 flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>

              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-violet-500 group-hover:translate-x-1 transition-all" />

            </div>

            <h3 className="mt-4 font-bold text-slate-800 dark:text-white">
              Plan de tratamiento
            </h3>

            <p className="mt-1 text-xs text-slate-400">
              Planificar tratamientos odontológicos
            </p>

          </button>

        </div>

      </section>


      {/* =================================================
          AGENDA
      ================================================= */}

      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">

        {/* CABECERA */}

        <div className="p-5 md:p-6 border-b border-slate-200 dark:border-slate-800">

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

            <div>

              <div className="flex items-center gap-2">

                <div className="w-9 h-9 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 flex items-center justify-center">
                  <Stethoscope className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                </div>

                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    Agenda clínica
                  </h2>

                  <p className="text-xs text-slate-400 mt-0.5">
                    Citas de hoy y próximas atenciones
                  </p>
                </div>

              </div>

            </div>

            <button
              onClick={() => setView('citas')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Ver agenda completa
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

          </div>

        </div>


        {/* CITAS */}

        <div>

          {citasHoy.length === 0 ? (

            <div className="py-14 px-6 text-center">

              <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <CalendarDays className="w-6 h-6 text-slate-400" />
              </div>

              <h3 className="mt-4 text-sm font-bold text-slate-700 dark:text-slate-200">
                Agenda libre
              </h3>

              <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
                No hay citas agendadas para hoy ni próximas
                citas disponibles.
              </p>

              <button
                onClick={() => setView('citas')}
                className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition cursor-pointer"
              >
                Ir a citas
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

            </div>

          ) : (

            <div className="divide-y divide-slate-100 dark:divide-slate-800">

              {citasHoy.map((apt) => {

                const estado =
                  getEstadoConfig(apt.estado);

                const EstadoIcon = estado.icon;

                return (
                  <div
                    key={apt.id}
                    className="group p-5 md:px-6 hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                  >

                    <div className="flex flex-col lg:flex-row lg:items-center gap-5">

                      {/* HORA */}

                      <div className="flex items-center gap-3 lg:w-28 shrink-0">

                        <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                          <Clock className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                        </div>

                        <div>

                          <p className="text-lg font-extrabold text-slate-800 dark:text-white font-mono">
                            {apt.hora.slice(0, 5)}
                          </p>

                          <p className="text-[10px] uppercase font-bold text-slate-400">
                            {formatFecha(apt.fecha)}
                          </p>

                        </div>

                      </div>


                      {/* PACIENTE */}

                      <div className="flex items-center gap-3 flex-1 min-w-0">

                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                          {(
                            apt.pacientes?.nombres?.charAt(0) ||
                            'P'
                          ).toUpperCase()}
                        </div>

                        <div className="min-w-0">

                          <h3 className="font-bold text-slate-800 dark:text-white truncate">
                            {apt.pacientes?.nombres}{' '}
                            {apt.pacientes?.apellidos}
                          </h3>

                          <div className="flex flex-wrap items-center gap-2 mt-1">

                            {apt.especialidad && (
                              <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400">
                                {apt.especialidad}
                              </span>
                            )}

                            {apt.motivo_consulta && (
                              <>
                                <span className="text-slate-300 dark:text-slate-700">
                                  •
                                </span>

                                <span className="text-xs text-slate-400 truncate max-w-[280px]">
                                  {apt.motivo_consulta}
                                </span>
                              </>
                            )}

                          </div>

                        </div>

                      </div>


                      {/* ESTADO */}

                      <div className="lg:w-32 shrink-0">

                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-extrabold ${estado.className}`}
                        >
                          <EstadoIcon className="w-3.5 h-3.5" />
                          {estado.label}
                        </span>

                      </div>


                      {/* ACCIÓN VISUAL */}

                      <div className="hidden lg:flex justify-end">

                        <button
                          onClick={() => setView('citas')}
                          className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-cyan-500 hover:border-cyan-300 dark:hover:border-cyan-800 transition cursor-pointer"
                          title="Ver agenda"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>

                      </div>

                    </div>

                  </div>
                );
              })}

            </div>

          )}

        </div>

      </section>


      {/* =================================================
          PIE DEL DASHBOARD
      ================================================= */}

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1">

        <div className="flex items-center gap-2 text-xs text-slate-400">

          <Activity className="w-3.5 h-3.5 text-emerald-500" />

          <span>
            Información sincronizada con el sistema clínico
          </span>

        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">

          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />

          Sistema en línea

        </div>

      </div>

    </div>
  );
};