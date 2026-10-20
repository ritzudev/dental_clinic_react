
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Loader2,
  RefreshCw,
  UserRound,
  Stethoscope,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  Baby,
  ClipboardList,
  HeartPulse,
  X,
} from 'lucide-react';

interface Paciente {
  nombres: string;
  apellidos: string;
}

interface Medico {
  nombres: string;
  apellidos: string;
  especialidades?: string[];
}

interface CitaAgenda {
  id: number;
  paciente_id: number;
  medico_id: number;
  especialidad: string;
  fecha: string;
  hora: string;
  motivo_consulta: string;
  descripcion?: string;
  estado: string;
  pacientes?: Paciente | Paciente[] | null;
  medicos?: Medico | Medico[] | null;
}

interface PosicionCita {
  carril: number;
  totalCarriles: number;
}

const HORA_INICIO = 9;
const HORA_FIN = 19;
const ALTURA_HORA = 64;
const DURACION_CITA = 45;

const DIAS_SEMANA = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
];

const ESTILOS_ESTADO: Record<
  string,
  {
    bloque: string;
    punto: string;
    etiqueta: string;
    suave: string;
  }
> = {
  pendiente: {
    bloque:
      'border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-100',
    punto: 'bg-amber-500',
    etiqueta: 'Pendiente',
    suave: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200',
  },
  confirmada: {
    bloque:
      'border-sky-300 bg-sky-50 text-sky-950 dark:border-sky-500/40 dark:bg-sky-500/15 dark:text-sky-100',
    punto: 'bg-sky-500',
    etiqueta: 'Confirmada',
    suave: 'bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-200',
  },
  atendida: {
    bloque:
      'border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-100',
    punto: 'bg-emerald-500',
    etiqueta: 'Atendida',
    suave:
      'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200',
  },
  cancelada: {
    bloque:
      'border-rose-300 bg-rose-50 text-rose-950 dark:border-rose-500/40 dark:bg-rose-500/15 dark:text-rose-100',
    punto: 'bg-rose-500',
    etiqueta: 'Cancelada',
    suave: 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-200',
  },
};

const ESTADO_POR_DEFECTO = ESTILOS_ESTADO.pendiente;

function fechaLocal(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');

  return `${anio}-${mes}-${dia}`;
}

function desdeFechaLocal(valor: string): Date {
  const [anio, mes, dia] = valor.split('-').map(Number);
  return new Date(anio, mes - 1, dia);
}

function obtenerLunes(fecha: Date): Date {
  const lunes = new Date(
    fecha.getFullYear(),
    fecha.getMonth(),
    fecha.getDate(),
  );

  const diaSemana = lunes.getDay();
  const diferencia = diaSemana === 0 ? -6 : 1 - diaSemana;

  lunes.setDate(lunes.getDate() + diferencia);
  return lunes;
}

function sumarDias(fecha: Date, cantidad: number): Date {
  const resultado = new Date(fecha);
  resultado.setDate(resultado.getDate() + cantidad);
  return resultado;
}

function nombrePersona(
  persona: Paciente | Medico | Paciente[] | Medico[] | null | undefined,
): string {
  if (!persona) return 'Sin información';

  const registro = Array.isArray(persona) ? persona[0] : persona;

  if (!registro) return 'Sin información';

  return (
    `${registro.nombres ?? ''} ${registro.apellidos ?? ''}`.trim() ||
    'Sin nombre'
  );
}

function horaAMinutos(hora: string): number {
  const [horas, minutos] = hora.split(':').map(Number);
  return (horas || 0) * 60 + (minutos || 0);
}

function formatoHora(hora: string): string {
  return hora?.slice(0, 5) ?? '';
}

function horaLegible(hora: string): string {
  const [horas, minutos] = hora.split(':').map(Number);

  if (Number.isNaN(horas) || Number.isNaN(minutos)) {
    return formatoHora(hora);
  }

  const periodo = horas >= 12 ? 'p. m.' : 'a. m.';
  const hora12 = horas % 12 || 12;

  return `${hora12}:${String(minutos).padStart(2, '0')} ${periodo}`;
}

