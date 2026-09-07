import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  Search,
  User,
  CalendarDays,
  Stethoscope,
  ClipboardList,
UserRound,
} from 'lucide-react';

interface Paciente {
  id: number;
  nombres: string;
  apellidos: string;
  dni: string;
  telefono: string;
  sexo: string;
}

interface HistoriaClinica {
  id: number;
  paciente_id: number;
  medico_id: number;
  cita_id: number;

  motivo_consulta: string;
  diagnostico: string;
  tratamiento_realizado: string;
  observaciones: string;

  created_at: string;

  citas?: {
    fecha: string;
    especialidad: string;
  };
  medicos?: {
  nombres: string;
  apellidos: string;
};
}
export const HistoriaClinicaPanel = () => {
  const [busqueda, setBusqueda] = useState('');
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(false);

  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<Paciente | null>(null);
  const [historial, setHistorial] = useState<HistoriaClinica[]>([]);
  const [filtroTexto, setFiltroTexto] = useState("");
const [filtroEspecialidad, setFiltroEspecialidad] = useState("todas");
const [filtroAnio, setFiltroAnio] = useState("todos");
const [ordenFecha, setOrdenFecha] = useState("desc");

  const buscarPacientes = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('pacientes')
      .select('*')
      .or(
        `nombres.ilike.%${busqueda}%,apellidos.ilike.%${busqueda}%,dni.ilike.%${busqueda}%`
      )
      .limit(10);

    if (!error && data) {
      setPacientes(data);
    }

    setLoading(false);
  };

  const cargarHistorial = async (
  pacienteId: number,
  paciente: Paciente
) => {
  setPacienteSeleccionado(paciente);

  const { data, error } = await supabase
  .from('historias_clinicas')
  .select(`
    *,
    citas (
      fecha,
      especialidad
    ),
    medicos (
      nombres,
      apellidos
    )
  `)
  .eq('paciente_id', pacienteId)
  .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  setHistorial(data || []);
};

  useEffect(() => {
    buscarPacientes();
  }, []);
  const historialFiltrado = historial.filter((historia) => {

  const texto = filtroTexto.toLowerCase();

  const coincideTexto =
    historia.motivo_consulta.toLowerCase().includes(texto) ||
    historia.diagnostico.toLowerCase().includes(texto) ||
    historia.tratamiento_realizado.toLowerCase().includes(texto) ||
    historia.observaciones.toLowerCase().includes(texto) ||
    `${historia.medicos?.nombres ?? ""} ${historia.medicos?.apellidos ?? ""}`
      .toLowerCase()
      .includes(texto);

  const coincideEspecialidad =
    filtroEspecialidad === "todas" ||
    historia.citas?.especialidad === filtroEspecialidad;

  const coincideAnio =
    filtroAnio === "todos" ||
    historia.citas?.fecha?.startsWith(filtroAnio);

  return coincideTexto && coincideEspecialidad && coincideAnio;
});
const historialOrdenado = [...historialFiltrado].sort((a, b) => {

  const fechaA = new Date(a.citas?.fecha ?? "").getTime();
  const fechaB = new Date(b.citas?.fecha ?? "").getTime();

  return ordenFecha === "desc"
    ? fechaB - fechaA
    : fechaA - fechaB;

});
  


