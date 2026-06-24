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

interface Cita {
  id: number;
  fecha: string;
  hora: string;
  especialidad: string;
  motivo_consulta: string;
  descripcion: string;
  estado: string;
}

export const HistoriaClinicaPanel = () => {
  const [busqueda, setBusqueda] = useState('');
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(false);

  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<Paciente | null>(null);
  const [historial, setHistorial] = useState<Cita[]>([]);

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
      .from('citas')
      .select('*')
      .eq('paciente_id', pacienteId)
      .order('fecha', { ascending: false });

    if (!error && data) {
      setHistorial(data);
    }
  };

  useEffect(() => {
    buscarPacientes();
  }, []);

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

        {historial.length === 0 ? (
          <div className="text-center text-slate-500 py-10">
            El paciente no tiene historial registrado.
          </div>
        ) : (
          <div className="space-y-4">

            {historial.map((cita) => (
  <div
    key={cita.id}
    className="relative pl-8 pb-8 border-l-2 border-slate-700"
  >
    {/* Punto */}
    <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-cyan-500 border-4 border-slate-900"></div>

    {/* Fecha */}
    <p className="text-cyan-400 font-semibold text-sm mb-2">
      {new Date(cita.fecha).toLocaleDateString('es-PE')}
    </p>

    {/* Especialidad */}
    <h4 className="text-lg font-bold text-white uppercase">
      {cita.especialidad}
    </h4>

    {/* Motivo */}
    <div className="mt-3">
      <p className="text-xs uppercase tracking-wider text-slate-500">
        Motivo de consulta
      </p>

      <p className="text-slate-200">
        {cita.motivo_consulta}
      </p>
    </div>

    {/* Observaciones */}
    {cita.descripcion && (
      <div className="mt-3">
        <p className="text-xs uppercase tracking-wider text-slate-500">
          Observaciones
        </p>

        <p className="text-slate-300">
          {cita.descripcion}
        </p>
      </div>
    )}

    {/* Estado */}
    <div className="mt-4">
      <span
        className={`px-3 py-1 rounded-lg text-xs font-bold
        ${
          cita.estado === 'atendida'
            ? 'bg-green-500/10 text-green-400'
            : cita.estado === 'confirmada'
            ? 'bg-blue-500/10 text-blue-400'
            : 'bg-yellow-500/10 text-yellow-400'
        }`}
      >
        {cita.estado.toUpperCase()}
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