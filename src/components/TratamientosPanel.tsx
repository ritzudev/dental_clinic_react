

import { useState } from 'react';
import { supabase } from '../lib/supabase';

import { Search, User, CheckCircle } from 'lucide-react';


interface Paciente {
  id: number;
  nombres: string;
  apellidos: string;
  dni: string;
  telefono: string;
}

export const TratamientosPanel = () => {
  const [dni, setDni] = useState('');
  const [loading, setLoading] = useState(false);

  const [paciente, setPaciente] =
    useState<Paciente | null>(null);

  const [nombreTratamiento, setNombreTratamiento] =
    useState('');

  const [descripcion, setDescripcion] =
    useState('');

  const [costo, setCosto] =
    useState('');

  const [mensajeExito, setMensajeExito] =
    useState('');
    
  const [mensajeActualizacion, setMensajeActualizacion] =
  useState('');  

  const [tratamientos, setTratamientos] =
    useState<any[]>([]);

  const [mostrarHistorial, setMostrarHistorial] =
  useState(false);

  const [tratamientoSeleccionado, setTratamientoSeleccionado] =
  useState<any | null>(null);

  const [modoEdicion, setModoEdicion] =
  useState(false);

const [editNombre, setEditNombre] =
  useState('');

const [editDescripcion, setEditDescripcion] =
  useState('');

const [editCosto, setEditCosto] =
  useState('');

const [editEstado, setEditEstado] =
  useState('');

  const cargarTratamientos = async (
    pacienteId: number
  ) => {
    const { data, error } = await supabase
      .from('tratamientos')
      .select('*')
      .eq('paciente_id', pacienteId)
      .order('id', { ascending: false });

    if (!error && data) {
      setTratamientos(data);
    }
  };

  const buscarPaciente = async () => {
    if (!dni.trim()) return;

    setLoading(true);

    const { data, error } = await supabase
      .from('pacientes')
      .select('*')
      .eq('dni', dni)
      .single();

    if (!error && data) {
      setPaciente(data);
      await cargarTratamientos(data.id);
    } else {
      setPaciente(null);
      alert('Paciente no encontrado');
    }

    setLoading(false);
  };

  const guardarTratamiento = async () => {
    if (!paciente) return;

    if (!nombreTratamiento.trim()) {
      alert('Ingrese el nombre del tratamiento');
      return;
    }

    const { error } = await supabase
      .from('tratamientos')
      .insert([
        {
          paciente_id: paciente.id,
          nombre_tratamiento: nombreTratamiento,
          descripcion,
          costo: Number(costo || 0)
        }
      ]);

    if (error) {
      console.error(error);
      alert(JSON.stringify(error));
      return;
    }

    setMensajeExito(
      'Tratamiento registrado correctamente'
    );

    setNombreTratamiento('');
    setDescripcion('');
    setCosto('');

    await cargarTratamientos(paciente.id);
  };

  const volverBusqueda = () => {
    setPaciente(null);
    setDni('');
    setNombreTratamiento('');
    setDescripcion('');
    setCosto('');
    setMensajeExito('');
    setTratamientos([]);
    setMostrarHistorial(false);
  };

  const cambiarEstado = async (
  tratamientoId: number,
  nuevoEstado: string
) => {
  const { error } = await supabase
    .from('tratamientos')
    .update({
      estado: nuevoEstado
    })
    .eq('id', tratamientoId);

  if (error) {
    console.error(error);
    alert('Error al actualizar estado');
    return;
  }

  if (paciente) {
    await cargarTratamientos(paciente.id);
  }
};

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-3xl font-extrabold text-white">
          Tratamientos
        </h1>

        <p className="text-slate-400">
          Gestión de tratamientos odontológicos.
        </p>

        {mensajeExito && (
          <div className="mt-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
            <p className="text-emerald-400 font-semibold">
              ✓ {mensajeExito}
            </p>
          </div>
          
        )}
      </div>
      {mensajeActualizacion && (
  <div className="fixed top-6 right-6 z-[9999] animate-bounce">

    <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl px-5 py-4 shadow-2xl shadow-emerald-500/20 min-w-[320px]">

      <div className="flex items-center gap-3">

        <CheckCircle className="w-6 h-6 text-emerald-400" />

        <div>
          <p className="text-emerald-400 font-bold">
            Actualización Exitosa
          </p>

          <p className="text-slate-300 text-sm">
            {mensajeActualizacion}
          </p>
        </div>

      </div>

    </div>

  </div>
)}


      {/* BUSCADOR */}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">

        <div className="flex gap-3">

          <div className="flex-1 relative">

            <Search className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />

            <input
              type="text"
              placeholder="Ingrese DNI del paciente"
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-white"
            />

          </div>

          <button
            onClick={buscarPaciente}
            className="px-5 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-bold"
          >
            Buscar
          </button>

        </div>

      </div>

      {/* LOADING */}

      {loading && (
        <div className="text-slate-400">
          Buscando paciente...
        </div>
      )}

      {/* PACIENTE */}

      {paciente && (

        <div className="space-y-6">

          <div className="flex justify-end">

            <button
              onClick={volverBusqueda}
              className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition"
            >
              ← Volver a búsqueda
            </button>

          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

            <div className="flex items-center gap-4">

              <div className="w-14 h-14 rounded-full bg-cyan-500/10 flex items-center justify-center">
                <User className="w-6 h-6 text-cyan-400" />
              </div>

              <div>

                <h2 className="text-xl font-bold text-white">
                  {paciente.nombres} {paciente.apellidos}
                </h2>

                <p className="text-slate-400">
                  DNI: {paciente.dni}
                </p>

                <p className="text-slate-400">
                  Teléfono: {paciente.telefono}
                </p>

              </div>

            </div>

          </div>

          {/* FORMULARIO */}

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

            <h2 className="text-xl font-bold text-white mb-5">
              Registrar Tratamiento
            </h2>

            <div className="space-y-4">

              <input
                type="text"
                placeholder="Nombre del tratamiento"
                value={nombreTratamiento}
                onChange={(e) =>
                  setNombreTratamiento(e.target.value)
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white"
              />

              <textarea
                placeholder="Descripción"
                value={descripcion}
                onChange={(e) =>
                  setDescripcion(e.target.value)
                }
                rows={4}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white"
              />

              <input
                type="number"
                placeholder="Costo"
                value={costo}
                onChange={(e) =>
                  setCosto(e.target.value)
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white"
              />

              <button
                onClick={guardarTratamiento}
                className="px-5 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-bold"
              >
                Guardar Tratamiento
              </button>

            </div>

          </div>
          {/* HISTORIAL */}

<div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

  <div className="flex items-center justify-between mb-5">

    <h2 className="text-xl font-bold text-white">
      Historial de Tratamientos
    </h2>

    <button
      onClick={() =>
        setMostrarHistorial(!mostrarHistorial)
      }
      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white"
    >
      {mostrarHistorial
        ? 'Ocultar historial'
        : `Ver historial (${tratamientos.length})`}
    </button>

  </div>

  {mostrarHistorial && (

    <>
      {tratamientos.length === 0 ? (

        <p className="text-slate-400">
          No existen tratamientos registrados.
        </p>

      ) : (

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead>

              <tr className="border-b border-slate-800">

                <th className="text-left py-3 text-slate-400">
                  Tratamiento
                </th>

                <th className="text-left py-3 text-slate-400">
                  Estado
                </th>
                <th className="text-left p-3">
                 Acciones
                </th>
                <th className="text-left p-3">
                 Detalle
               </th>

                <th className="text-left py-3 text-slate-400">
                  Costo
                </th>

                <th className="text-left py-3 text-slate-400">
                  Fecha
                </th>

              </tr>

            </thead>

            <tbody>

  {tratamientos.map((tratamiento) => (

    <tr
      key={tratamiento.id}
      className="border-b border-slate-800 hover:bg-slate-950 transition"
    >

      <td className="py-4 text-white">
        {tratamiento.nombre_tratamiento}
      </td>

      <td className="py-4">

        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            tratamiento.estado === 'pendiente'
              ? 'bg-yellow-500/10 text-yellow-400'
              : tratamiento.estado === 'en proceso'
              ? 'bg-blue-500/10 text-blue-400'
              : 'bg-emerald-500/10 text-emerald-400'
          }`}
        >
          {tratamiento.estado}
        </span>

      </td>

      <td className="p-3">

        <select
          value={tratamiento.estado}
          onChange={(e) =>
            cambiarEstado(
              tratamiento.id,
              e.target.value
            )
          }
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
        >
          <option value="pendiente">
            Pendiente
          </option>

          <option value="en proceso">
            En proceso
          </option>

          <option value="finalizado">
            Finalizado
          </option>

        </select>

      </td>

      <td className="p-3">

        <button
  onClick={() => {
    setTratamientoSeleccionado(tratamiento);

    setEditNombre(
      tratamiento.nombre_tratamiento
    );

    setEditDescripcion(
      tratamiento.descripcion || ''
    );

    setEditCosto(
      tratamiento.costo
    );

    setEditEstado(
      tratamiento.estado
    );

    setModoEdicion(false);
  }}
  className="px-3 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white text-sm"
>
  Ver
</button>

      </td>

      <td className="py-4 text-cyan-400 font-semibold">
        S/ {tratamiento.costo}
      </td>

      <td className="py-4 text-slate-400">
        {tratamiento.fecha_inicio}
      </td>

    </tr>

  ))}

</tbody>

          </table>
         {tratamientoSeleccionado && (

  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">

    <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">

      <div className="flex items-center justify-between mb-6">

        <h2 className="text-2xl font-bold text-white">
          Detalle del Tratamiento
        </h2>
        <div className="flex gap-2">

  {!modoEdicion && (
    <button
      onClick={() =>
        setModoEdicion(true)
      }
      className="px-4 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-white"
    >
      Editar
    </button>
  )}

  <button
    onClick={() => {
      setTratamientoSeleccionado(null);
      setModoEdicion(false);
    }}
    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white"
  >
    ✕
  </button>

</div>

      

      </div>

      <div className="grid md:grid-cols-2 gap-6">

        <div>
  <p className="text-slate-400 text-sm">
    Tratamiento
  </p>

  {modoEdicion ? (
    <input
      type="text"
      value={editNombre}
      onChange={(e) =>
        setEditNombre(e.target.value)
      }
      className="mt-2 w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white"
    />
  ) : (
    <p className="text-white font-semibold text-lg">
      {tratamientoSeleccionado.nombre_tratamiento}
    </p>
  )}
</div>
        {modoEdicion && (

  <div className="mt-6 flex gap-3">

    <button
      onClick={async () => {

        const { error } = await supabase
          .from('tratamientos')
          .update({
            nombre_tratamiento: editNombre,
            descripcion: editDescripcion,
            costo: Number(editCosto),
            estado: editEstado
          })
          .eq(
            'id',
            tratamientoSeleccionado.id
          );

        if (error) {
          alert(
            'Error al actualizar'
          );
          return;
        }

        setMensajeActualizacion(
  'Tratamiento actualizado correctamente'
);

setTimeout(() => {
  setMensajeActualizacion('');
}, 5000);

        if (paciente) {
          await cargarTratamientos(
            paciente.id
          );
        }
        setTratamientoSeleccionado({
  ...tratamientoSeleccionado,
  nombre_tratamiento: editNombre,
  descripcion: editDescripcion,
  costo: Number(editCosto),
  estado: editEstado
});

        setModoEdicion(false);
      }}
      className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold"
    >
      Guardar Cambios
    </button>

    <button
      onClick={() =>
        setModoEdicion(false)
      }
      className="px-5 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white"
    >
      Cancelar
    </button>

  </div>

)}

        <div>
  <p className="text-slate-400 text-sm">
    Estado
  </p>

  {modoEdicion ? (
    <select
      value={editEstado}
      onChange={(e) =>
        setEditEstado(e.target.value)
      }
      className="mt-2 w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white"
    >
      <option value="pendiente">
        Pendiente
      </option>

      <option value="en proceso">
        En proceso
      </option>

      <option value="finalizado">
        Finalizado
      </option>
    </select>
  ) : (
    <p className="text-white font-semibold">
      {tratamientoSeleccionado.estado}
    </p>
  )}
</div>

        <div>
  <p className="text-slate-400 text-sm">
    Costo
  </p>

  {modoEdicion ? (
    <input
      type="number"
      value={editCosto}
      onChange={(e) =>
        setEditCosto(e.target.value)
      }
      className="mt-2 w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white"
    />
  ) : (
    <p className="text-cyan-400 font-bold text-xl">
      S/ {tratamientoSeleccionado.costo}
    </p>
  )}
</div>

        <div>
          <p className="text-slate-400 text-sm">
            Fecha Inicio
          </p>

          <p className="text-white">
            {tratamientoSeleccionado.fecha_inicio}
          </p>
        </div>

        <div className="md:col-span-2">

  <p className="text-slate-400 text-sm">
    Descripción
  </p>

  {modoEdicion ? (

    <textarea
      value={editDescripcion}
      onChange={(e) =>
        setEditDescripcion(e.target.value)
      }
      rows={5}
      className="mt-2 w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white"
    />

  ) : (

    <div className="mt-2 bg-slate-950 border border-slate-800 rounded-xl p-4">
      <p className="text-white">
        {tratamientoSeleccionado.descripcion ||
          'Sin descripción'}
      </p>
    </div>

  )}

</div>

      </div>

    </div>

  </div>

)}
        </div>
        

      )}

    </>

  )}

</div>

        </div>

      )}

    </div>
  );
};
