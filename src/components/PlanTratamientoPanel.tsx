import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

interface Consulta {
  id: number;
  procedimiento: string;
  costo: number;
  observaciones: string;
}

interface Paciente {
  id: number;
  nombres: string;
  apellidos: string;
  dni: string;
  telefono: string | null;
  sexo: string | null;
}

const crearConsultas = (cantidad: number): Consulta[] => {
  return Array.from({ length: cantidad }, (_, index) => ({
    id: index + 1,
    procedimiento: "",
    costo: 0,
    observaciones: "",
  }));
};

export const PlanTratamientoPanel = () => {

  // =====================================================
  // PACIENTE
  // =====================================================

  const [buscarPaciente, setBuscarPaciente] = useState("");

  const [pacientes, setPacientes] = useState<Paciente[]>([]);

  const [pacienteSeleccionado, setPacienteSeleccionado] =
    useState<Paciente | null>(null);


  // =====================================================
  // PLAN DE TRATAMIENTO
  // =====================================================

  const [cantidadConsultas, setCantidadConsultas] = useState(4);

  const [costoTotal, setCostoTotal] = useState(0);

  const [consultas, setConsultas] = useState<Consulta[]>(
    crearConsultas(4)
  );


  // =====================================================
  // ESTADOS
  // =====================================================

  const [guardando, setGuardando] = useState(false);

  const [mensaje, setMensaje] = useState("");


  // =====================================================
  // BUSCAR PACIENTES
  // =====================================================

  useEffect(() => {

    buscarPacientes();

  }, [buscarPaciente]);


  const buscarPacientes = async () => {

    if (!buscarPaciente.trim()) {
      setPacientes([]);
      return;
    }

    const { data, error } = await supabase
      .from("pacientes")
      .select("*")
      .or(
        `dni.ilike.%${buscarPaciente}%,nombres.ilike.%${buscarPaciente}%,apellidos.ilike.%${buscarPaciente}%`
      )
      .limit(8);

    if (error) {
      console.error("Error buscando pacientes:", error);
      return;
    }

    setPacientes(data || []);
  };


  // =====================================================
  // SELECCIONAR PACIENTE
  // =====================================================

  const seleccionarPaciente = (paciente: Paciente) => {

    setPacienteSeleccionado(paciente);

    setBuscarPaciente(
      `${paciente.nombres} ${paciente.apellidos}`
    );

    setPacientes([]);
  };


  // =====================================================
  // LIMPIAR TODO
  // =====================================================

  const limpiarPlan = () => {

    setBuscarPaciente("");

    setPacientes([]);

    setPacienteSeleccionado(null);

    setCantidadConsultas(4);

    setCostoTotal(0);

    setConsultas(crearConsultas(4));

    setMensaje("");
  };


  // =====================================================
  // CAMBIAR CANTIDAD DE CONSULTAS
  // =====================================================

  const cambiarCantidadConsultas = (cantidad: number) => {

    if (cantidad < 1) {
      cantidad = 1;
    }

    if (cantidad > 20) {
      cantidad = 20;
    }

    setCantidadConsultas(cantidad);

    setConsultas((anteriores) => {

      const nuevasConsultas: Consulta[] = [];

      for (let i = 1; i <= cantidad; i++) {

        const existente = anteriores.find(
          (consulta) => consulta.id === i
        );

        nuevasConsultas.push(
          existente || {
            id: i,
            procedimiento: "",
            costo: 0,
            observaciones: "",
          }
        );
      }

      return nuevasConsultas;
    });
  };


  // =====================================================
  // DISTRIBUIR COSTO TOTAL
  // =====================================================

  const distribuirCosto = (total: number) => {

    if (total < 0) {
      total = 0;
    }

    setCostoTotal(total);

    if (cantidadConsultas <= 0) {
      return;
    }

    const cantidadBase =
      Math.floor((total / cantidadConsultas) * 100) / 100;

    const totalBase =
      cantidadBase * cantidadConsultas;

    const diferencia =
      Math.round((total - totalBase) * 100) / 100;

    const nuevasConsultas = consultas.map(
      (consulta, index) => {

        let costo = cantidadBase;

        // La diferencia queda en la última consulta
        if (index === cantidadConsultas - 1) {
          costo =
            Math.round(
              (cantidadBase + diferencia) * 100
            ) / 100;
        }

        return {
          ...consulta,
          costo,
        };
      }
    );

    setConsultas(nuevasConsultas);
  };


  // =====================================================
  // ACTUALIZAR CONSULTA
  // =====================================================

  const actualizarConsulta = (
    id: number,
    campo: keyof Consulta,
    valor: string | number
  ) => {

    setConsultas((anteriores) =>

      anteriores.map((consulta) =>

        consulta.id === id
          ? {
              ...consulta,
              [campo]: valor,
            }
          : consulta

      )
    );
  };


  // =====================================================
  // TOTAL REAL DE CONSULTAS
  // =====================================================

  const totalConsultas = consultas.reduce(
    (total, consulta) =>
      total + Number(consulta.costo || 0),
    0
  );


  // =====================================================
  // GUARDAR PLAN
  // =====================================================

  const guardarPlan = async () => {

    if (!pacienteSeleccionado) {

      setMensaje(
        "Primero debes seleccionar un paciente."
      );

      return;
    }

    if (consultas.some(
      (consulta) =>
        !consulta.procedimiento.trim()
    )) {

      setMensaje(
        "Completa el procedimiento de todas las consultas."
      );

      return;
    }

    setGuardando(true);

    setMensaje("");

    try {

      /*
       * ESTA PARTE LA CONECTAREMOS CON SUPABASE
       * CUANDO CREEMOS LAS TABLAS DEL PLAN.
       *
       * Por ahora comprobamos que todo esté correcto.
       */

      console.log("Paciente:", pacienteSeleccionado);

      console.log("Costo total:", costoTotal);

      console.log("Consultas:", consultas);

      setMensaje(
        "Plan de tratamiento preparado correctamente."
      );

    } catch (error) {

      console.error(error);

      setMensaje(
        "Ocurrió un error al guardar el plan."
      );

    } finally {

      setGuardando(false);

    }
  };


  // =====================================================
  // INTERFAZ
  // =====================================================

  return (

    <div className="space-y-6">


      {/* =================================================
          ENCABEZADO
      ================================================= */}

      <div>

        <h1 className="text-3xl font-extrabold text-white">
          Plan de Tratamiento
        </h1>

        <p className="text-slate-400 mt-2">
          Planificación clínica y seguimiento del tratamiento odontológico.
        </p>

      </div>


      {/* =================================================
          PACIENTE
      ================================================= */}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

        <div className="flex items-center justify-between mb-5">

          <h2 className="text-xl font-bold text-white">
            Paciente
          </h2>

          <button
            onClick={limpiarPlan}
            className="
              px-4
              py-2
              rounded-xl
              bg-slate-700
              hover:bg-slate-600
              text-white
              text-sm
              font-semibold
              transition
            "
          >
            Limpiar
          </button>

        </div>


        {/* BUSCADOR */}

        <label className="text-slate-400 text-sm">
          Buscar paciente por DNI o nombre
        </label>

        <input
          value={buscarPaciente}
          onChange={(e) =>
            setBuscarPaciente(e.target.value)
          }
          placeholder="Escriba DNI o nombre..."
          className="
            mt-2
            w-full
            bg-slate-950
            border
            border-slate-800
            rounded-xl
            px-4
            py-3
            text-white
            outline-none
            focus:border-cyan-500
          "
        />


        {/* RESULTADOS */}

        {pacientes.length > 0 && (

          <div className="mt-3 rounded-xl border border-slate-800 overflow-hidden">

            {pacientes.map((p) => (

              <button
                key={p.id}
                type="button"
                onClick={() =>
                  seleccionarPaciente(p)
                }
                className="
                  w-full
                  text-left
                  p-4
                  hover:bg-slate-800
                  border-b
                  border-slate-800
                  last:border-b-0
                  transition
                "
              >

                <div className="font-bold text-white">
                  {p.nombres} {p.apellidos}
                </div>

                <div className="text-sm text-slate-400">
                  DNI: {p.dni}
                </div>

              </button>

            ))}

          </div>

        )}


        {/* PACIENTE SELECCIONADO */}

        {pacienteSeleccionado && (

          <div
            className="
              mt-5
              bg-slate-950
              border
              border-cyan-500/50
              rounded-xl
              p-5
            "
          >

            <div className="flex items-center justify-between">

              <h2 className="text-cyan-400 font-bold text-lg">
                Paciente seleccionado
              </h2>

              <span className="
                text-xs
                px-3
                py-1
                rounded-full
                bg-cyan-500/10
                text-cyan-400
              ">
                Paciente activo
              </span>

            </div>


            <div className="
              grid
              grid-cols-1
              md:grid-cols-2
              gap-3
              mt-4
              text-sm
            ">

              <p className="text-white">
                <b>Nombre:</b>{" "}
                {pacienteSeleccionado.nombres}{" "}
                {pacienteSeleccionado.apellidos}
              </p>

              <p className="text-white">
                <b>DNI:</b>{" "}
                {pacienteSeleccionado.dni}
              </p>

              <p className="text-white">
                <b>Teléfono:</b>{" "}
                {pacienteSeleccionado.telefono || "No registrado"}
              </p>

              <p className="text-white">
                <b>Sexo:</b>{" "}
                {pacienteSeleccionado.sexo || "No registrado"}
              </p>

            </div>

          </div>

        )}

      </div>


      {/* =================================================
          CONFIGURACIÓN DEL PLAN
      ================================================= */}

      {pacienteSeleccionado && (

        <div className="
          bg-slate-900
          border
          border-slate-800
          rounded-2xl
          p-6
        ">

          <div className="
            flex
            flex-col
            lg:flex-row
            lg:items-end
            justify-between
            gap-5
          ">

            <div>

              <h2 className="text-xl font-bold text-white">
                Configuración del tratamiento
              </h2>

              <p className="text-sm text-slate-400 mt-1">
                Define la cantidad de consultas y distribuye el costo total.
              </p>

            </div>


            <div className="
              grid
              grid-cols-1
              sm:grid-cols-2
              gap-4
              w-full
              lg:w-auto
            ">


              {/* CANTIDAD */}

              <div>

                <label className="text-sm text-slate-400">
                  Cantidad de consultas
                </label>

                <input
                  type="number"
                  min={1}
                  max={20}
                  value={cantidadConsultas}
                  onChange={(e) =>
                    cambiarCantidadConsultas(
                      Number(e.target.value)
                    )
                  }
                  className="
                    mt-2
                    w-full
                    sm:w-40
                    bg-slate-950
                    border
                    border-slate-700
                    rounded-xl
                    px-4
                    py-3
                    text-white
                  "
                />

              </div>


              {/* COSTO TOTAL */}

              <div>

                <label className="text-sm text-slate-400">
                  Costo total del tratamiento
                </label>

                <div className="flex mt-2">

                  <span className="
                    flex
                    items-center
                    px-3
                    bg-slate-800
                    border
                    border-slate-700
                    border-r-0
                    rounded-l-xl
                    text-slate-300
                  ">
                    S/.
                  </span>

                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={costoTotal}
                    onChange={(e) =>
                      setCostoTotal(
                        Number(e.target.value)
                      )
                    }
                    className="
                      w-full
                      sm:w-40
                      bg-slate-950
                      border
                      border-slate-700
                      rounded-r-xl
                      px-4
                      py-3
                      text-white
                    "
                  />

                </div>

              </div>

            </div>

          </div>


          {/* DISTRIBUIR */}

          <div className="
            mt-5
            flex
            flex-col
            sm:flex-row
            sm:items-center
            justify-between
            gap-4
            p-4
            rounded-xl
            bg-cyan-500/5
            border
            border-cyan-500/20
          ">

            <div>

              <p className="text-white font-semibold">
                Distribución del tratamiento
              </p>

              <p className="text-sm text-slate-400">
                El costo total se repartirá entre las consultas.
              </p>

            </div>

            <button
              onClick={() =>
                distribuirCosto(costoTotal)
              }
              className="
                px-5
                py-2.5
                rounded-xl
                bg-cyan-600
                hover:bg-cyan-500
                text-white
                font-semibold
                transition
              "
            >
              Distribuir costo
            </button>

          </div>

        </div>

      )}


      {/* =================================================
          CONSULTAS
      ================================================= */}

      {pacienteSeleccionado && (

        <div className="
          bg-slate-900
          border
          border-slate-800
          rounded-2xl
          p-6
        ">

          <div className="
            flex
            flex-col
            sm:flex-row
            sm:items-center
            justify-between
            gap-3
            mb-6
          ">

            <div>

              <h2 className="text-xl font-bold text-white">
                Planificación de Consultas
              </h2>

              <p className="text-sm text-slate-400 mt-1">
                Organiza paso a paso el tratamiento del paciente.
              </p>

            </div>

            <div className="text-sm text-slate-400">

              Total distribuido:{" "}

              <span className="text-cyan-400 font-bold">
                S/. {totalConsultas.toFixed(2)}
              </span>

            </div>

          </div>


          {/* GRID RESPONSIVE */}

          <div className="
            grid
            grid-cols-1
            md:grid-cols-2
            xl:grid-cols-3
            2xl:grid-cols-4
            gap-5
          ">

            {consultas.map((consulta) => (

              <div
                key={consulta.id}
                className="
                  bg-slate-950
                  border
                  border-slate-800
                  rounded-xl
                  p-5
                  hover:border-slate-700
                  transition
                "
              >

                {/* CABECERA */}

                <div className="
                  flex
                  items-center
                  justify-between
                  mb-5
                ">

                  <h3 className="
                    text-lg
                    font-bold
                    text-cyan-400
                  ">
                    Consulta {consulta.id}
                  </h3>

                  <span className="
                    text-xs
                    px-2.5
                    py-1
                    rounded-full
                    bg-slate-800
                    text-slate-400
                  ">
                    Sesión {consulta.id}
                  </span>

                </div>


                {/* PROCEDIMIENTO */}

                <label className="text-sm text-slate-400">
                  Procedimiento
                </label>

                <textarea
                  rows={5}
                  value={consulta.procedimiento}
                  onChange={(e) =>
                    actualizarConsulta(
                      consulta.id,
                      "procedimiento",
                      e.target.value
                    )
                  }
                  placeholder="Ej. Evaluación, limpieza, restauración..."
                  className="
                    mt-2
                    w-full
                    bg-slate-900
                    border
                    border-slate-700
                    rounded-xl
                    p-3
                    text-white
                    outline-none
                    focus:border-cyan-500
                    resize-none
                  "
                />


                {/* COSTO */}

                <label className="
                  text-sm
                  text-slate-400
                  mt-5
                  block
                ">
                  Costo de la consulta
                </label>

                <div className="flex mt-2">

                  <span className="
                    flex
                    items-center
                    px-3
                    bg-slate-800
                    border
                    border-slate-700
                    border-r-0
                    rounded-l-xl
                    text-slate-300
                  ">
                    S/.
                  </span>

                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={consulta.costo}
                    onChange={(e) =>
                      actualizarConsulta(
                        consulta.id,
                        "costo",
                        Number(e.target.value)
                      )
                    }
                    className="
                      w-full
                      bg-slate-900
                      border
                      border-slate-700
                      rounded-r-xl
                      p-3
                      text-white
                    "
                  />

                </div>


                {/* OBSERVACIONES */}

                <label className="
                  text-sm
                  text-slate-400
                  mt-5
                  block
                ">
                  Observaciones
                </label>

                <textarea
                  rows={3}
                  value={consulta.observaciones}
                  onChange={(e) =>
                    actualizarConsulta(
                      consulta.id,
                      "observaciones",
                      e.target.value
                    )
                  }
                  placeholder="Notas de esta consulta..."
                  className="
                    mt-2
                    w-full
                    bg-slate-900
                    border
                    border-slate-700
                    rounded-xl
                    p-3
                    text-white
                    outline-none
                    focus:border-cyan-500
                    resize-none
                  "
                />

              </div>

            ))}

          </div>


          {/* TOTAL */}

          <div className="
            mt-6
            flex
            flex-col
            sm:flex-row
            sm:items-center
            justify-between
            gap-3
            p-5
            rounded-xl
            bg-slate-950
            border
            border-slate-800
          ">

            <div>

              <p className="text-slate-400 text-sm">
                Costo total del plan
              </p>

              <p className="text-white text-2xl font-bold mt-1">
                S/. {totalConsultas.toFixed(2)}
              </p>

            </div>

            <div className="text-right">

              <p className="text-slate-400 text-sm">
                Consultas programadas
              </p>

              <p className="text-cyan-400 text-xl font-bold">
                {consultas.length}
              </p>

            </div>

          </div>


          {/* MENSAJE */}

          {mensaje && (

            <div className="
              mt-5
              p-4
              rounded-xl
              bg-slate-950
              border
              border-cyan-500/30
              text-cyan-300
            ">
              {mensaje}
            </div>

          )}


          {/* GUARDAR */}

          <div className="
            flex
            justify-end
            mt-6
          ">

            <button
              onClick={guardarPlan}
              disabled={guardando}
              className="
                px-6
                py-3
                rounded-xl
                bg-cyan-600
                hover:bg-cyan-500
                disabled:opacity-50
                text-white
                font-semibold
                shadow-lg
                transition
              "
            >
              {guardando
                ? "Guardando..."
                : "💾 Guardar plan de tratamiento"}
            </button>

          </div>

        </div>

      )}

    </div>
  );
};