function rangoSemana(inicio: Date, fin: Date): string {
  const mismoMes =
    inicio.getMonth() === fin.getMonth() &&
    inicio.getFullYear() === fin.getFullYear();

  if (mismoMes) {
    return `${inicio.getDate()} – ${fin.getDate()} de ${fin.toLocaleDateString(
      'es-PE',
      { month: 'long', year: 'numeric' },
    )}`;
  }

  return `${inicio.toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'short',
  })} – ${fin.toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })}`;
}

function distribuirCitasDelDia(
  citasDelDia: CitaAgenda[],
): Map<number, PosicionCita> {
  const resultado = new Map<number, PosicionCita>();

  const citasOrdenadas = [...citasDelDia]
    .filter((cita) => {
      const inicio = horaAMinutos(cita.hora);
      const fin = inicio + DURACION_CITA;

      return inicio < HORA_FIN * 60 && fin > HORA_INICIO * 60;
    })
    .sort((a, b) => horaAMinutos(a.hora) - horaAMinutos(b.hora));

  let indice = 0;

  while (indice < citasOrdenadas.length) {
    const grupo: CitaAgenda[] = [];
    let finGrupo = horaAMinutos(citasOrdenadas[indice].hora) + DURACION_CITA;

    grupo.push(citasOrdenadas[indice]);
    indice += 1;

    while (indice < citasOrdenadas.length) {
      const siguiente = citasOrdenadas[indice];
      const inicioSiguiente = horaAMinutos(siguiente.hora);

      if (inicioSiguiente >= finGrupo) break;

      grupo.push(siguiente);
      finGrupo = Math.max(finGrupo, inicioSiguiente + DURACION_CITA);
      indice += 1;
    }

    const finalesCarriles: number[] = [];
    const asignaciones: Array<{ id: number; carril: number }> = [];

    for (const cita of grupo) {
      const inicio = horaAMinutos(cita.hora);

      let carril = finalesCarriles.findIndex(
        (finCarril) => finCarril <= inicio,
      );

      if (carril === -1) {
        carril = finalesCarriles.length;
        finalesCarriles.push(0);
      }

      finalesCarriles[carril] = inicio + DURACION_CITA;
      asignaciones.push({ id: cita.id, carril });
    }

    const totalCarriles = Math.max(finalesCarriles.length, 1);

    for (const asignacion of asignaciones) {
      resultado.set(asignacion.id, {
        carril: asignacion.carril,
        totalCarriles,
      });
    }
  }

  return resultado;
}