return (
  <div className="min-h-full w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 p-4 md:p-6">

    {/* HEADER */}
    <div className="max-w-[1600px] mx-auto space-y-6">

      <div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <User className="w-5 h-5 text-cyan-500" />
          </div>

          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">
              Historia Clínica
            </h1>

            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Consulta y seguimiento del historial clínico de los pacientes.
            </p>
          </div>
        </div>
      </div>


      {/* CONTENEDOR PRINCIPAL */}
      <div className="grid grid-cols-1 xl:grid-cols-[280px_minmax(0,1fr)] gap-4">


        {/* ====================================================== */}
        {/* PANEL IZQUIERDO - PACIENTES */}
        {/* ====================================================== */}

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden h-fit xl:sticky xl:top-6">

          {/* CABECERA */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">

            <div className="flex items-center justify-between mb-3">

              <div>
                <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Buscar paciente
                </h2>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Selecciona un paciente para consultar su historia
                </p>
              </div>

            </div>


            {/* BUSCADOR */}
            <div className="relative">

              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

              <input
                type="text"
                placeholder="Buscar por DNI, nombre o apellido..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    buscarPacientes();
                  }
                }}
                className="w-full h-10 pl-9 pr-3 rounded-xl
                bg-slate-50 dark:bg-slate-950
                border border-slate-200 dark:border-slate-800
                text-sm text-slate-900 dark:text-white
                placeholder:text-slate-400
                outline-none
                focus:border-cyan-500
                focus:ring-2 focus:ring-cyan-500/10
                transition"
              />

            </div>

          </div>


          {/* TÍTULO LISTA */}
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">

            <div className="flex items-center justify-between">

              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Pacientes encontrados
              </span>

              <span className="text-xs font-bold text-cyan-500">
                {pacientes.length}
              </span>

            </div>

          </div>


          {/* LISTA DE PACIENTES */}
          <div className="max-h-[calc(100vh-280px)] overflow-y-auto scrollbar-hide">

            {loading ? (

              <div className="p-8 text-center">
                <div className="w-8 h-8 mx-auto mb-3 rounded-full border-2 border-slate-300 border-t-cyan-500 animate-spin" />

                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Cargando pacientes...
                </p>
              </div>

            ) : pacientes.length === 0 ? (

              <div className="p-8 text-center">

                <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <User className="w-5 h-5 text-slate-400" />
                </div>

                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  No se encontraron pacientes
                </p>

              </div>

            ) : (

              <div className="p-2 space-y-1">

                {pacientes.map((paciente) => {

                  const seleccionado =
                    pacienteSeleccionado?.id === paciente.id;

                  return (

                    <button
                      key={paciente.id}
                      onClick={() =>
                        cargarHistorial(paciente.id, paciente)
                      }
                      className={`w-full text-left rounded-xl p-3 transition border ${
                        seleccionado
                          ? 'bg-cyan-500/10 border-cyan-500/40'
                          : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >

                      <div className="flex items-center gap-3">

                        {/* AVATAR */}
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                            seleccionado
                              ? 'bg-cyan-500 text-white'
                              : 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-500'
                          }`}
                        >
                          <User className="w-4 h-4" />
                        </div>


                        {/* INFO */}
                        <div className="min-w-0 flex-1">

                          <p className={`text-sm font-bold truncate ${
                            seleccionado
                              ? 'text-cyan-500'
                              : 'text-slate-800 dark:text-white'
                          }`}>
                            {paciente.nombres} {paciente.apellidos}
                          </p>

                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            DNI: {paciente.dni}
                          </p>

                          {paciente.telefono && (
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                              {paciente.telefono}
                            </p>
                          )}

                        </div>


                        {/* INDICADOR */}
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          seleccionado
                            ? 'bg-cyan-500'
                            : 'bg-slate-300 dark:bg-slate-700'
                        }`} />

                      </div>

                    </button>

                  );

                })}

              </div>

            )}

          </div>

        </div>



        {/* ====================================================== */}
        {/* PANEL DERECHO - HISTORIA CLÍNICA */}
        {/* ====================================================== */}

        <div className="min-w-0">

          {!pacienteSeleccionado ? (

            /* ESTADO SIN PACIENTE */
            <div className="min-h-[600px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-center">

              <div className="text-center max-w-md px-6">

                <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                  <User className="w-7 h-7 text-cyan-500" />
                </div>

                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Selecciona un paciente
                </h2>

                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                  Selecciona un paciente del panel izquierdo para consultar su historia clínica y sus consultas registradas.
                </p>

              </div>

            </div>

          ) : (

            <div className="space-y-5">


              {/* ================================================== */}
              {/* CABECERA DEL PACIENTE */}
              {/* ================================================== */}

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">

                <div className="p-5 md:p-6">

                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">

                    <div className="flex items-center gap-4">

                      <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                        <span className="text-lg font-extrabold text-cyan-500">
                          {pacienteSeleccionado.nombres?.charAt(0)}
                          {pacienteSeleccionado.apellidos?.charAt(0)}
                        </span>
                      </div>

                      <div>

                        <p className="text-[11px] uppercase tracking-wider font-bold text-cyan-500">
                          Paciente
                        </p>

                        <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white">
                          {pacienteSeleccionado.nombres} {pacienteSeleccionado.apellidos}
                        </h2>

                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Historia clínica odontológica
                        </p>

                      </div>

                    </div>


                    <div className="flex items-center gap-2">

                      <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold border border-emerald-500/20">
                        Historia activa
                      </span>

                    </div>

                  </div>


                  {/* DATOS PACIENTE */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">

                    <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                        DNI
                      </p>
                      <p className="text-sm font-bold text-slate-800 dark:text-white mt-1">
                        {pacienteSeleccionado.dni || '--'}
                      </p>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                        Teléfono
                      </p>
                      <p className="text-sm font-bold text-slate-800 dark:text-white mt-1">
                        {pacienteSeleccionado.telefono || '--'}
                      </p>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                        Sexo
                      </p>
                      <p className="text-sm font-bold text-slate-800 dark:text-white mt-1">
                        {pacienteSeleccionado.sexo || '--'}
                      </p>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                        Consultas
                      </p>
                      <p className="text-sm font-bold text-cyan-500 mt-1">
                        {historial.length}
                      </p>
                    </div>

                  </div>

                </div>

              </div>



              {/* ================================================== */}
              {/* RESUMEN CLÍNICO */}
              {/* ================================================== */}

             {/* RESUMEN CLÍNICO */}
<div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

  {/* TOTAL DE CONSULTAS */}
  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
    <div className="flex items-start gap-3">

      <div className="w-10 h-10 shrink-0 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
        <ClipboardList className="w-5 h-5 text-cyan-500" />
      </div>

      <div className="min-w-0">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Total de consultas
        </p>

        <p className="text-2xl font-extrabold text-cyan-500 mt-1">
          {historialFiltrado.length}
        </p>

        <p className="text-[11px] text-slate-400 mt-1">
          Registros clínicos
        </p>
      </div>

    </div>
  </div>


  {/* ESPECIALIDADES */}
  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
    <div className="flex items-start gap-3">

      <div className="w-10 h-10 shrink-0 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
        <Stethoscope className="w-5 h-5 text-emerald-500" />
      </div>

      <div className="min-w-0">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Especialidades
        </p>

        <p className="text-2xl font-extrabold text-emerald-500 mt-1">
          {new Set(
            historialFiltrado
              .map(h => h.citas?.especialidad)
              .filter(Boolean)
          ).size}
        </p>

        <p className="text-[11px] text-slate-400 mt-1">
          Áreas atendidas
        </p>
      </div>

    </div>
  </div>


  {/* ÚLTIMA CONSULTA */}
  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
    <div className="flex items-start gap-3">

      <div className="w-10 h-10 shrink-0 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
        <CalendarDays className="w-5 h-5 text-amber-500" />
      </div>

      <div className="min-w-0">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Última consulta
        </p>

        <p className="text-base font-extrabold text-amber-500 mt-2">
          {historialOrdenado[0]?.citas?.fecha
            ? new Date(historialOrdenado[0].citas.fecha)
                .toLocaleDateString("es-PE")
            : "--"}
        </p>

        <p className="text-[11px] text-slate-400 mt-1">
          Registro más reciente
        </p>
      </div>

    </div>
  </div>


  {/* MÉDICOS REGISTRADOS */}
  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
    <div className="flex items-start gap-3">

      <div className="w-10 h-10 shrink-0 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
        <UserRound className="w-5 h-5 text-violet-500" />
      </div>

      <div className="min-w-0">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Médicos registrados
        </p>

        <p className="text-2xl font-extrabold text-violet-500 mt-1">
          {new Set(
            historialFiltrado
              .map(h =>
                h.medicos
                  ? `${h.medicos.nombres} ${h.medicos.apellidos}`
                  : null
              )
              .filter(Boolean)
          ).size}
        </p>

        <p className="text-[11px] text-slate-400 mt-1">
          Profesionales
        </p>
      </div>

    </div>
  </div>

</div>
              {/* ================================================== */}
              {/* HISTORIAL */}
              {/* ================================================== */}

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">

                {/* CABECERA */}
                <div className="p-4 md:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900">

                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

                    <div>
                      <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                        Historial de consultas
                      </h3>

                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Registros clínicos y evolución del paciente
                      </p>
                    </div>

                  </div>


                  {/* FILTROS */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mt-5">

                    <div className="relative">

                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

                      <input
                        type="text"
                        placeholder="Buscar en el historial..."
                        value={filtroTexto}
                        onChange={(e) => setFiltroTexto(e.target.value)}
                        className="w-full h-10 pl-9 pr-3 rounded-xl
                        bg-slate-50 dark:bg-slate-950
                        border border-slate-200 dark:border-slate-800
                        text-sm text-slate-900 dark:text-white
                        outline-none
                        focus:border-cyan-500"
                      />

                    </div>


                    <select
                      value={filtroEspecialidad}
                      onChange={(e) => setFiltroEspecialidad(e.target.value)}
                      className="h-10 px-3 rounded-xl
                      bg-slate-50 dark:bg-slate-950
                      border border-slate-200 dark:border-slate-800
                      text-sm text-slate-800 dark:text-white
                      outline-none focus:border-cyan-500"
                    >

                      <option value="todas">
                        Todas las especialidades
                      </option>

                      {[...new Set(
                        historial
                          .map(h => h.citas?.especialidad)
                          .filter(Boolean)
                      )].map((esp) => (

                        <option key={esp} value={esp}>
                          {esp}
                        </option>

                      ))}

                    </select>


                    <select
                      value={filtroAnio}
                      onChange={(e) => setFiltroAnio(e.target.value)}
                      className="h-10 px-3 rounded-xl
                      bg-slate-50 dark:bg-slate-950
                      border border-slate-200 dark:border-slate-800
                      text-sm text-slate-800 dark:text-white
                      outline-none focus:border-cyan-500"
                    >

                      <option value="todos">
                        Todas las fechas
                      </option>

                      {[...new Set(
                        historial
                          .map(h => h.citas?.fecha?.substring(0, 4))
                          .filter(Boolean)
                      )].map((anio) => (

                        <option key={anio} value={anio}>
                          {anio}
                        </option>

                      ))}

                    </select>


                    <select
                      value={ordenFecha}
                      onChange={(e) => setOrdenFecha(e.target.value)}
                      className="h-10 px-3 rounded-xl
                      bg-slate-50 dark:bg-slate-950
                      border border-slate-200 dark:border-slate-800
                      text-sm text-slate-800 dark:text-white
                      outline-none focus:border-cyan-500"
                    >

                      <option value="desc">
                        Más recientes primero
                      </option>

                      <option value="asc">
                        Más antiguas primero
                      </option>

                    </select>

                  </div>

                </div>



                {/* LISTADO CLÍNICO */}
                <div className="p-5">

                  {historial.length === 0 ? (

                    <div className="py-14 text-center">

                      <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <User className="w-5 h-5 text-slate-400" />
                      </div>

                      <p className="font-bold text-slate-700 dark:text-slate-300">
                        Sin historial clínico
                      </p>

                      <p className="text-sm text-slate-500 mt-1">
                        Este paciente todavía no tiene consultas registradas.
                      </p>

                    </div>

                  ) : historialOrdenado.length === 0 ? (

                    <div className="py-14 text-center">

                      <p className="font-bold text-slate-700 dark:text-slate-300">
                        No hay resultados
                      </p>

                      <p className="text-sm text-slate-500 mt-1">
                        Prueba modificando los filtros de búsqueda.
                      </p>

                    </div>

                  ) : (

                  <div className="overflow-x-auto">

  {/* CABECERA DE LA TABLA */}
  <div className="min-w-[900px]">

    <div className="grid grid-cols-[90px_150px_150px_minmax(140px,1fr)_minmax(140px,1fr)_minmax(140px,1fr)_minmax(140px,1fr)] gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70">

      <div className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
        Fecha
      </div>

      <div className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
        Especialidad
      </div>

      <div className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
        Médico
      </div>

      <div className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
        Motivo de consulta
      </div>

      <div className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
        Diagnóstico
      </div>

      <div className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
        Tratamiento
      </div>

      <div className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
        Observaciones
      </div>

    </div>


    {/* FILAS */}
    <div className="divide-y divide-slate-200 dark:divide-slate-800">

      {historialOrdenado.map((historia) => (

        <div
          key={historia.id}
          className="grid grid-cols-[90px_150px_150px_minmax(140px,1fr)_minmax(140px,1fr)_minmax(140px,1fr)_minmax(140px,1fr)] gap-3 px-4 py-4 items-center hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
        >

          {/* FECHA */}
          <div>

            <p className="text-lg font-extrabold text-slate-900 dark:text-white leading-none">
              {historia.citas?.fecha
                ? new Date(historia.citas.fecha)
                    .getDate()
                    .toString()
                    .padStart(2, '0')
                : '--'}
            </p>

            <p className="text-[10px] uppercase font-bold text-cyan-500 mt-1">
              {historia.citas?.fecha
                ? new Date(historia.citas.fecha)
                    .toLocaleDateString("es-PE", {
                      month: "short"
                    })
                : ''}
            </p>

            <p className="text-[10px] text-slate-400 mt-0.5">
              {historia.citas?.fecha
                ? new Date(historia.citas.fecha).getFullYear()
                : ''}
            </p>

          </div>


          {/* ESPECIALIDAD */}
          <div>

            <span className="inline-flex px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-500 text-[9px] font-extrabold uppercase tracking-wide">
              {historia.citas?.especialidad || 'Consulta'}
            </span>

          </div>


          {/* MÉDICO */}
          <div className="min-w-0">

            <p className="text-xs font-bold text-slate-800 dark:text-white truncate">
              Dr. {historia.medicos?.nombres} {historia.medicos?.apellidos}
            </p>

          </div>


          {/* MOTIVO */}
          <div className="min-w-0">

            <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2">
              {historia.motivo_consulta || 'Sin información'}
            </p>

          </div>


          {/* DIAGNÓSTICO */}
          <div className="min-w-0">

            <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2">
              {historia.diagnostico || 'Sin información'}
            </p>

          </div>


          {/* TRATAMIENTO */}
          <div className="min-w-0">

            <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2">
              {historia.tratamiento_realizado || 'Sin información'}
            </p>

          </div>


          {/* OBSERVACIONES */}
          <div className="min-w-0">

            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
              {historia.observaciones || 'Sin observaciones'}
            </p>

          </div>

        </div>

      ))}

    </div>

  </div>

</div>

                  )}

                </div>

              </div>

            </div>

          )}

        </div>

      </div>

    </div>

  </div>
)}