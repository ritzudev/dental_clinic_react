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

export const PlanTratamientoPanel = () => {

  const [buscarPaciente, setBuscarPaciente] = useState("");

  const [pacientes, setPacientes] = useState<Paciente[]>([]);

  const [pacienteSeleccionado, setPacienteSeleccionado] =
    useState<Paciente | null>(null);
  const [cantidadConsultas, setCantidadConsultas] = useState(6);

  const [consultas, setConsultas] = useState<Consulta[]>([



    {
      id: 1,
      procedimiento: "",
      costo: 0,
      observaciones: ""
    },
    {
      id: 2,
      procedimiento: "",
      costo: 0,
      observaciones: ""
    },
    {
      id: 3,
      procedimiento: "",
      costo: 0,
      observaciones: ""
    },
    {
      id: 4,
      procedimiento: "",
      costo: 0,
      observaciones: ""
    },
    {
      id: 5,
      procedimiento: "",
      costo: 0,
      observaciones: ""
    },
    {
      id: 6,
      procedimiento: "",
      costo: 0,
      observaciones: ""
    }

  ]);
  useEffect(() => {

    buscarPacientes();

  }, [buscarPaciente]);

  const buscarPacientes = async () => {

    if (buscarPaciente === "") {
      setPacientes([]);
      return;
    }

    const { data } = await supabase

      .from("pacientes")

      .select("*")

      .or(`dni.ilike.%${buscarPaciente}%,nombres.ilike.%${buscarPaciente}%,apellidos.ilike.%${buscarPaciente}%`)

      .limit(8);

    setPacientes(data || []);

  };

  const cambiarCantidadConsultas = (cantidad: number) => {

    if (cantidad < 1) cantidad = 1;

    setCantidadConsultas(cantidad);

    const nuevasConsultas: Consulta[] = [];

    for (let i = 1; i <= cantidad; i++) {

      const existente = consultas.find(c => c.id === i);

      nuevasConsultas.push(
        existente || {
          id: i,
          procedimiento: "",
          costo: 0,
          observaciones: ""
        }
      );

    }

    setConsultas(nuevasConsultas);

  };

  const actualizarConsulta = (
    id: number,
    campo: keyof Consulta,
    valor: string | number
  ) => {

    setConsultas(

      consultas.map((consulta) =>

        consulta.id === id
          ? { ...consulta, [campo]: valor }
          : consulta

      )

    );

  };

  return (

    <div className="space-y-6">

      <div>

        <h1 className="text-3xl font-extrabold text-white">
          Plan de Tratamiento
        </h1>

        <p className="text-slate-400 mt-2">
          Planificación clínica y seguimiento del tratamiento odontológico.
        </p>

      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">


          <div className="md:col-span-2">

            <label className="text-slate-400 text-sm">
              Buscar paciente por DNI o Nombre
            </label>

            <input
              value={buscarPaciente}
              onChange={(e) => setBuscarPaciente(e.target.value)}
              placeholder="Escriba DNI o Nombre..."
              className="mt-2 w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white"
            />

            {
              pacientes.length > 0 && (

                <div className="mt-3 rounded-xl border border-slate-800 overflow-hidden">

                  {

                    pacientes.map((p) => (

                      <div

                        key={p.id}

                        onClick={() => {

                          setPacienteSeleccionado(p);

                          setBuscarPaciente(
                            `${p.nombres} ${p.apellidos}`
                          );

                          setPacientes([]);

                        }}

                        className="cursor-pointer p-4 hover:bg-slate-800 border-b border-slate-800"

                      >

                        <div className="font-bold text-white">
                          {p.nombres} {p.apellidos}
                        </div>

                        <div className="text-sm text-slate-400">
                          DNI: {p.dni}
                        </div>

                      </div>

                    ))

                  }

                </div>

              )

            }

          </div>
          {
            pacienteSeleccionado && (

              <div className="mt-6 bg-slate-950 border border-cyan-500 rounded-xl p-5">

                <h2 className="text-cyan-400 font-bold text-xl">

                  Paciente seleccionado

                </h2>

                <p className="text-white mt-3">

                  <b>Nombre:</b>

                  {" "}
                  {pacienteSeleccionado.nombres} {pacienteSeleccionado.apellidos}

                </p>

                <p className="text-white">

                  <b>DNI:</b>

                  {" "}
                  {pacienteSeleccionado.dni}

                </p>

                <p className="text-white">

                  <b>Teléfono:</b>

                  {" "}
                  {pacienteSeleccionado.telefono}

                </p>

                <p className="text-white">

                  <b>Sexo:</b>

                  {" "}
                  {pacienteSeleccionado.sexo}

                </p>

              </div>

            )
          }





        </div>






        {/* CONSULTAS DEL TRATAMIENTO */}

        <div className="mt-6">

          <div className="flex items-center justify-between mb-5">

            <h2 className="text-xl font-bold text-white">
              Planificación de Consultas
            </h2>

            <div className="flex items-center gap-3">

              <span className="text-slate-400">
                Cantidad
              </span>

              <input
                type="number"
                min={1}
                value={cantidadConsultas}
                onChange={(e) =>
                  cambiarCantidadConsultas(Number(e.target.value))
                }
                className="w-24 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
              />

            </div>

          </div>
          <div className="flex gap-5">

            {consultas.map((consulta) => (

              <div
                key={consulta.id}
                className="min-w-[300px] bg-slate-950 border border-slate-800 rounded-xl p-5"
              >

                <h3 className="text-lg font-bold text-cyan-400 mb-5">
                  Consulta {consulta.id}
                </h3>

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
                  className="mt-2 w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white"
                />

                <label className="text-sm text-slate-400 mt-5 block">
                  Costo (S/.)
                </label>

                <input
                  type="number"
                  value={consulta.costo}
                  onChange={(e) =>
                    actualizarConsulta(
                      consulta.id,
                      "costo",
                      Number(e.target.value)
                    )
                  }
                  className="mt-2 w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white"
                />

                <label className="text-sm text-slate-400 mt-5 block">
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
                  className="mt-2 w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white"
                />

              </div>

            ))}

          </div>

        </div>

      </div>

    </div>

  );


};          