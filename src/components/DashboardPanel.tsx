import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  Users,
  Calendar,
  Clock,
  ArrowRight,
  Loader2,
  ClipboardList,
  FileText,
  Stethoscope,
  Activity,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  CalendarDays,
  Sparkles,
  CircleDot,
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
      <div className="flex flex-1 items-center justify-center min-h-[500px] bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center shadow-sm">
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
    <div className="w-full max-w-[1500px] mx-auto space-y-7 pb-10">

      {/* =================================================
          CABECERA PRINCIPAL
      ================================================= */}

      <section className="relative overflow-hidden rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">

        {/* Decoración adaptable al tema */}
        <div className="absolute -right-20 -top-24 w-80 h-80 rounded-full bg-cyan-500/10 dark:bg-cyan-400/5 blur-3xl pointer-events-none" />

        <div className="absolute right-20 bottom-0 w-40 h-40 rounded-full bg-blue-500/5 dark:bg-blue-500/5 blur-3xl pointer-events-none" />

        <div className="relative p-7 md:p-9">

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-7">

            <div className="max-w-3xl">

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-100 dark:border-cyan-900/60 text-cyan-700 dark:text-cyan-400 text-[11px] font-extrabold uppercase tracking-wider">

                <Sparkles className="w-3.5 h-3.5" />

                Gestión clínica

              </div>

              <h1 className="mt-4 text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">

                Buenos días, {getNombreUsuario()}

              </h1>

              <p className="mt-3 text-sm md:text-[15px] leading-6 text-slate-500 dark:text-slate-400 max-w-2xl">

                Gestione la actividad de la clínica desde un solo lugar.
                Consulte pacientes, revise la agenda y continúe con el
                seguimiento clínico de sus pacientes.

              </p>

            </div>


            {/* FECHA */}

            <div className="shrink-0">

              <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">

                <div className="w-11 h-11 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center shadow-sm">

                  <CalendarDays className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />

                </div>

                <div>

                  <p className="text-[10px] uppercase tracking-[0.15em] font-extrabold text-slate-400">
                    Hoy
                  </p>

                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200 capitalize">
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
          GESTIÓN DIARIA
      ================================================= */}

      <section>

        <div className="flex items-end justify-between mb-4">

          <div>

            <div className="flex items-center gap-2">

              <div className="w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-950/40 flex items-center justify-center">

                <Stethoscope className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />

              </div>

              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Gestión diaria
              </h2>

            </div>

            <p className="text-xs text-slate-400 mt-1 ml-10">
              Herramientas principales de atención clínica
            </p>

          </div>

        </div>


        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

          {/* PACIENTES */}

          <button
            onClick={() => setView('pacientes')}
            className="group relative overflow-hidden text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-cyan-300 dark:hover:border-cyan-800 hover:shadow-lg transition-all cursor-pointer"
          >

            <div className="flex items-center justify-between">

              <div className="w-11 h-11 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 flex items-center justify-center">

                <Users className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />

              </div>

              <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-700 group-hover:text-cyan-500 group-hover:translate-x-1 transition-all" />

            </div>

            <h3 className="mt-4 font-bold text-slate-800 dark:text-white">
              Pacientes
            </h3>

            <p className="mt-1 text-xs text-slate-400">
              Registrar y consultar pacientes
            </p>

            <div className="mt-4 flex items-center gap-2 text-[11px] font-bold text-cyan-600 dark:text-cyan-400">
              <CircleDot className="w-3 h-3" />
              {totalPacientes} pacientes activos
            </div>

          </button>


          {/* CITAS */}

          <button
            onClick={() => setView('citas')}
            className="group relative overflow-hidden text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-blue-300 dark:hover:border-blue-800 hover:shadow-lg transition-all cursor-pointer"
          >

            <div className="flex items-center justify-between">

              <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center">

                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />

              </div>

              <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-700 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />

            </div>

            <h3 className="mt-4 font-bold text-slate-800 dark:text-white">
              Agenda
            </h3>

            <p className="mt-1 text-xs text-slate-400">
              Revisar y organizar las citas
            </p>

            <div className="mt-4 flex items-center gap-2 text-[11px] font-bold text-blue-600 dark:text-blue-400">
              <CalendarDays className="w-3 h-3" />
              {citasDeHoyCount} citas para hoy
            </div>

          </button>


          {/* HISTORIA CLÍNICA */}

          <button
            onClick={() => setView('historia-clinica')}
            className="group relative overflow-hidden text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-emerald-300 dark:hover:border-emerald-800 hover:shadow-lg transition-all cursor-pointer"
          >

            <div className="flex items-center justify-between">

              <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center">

                <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />

              </div>

              <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-700 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />

            </div>

            <h3 className="mt-4 font-bold text-slate-800 dark:text-white">
              Historia clínica
            </h3>

            <p className="mt-1 text-xs text-slate-400">
              Consultar información clínica
            </p>

            <div className="mt-4 flex items-center gap-2 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              <Activity className="w-3 h-3" />
              Seguimiento clínico
            </div>

          </button>


          {/* PLAN */}

          <button
            onClick={() => setView('plan-tratamiento')}
            className="group relative overflow-hidden text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-violet-300 dark:hover:border-violet-800 hover:shadow-lg transition-all cursor-pointer"
          >

            <div className="flex items-center justify-between">

              <div className="w-11 h-11 rounded-xl bg-violet-50 dark:bg-violet-950/40 flex items-center justify-center">

                <ClipboardList className="w-5 h-5 text-violet-600 dark:text-violet-400" />

              </div>

              <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-700 group-hover:text-violet-500 group-hover:translate-x-1 transition-all" />

            </div>

            <h3 className="mt-4 font-bold text-slate-800 dark:text-white">
              Plan de tratamiento
            </h3>

            <p className="mt-1 text-xs text-slate-400">
              Planificar tratamientos odontológicos
            </p>

            <div className="mt-4 flex items-center gap-2 text-[11px] font-bold text-violet-600 dark:text-violet-400">
              <Stethoscope className="w-3 h-3" />
              Tratamiento personalizado
            </div>

          </button>

        </div>

      </section>


      {/* =================================================
          MINI RESUMEN DE AGENDA
      ================================================= */}

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* COLUMNA PRINCIPAL */}

        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">

          <div className="flex items-center justify-between">

            <div>

              <div className="flex items-center gap-2">

                <Clock className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />

                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Resumen de agenda
                </h2>

              </div>

              <p className="text-xs text-slate-400 mt-1">
                Estado de las atenciones programadas
              </p>

            </div>

            <button
              onClick={() => setView('citas')}
              className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 transition cursor-pointer"
            >
              Ver agenda
            </button>

          </div>


          <div className="mt-6 grid grid-cols-3 gap-3">

            <div className="rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4">

              <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
                Hoy
              </p>

              <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">
                {citasDeHoyCount}
              </p>

              <p className="text-[10px] text-slate-400 mt-1">
                citas
              </p>

            </div>


            <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50 p-4">

              <p className="text-[10px] uppercase tracking-wider font-extrabold text-amber-600 dark:text-amber-400">
                Pendientes
              </p>

              <p className="mt-2 text-2xl font-extrabold text-amber-700 dark:text-amber-400">
                {citasPendientes}
              </p>

              <p className="text-[10px] text-amber-600/70 dark:text-amber-400/70 mt-1">
                por confirmar
              </p>

            </div>


            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 p-4">

              <p className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-600 dark:text-emerald-400">
                Equipo
              </p>

              <p className="mt-2 text-2xl font-extrabold text-emerald-700 dark:text-emerald-400">
                {totalMedicos}
              </p>

              <p className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 mt-1">
                profesionales
              </p>

            </div>

          </div>

        </div>


        {/* PANEL LATERAL */}

        <div className="relative overflow-hidden bg-gradient-to-br from-cyan-600 to-blue-700 dark:from-cyan-950 dark:to-blue-950 rounded-2xl p-6 text-white shadow-sm">

          <div className="absolute -right-12 -top-12 w-36 h-36 rounded-full bg-white/10 blur-2xl" />

          <div className="relative">

            <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center">

              <Stethoscope className="w-5 h-5 text-white" />

            </div>

            <p className="mt-5 text-[10px] uppercase tracking-[0.18em] font-extrabold text-cyan-100">
              Atención clínica
            </p>

            <h3 className="mt-2 text-xl font-extrabold">
              Todo listo para continuar.
            </h3>

            <p className="mt-2 text-xs leading-5 text-cyan-50/80">
              Acceda rápidamente a pacientes, agenda e historias
              clínicas desde este panel.
            </p>

            <button
              onClick={() => setView('citas')}
              className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-cyan-700 hover:bg-cyan-50 text-xs font-extrabold transition cursor-pointer"
            >
              Revisar agenda
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

          </div>

        </div>

      </section>


      {/* =================================================
          AGENDA CLÍNICA
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


                      {/* ACCIÓN */}

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
          PIE
      ================================================= */}

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 pt-1">

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