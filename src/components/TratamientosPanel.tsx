import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

import {
  Search,
  User,
  ClipboardList,
  Activity,
  Clock3,
  Check,
  CheckCircle,
  PlusCircle,
  Eye
} from "lucide-react";

interface Paciente {
  id: number;
  nombres: string;
  apellidos: string;
  dni: string;
  telefono: string;
}

interface Tratamiento {
  id: number;

  paciente_id: number;

  historia_clinica_id?: number;

  nombre_tratamiento: string;

  descripcion: string;

  costo: number;

  estado: string;

  fecha_inicio: string;

  fecha_fin?: string;

  created_at: string;

  pacientes?: Paciente;

  historias_clinicas?: {

    id: number;

    diagnostico: string;

  };
}

export const TratamientosPanel = () => {

  /* ==========================
          BUSCADOR
  ========================== */

  const [dni, setDni] = useState("");

  const [loading, setLoading] = useState(false);

  const [paciente, setPaciente] =
    useState<Paciente | null>(null);
  
 const [mostrarModalPaciente, setMostrarModalPaciente] = useState(false);

const [pestanaPaciente, setPestanaPaciente] =
useState<"registro" | "historial">("registro");

  /* ==========================
        NUEVO TRATAMIENTO
  ========================== */

  const [nombreTratamiento,
    setNombreTratamiento] =
      useState("");

  const [descripcion,
    setDescripcion] =
      useState("");

  const [costo,
    setCosto] =
      useState("");

  /* ==========================
          MENSAJES
  ========================== */

  const [mensajeExito,
    setMensajeExito] =
      useState("");

  const [mensajeActualizacion,
    setMensajeActualizacion] =
      useState("");

  /* ==========================
          LISTAS
  ========================== */

  const [tratamientos,
    setTratamientos] =
      useState<Tratamiento[]>([]);

  const [todosTratamientos,
    setTodosTratamientos] =
      useState<Tratamiento[]>([]);

  /* ==========================
          HISTORIAL
  ========================== */

  const [mostrarHistorial,
    setMostrarHistorial] =
      useState(false);

  /* ==========================
            MODAL
  ========================== */

  const [tratamientoSeleccionado,
    setTratamientoSeleccionado] =
      useState<Tratamiento | null>(null);

  const [modoEdicion,
    setModoEdicion] =
      useState(false);

  const [editNombre,
    setEditNombre] =
      useState("");

  const [editDescripcion,
    setEditDescripcion] =
      useState("");

  const [editCosto,
    setEditCosto] =
      useState("");

  const [editEstado,
    setEditEstado] =
      useState("");

  /* ==========================
        DASHBOARD
  ========================== */

  const pendientes =
    todosTratamientos.filter(
      t => t.estado === "pendiente"
    ).length;

  const proceso =
    todosTratamientos.filter(
      t => t.estado === "en proceso"
    ).length;

  const finalizados =
    todosTratamientos.filter(
      t => t.estado === "finalizado"
    ).length;

  const totalCosto =
    todosTratamientos.reduce(
      (acc, t) => acc + Number(t.costo),
      0
    );

  useEffect(() => {

    cargarTodosTratamientos();

  }, []);

    /* ==========================
      CARGAR TODOS
  ========================== */

  const cargarTodosTratamientos = async () => {

    const { data, error } = await supabase

      .from("tratamientos")

      .select(`
        *,
        pacientes(
          id,
          nombres,
          apellidos,
          dni,
          telefono
        ),
        historias_clinicas(
          id,
          diagnostico
        )
      `)

      .order("created_at", {
        ascending: false
      });

    if (error) {

      console.error(error);

      return;

    }

    setTodosTratamientos(
      (data as Tratamiento[]) || []
    );

  };

  /* ==========================
      CARGAR TRATAMIENTOS
  ========================== */

  const cargarTratamientos = async (
    pacienteId: number
  ) => {

    const { data, error } = await supabase

      .from("tratamientos")

      .select("*")

      .eq("paciente_id", pacienteId)

      .order("created_at", {
        ascending: false
      });

    if (!error) {

      setTratamientos(
        (data as Tratamiento[]) || []
      );

    }

  };

  /* ==========================
      BUSCAR PACIENTE
  ========================== */

  const buscarPaciente = async () => {

    if (!dni.trim()) return;

    setLoading(true);

    const { data, error } = await supabase

      .from("pacientes")

      .select("*")

      .eq("dni", dni)

      .single();

    if (error || !data) {

      alert("Paciente no encontrado");

      setPaciente(null);

      setLoading(false);

      return;

    }

    setPaciente(data);
    setMostrarModalPaciente(true);

    await cargarTratamientos(data.id);

    setLoading(false);

  };

  /* ==========================
      REGISTRAR TRATAMIENTO
  ========================== */

  const guardarTratamiento = async () => {

    if (!paciente) return;

    if (!nombreTratamiento.trim()) {

      alert("Ingrese el tratamiento");

      return;

    }

    const { error } = await supabase

      .from("tratamientos")

      .insert([

        {

          paciente_id: paciente.id,

          nombre_tratamiento: nombreTratamiento,

          descripcion,

          costo: Number(costo || 0),

          estado: "pendiente"

        }

      ]);

    if (error) {

      console.error(error);

      return;

    }

    setMensajeExito(
      "Tratamiento registrado correctamente"
    );

    setTimeout(() => {

      setMensajeExito("");

    }, 3000);

    setNombreTratamiento("");

    setDescripcion("");

    setCosto("");

    await cargarTratamientos(paciente.id);

    await cargarTodosTratamientos();

  };
    /* ==========================
      VOLVER BUSQUEDA
  ========================== */

 const volverBusqueda = () => {

  setMostrarModalPaciente(false);

  setPaciente(null);

  setDni("");

  setNombreTratamiento("");

  setDescripcion("");

  setCosto("");

  setTratamientos([]);

  setMostrarHistorial(false);

  setPestanaPaciente("registro");

}
  /* ==========================
      CAMBIAR ESTADO
  ========================== */

  const cambiarEstado = async (
    tratamientoId: number,
    nuevoEstado: string
  ) => {

    const { error } = await supabase

      .from("tratamientos")

      .update({
        estado: nuevoEstado
      })

      .eq("id", tratamientoId);

    if (error) {

      console.error(error);

      return;

    }

    if (paciente) {

      await cargarTratamientos(
        paciente.id
      );

    }

    await cargarTodosTratamientos();

  };

  /* ==========================
          RENDER
  ========================== */

  return (

    <div className="space-y-8">

      {/* ==========================
              HEADER
      ========================== */}

      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">

        <div>

          <h1 className="text-4xl font-black text-white">

            Gestión de Tratamientos

          </h1>

          <p className="text-slate-400 mt-2 text-lg">

            Administración completa de tratamientos odontológicos.

          </p>

        </div>

        <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-3xl px-6 py-5">

          <p className="text-cyan-300 text-sm">

            Total registrados

          </p>

          <h2 className="text-5xl font-black text-cyan-400 mt-1">

            {todosTratamientos.length}

          </h2>

        </div>

      </div>

      {/* ==========================
            DASHBOARD
      ========================== */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

        <div className="rounded-3xl bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border border-yellow-500/30 p-6">

          <div className="flex justify-between items-center">

            <div>

              <p className="text-yellow-300 text-sm">

                Pendientes

              </p>

              <h2 className="text-5xl font-black text-yellow-400 mt-3">

                {pendientes}

              </h2>

            </div>

            <Clock3
              className="w-11 h-11 text-yellow-400"
            />

          </div>

        </div>

        <div className="rounded-3xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 p-6">

          <div className="flex justify-between items-center">

            <div>

              <p className="text-blue-300 text-sm">

                En proceso

              </p>

              <h2 className="text-5xl font-black text-blue-400 mt-3">

                {proceso}

              </h2>

            </div>

            <Activity
              className="w-11 h-11 text-blue-400"
            />

          </div>

        </div>

        <div className="rounded-3xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 p-6">

          <div className="flex justify-between items-center">

            <div>

              <p className="text-emerald-300 text-sm">

                Finalizados

              </p>

              <h2 className="text-5xl font-black text-emerald-400 mt-3">

                {finalizados}

              </h2>

            </div>

            <Check
              className="w-11 h-11 text-emerald-400"
            />

          </div>

        </div>

        <div className="rounded-3xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 border border-cyan-500/30 p-6">

          <div className="flex justify-between items-center">

            <div>

              <p className="text-cyan-300 text-sm">

                Valor Total

              </p>

              <h2 className="text-4xl font-black text-cyan-400 mt-3">

                S/ {totalCosto.toFixed(2)}

              </h2>

            </div>

            <ClipboardList
              className="w-11 h-11 text-cyan-400"
            />

          </div>

        </div>

      </div>
            {/* ==========================
            BUSCAR PACIENTE
      ========================== */}

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-7">

        <div className="mb-6">

          <h2 className="text-2xl font-bold text-white">

            Buscar Paciente

          </h2>

          <p className="text-slate-400 mt-1">

            Ingresa el DNI del paciente para administrar sus tratamientos.

          </p>

        </div>

        <div className="flex flex-col md:flex-row gap-4">

          <div className="relative flex-1">

            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
              size={20}
            />

            <input
              type="text"
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              placeholder="Ingrese el DNI..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-white outline-none focus:ring-2 focus:ring-cyan-500"
            />

          </div>

          <button
            onClick={buscarPaciente}
            className="px-8 py-4 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition"
          >

            Buscar

          </button>

        </div>

        {loading && (

          <div className="mt-5">

            <p className="text-cyan-400 font-semibold">

              Buscando paciente...

            </p>

          </div>

        )}

      </div>

      
{/* ==========================================
      CONTENIDO DEL MODAL (lo moveremos aquí)
========================================== */}

{mostrarModalPaciente && paciente && (

  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-6">

    <div className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl w-full max-w-7xl max-h-[92vh] overflow-hidden">

      {/* CABECERA */}

      <div className="px-8 py-6 border-b border-slate-800 flex items-center justify-between">

        <div className="flex items-center gap-5">

          <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center">

            <User
              className="text-cyan-400"
              size={34}
            />

          </div>

          <div>

            <h2 className="text-3xl font-black text-white">

              {paciente.nombres} {paciente.apellidos}

            </h2>

            <p className="text-slate-400">

              DNI: {paciente.dni}

            </p>

            <p className="text-slate-500">

              {paciente.telefono || "Sin teléfono"}

            </p>

          </div>

        </div>

        <button

          onClick={volverBusqueda}

          className="px-6 py-3 rounded-xl bg-red-500 hover:bg-red-400 text-white font-bold"

        >

          Cerrar

        </button>

      </div>

      {/* AQUÍ IRÁN LAS PESTAÑAS */}

      {/* ==========================
        PESTAÑAS
========================== */}

<div className="border-b border-slate-800">

  <div className="flex">

    <button
      onClick={() => setPestanaPaciente("registro")}
      className={`flex-1 py-4 font-bold transition ${
        pestanaPaciente === "registro"
          ? "bg-cyan-600 text-white"
          : "bg-slate-900 text-slate-400 hover:bg-slate-800"
      }`}
    >
      ➕ Registrar Tratamiento
    </button>

    <button
      onClick={() => setPestanaPaciente("historial")}
      className={`flex-1 py-4 font-bold transition ${
        pestanaPaciente === "historial"
          ? "bg-cyan-600 text-white"
          : "bg-slate-900 text-slate-400 hover:bg-slate-800"
      }`}
    >
      📋 Historial
    </button>

  </div>

</div>

<div className="p-8">

  {pestanaPaciente === "registro" && (

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-7">

          <div className="flex items-center gap-3 mb-6">

            <PlusCircle
              className="text-cyan-400"
              size={28}
            />

            <h2 className="text-2xl font-bold text-white">

              Registrar Nuevo Tratamiento

            </h2>

          </div>

          <div className="grid md:grid-cols-2 gap-5">

            <div>

              <label className="text-slate-400 text-sm">

                Tratamiento

              </label>

              <input
                value={nombreTratamiento}
                onChange={(e)=>setNombreTratamiento(e.target.value)}
                className="mt-2 w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white"
              />

            </div>

            <div>

              <label className="text-slate-400 text-sm">

                Costo

              </label>

              <input
                type="number"
                value={costo}
                onChange={(e)=>setCosto(e.target.value)}
                className="mt-2 w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white"
              />

            </div>

          </div>

          <div className="mt-5">

            <label className="text-slate-400 text-sm">

              Descripción

            </label>

            <textarea
              rows={5}
              value={descripcion}
              onChange={(e)=>setDescripcion(e.target.value)}
              className="mt-2 w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white"
            />

          </div>

          <button
            onClick={guardarTratamiento}
            className="mt-6 bg-cyan-600 hover:bg-cyan-500 px-7 py-4 rounded-2xl text-white font-bold"
          >

            Registrar Tratamiento

          </button>

          {mensajeExito && (

            <div className="mt-5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4">

              <div className="flex items-center gap-3">

                <CheckCircle
                  className="text-emerald-400"
                  size={22}
                />

                <p className="text-emerald-400 font-semibold">

                  {mensajeExito}

                </p>

              </div>

            </div>

          )}

        </div>

      )}
            
            {/* ==========================
          HISTORIAL DEL PACIENTE
      ========================== */}

      {pestanaPaciente === "historial" && (

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-7">

          <div className="flex items-center justify-between mb-6">

            <div>

              <h2 className="text-2xl font-bold text-white">

                Historial de Tratamientos

              </h2>

              <p className="text-slate-400 mt-1">

                Total registrados: {tratamientos.length}

              </p>

            </div>

            <button

              onClick={() =>
                setMostrarHistorial(!mostrarHistorial)
              }

              className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white"

            >

              {mostrarHistorial
                ? "Ocultar historial"
                : "Ver historial"}

            </button>

          </div>

          {mostrarHistorial && (

            tratamientos.length === 0 ? (

              <div className="text-center py-12 text-slate-500">

                Este paciente aún no tiene tratamientos registrados.

              </div>

            ) : (

              <div className="overflow-x-auto">

                <table className="w-full">

                  <thead>

                    <tr className="border-b border-slate-800">

                      <th className="p-4 text-left text-slate-400">

                        Tratamiento

                      </th>

                      <th className="p-4 text-left text-slate-400">

                        Estado

                      </th>

                      <th className="p-4 text-left text-slate-400">

                        Costo

                      </th>

                      <th className="p-4 text-left text-slate-400">

                        Fecha

                      </th>

                      <th className="p-4 text-center text-slate-400">

                        Acción

                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {tratamientos.map((tratamiento) => (

                      <tr

                        key={tratamiento.id}

                        className="border-b border-slate-800 hover:bg-slate-800/40 transition"

                      >

                        <td className="p-4">

                          <div>

                            <p className="font-bold text-white">

                              {tratamiento.nombre_tratamiento}

                            </p>

                            <p className="text-slate-500 text-sm mt-1">

                              {tratamiento.descripcion || "Sin descripción"}

                            </p>

                          </div>

                        </td>

                        <td className="p-4">

                          <select

                            value={tratamiento.estado}

                            onChange={(e)=>

                              cambiarEstado(

                                tratamiento.id,

                                e.target.value

                              )

                            }

                            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"

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

                        <td className="p-4 font-bold text-cyan-400">

                          S/ {Number(tratamiento.costo).toFixed(2)}

                        </td>

                        <td className="p-4 text-slate-400">

                          {tratamiento.fecha_inicio}

                        </td>

                        <td className="p-4 text-center">

                          <button

                            onClick={() => {

                              setTratamientoSeleccionado(tratamiento);

                              setEditNombre(
                                tratamiento.nombre_tratamiento
                              );

                              setEditDescripcion(
                                tratamiento.descripcion
                              );

                              setEditCosto(
                                String(tratamiento.costo)
                              );

                              setEditEstado(
                                tratamiento.estado
                              );

                              setModoEdicion(false);

                            }}

                            className="bg-cyan-600 hover:bg-cyan-500 px-4 py-2 rounded-xl text-white flex items-center gap-2 mx-auto"

                          >

                            <Eye size={18} />

                            Ver

                          </button>

                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>

            )

          )}

        </div>

      )}
            </div> {/* fin p-8 */}

    </div> {/* fin ventana modal */}

  </div> 

)}

            {/* ==========================
            MODAL DETALLE
      ========================== */}

      {tratamientoSeleccionado && (

        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-6">

          <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-8">

            <div className="flex items-center justify-between mb-8">

              <div>

                <h2 className="text-3xl font-black text-white">

                  Detalle del Tratamiento

                </h2>

                <p className="text-slate-400 mt-1">

                  Consulta o modifica la información.

                </p>

              </div>

              <button

                onClick={() => {

                  setTratamientoSeleccionado(null);

                  setModoEdicion(false);

                }}

                className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white"

              >

                Cerrar

              </button>

            </div>

            <div className="grid md:grid-cols-2 gap-6">

              <div>

                <label className="text-slate-400 text-sm">

                  Tratamiento

                </label>

                {modoEdicion ? (

                  <input
                    value={editNombre}
                    onChange={(e)=>setEditNombre(e.target.value)}
                    className="mt-2 w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white"
                  />

                ) : (

                  <p className="mt-2 text-2xl font-bold text-white">

                    {tratamientoSeleccionado.nombre_tratamiento}

                  </p>

                )}

              </div>

              <div>

                <label className="text-slate-400 text-sm">

                  Estado

                </label>

                {modoEdicion ? (

                  <select
                    value={editEstado}
                    onChange={(e)=>setEditEstado(e.target.value)}
                    className="mt-2 w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white"
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

                  <p className="mt-2 text-cyan-400 font-bold">

                    {tratamientoSeleccionado.estado}

                  </p>

                )}

              </div>

              <div>

                <label className="text-slate-400 text-sm">

                  Costo

                </label>

                {modoEdicion ? (

                  <input
                    type="number"
                    value={editCosto}
                    onChange={(e)=>setEditCosto(e.target.value)}
                    className="mt-2 w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white"
                  />

                ) : (

                  <p className="mt-2 text-3xl font-black text-emerald-400">

                    S/ {Number(tratamientoSeleccionado.costo).toFixed(2)}

                  </p>

                )}

              </div>

              <div>

                <label className="text-slate-400 text-sm">

                  Fecha

                </label>

                <p className="mt-2 text-white">

                  {tratamientoSeleccionado.fecha_inicio}

                </p>

              </div>

              <div className="md:col-span-2">

                <label className="text-slate-400 text-sm">

                  Descripción

                </label>

                {modoEdicion ? (

                  <textarea
                    rows={6}
                    value={editDescripcion}
                    onChange={(e)=>setEditDescripcion(e.target.value)}
                    className="mt-2 w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white"
                  />

                ) : (

                  <div className="mt-2 bg-slate-950 border border-slate-800 rounded-xl p-5 text-white">

                    {tratamientoSeleccionado.descripcion || "Sin descripción"}

                  </div>

                )}

              </div>

            </div>
                        {/* ==========================
                  BOTONES
            ========================== */}

            <div className="flex justify-end gap-4 mt-8">

              {modoEdicion ? (

                <>

                  <button

                    onClick={() => setModoEdicion(false)}

                    className="px-6 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white"

                  >

                    Cancelar

                  </button>

                  <button

                    onClick={async () => {

                      const { error } = await supabase

                        .from("tratamientos")

                        .update({

                          nombre_tratamiento: editNombre,

                          descripcion: editDescripcion,

                          costo: Number(editCosto),

                          estado: editEstado

                        })

                        .eq("id", tratamientoSeleccionado.id);

                      if (error) {

                        alert("Error al actualizar");

                        return;

                      }

                      setMensajeActualizacion(

                        "Tratamiento actualizado correctamente"

                      );

                      setTimeout(() => {

                        setMensajeActualizacion("");

                      }, 3000);

                      await cargarTodosTratamientos();

                      if (paciente) {

                        await cargarTratamientos(

                          paciente.id

                        );

                      }

                      setTratamientoSeleccionado(null);

                      setModoEdicion(false);

                    }}

                    className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold"

                  >

                    Guardar Cambios

                  </button>

                </>

              ) : (

                <button

                  onClick={() => setModoEdicion(true)}

                  className="px-6 py-3 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-white font-bold"

                >

                  Editar

                </button>

              )}

            </div>

            {mensajeActualizacion && (

              <div className="mt-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4">

                <div className="flex items-center gap-3">

                  <CheckCircle

                    className="text-emerald-400"

                    size={22}

                  />

                  <p className="text-emerald-400 font-semibold">

                    {mensajeActualizacion}

                  </p>

                </div>

              </div>

            )}

          </div>

        </div>

      )}
            {/* ==========================
            TABLA GENERAL
      ========================== */}

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">

        <div className="px-8 py-6 border-b border-slate-800 flex items-center justify-between">

          <div>

            <h2 className="text-3xl font-black text-white">

              Todos los Tratamientos

            </h2>

            <p className="text-slate-400 mt-1">

              Historial general del consultorio

            </p>

          </div>

          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-2xl px-5 py-3">

            <span className="text-cyan-400 font-bold">

              {todosTratamientos.length} registros

            </span>

          </div>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead className="bg-slate-950">

              <tr>

                <th className="p-4 text-left text-slate-400">

                  Paciente

                </th>

                <th className="p-4 text-left text-slate-400">

                  Tratamiento

                </th>

                <th className="p-4 text-left text-slate-400">

                  Estado

                </th>

                <th className="p-4 text-left text-slate-400">

                  Costo

                </th>

                <th className="p-4 text-left text-slate-400">

                  Fecha

                </th>

              </tr>

            </thead>

            <tbody>

              {todosTratamientos.map((t) => (

                <tr

                  key={t.id}

                  className="border-t border-slate-800 hover:bg-slate-800/40 transition"

                >

                  <td className="p-4">

                    <p className="font-semibold text-white">

                      {t.pacientes?.nombres} {t.pacientes?.apellidos}

                    </p>

                    <p className="text-xs text-slate-500">

                      DNI {t.pacientes?.dni}

                    </p>

                  </td>

                  <td className="p-4 text-white">

                    {t.nombre_tratamiento}

                  </td>

                  <td className="p-4">

                    <span

                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        t.estado === "pendiente"
                          ? "bg-yellow-500/10 text-yellow-400"
                          : t.estado === "en proceso"
                          ? "bg-blue-500/10 text-blue-400"
                          : "bg-emerald-500/10 text-emerald-400"
                      }`}

                    >

                      {t.estado}

                    </span>

                  </td>

                  <td className="p-4 text-cyan-400 font-bold">

                    S/ {Number(t.costo).toFixed(2)}

                  </td>

                  <td className="p-4 text-slate-400">

                    {t.fecha_inicio}

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>

    </div>

  );

};