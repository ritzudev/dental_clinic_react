import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Search, User } from 'lucide-react';

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
    <div className="space-y-6">

      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-extrabold text-white">
          Historia Clínica
        </h1>

        <p className="text-slate-400 mt-1">
          Consulta y visualización del historial clínico de pacientes.
        </p>
      </div>

      {/* BUSCADOR */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">

        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />

            <input
              type="text"
              placeholder="Buscar por DNI, nombre o apellido..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-white outline-none focus:border-cyan-500"
            />
          </div>

          <button
            onClick={buscarPacientes}
            className="px-5 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-bold transition"
          >
            Buscar
          </button>
        </div>
      </div>

      {/* RESULTADOS */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">

        <div className="p-5 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white">
            Pacientes encontrados
          </h2>
        </div>

        {loading ? (
          <div className="p-10 text-center text-slate-400">
            Cargando pacientes...
          </div>
        ) : pacientes.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
            No se encontraron pacientes.
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {pacientes.map((paciente) => (
              <div
                key={paciente.id}
                className="p-5 flex items-center justify-between hover:bg-slate-800/40 transition"
              >
                <div className="flex items-center gap-4">

                  <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                    <User className="w-5 h-5 text-cyan-400" />
                  </div>

                  <div>
                    <h3 className="font-bold text-white">
                      {paciente.nombres} {paciente.apellidos}
                    </h3>

                    <p className="text-sm text-slate-400">
                      DNI: {paciente.dni}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => cargarHistorial(paciente.id, paciente)}
                  className="px-4 py-2 rounded-lg border border-slate-700 hover:border-cyan-500 text-slate-300 hover:text-cyan-400 transition"
                >
                  Ver historial
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* HISTORIAL CLÍNICO */}
      {/* MODAL HISTORIA CLÍNICA */}
{pacienteSeleccionado && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">

    <div className="w-full max-w-5xl mx-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">

      <div className="flex items-center justify-between p-6 border-b border-slate-800">

        <div>
          <h2 className="text-2xl font-bold text-white">
            Historia Clínica
          </h2>

          <p className="text-slate-400">
            {pacienteSeleccionado.nombres} {pacienteSeleccionado.apellidos}
          </p>
        </div>

        <button
          onClick={() => {
            setPacienteSeleccionado(null);
            setHistorial([]);
          }}
          className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-400 text-white cursor-pointer"
        >
          Cerrar
        </button>

      </div>

      <div className="p-6 max-h-[70vh] overflow-y-auto">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
            <p className="text-slate-500 text-sm">DNI</p>
            <p className="text-white font-semibold">
              {pacienteSeleccionado.dni}
            </p>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
            <p className="text-slate-500 text-sm">Teléfono</p>
            <p className="text-white font-semibold">
              {pacienteSeleccionado.telefono}
            </p>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
            <p className="text-slate-500 text-sm">Sexo</p>
            <p className="text-white font-semibold">
              {pacienteSeleccionado.sexo}
            </p>
          </div>

        </div>

        <h3 className="text-xl font-bold text-white mb-4">
          Consultas Registradas
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

  {/* Buscar */}
  <input
    type="text"
    placeholder="Buscar diagnóstico, tratamiento, médico..."
    value={filtroTexto}
    onChange={(e) => setFiltroTexto(e.target.value)}
    className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-cyan-500 outline-none"
  />

  {/* Especialidad */}
  <select
    value={filtroEspecialidad}
    onChange={(e) => setFiltroEspecialidad(e.target.value)}
    className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-cyan-500 outline-none"
  >
    <option value="todas">Todas las especialidades</option>

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

  {/* Año */}
  <select
    value={filtroAnio}
    onChange={(e) => setFiltroAnio(e.target.value)}
    className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-cyan-500 outline-none"
  >
    <option value="todos">Todas las fechas</option>

    {[...new Set(
      historial
        .map(h => h.citas?.fecha?.substring(0,4))
        .filter(Boolean)
    )].map((anio) => (
      <option key={anio} value={anio}>
        {anio}
      </option>
    ))}
  </select>

</div>


<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
    <p className="text-slate-500 text-sm">
      Total de historias
    </p>

    <p className="text-3xl font-bold text-cyan-400">
      {historialFiltrado.length}
    </p>
  </div>

  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
    <p className="text-slate-500 text-sm">
      Especialidades distintas
    </p>

    <p className="text-3xl font-bold text-emerald-400">
      {
        new Set(
          historialFiltrado.map(h => h.citas?.especialidad)
        ).size
      }
    </p>
  </div>

  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
    <p className="text-slate-500 text-sm">
      Última consulta
    </p>

    <p className="text-lg font-bold text-yellow-400">
      {historialFiltrado[0]?.citas?.fecha
        ? new Date(historialFiltrado[0].citas.fecha).toLocaleDateString("es-PE")
        : "--"}
    </p>
  </div>

</div>



<div className="flex justify-end mb-6">

  <select
    value={ordenFecha}
    onChange={(e) => setOrdenFecha(e.target.value)}
    className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-cyan-500 outline-none"
  >
    <option value="desc">
      Más recientes primero
    </option>

    <option value="asc">
      Más antiguas primero
    </option>

  </select>

</div>






        {historial.length === 0 ? (
          <div className="text-center text-slate-500 py-10">
            El paciente no tiene historial registrado.
          </div>
        ) : (
          <div className="space-y-4">
{historialOrdenado.map((historia) => (

  <div
    key={historia.id}
    className="relative pl-8 pb-8 border-l-2 border-slate-700"
  >

    <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-cyan-500 border-4 border-slate-900"></div>

    <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 mb-5">

  <div className="flex justify-between items-start">

    <div>

      <p className="text-xs uppercase tracking-widest text-cyan-400 font-bold">
        Consulta Odontológica
      </p>

      <h4 className="text-2xl font-extrabold text-white mt-1">
        {historia.citas?.especialidad}
      </h4>

      <p className="text-slate-400 mt-2">
        Dr. {historia.medicos?.nombres} {historia.medicos?.apellidos}
      </p>

    </div>

    <div className="text-right">

      <p className="text-xs text-slate-500">
        Fecha
      </p>

      <p className="text-cyan-400 font-bold">
        {historia.citas?.fecha
          ? new Date(historia.citas.fecha).toLocaleDateString("es-PE")
          : "Sin fecha"}
      </p>

    </div>

  </div>

</div>

    <div className="mt-4">
      <p className="text-xs uppercase tracking-wider text-slate-500">
        Motivo de consulta
      </p>

      <p className="text-slate-200">
        {historia.motivo_consulta}
      </p>
    </div>

    <div className="mt-4">
      <p className="text-xs uppercase tracking-wider text-slate-500">
        Diagnóstico
      </p>

      <p className="text-slate-200">
        {historia.diagnostico}
      </p>
    </div>

    <div className="mt-4">
      <p className="text-xs uppercase tracking-wider text-slate-500">
        Tratamiento realizado
      </p>

      <p className="text-slate-200">
        {historia.tratamiento_realizado}
      </p>
    </div>

    <div className="mt-4">
      <p className="text-xs uppercase tracking-wider text-slate-500">
        Observaciones
      </p>

      <p className="text-slate-300">
        {historia.observaciones || "Sin observaciones"}
      </p>
    </div>
    <div className="mt-6 flex flex-wrap gap-3">

  <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-bold">
    {historia.citas?.especialidad}
  </span>

  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold">
    {historia.citas?.fecha
      ? new Date(historia.citas.fecha).toLocaleDateString("es-PE")
      : "Sin fecha"}
  </span>

</div>

  </div>

))}

          </div>
        )}

      </div>

    </div>

  </div>
)}
    </div>
  );
};