export function AgendaSemanalPanel() {
  const [semana, setSemana] = useState<Date>(() =>
    obtenerLunes(new Date()),
  );
  const [citas, setCitas] = useState<CitaAgenda[]>([]);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [error, setError] = useState('');
  const [citaSeleccionada, setCitaSeleccionada] =
    useState<CitaAgenda | null>(null);

  const dias = useMemo(
    () => Array.from({ length: 5 }, (_, indice) => sumarDias(semana, indice)),
    [semana],
  );

  const finSemana = useMemo(() => sumarDias(semana, 4), [semana]);
  const hoy = fechaLocal(new Date());

  const cargarCitas = useCallback(async () => {
    setCargando(true);
    setActualizando(true);
    setError('');

    try {
      const {
        data: { user },
        error: errorUsuario,
      } = await supabase.auth.getUser();

      if (errorUsuario) throw errorUsuario;

      if (!user) {
        setCitas([]);
        setError('Tu sesión no está disponible. Inicia sesión nuevamente.');
        return;
      }

      const { data: perfil, error: errorPerfil } = await supabase
        .from('perfiles')
        .select('rol')
        .eq('id', user.id)
        .maybeSingle();

      if (errorPerfil) throw errorPerfil;

      let medicoId: number | null = null;

      if (perfil?.rol === 'medico') {
        const { data: medico, error: errorMedico } = await supabase
          .from('medicos')
          .select('id')
          .eq('auth_user_id', user.id)
          .maybeSingle();

        if (errorMedico) throw errorMedico;

        if (!medico) {
          setCitas([]);
          setError(
            'No se encontró el registro del médico asociado a tu usuario.',
          );
          return;
        }

        medicoId = medico.id;
      }

      let consulta = supabase
        .from('citas')
        .select(`
          id,
          paciente_id,
          medico_id,
          especialidad,
          fecha,
          hora,
          motivo_consulta,
          descripcion,
          estado,
          pacientes ( nombres, apellidos ),
          medicos ( nombres, apellidos, especialidades )
        `)
        .gte('fecha', fechaLocal(semana))
        .lte('fecha', fechaLocal(finSemana))
        .order('hora', { ascending: true });

      if (medicoId !== null) {
        consulta = consulta.eq('medico_id', medicoId);
      }

      const { data, error: errorCitas } = await consulta;

      if (errorCitas) throw errorCitas;

      setCitas((data ?? []) as unknown as CitaAgenda[]);
    } catch (err) {
      console.error('Error al cargar la agenda semanal:', err);
      setError(
        'No se pudieron cargar las citas. Comprueba tu conexión e inténtalo nuevamente.',
      );
    } finally {
      setCargando(false);
      setActualizando(false);
    }
  }, [semana, finSemana]);

  useEffect(() => {
    void cargarCitas();
  }, [cargarCitas]);

  const citasPorDia = useMemo(() => {
    const agrupadas: Record<string, CitaAgenda[]> = {};

    for (const dia of dias) {
      agrupadas[fechaLocal(dia)] = [];
    }

    for (const cita of citas) {
      if (agrupadas[cita.fecha]) {
        agrupadas[cita.fecha].push(cita);
      }
    }

    return agrupadas;
  }, [citas, dias]);

  const totalSemana = citas.length;
  const totalPendientes = citas.filter(
    (cita) => cita.estado === 'pendiente',
  ).length;
  const totalConfirmadas = citas.filter(
    (cita) => cita.estado === 'confirmada',
  ).length;
  const totalAtendidas = citas.filter(
    (cita) => cita.estado === 'atendida',
  ).length;

  function cambiarSemana(cantidad: number) {
    setSemana((actual) => sumarDias(actual, cantidad * 7));
    setCitaSeleccionada(null);
  }

  function irAHoy() {
    setSemana(obtenerLunes(new Date()));
    setCitaSeleccionada(null);
  }

  function posicionCita(cita: CitaAgenda) {
    const inicioMinutos = horaAMinutos(cita.hora);
    const limiteSuperior = HORA_INICIO * 60;
    const limiteInferior = HORA_FIN * 60;

    const inicioVisible = Math.max(inicioMinutos, limiteSuperior);
    const finVisible = Math.min(
      inicioMinutos + DURACION_CITA,
      limiteInferior,
    );

    return {
      top: ((inicioVisible - limiteSuperior) / 60) * ALTURA_HORA,
      height: Math.max(
        ((finVisible - inicioVisible) / 60) * ALTURA_HORA,
        28,
      ),
      fueraDeHorario:
        inicioMinutos >= limiteInferior ||
        inicioMinutos + DURACION_CITA <= limiteSuperior,
    };
  }

  const fechaSeleccionada = citaSeleccionada
    ? desdeFechaLocal(citaSeleccionada.fecha)
    : null;

  const estiloSeleccionado = citaSeleccionada
    ? ESTILOS_ESTADO[citaSeleccionada.estado] ?? ESTADO_POR_DEFECTO
    : null;

  return (
    <div className="min-h-full space-y-5 bg-gradient-to-b from-cyan-50/60 via-slate-50 to-sky-50/40 p-3 text-slate-800 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 sm:space-y-6 sm:p-5 lg:p-7">
      {/* Encabezado */}
      <header className="relative overflow-hidden rounded-3xl border border-cyan-100 bg-white p-5 shadow-sm dark:border-cyan-900/50 dark:bg-slate-900 sm:p-6">
        <div className="pointer-events-none absolute -right-10 -top-14 h-44 w-44 rounded-full bg-cyan-100/70 blur-3xl dark:bg-cyan-500/10" />
        <div className="pointer-events-none absolute -bottom-16 right-36 h-36 w-36 rounded-full bg-emerald-100/70 blur-3xl dark:bg-emerald-500/10" />

        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-500 text-white shadow-lg shadow-cyan-200/60 dark:shadow-none">
              <CalendarDays className="h-7 w-7" />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                  Atención infantil
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400">
                  <HeartPulse className="h-3.5 w-3.5" />
                  Organización clínica
                </span>
              </div>

              <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                Agenda semanal
              </h1>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                Organiza las consultas, revisa los horarios y consulta los
                detalles de cada pequeño paciente.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => cambiarSemana(-1)}
              aria-label="Semana anterior"
              title="Semana anterior"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-cyan-500"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={irAHoy}
              className="h-10 rounded-xl border border-cyan-200 bg-cyan-50 px-4 text-sm font-bold text-cyan-800 transition hover:bg-cyan-100 dark:border-cyan-800 dark:bg-cyan-500/10 dark:text-cyan-200 dark:hover:bg-cyan-500/20"
            >
              Hoy
            </button>

            <button
              type="button"
              onClick={() => cambiarSemana(1)}
              aria-label="Semana siguiente"
              title="Semana siguiente"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-cyan-500"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={() => void cargarCitas()}
              disabled={actualizando}
              className="flex h-10 items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                className={`h-4 w-4 ${actualizando ? 'animate-spin' : ''}`}
              />
              Actualizar
            </button>
          </div>
        </div>
      </header>

      {/* Resumen de citas */}
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <div className="rounded-2xl border border-cyan-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 sm:text-sm">
              Citas de la semana
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-300">
              <CalendarDays className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {cargando ? '—' : totalSemana}
          </p>
          <p className="mt-1 text-xs text-slate-400">Lunes a viernes</p>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 sm:text-sm">
              Pendientes
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
              <Clock3 className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold tracking-tight text-amber-600 dark:text-amber-400">
            {cargando ? '—' : totalPendientes}
          </p>
          <p className="mt-1 text-xs text-slate-400">Por atender</p>
        </div>

        <div className="rounded-2xl border border-sky-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 sm:text-sm">
              Confirmadas
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300">
              <CalendarCheck className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold tracking-tight text-sky-600 dark:text-sky-400">
            {cargando ? '—' : totalConfirmadas}
          </p>
          <p className="mt-1 text-xs text-slate-400">Citas confirmadas</p>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 sm:text-sm">
              Atendidas
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
            {cargando ? '—' : totalAtendidas}
          </p>
          <p className="mt-1 text-xs text-slate-400">Atención completada</p>
        </div>
      </section>

      {/* Título de semana y leyenda */}
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-700 dark:text-cyan-400">
            Calendario de atención
          </p>
          <h2 className="mt-1 text-xl font-extrabold capitalize text-slate-900 dark:text-white sm:text-2xl">
            {rangoSemana(semana, finSemana)}
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Horario visible: 9:00 a. m. – 7:00 p. m.
          </p>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-slate-600 dark:text-slate-300">
          {Object.entries(ESTILOS_ESTADO).map(([estado, estilo]) => (
            <div key={estado} className="flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-full ${estilo.punto}`} />
              {estilo.etiqueta}
            </div>
          ))}
        </div>
      </section>

      {error && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200 sm:flex-row sm:items-center sm:justify-between"
        >
          <p>{error}</p>
          <button
            type="button"
            onClick={() => void cargarCitas()}
            className="shrink-0 font-bold underline underline-offset-4"
          >
            Intentar nuevamente
          </button>
        </div>
      )}

      {/* Calendario izquierdo + detalle derecho */}
      <section className="grid min-w-0 grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px] 2xl:grid-cols-[minmax(0,1fr)_350px]">
        {/* Calendario */}
        <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 dark:border-slate-800 sm:px-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300">
                <CalendarClock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white">
                  Horario de citas
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Selecciona una cita para ver sus detalles
                </p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
              9:00 a. m. – 7:00 p. m.
            </span>
          </div>

          {cargando ? (
            <div className="flex min-h-80 flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-600 dark:text-cyan-400" />
              <p className="text-sm font-medium">Cargando agenda semanal...</p>
            </div>
          ) : (
            <div className="overflow-x-auto overscroll-x-contain">
              <div className="min-w-[740px]">
                {/* Cabecera de días */}
                <div
                  className="grid border-b border-slate-200 bg-slate-50/90 dark:border-slate-800 dark:bg-slate-950/70"
                  style={{
                    gridTemplateColumns: '58px repeat(5, minmax(0, 1fr))',
                  }}
                >
                  <div className="flex items-center justify-center border-r border-slate-200 dark:border-slate-800">
                    <Clock3 className="h-4 w-4 text-slate-400" />
                  </div>

                  {dias.map((dia, indice) => {
                    const clave = fechaLocal(dia);
                    const esHoy = clave === hoy;
                    const cantidad = citasPorDia[clave]?.length ?? 0;

                    return (
                      <div
                        key={clave}
                        className={`min-w-0 border-r border-slate-200 px-1.5 py-3 text-center last:border-r-0 dark:border-slate-800 sm:px-2 ${
                          esHoy ? 'bg-cyan-50/80 dark:bg-cyan-500/10' : ''
                        }`}
                      >
                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 sm:text-xs">
                          {DIAS_SEMANA[indice]}
                        </p>
                        <div
                          className={`mx-auto mt-1 flex h-8 w-8 items-center justify-center rounded-xl text-sm font-extrabold sm:h-9 sm:w-9 sm:text-base ${
                            esHoy
                              ? 'bg-cyan-600 text-white shadow-sm'
                              : 'text-slate-800 dark:text-white'
                          }`}
                        >
                          {dia.getDate()}
                        </div>
                        <p className="mt-1 truncate text-[9px] font-medium text-slate-400 sm:text-[10px]">
                          {dia
                            .toLocaleDateString('es-PE', { month: 'short' })
                            .replace('.', '')}
                          {' · '}
                          {cantidad} {cantidad === 1 ? 'cita' : 'citas'}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Cuadrícula horaria */}
                <div
                  className="grid"
                  style={{
                    gridTemplateColumns: '58px repeat(5, minmax(0, 1fr))',
                  }}
                >
                  <div className="relative border-r border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-950/40">
                    {Array.from(
                      { length: HORA_FIN - HORA_INICIO },
                      (_, indice) => {
                        const hora = HORA_INICIO + indice;

                        return (
                          <div
                            key={hora}
                            className="relative border-b border-slate-100 dark:border-slate-800/80"
                            style={{ height: ALTURA_HORA }}
                          >
                            <span className="absolute -top-2 right-1 whitespace-nowrap text-[9px] font-semibold text-slate-400 sm:right-2 sm:text-[10px]">
                              {new Date(2000, 0, 1, hora).toLocaleTimeString(
                                'es-PE',
                                {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true,
                                },
                              ).replace(' a. m.', ' AM').replace(' p. m.', ' PM')}
                            </span>
                          </div>
                        );
                      },
                    )}
                  </div>

                  {dias.map((dia) => {
                    const clave = fechaLocal(dia);
                    const citasDelDia = citasPorDia[clave] ?? [];
                    const esHoy = clave === hoy;
                    const posiciones = distribuirCitasDelDia(citasDelDia);

                    return (
                      <div
                        key={clave}
                        className={`relative border-r border-slate-200 last:border-r-0 dark:border-slate-800 ${
                          esHoy
                            ? 'bg-cyan-50/30 dark:bg-cyan-500/[0.035]'
                            : ''
                        }`}
                        style={{
                          height: (HORA_FIN - HORA_INICIO) * ALTURA_HORA,
                        }}
                      >
                        {/* Líneas horarias */}
                        {Array.from(
                          { length: HORA_FIN - HORA_INICIO },
                          (_, indice) => (
                            <div
                              key={indice}
                              className="pointer-events-none absolute inset-x-0 border-b border-slate-100 dark:border-slate-800"
                              style={{
                                top: (indice + 1) * ALTURA_HORA,
                                height: 1,
                              }}
                            />
                          ),
                        )}

                        {/* Citas con carriles para evitar superposición */}
                        {citasDelDia.map((cita) => {
                          const posicion = posicionCita(cita);
                          if (posicion.fueraDeHorario) return null;

                          const distribucion = posiciones.get(cita.id) ?? {
                            carril: 0,
                            totalCarriles: 1,
                          };

                          const estilo =
                            ESTILOS_ESTADO[cita.estado] ??
                            ESTADO_POR_DEFECTO;

                          const anchoCarril = 100 / distribucion.totalCarriles;
                          const izquierda = distribucion.carril * anchoCarril;
                          const derecha =
                            (distribucion.totalCarriles -
                              distribucion.carril -
                              1) *
                            anchoCarril;

                          const seleccionada =
                            citaSeleccionada?.id === cita.id;

                          return (
                            <button
                              key={cita.id}
                              type="button"
                              onClick={() => setCitaSeleccionada(cita)}
                              aria-pressed={seleccionada}
                              title={`${nombrePersona(cita.pacientes)} · ${horaLegible(cita.hora)}`}
                              className={`absolute z-10 overflow-hidden rounded-md border-l-[3px] px-1 py-1 text-left transition hover:z-20 hover:brightness-[0.98] hover:shadow-md focus-visible:z-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 sm:rounded-lg sm:px-1.5 ${estilo.bloque} ${
                                seleccionada
                                  ? 'z-20 ring-2 ring-cyan-500 ring-offset-1 dark:ring-offset-slate-900'
                                  : ''
                              }`}
                              style={{
                                top: posicion.top + 2,
                                height: posicion.height - 4,
                                minHeight: 27,
                                left: `calc(${izquierda}% + 2px)`,
                                right: `calc(${derecha}% + 2px)`,
                              }}
                            >
                              <p className="truncate text-[9px] font-extrabold leading-tight sm:text-[10px]">
                                {formatoHora(cita.hora)}
                              </p>
                              <p className="mt-0.5 truncate text-[9px] font-bold leading-tight sm:text-[11px]">
                                {nombrePersona(cita.pacientes)}
                              </p>
                              {posicion.height >= 58 &&
                                distribucion.totalCarriles === 1 && (
                                  <p className="mt-1 truncate text-[9px] leading-tight opacity-80">
                                    {cita.especialidad || 'Consulta general'}
                                  </p>
                                )}
                            </button>
                          );
                        })}

                        {citasDelDia.length === 0 && (
                          <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center">
                            <span className="text-[10px] text-slate-300 dark:text-slate-700">
                              Libre
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 bg-slate-50/70 px-4 py-3 text-[11px] text-slate-500 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400 sm:px-5">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-cyan-500" />
              Día actual
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-sky-500" />
              Selecciona una cita
            </span>
            <span>Duración visual estimada: 45 minutos por cita</span>
          </div>
        </div>

        {/* Panel lateral de detalle */}
        <aside className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 xl:sticky xl:top-5">
          <div className="relative overflow-hidden bg-gradient-to-br from-cyan-600 via-cyan-600 to-sky-600 p-5 text-white">
            <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full border-[20px] border-white/10" />
            <div className="pointer-events-none absolute -bottom-12 right-16 h-28 w-28 rounded-full bg-white/10 blur-xl" />

            <div className="relative flex items-start justify-between gap-3">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide">
                  <ClipboardList className="h-3.5 w-3.5" />
                  Información clínica
                </span>
                <h3 className="mt-3 text-xl font-extrabold">
                  Detalle de cita
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-cyan-50">
                  Consulta los datos de la atención seleccionada.
                </p>
              </div>
              {citaSeleccionada && (
                <button
                  type="button"
                  onClick={() => setCitaSeleccionada(null)}
                  aria-label="Quitar cita seleccionada"
                  className="rounded-xl p-2 text-white/80 transition hover:bg-white/15 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {citaSeleccionada && fechaSeleccionada && estiloSeleccionado ? (
            <div className="space-y-5 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300">
                  <Baby className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    Paciente
                  </p>
                  <p className="mt-1 break-words text-base font-extrabold text-slate-900 dark:text-white">
                    {nombrePersona(citaSeleccionada.pacientes)}
                  </p>
                  <span
                    className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${estiloSeleccionado.suave}`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${estiloSeleccionado.punto}`}
                    />
                    {estiloSeleccionado.etiqueta}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-3 dark:border-cyan-900/40 dark:bg-cyan-500/5">
                  <CalendarDays className="h-4 w-4 text-cyan-700 dark:text-cyan-300" />
                  <p className="mt-2 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                    Fecha
                  </p>
                  <p className="mt-1 text-sm font-extrabold capitalize text-slate-800 dark:text-white">
                    {fechaSeleccionada.toLocaleDateString('es-PE', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    }).replace('.', '')}
                  </p>
                </div>

                <div className="rounded-2xl border border-sky-100 bg-sky-50/60 p-3 dark:border-sky-900/40 dark:bg-sky-500/5">
                  <Clock3 className="h-4 w-4 text-sky-700 dark:text-sky-300" />
                  <p className="mt-2 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                    Hora
                  </p>
                  <p className="mt-1 text-sm font-extrabold text-slate-800 dark:text-white">
                    {horaLegible(citaSeleccionada.hora)}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-slate-400">
                    Médico responsable
                  </p>
                  <div className="mt-2 flex items-start gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                      <Stethoscope className="h-4 w-4" />
                    </div>
                    <p className="pt-1.5 text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {nombrePersona(citaSeleccionada.medicos)}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-slate-400">
                    Especialidad
                  </p>
                  <p className="mt-1.5 text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {citaSeleccionada.especialidad || 'No especificada'}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-slate-400">
                    Motivo de consulta
                  </p>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    {citaSeleccionada.motivo_consulta ||
                      'Sin motivo registrado'}
                  </p>
                </div>

                {citaSeleccionada.descripcion && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-slate-400">
                      Descripción
                    </p>
                    <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                      {citaSeleccionada.descripcion}
                    </p>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    Información de la cita
                  </p>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  Este panel es de consulta. Para cambiar el estado o editar
                  los datos, utiliza las opciones disponibles en el módulo de
                  citas.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setCitaSeleccionada(null)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-cyan-700 dark:hover:bg-cyan-500/10 dark:hover:text-cyan-200"
              >
                Quitar selección
              </button>
            </div>
          ) : (
            <div className="flex min-h-80 flex-col items-center justify-center px-6 py-10 text-center">
              <div className="relative flex h-20 w-20 items-center justify-center rounded-[28px] bg-gradient-to-br from-cyan-50 to-emerald-50 text-cyan-600 dark:from-cyan-500/10 dark:to-emerald-500/10 dark:text-cyan-300">
                <CalendarCheck className="h-9 w-9" />
                <span className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
              </div>

              <h4 className="mt-5 text-base font-extrabold text-slate-900 dark:text-white">
                Selecciona una cita
              </h4>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                Haz clic en cualquier bloque del calendario para consultar el
                paciente, el horario, el médico y el motivo de atención.
              </p>

              <div className="mt-5 flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-800 dark:bg-cyan-500/10 dark:text-cyan-200">
                <UserRound className="h-4 w-4" />
                Detalles de atención
              </div>
            </div>
          )}
        </aside>
      </section>

      <p className="px-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
        La agenda muestra de lunes a viernes. En pantallas pequeñas puedes
        deslizar horizontalmente el calendario para ver todos los días. La
        duración visual de cada cita se estima en 45 minutos porque el modelo
        actual no incluye un campo de duración.
      </p>
    </div>
  );
}

export default AgendaSemanalPanel;
