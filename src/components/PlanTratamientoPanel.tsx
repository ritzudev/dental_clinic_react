import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import jsPDF from "jspdf";

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
  const [buscarPaciente, setBuscarPaciente] = useState("");
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [pacienteSeleccionado, setPacienteSeleccionado] =
    useState<Paciente | null>(null);

  const [cantidadConsultas, setCantidadConsultas] = useState(4);
  const [costoTotal, setCostoTotal] = useState(0);
  const [tituloPlan, setTituloPlan] = useState("");
  const [consultas, setConsultas] = useState<Consulta[]>(
    crearConsultas(4)
  );

  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");

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

  const seleccionarPaciente = (paciente: Paciente) => {
    setPacienteSeleccionado(paciente);
    setBuscarPaciente(
      `${paciente.nombres} ${paciente.apellidos}`
    );
    setPacientes([]);
  };

  const limpiarPlan = () => {
    setBuscarPaciente("");
    setPacientes([]);
    setPacienteSeleccionado(null);
    setCantidadConsultas(4);
    setCostoTotal(0);
    setConsultas(crearConsultas(4));
    setMensaje("");
  };

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

  const totalConsultas = consultas.reduce(
    (total, consulta) =>
      total + Number(consulta.costo || 0),
    0
  );

  const exportarPDF = async () => {
    if (!pacienteSeleccionado) {
      setMensaje("Primero debes seleccionar un paciente para exportar el plan.");
      return;
    }

    // Obtener el nombre del médico vinculado a la sesión actual.
    let nombreDoctor = "No registrado";
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: medico } = await supabase
          .from("medicos")
          .select("*")
          .eq("auth_user_id", user.id)
          .maybeSingle();

        if (medico) {
          const registro = medico as Record<string, unknown>;
          const nombres = String(registro.nombres ?? registro.nombre ?? "").trim();
          const apellidos = String(registro.apellidos ?? registro.apellido ?? "").trim();
          const nombreCompleto = String(
            registro.nombre_completo ?? registro.nombreCompleto ?? ""
          ).trim();

          nombreDoctor =
            nombreCompleto ||
            [nombres, apellidos].filter(Boolean).join(" ") ||
            "No registrado";
        }
      }
    } catch (error) {
      console.error("No se pudo obtener el nombre del médico para el PDF:", error);
    }

    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 16;
    const contentWidth = pageWidth - margin * 2;
    const today = new Date();
    const fechaEmision = today.toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    const cyan = [8, 145, 178] as [number, number, number];
    const dark = [30, 41, 59] as [number, number, number];
    const muted = [100, 116, 139] as [number, number, number];
    const line = [226, 232, 240] as [number, number, number];
    const pale = [236, 254, 255] as [number, number, number];

    let y = 16;

    // Encabezado institucional
    doc.setFillColor(...cyan);
    doc.roundedRect(margin, y, contentWidth, 25, 3, 3, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("VILLA 920 DENTAL", margin + 6, y + 10);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("SALUD · ESTÉTICA · BIENESTAR", margin + 6, y + 16);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("PLAN DE TRATAMIENTO", pageWidth - margin - 6, y + 11, {
      align: "right",
    });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`Emisión: ${fechaEmision}`, pageWidth - margin - 6, y + 17, {
      align: "right",
    });

    y += 34;

    // Identificación organizada en dos columnas: paciente y médico responsable.
    doc.setTextColor(...dark);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("DATOS DEL PACIENTE", margin, y);
    y += 5;

    const patientBoxY = y;
    const patientBoxHeight = 31;
    const innerPadding = 5;
    const dividerX = margin + contentWidth * 0.62;
    doc.setDrawColor(...line);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(
      margin,
      patientBoxY,
      contentWidth,
      patientBoxHeight,
      2.5,
      2.5,
      "FD"
    );
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.line(dividerX, patientBoxY + 4, dividerX, patientBoxY + patientBoxHeight - 4);

    const nombrePaciente = `${pacienteSeleccionado.nombres} ${pacienteSeleccionado.apellidos}`;
    const leftX = margin + innerPadding;
    const rightX = dividerX + innerPadding;
    const rightWidth = margin + contentWidth - rightX - innerPadding;

    // Columna izquierda: etiquetas y valores en filas alineadas.
    const labelX = leftX;
    const valueX = leftX + 24;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...muted);
    doc.text("PACIENTE", labelX, patientBoxY + 8);
    doc.text("DNI", labelX, patientBoxY + 17);
    doc.text("TELÉFONO", labelX, patientBoxY + 26);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...dark);
    const patientValueWidth = dividerX - valueX - 4;
    const nombrePacienteLineas = doc.splitTextToSize(nombrePaciente, patientValueWidth);
    doc.text(nombrePacienteLineas.slice(0, 1), valueX, patientBoxY + 8);
    doc.text(pacienteSeleccionado.dni || "No registrado", valueX, patientBoxY + 17);
    doc.text(pacienteSeleccionado.telefono || "No registrado", valueX, patientBoxY + 26);

    // Columna derecha: doctor con la misma estructura etiqueta / valor.
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...muted);
    doc.text("DOCTOR", rightX, patientBoxY + 8);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...dark);
    const doctorLineas = doc.splitTextToSize(nombreDoctor, rightWidth);
    doc.text(doctorLineas.slice(0, 2), rightX, patientBoxY + 15);

    y += 40;

    // Título y resumen
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...dark);
    doc.text("DETALLE DEL PLAN", margin, y);
    y += 6;

    doc.setFillColor(...pale);
    doc.setDrawColor(165, 243, 252);
    doc.roundedRect(margin, y, contentWidth, 17, 2, 2, "FD");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...muted);
    doc.text("Nombre del plan", margin + 5, y + 6);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...dark);
    const titulo = tituloPlan.trim() || "Plan de tratamiento odontológico";
    doc.text(doc.splitTextToSize(titulo, contentWidth - 10).slice(0, 2), margin + 5, y + 12);

    y += 25;

    // Tabla de consultas
    const col = {
      numero: margin + 2,
      procedimiento: margin + 16,
      observaciones: margin + 91,
      costo: pageWidth - margin - 3,
    };
    const procedureWidth = 70;
    const observationWidth = 52;

    const dibujarCabeceraTabla = () => {
      doc.setFillColor(...cyan);
      doc.roundedRect(margin, y, contentWidth, 9, 1.5, 1.5, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text("N.º", col.numero, y + 5.8);
      doc.text("PROCEDIMIENTO", col.procedimiento, y + 5.8);
      doc.text("OBSERVACIONES", col.observaciones, y + 5.8);
      doc.text("COSTO (S/.)", col.costo, y + 5.8, { align: "right" });
      y += 12;
    };

    dibujarCabeceraTabla();

    consultas.forEach((consulta, index) => {
      const procedimiento = consulta.procedimiento.trim() || "Por definir";
      const observaciones = consulta.observaciones.trim() || "—";
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      const procedimientoLineas = doc.splitTextToSize(procedimiento, procedureWidth);
      const observacionesLineas = doc.splitTextToSize(observaciones, observationWidth);
      const lineas = Math.max(procedimientoLineas.length, observacionesLineas.length, 1);
      const rowHeight = Math.max(11, lineas * 4 + 5);

      if (y + rowHeight > pageHeight - 25) {
        doc.addPage();
        y = 18;
        dibujarCabeceraTabla();
      }

      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y - 3, contentWidth, rowHeight, "F");
      }
      doc.setDrawColor(...line);
      doc.line(margin, y + rowHeight - 3, pageWidth - margin, y + rowHeight - 3);

      doc.setTextColor(...dark);
      doc.text(String(consulta.id).padStart(2, "0"), col.numero, y + 3);
      doc.text(procedimientoLineas, col.procedimiento, y + 3);
      doc.setTextColor(...muted);
      doc.text(observacionesLineas, col.observaciones, y + 3);
      doc.setTextColor(...dark);
      doc.setFont("helvetica", "bold");
      doc.text(Number(consulta.costo || 0).toLocaleString("es-PE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }), col.costo, y + 3, { align: "right" });

      y += rowHeight;
    });

    y += 7;
    if (y + 32 > pageHeight - 20) {
      doc.addPage();
      y = 20;
    }

    // Resumen económico
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(...line);
    doc.roundedRect(margin, y, contentWidth, 25, 2, 2, "FD");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...muted);
    doc.text("Consultas programadas", margin + 5, y + 8);
    doc.text("Costo total del plan", pageWidth - margin - 5, y + 8, {
      align: "right",
    });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...dark);
    doc.text(String(consultas.length), margin + 5, y + 17);
    doc.setTextColor(...cyan);
    doc.text(`S/. ${totalConsultas.toFixed(2)}`, pageWidth - margin - 5, y + 17, {
      align: "right",
    });

    y += 33;
    if (y > pageHeight - 17) {
      doc.addPage();
      y = 20;
    }
    doc.setDrawColor(...line);
    doc.line(margin, pageHeight - 13, pageWidth - margin, pageHeight - 13);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...muted);
    doc.text("Documento de planificación del tratamiento odontológico.", margin, pageHeight - 8);
    doc.text("VILLA 920 DENTAL", pageWidth - margin, pageHeight - 8, {
      align: "right",
    });

    const nombreArchivo = `Plan_Tratamiento_${pacienteSeleccionado.apellidos
      .trim()
      .replace(/\s+/g, "_")}_${today.toISOString().slice(0, 10)}.pdf`;
    doc.save(nombreArchivo);
    setMensaje("PDF del plan de tratamiento generado.");
  };

  const guardarPlan = async () => {
    if (!pacienteSeleccionado) {
      setMensaje("Primero debes seleccionar un paciente.");
      return;
    }

    if (!tituloPlan.trim()) {
      setMensaje("Ingresa un título para el plan de tratamiento.");
      return;
    }

    if (
      consultas.some(
        (consulta) =>
          !consulta.procedimiento.trim()
      )
    ) {
      setMensaje(
        "Completa el procedimiento de todas las consultas."
      );
      return;
    }

    setGuardando(true);
    setMensaje("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error(
          "No se pudo obtener el usuario autenticado."
        );
      }

      console.log("USUARIO AUTENTICADO:", user);
      console.log("USER ID:", user.id);
      console.log("USER EMAIL:", user.email);

      const {
        data: medico,
        error: medicoError,
      } = await supabase
        .from("medicos")
        .select("id")
        .eq("auth_user_id", user.id)
        .single();

      if (medicoError || !medico) {
        console.error("Error médico:", medicoError);
        throw new Error(
          "No se encontró un médico vinculado a este usuario."
        );
      }

      const {
        data: plan,
        error: planError,
      } = await supabase
        .from("planes_tratamiento")
        .insert({
          paciente_id: pacienteSeleccionado.id,
          medico_id: medico.id,
          titulo: tituloPlan.trim(),
          cantidad_consultas: consultas.length,
          costo_total: totalConsultas,
          estado: "pendiente",
        })
        .select()
        .single();

      if (planError || !plan) {
        console.error(
          "Error guardando plan:",
          planError
        );

        throw new Error(
          planError?.message ||
          "No se pudo guardar el plan."
        );
      }

      const consultasParaGuardar = consultas.map(
        (consulta) => ({
          plan_id: plan.id,
          numero_consulta: consulta.id,
          descripcion: consulta.procedimiento.trim(),
          costo: Number(consulta.costo),
          estado: "pendiente",
          observaciones:
            consulta.observaciones.trim() || null,
        })
      );

      const {
        error: consultasError,
      } = await supabase
        .from("plan_consultas")
        .insert(consultasParaGuardar);

      if (consultasError) {
        console.error(
          "Error guardando consultas:",
          consultasError
        );

        throw new Error(
          consultasError.message ||
          "No se pudieron guardar las consultas."
        );
      }

      setMensaje(
        "Plan de tratamiento guardado correctamente."
      );
    } catch (error) {
      console.error(
        "Error al guardar plan:",
        error
      );

      setMensaje(
        error instanceof Error
          ? error.message
          : "Ocurrió un error al guardar el plan."
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* ENCABEZADO */}

      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
          Plan de Tratamiento
        </h1>

        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Planificación clínica y seguimiento del tratamiento odontológico.
        </p>
      </div>


      {/* PACIENTE */}

      <div className="
        bg-white
        dark:bg-slate-900
        border
        border-slate-200
        dark:border-slate-800
        rounded-2xl
        overflow-hidden
        shadow-sm
        dark:shadow-xl
      ">

        {/* CABECERA */}

        <div className="
          px-6
          py-5
          border-b
          border-slate-200
          dark:border-slate-800
          flex
          flex-col
          sm:flex-row
          sm:items-center
          sm:justify-between
          gap-4
        ">

          <div className="flex items-center gap-3">

            <div className="
              w-11
              h-11
              rounded-xl
              bg-cyan-500/10
              border
              border-cyan-500/20
              flex
              items-center
              justify-center
              text-cyan-500
              dark:text-cyan-400
              text-xl
            ">
              👤
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Paciente
              </h2>

              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Selecciona al paciente para iniciar su plan de tratamiento.
              </p>
            </div>

          </div>

          <button
            onClick={limpiarPlan}
            className="
              px-4
              py-2
              rounded-xl
              bg-slate-100
              hover:bg-slate-200
              dark:bg-slate-800
              dark:hover:bg-slate-700
              border
              border-slate-200
              dark:border-slate-700
              text-slate-600
              dark:text-slate-300
              hover:text-slate-900
              dark:hover:text-white
              text-sm
              font-semibold
              transition
            "
          >
            Limpiar
          </button>

        </div>


        {/* CONTENIDO */}

        <div className="p-6">

          {/* BUSCADOR */}

          <div className="max-w-2xl">

            <label className="
              block
              text-sm
              font-semibold
              text-slate-700
              dark:text-slate-300
              mb-2
            ">
              Buscar paciente
            </label>

            <div className="relative">

              <span className="
                absolute
                left-4
                top-1/2
                -translate-y-1/2
                text-slate-400
                dark:text-slate-500
                text-lg
              ">
                🔎
              </span>

              <input
                value={buscarPaciente}
                onChange={(e) =>
                  setBuscarPaciente(e.target.value)
                }
                placeholder="Buscar por DNI, nombres o apellidos..."
                className="
                  w-full
                  bg-white
                  dark:bg-slate-950
                  border
                  border-slate-300
                  dark:border-slate-700
                  rounded-xl
                  pl-11
                  pr-4
                  py-3.5
                  text-slate-900
                  dark:text-white
                  placeholder:text-slate-400
                  dark:placeholder:text-slate-600
                  outline-none
                  transition
                  focus:border-cyan-500
                  focus:ring-2
                  focus:ring-cyan-500/10
                "
              />

            </div>

            <p className="
              text-xs
              text-slate-500
              mt-2
            ">
              Escribe al menos parte del DNI o nombre del paciente.
            </p>

          </div>


          {/* RESULTADOS DE BÚSQUEDA */}

          {pacientes.length > 0 && (

            <div className="
              mt-4
              max-w-2xl
              bg-white
              dark:bg-slate-950
              border
              border-slate-200
              dark:border-slate-800
              rounded-xl
              overflow-hidden
              shadow-lg
            ">

              <div className="
                px-4
                py-3
                border-b
                border-slate-200
                dark:border-slate-800
                bg-slate-50
                dark:bg-slate-900/60
              ">

                <p className="
                  text-xs
                  uppercase
                  tracking-wider
                  font-bold
                  text-slate-500
                ">
                  Pacientes encontrados
                </p>

              </div>

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
                    px-4
                    py-4
                    flex
                    items-center
                    gap-4
                    border-b
                    border-slate-200
                    dark:border-slate-800
                    last:border-b-0
                    hover:bg-slate-50
                    dark:hover:bg-slate-800/70
                    transition
                  "
                >

                  <div className="
                    w-10
                    h-10
                    shrink-0
                    rounded-full
                    bg-cyan-500/10
                    border
                    border-cyan-500/20
                    flex
                    items-center
                    justify-center
                    text-cyan-600
                    dark:text-cyan-400
                    font-bold
                  ">
                    {p.nombres?.charAt(0)}
                  </div>

                  <div className="min-w-0">

                    <p className="
                      text-slate-900
                      dark:text-white
                      font-semibold
                      truncate
                    ">
                      {p.nombres} {p.apellidos}
                    </p>

                    <p className="
                      text-sm
                      text-slate-500
                      dark:text-slate-500
                      mt-0.5
                    ">
                      DNI: {p.dni}
                    </p>

                  </div>

                  <span className="
                    ml-auto
                    text-slate-400
                    dark:text-slate-600
                    text-lg
                  ">
                    →
                  </span>

                </button>

              ))}

            </div>

          )}


          {/* PACIENTE SELECCIONADO */}

          {pacienteSeleccionado && (

            <div className="
              mt-6
              rounded-2xl
              border
              border-cyan-200
              dark:border-cyan-500/20
              bg-gradient-to-br
              from-cyan-50
              via-white
              to-slate-50
              dark:from-cyan-500/5
              dark:via-slate-950
              dark:to-slate-950
              overflow-hidden
            ">

              {/* IDENTIFICACIÓN */}

              <div className="
                px-5
                py-4
                border-b
                border-cyan-100
                dark:border-cyan-500/10
                flex
                flex-col
                sm:flex-row
                sm:items-center
                sm:justify-between
                gap-4
              ">

                <div className="flex items-center gap-4">

                  <div className="
                    w-14
                    h-14
                    rounded-2xl
                    bg-cyan-500/10
                    border
                    border-cyan-500/20
                    flex
                    items-center
                    justify-center
                    text-cyan-600
                    dark:text-cyan-400
                    text-xl
                    font-bold
                  ">
                    {pacienteSeleccionado.nombres?.charAt(0)}
                  </div>

                  <div>

                    <p className="
                      text-xs
                      uppercase
                      tracking-wider
                      text-cyan-600
                      dark:text-cyan-400
                      font-bold
                    ">
                      Paciente seleccionado
                    </p>

                    <h3 className="
                      text-xl
                      font-bold
                      text-slate-900
                      dark:text-white
                      mt-1
                    ">
                      {pacienteSeleccionado.nombres}{" "}
                      {pacienteSeleccionado.apellidos}
                    </h3>

                  </div>

                </div>

                <span className="
                  inline-flex
                  items-center
                  gap-2
                  w-fit
                  px-3
                  py-1.5
                  rounded-full
                  bg-emerald-50
                  dark:bg-emerald-500/10
                  border
                  border-emerald-200
                  dark:border-emerald-500/20
                  text-emerald-700
                  dark:text-emerald-400
                  text-xs
                  font-bold
                ">

                  <span className="
                    w-1.5
                    h-1.5
                    rounded-full
                    bg-emerald-500
                    dark:bg-emerald-400
                  " />

                  Paciente activo

                </span>

              </div>


              {/* DATOS CLÍNICOS */}

              <div className="
                grid
                grid-cols-1
                sm:grid-cols-2
                lg:grid-cols-4
                gap-px
                bg-slate-200
                dark:bg-slate-800/50
              ">

                <div className="
                  bg-white
                  dark:bg-slate-950/80
                  p-4
                ">

                  <p className="
                    text-xs
                    text-slate-500
                    uppercase
                    tracking-wide
                    font-semibold
                  ">
                    DNI
                  </p>

                  <p className="
                    text-slate-900
                    dark:text-white
                    font-semibold
                    mt-1
                  ">
                    {pacienteSeleccionado.dni}
                  </p>

                </div>


                <div className="
                  bg-white
                  dark:bg-slate-950/80
                  p-4
                ">

                  <p className="
                    text-xs
                    text-slate-500
                    uppercase
                    tracking-wide
                    font-semibold
                  ">
                    Teléfono
                  </p>

                  <p className="
                    text-slate-900
                    dark:text-white
                    font-semibold
                    mt-1
                  ">
                    {pacienteSeleccionado.telefono ||
                      "No registrado"}
                  </p>

                </div>


                <div className="
                  bg-white
                  dark:bg-slate-950/80
                  p-4
                ">

                  <p className="
                    text-xs
                    text-slate-500
                    uppercase
                    tracking-wide
                    font-semibold
                  ">
                    Sexo
                  </p>

                  <p className="
                    text-slate-900
                    dark:text-white
                    font-semibold
                    mt-1
                  ">
                    {pacienteSeleccionado.sexo ||
                      "No registrado"}
                  </p>

                </div>


                <div className="
                  bg-white
                  dark:bg-slate-950/80
                  p-4
                ">

                  <p className="
                    text-xs
                    text-slate-500
                    uppercase
                    tracking-wide
                    font-semibold
                  ">
                    Estado
                  </p>

                  <p className="
                    text-emerald-600
                    dark:text-emerald-400
                    font-semibold
                    mt-1
                  ">
                    Listo para tratamiento
                  </p>

                </div>

              </div>

            </div>

          )}

        </div>

      </div>


      {/* =================================================
          CONFIGURACIÓN DEL PLAN
      ================================================= */}

      {pacienteSeleccionado && (

        <div className="
          bg-white
          dark:bg-slate-900
          border
          border-slate-200
          dark:border-slate-800
          rounded-2xl
          p-6
          shadow-sm
          dark:shadow-none
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

              <h2 className="
                text-xl
                font-bold
                text-slate-900
                dark:text-white
              ">
                Configuración del tratamiento
              </h2>

              <p className="
                text-sm
                text-slate-500
                dark:text-slate-400
                mt-1
              ">
                Define la cantidad de consultas y distribuye el costo total.
              </p>

            </div>


            <div className="mt-5 lg:mt-0 w-full lg:max-w-md">

              <label className="
                text-sm
                text-slate-600
                dark:text-slate-400
              ">
                Título del plan de tratamiento
              </label>

              <input
                type="text"
                value={tituloPlan}
                onChange={(e) =>
                  setTituloPlan(e.target.value)
                }
                placeholder="Ej. Tratamiento integral odontológico"
                className="
                  mt-2
                  w-full
                  bg-white
                  dark:bg-slate-950
                  border
                  border-slate-300
                  dark:border-slate-700
                  rounded-xl
                  px-4
                  py-3
                  text-slate-900
                  dark:text-white
                  placeholder:text-slate-400
                  dark:placeholder:text-slate-600
                  outline-none
                  transition
                  focus:border-cyan-500
                  focus:ring-2
                  focus:ring-cyan-500/10
                "
              />

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

              <div className="flex flex-col gap-2">

                <label className="
                  text-sm
                  text-slate-600
                  dark:text-slate-400
                ">
                  Cantidad de consultas
                </label>

                <input
                  type="number"
                  min={1}
                  value={cantidadConsultas}
                  onChange={(e) =>
                    cambiarCantidadConsultas(
                      Number(e.target.value)
                    )
                  }
                  className="
                    w-full
                    bg-white
                    dark:bg-slate-950
                    border
                    border-slate-300
                    dark:border-slate-700
                    rounded-lg
                    px-3
                    py-2
                    text-slate-900
                    dark:text-white
                    outline-none
                    transition
                    focus:border-cyan-500
                    focus:ring-2
                    focus:ring-cyan-500/10
                  "
                />

              </div>


              {/* COSTO TOTAL */}

              <div>

                <label className="
                  text-sm
                  text-slate-600
                  dark:text-slate-400
                ">
                  Costo total del tratamiento
                </label>

                <div className="flex mt-2">

                  <span className="
                    flex
                    items-center
                    px-3
                    bg-slate-100
                    dark:bg-slate-800
                    border
                    border-slate-300
                    dark:border-slate-700
                    border-r-0
                    rounded-l-xl
                    text-slate-600
                    dark:text-slate-300
                  ">
                    S/.
                  </span>

                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={costoTotal}
                    onFocus={(e) =>
                      e.currentTarget.select()
                    }
                    onChange={(e) =>
                      setCostoTotal(
                        Number(e.target.value)
                      )
                    }
                    className="
                      w-full
                      sm:w-40
                      bg-white
                      dark:bg-slate-950
                      border
                      border-slate-300
                      dark:border-slate-700
                      rounded-r-xl
                      px-4
                      py-3
                      text-slate-900
                      dark:text-white
                      outline-none
                      focus:border-cyan-500
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
            bg-cyan-50
            dark:bg-cyan-500/5
            border
            border-cyan-200
            dark:border-cyan-500/20
          ">

            <div>

              <p className="
                text-slate-900
                dark:text-white
                font-semibold
              ">
                Distribución del tratamiento
              </p>

              <p className="
                text-sm
                text-slate-500
                dark:text-slate-400
              ">
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
                shadow-sm
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
          bg-white
          dark:bg-slate-900
          border
          border-slate-200
          dark:border-slate-800
          rounded-2xl
          p-6
          shadow-sm
          dark:shadow-none
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

              <h2 className="
                text-xl
                font-bold
                text-slate-900
                dark:text-white
              ">
                Planificación de Consultas
              </h2>

              <p className="
                text-sm
                text-slate-500
                dark:text-slate-400
                mt-1
              ">
                Organiza paso a paso el tratamiento del paciente.
              </p>

            </div>

            <div className="
              text-sm
              text-slate-500
              dark:text-slate-400
            ">

              Total distribuido:{" "}

              <span className="
                text-cyan-600
                dark:text-cyan-400
                font-bold
              ">
                S/. {totalConsultas.toFixed(2)}
              </span>

            </div>

          </div>


          {/* GRID RESPONSIVE */}

          <div className="
            grid
            grid-cols-1
            sm:grid-cols-2
            lg:grid-cols-4
            gap-5
          ">

            {consultas.map((consulta) => (

              <div
                key={consulta.id}
                className="
                  bg-slate-50
                  dark:bg-slate-950
                  border
                  border-slate-200
                  dark:border-slate-800
                  rounded-xl
                  p-5
                  hover:border-cyan-300
                  dark:hover:border-slate-700
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
                    text-cyan-600
                    dark:text-cyan-400
                  ">
                    Consulta {consulta.id}
                  </h3>

                  <span className="
                    text-xs
                    px-2.5
                    py-1
                    rounded-full
                    bg-slate-200
                    dark:bg-slate-800
                    text-slate-600
                    dark:text-slate-400
                  ">
                    Sesión {consulta.id}
                  </span>

                </div>


                {/* PROCEDIMIENTO */}

                <label className="
                  text-sm
                  text-slate-600
                  dark:text-slate-400
                ">
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
                    bg-white
                    dark:bg-slate-900
                    border
                    border-slate-300
                    dark:border-slate-700
                    rounded-xl
                    p-3
                    text-slate-900
                    dark:text-white
                    placeholder:text-slate-400
                    dark:placeholder:text-slate-600
                    outline-none
                    focus:border-cyan-500
                    focus:ring-2
                    focus:ring-cyan-500/10
                    resize-none
                  "
                />


                {/* COSTO */}

                <label className="
                  text-sm
                  text-slate-600
                  dark:text-slate-400
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
                    bg-slate-100
                    dark:bg-slate-800
                    border
                    border-slate-300
                    dark:border-slate-700
                    border-r-0
                    rounded-l-xl
                    text-slate-600
                    dark:text-slate-300
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
                      bg-white
                      dark:bg-slate-900
                      border
                      border-slate-300
                      dark:border-slate-700
                      rounded-r-xl
                      p-3
                      text-slate-900
                      dark:text-white
                      outline-none
                      focus:border-cyan-500
                    "
                  />

                </div>


                {/* OBSERVACIONES */}

                <label className="
                  text-sm
                  text-slate-600
                  dark:text-slate-400
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
                    bg-white
                    dark:bg-slate-900
                    border
                    border-slate-300
                    dark:border-slate-700
                    rounded-xl
                    p-3
                    text-slate-900
                    dark:text-white
                    placeholder:text-slate-400
                    dark:placeholder:text-slate-600
                    outline-none
                    focus:border-cyan-500
                    focus:ring-2
                    focus:ring-cyan-500/10
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
            bg-slate-50
            dark:bg-slate-950
            border
            border-slate-200
            dark:border-slate-800
          ">

            <div>

              <p className="
                text-slate-500
                dark:text-slate-400
                text-sm
              ">
                Costo total del plan
              </p>

              <p className="
                text-slate-900
                dark:text-white
                text-2xl
                font-bold
                mt-1
              ">
                S/. {totalConsultas.toFixed(2)}
              </p>

            </div>

            <div className="text-right">

              <p className="
                text-slate-500
                dark:text-slate-400
                text-sm
              ">
                Consultas programadas
              </p>

              <p className="
                text-cyan-600
                dark:text-cyan-400
                text-xl
                font-bold
              ">
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
              bg-cyan-50
              dark:bg-cyan-500/5
              border
              border-cyan-200
              dark:border-cyan-500/30
              text-cyan-700
              dark:text-cyan-300
            ">
              {mensaje}
            </div>

          )}


          {/* GUARDAR */}

          <div className="
            flex
            flex-col-reverse
            sm:flex-row
            sm:justify-end
            gap-3
            mt-6
          ">

            <button
              type="button"
              onClick={exportarPDF}
              className="
                px-6
                py-3
                rounded-xl
                border
                border-cyan-600
                text-cyan-700
                dark:text-cyan-300
                hover:bg-cyan-50
                dark:hover:bg-cyan-500/10
                font-semibold
                transition
              "
            >
              📄 Exportar PDF
            </button>

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