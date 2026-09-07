
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

import jsPDF from "jspdf";
import Tooth from "./OdontogramaPanel/Tooth";

import type { Estado } from "./OdontogramaPanel/ToothTypes";


type Paciente = {
  id: number;
  nombres: string;
  apellidos: string;
  dni: string;
  telefono: string;
  estado: string;
};

interface OdontogramaProps {
  paciente: Paciente;
  medico: string;
  medicoId: number;
  citaId: number;
}


const dientes = [
  18,17,16,15,14,13,12,11,
  21,22,23,24,25,26,27,28,
  48,47,46,45,44,43,42,41,
  31,32,33,34,35,36,37,38
];

export default function Odontograma({
  paciente,
  medico,
  medicoId,
  citaId,
}: OdontogramaProps) {




  console.log("===== DATOS ODONTOGRAMA =====");
console.log("Paciente:", paciente.id);
console.log("Médico:", medicoId);
console.log("Cita:", citaId);





  const [selected, setSelected] = useState<{
  numero: number;
  face: "top" | "right" | "bottom" | "left" | "center";
} | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  type Caras = {
  top?: Estado;
  right?: Estado;
  bottom?: Estado;
  left?: Estado;
  center?: Estado;
};

const [datos, setDatos] = useState<Record<number, Caras>>({});

const [observaciones, setObservaciones] = useState("");
const [diagnostico, setDiagnostico] = useState("");

const [mensajeGuardado, setMensajeGuardado] = useState("");
const [mostrarHistorial, setMostrarHistorial] = useState(false);
const [historial, setHistorial] = useState<any[]>([]);

const [odontogramaHistorico, setOdontogramaHistorico] = useState<any | null>(null);

useEffect(() => {
  if (mostrarHistorial) {
    cargarHistorial();
  }
}, [mostrarHistorial]);

useEffect(() => {
  cargarOdontograma();
}, [citaId]);



const cargarHistorial = async () => {
  if (!paciente.id) return;

  const { data, error } = await supabase
    .from("odontogramas")
    .select(`
      id,
      paciente_id,
      medico_id,
      cita_id,
      datos,
      observaciones,
      diagnostico,
      created_at,
      updated_at
    `)
    .eq("paciente_id", paciente.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("ERROR AL CARGAR HISTORIAL:", error);
    return;
  }

  setHistorial(data || []);
};

const verOdontogramaHistorico = (odontograma: any) => {
  setOdontogramaHistorico(odontograma);
};


const cargarOdontograma = async () => {
  if (!citaId) return;

  
  const { data, error } = await supabase
    .from("odontogramas")
    .select("*")
    .eq("cita_id", citaId)
    .maybeSingle();

  if (error) {
    console.error("ERROR AL CARGAR ODONTOGRAMA:", error);
    return;
  }

  if (!data) {
    console.log("Esta cita todavía no tiene odontograma.");
    return;
  }

  console.log("ODONTOGRAMA CARGADO:", data);

  setDatos(data.datos || {});
  setObservaciones(data.observaciones || "");
  setDiagnostico(data.diagnostico || "");
};


  const handleFaceClick = (
  numero: number,
  face: "top" | "right" | "bottom" | "left" | "center",
  e: React.MouseEvent
) => {
  setSelected({
    numero,
    face,
  });

  setPos({
    x: e.clientX + 10,
    y: e.clientY + 10,
  });
};

  const guardarEstado = (estado: Estado) => {
  if (!selected) return;

  
setDatos((prev) => ({
  ...prev,
  [selected.numero]: {
    ...prev[selected.numero],
    [selected.face]: estado,
  },
}));

  setSelected(null);
};
const guardarOdontograma = async () => {
  try {
    if (!paciente.id) {
      alert("No se encontró el paciente.");
      return;
    }

    if (!medicoId) {
      alert("No se encontró el médico.");
      return;
    }

    if (!citaId) {
      alert("No se encontró la cita.");
      return;
    }

    const { error } = await supabase
      .from("odontogramas")
      .upsert(
        {
          paciente_id: paciente.id,
          medico_id: medicoId,
          cita_id: citaId,
          datos: datos,
          observaciones: observaciones,
          diagnostico: diagnostico,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "cita_id",
        }
      );

    if (error) {
  console.error("ERROR AL GUARDAR ODONTOGRAMA:", error);
  console.error("Mensaje:", error.message);
  console.error("Detalles:", error.details);
  console.error("Hint:", error.hint);
  console.error("Código:", error.code);

  alert(
    `Error al guardar:\n\n${error.message}\n\nDetalles: ${error.details || "Sin detalles"}`
  );

  return;
}
    setMensajeGuardado("Odontograma guardado correctamente.");

setTimeout(() => {
  setMensajeGuardado("");
}, 2500);

  } catch (error) {
    console.error("ERROR INESPERADO:", error);
    alert("Ocurrió un error al guardar el odontograma.");
  }
};

const exportarPDF = () => {
  const doc = new jsPDF("p", "mm", "a4");

  // =========================
  // CONFIGURACIÓN
  // =========================

  const margen = 15;
  const anchoPagina = 210;
  const centroPagina = anchoPagina / 2;

  // =========================
  // ENCABEZADO
  // =========================

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);

  doc.text("NOMBRE DE LA CLÍNICA", margen, 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  doc.text("Dirección de la clínica", margen, 26);
  doc.text("Teléfono: ____________________", margen, 31);

  doc.line(margen, 38, anchoPagina - margen, 38);

  // =========================
  // TÍTULO
  // =========================

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);

  doc.text(
    "ODONTOGRAMA DENTAL",
    centroPagina,
    48,
    { align: "center" }
  );

  // =========================
  // DATOS DEL PACIENTE
  // =========================

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  doc.text(
    `Paciente: ${paciente.nombres} ${paciente.apellidos}`,
    margen,
    60
  );

  doc.text(`DNI: ${paciente.dni}`, margen, 67);

  doc.text(`Médico: Dr. ${medico}`, margen, 74);

  doc.text(
    `Fecha: ${new Date().toLocaleDateString("es-PE")}`,
    120,
    74
  );

  doc.line(
    margen,
    80,
    anchoPagina - margen,
    80
  );

  // =========================
  // TÍTULO ODONTOGRAMA
  // =========================

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);

  doc.text(
    "ODONTOGRAMA",
    centroPagina,
    90,
    { align: "center" }
  );

  // =====================================================
  // CONFIGURACIÓN DE LOS DIENTES
  // =====================================================

  const inicioX = 15;
  const inicioY = 100;

  const espacioDiente = 11.25;
  const espacioFilas = 25;

  // =====================================================
  // TIPO DE DIENTE
  // =====================================================

  
  // ------------------------------------
// OBTENER COLOR DEL ESTADO
// ------------------------------------

const obtenerColorEstado = (estado?: Estado) => {
  switch (estado) {
    case "sano":
      return [34, 197, 94];

    case "caries":
      return [239, 68, 68];

    case "restaurado":
      return [59, 130, 246];

    case "extraido":
      return [107, 114, 128];

    default:
      return [255, 255, 255];
  }
};


// ------------------------------------
// DIBUJAR UNA CARA
// ------------------------------------

const dibujarCara = (
  puntos: [number, number][],
  estado?: Estado
) => {

  const [r, g, b] = obtenerColorEstado(estado);

  const [p1, p2, p3, p4] = puntos;

  // Relleno
  doc.setFillColor(r, g, b);

  doc.triangle(
    p1[0], p1[1],
    p2[0], p2[1],
    p3[0], p3[1],
    "F"
  );

  doc.triangle(
    p1[0], p1[1],
    p3[0], p3[1],
    p4[0], p4[1],
    "F"
  );

  // Bordes internos
  doc.setDrawColor(90, 90, 90);
  doc.setLineWidth(0.22);

  doc.line(
    p1[0], p1[1],
    p2[0], p2[1]
  );

  doc.line(
    p2[0], p2[1],
    p3[0], p3[1]
  );

  doc.line(
    p3[0], p3[1],
    p4[0], p4[1]
  );

  doc.line(
    p4[0], p4[1],
    p1[0], p1[1]
  );
};


// ------------------------------------
// DIBUJAR UN DIENTE
// ------------------------------------


const dibujarDiente = (
  numero: number,
  x: number,
  y: number
) => {

  const caras = datos[numero] || {};

  // =====================================
  // TAMAÑO
  // =====================================

  const ancho = 9;
  const alto = 14;

  const offsetX = (espacioDiente - ancho) / 2;

  const dx = x + offsetX;

  // =====================================
  // ESCALA
  // =====================================

  const sx = ancho / 100;
  const sy = alto / 140;

  const px = (v: number) => dx + v * sx;
  const py = (v: number) => y + v * sy;

  // =====================================
  // CONTORNO DEL DIENTE
  // =====================================

  const contorno = [
    {
      op: "m" as const,
      c: [px(20), py(28)],
    },

    // Parte superior izquierda
    {
      op: "c" as const,
      c: [
        px(18), py(16),
        px(30), py(8),
        px(50), py(10),
      ],
    },

    // Parte superior derecha
    {
      op: "c" as const,
      c: [
        px(70), py(8),
        px(82), py(16),
        px(80), py(28),
      ],
    },

    // Lado derecho de la corona
    {
      op: "c" as const,
      c: [
        px(80), py(42),
        px(73), py(58),
        px(65), py(72),
      ],
    },

    // Raíz derecha
    {
      op: "c" as const,
      c: [
        px(60), py(88),
        px(57), py(108),
        px(54), py(128),
      ],
    },

    // Punta de la raíz
    {
      op: "c" as const,
      c: [
        px(53), py(135),
        px(50), py(138),
        px(47), py(135),
      ],
    },

    // Raíz izquierda
    {
      op: "c" as const,
      c: [
        px(44), py(118),
        px(41), py(94),
        px(35), py(75),
      ],
    },

    // Lado izquierdo de la corona
    {
      op: "c" as const,
      c: [
        px(27), py(60),
        px(19), py(42),
        px(20), py(28),
      ],
    },

    {
      op: "h" as const,
      c: [],
    },
  ];

  // =====================================
  // 1. FONDO BLANCO
  // =====================================

  doc.setFillColor(255, 255, 255);

  doc.path(
    contorno,
    "F"
  );

  // =====================================
  // 2. CARAS INTERNAS
  // =====================================

  /*
   Estas caras están deliberadamente
   dentro del contorno.
  */

  // -------------------------------------
  // CARA SUPERIOR
  // -------------------------------------

  dibujarCara(
    [
      [px(34), py(25)],
      [px(66), py(25)],
      [px(60), py(40)],
      [px(40), py(40)],
    ],
    caras.top
  );

  // -------------------------------------
  // CARA IZQUIERDA
  // -------------------------------------

  dibujarCara(
    [
      [px(27), py(42)],
      [px(40), py(40)],
      [px(40), py(70)],
      [px(30), py(66)],
    ],
    caras.left
  );

  // -------------------------------------
  // CARA CENTRAL
  // -------------------------------------

  dibujarCara(
    [
      [px(40), py(40)],
      [px(60), py(40)],
      [px(60), py(70)],
      [px(40), py(70)],
    ],
    caras.center
  );

  // -------------------------------------
  // CARA DERECHA
  // -------------------------------------

  dibujarCara(
    [
      [px(60), py(40)],
      [px(73), py(43)],
      [px(70), py(66)],
      [px(60), py(70)],
    ],
    caras.right
  );

  // -------------------------------------
  // CARA INFERIOR
  // -------------------------------------

  dibujarCara(
    [
      [px(40), py(70)],
      [px(60), py(70)],
      [px(63), py(83)],
      [px(37), py(83)],
    ],
    caras.bottom
  );

  // =====================================
  // 3. CONTORNO ENCIMA
  // =====================================

  doc.setDrawColor(68, 68, 68);
  doc.setLineWidth(0.45);

  doc.path(
    contorno,
    "S"
  );

  // =====================================
  // 4. NÚMERO FDI
  // =====================================

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.setTextColor(60, 60, 60);

  doc.text(
    String(numero),
    dx + ancho / 2,
    y - 2,
    {
      align: "center",
    }
  );
};
  // =====================================================
  // PRIMERA FILA
  // =====================================================

  dientes
    .slice(0, 16)
    .forEach((diente, index) => {

      dibujarDiente(
        diente,
        inicioX +
          index * espacioDiente,
        inicioY
      );
    });

  // =====================================================
  // SEGUNDA FILA
  // =====================================================

  dientes
    .slice(16, 32)
    .forEach((diente, index) => {

      dibujarDiente(
        diente,
        inicioX +
          index * espacioDiente,
        inicioY + espacioFilas
      );
    });

  // =====================================================
  // DIAGNÓSTICO
  // =====================================================

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);

  doc.text(
    "DIAGNÓSTICO",
    margen,
    175
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  doc.text(
    diagnostico || "Sin diagnóstico",
    margen,
    182
  );

  // =====================================================
  // OBSERVACIONES
  // =====================================================

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);

  doc.text(
    "OBSERVACIONES CLÍNICAS",
    margen,
    195
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  const textoObservaciones =
    observaciones || "Sin observaciones";

  const observacionesLineas =
    doc.splitTextToSize(
      textoObservaciones,
      anchoPagina - margen * 2
    );

  doc.text(
    observacionesLineas,
    margen,
    202
  );

  // =====================================================
  // RESUMEN
  // =====================================================

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);

  doc.text(
    "RESUMEN",
    margen,
    220
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  doc.text(
    `Sanos: ${resumen.sano}`,
    margen,
    228
  );

  doc.text(
    `Caries: ${resumen.caries}`,
    65,
    228
  );

  doc.text(
    `Restaurados: ${resumen.restaurado}`,
    105,
    228
  );

  doc.text(
    `Extraídos: ${resumen.extraido}`,
    160,
    228
  );

  // =====================================================
  // FIRMA
  // =====================================================

  doc.line(
    65,
    260,
    145,
    260
  );

  doc.setFontSize(9);

  doc.text(
    "Firma y sello del médico",
    centroPagina,
    267,
    {
      align: "center",
    }
  );

  // =====================================================
  // GUARDAR
  // =====================================================

  doc.save(
    `odontograma-${paciente.apellidos}.pdf`
  );
};



 const resumen = {
  sano: 0,
  caries: 0,
  restaurado: 0,
  extraido: 0,
};

Object.values(datos).forEach((caras) => {
  Object.values(caras).forEach((estado) => {
    if (estado) {
      resumen[estado]++;
    }
  });
});

  return (
    <div className="min-h-full w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 p-4 md:p-6">



{mensajeGuardado && (
  <div
    className="
      fixed
      top-6
      left-1/2
      -translate-x-1/2
      z-50
      w-[90%]
      max-w-xl
      bg-green-600
      text-white
      rounded-2xl
      shadow-2xl
      px-6
      py-5
      flex
      items-center
      gap-4
      border-2
      border-green-400
    "
  >
    <div
      className="
        flex
        items-center
        justify-center
        w-12
        h-12
        rounded-full
        bg-white
        text-green-600
        text-2xl
        font-bold
        shrink-0
      "
    >
      ✓
    </div>

    <div>
      <p className="text-lg font-bold">
        Odontograma guardado correctamente
      </p>

      <p className="text-sm text-green-100 mt-1">
        Los cambios fueron guardados en el sistema.
      </p>
    </div>
  </div>
)}

      
<div className="mb-6">
  <div className="flex items-center gap-3">
    <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20 flex items-center justify-center">
      <span className="text-lg">🦷</span>
    </div>

    <div>
      <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
        Odontograma Dental
      </h2>

      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
        Registro y seguimiento del estado dental del paciente
      </p>
    </div>
  </div>
</div>




{/* INFORMACIÓN DEL PACIENTE + HISTORIAL */}
<div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-6">

  <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.15fr]">

    {/* INFORMACIÓN DEL PACIENTE */}
    <div className="p-6 md:p-7 border-b xl:border-b-0 xl:border-r border-slate-200 dark:border-slate-800">

    <div className="flex items-center gap-4 mb-6">

  <div className="w-14 h-14 rounded-2xl bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20 flex items-center justify-center shrink-0 shadow-sm">
    <span className="text-lg font-extrabold text-cyan-700 dark:text-cyan-300">
      {paciente.nombres?.charAt(0)}
      {paciente.apellidos?.charAt(0)}
    </span>
  </div>

  <div className="min-w-0">
    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-600 dark:text-cyan-400 mb-1">
      Paciente
    </p>

    <h3 className="text-xl font-extrabold text-slate-900 dark:text-white truncate">
      {paciente.nombres} {paciente.apellidos}
    </h3>

    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
      Ficha odontológica · Información clínica
    </p>
  </div>

</div>

     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

  <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70 p-4 transition-colors">
    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500 mb-1.5">
      DNI
    </p>

    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
      {paciente.dni}
    </p>
  </div>

  <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70 p-4 transition-colors">
    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500 mb-1.5">
      Teléfono
    </p>

    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
      {paciente.telefono}
    </p>
  </div>

  <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70 p-4 transition-colors">
    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500 mb-1.5">
      Estado
    </p>

    <div className="flex items-center gap-2">
      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>

      <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400 truncate">
        {paciente.estado}
      </p>
    </div>
  </div>

  <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70 p-4 transition-colors">
    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500 mb-1.5">
      Médico
    </p>

    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
      Dr. {medico}
    </p>
  </div>

</div>
    </div>


    {/* HISTORIAL ODONTOLÓGICO */}
    <div className="p-6 md:p-7">

      <div className="flex items-center justify-between gap-4 mb-5">

        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 mb-1">
            Seguimiento
          </p>

          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
            Historial odontológico
          </h3>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Registros clínicos anteriores del paciente
          </p>
        </div>

        <button
          onClick={() => setMostrarHistorial(!mostrarHistorial)}
          className="
            shrink-0
            inline-flex
            items-center
            gap-2
            px-3.5
            py-2.5
            rounded-xl
            border
            border-slate-200
            dark:border-slate-700
            bg-slate-50
            dark:bg-slate-800
            text-slate-600
            dark:text-slate-300
            text-xs
            font-bold
            hover:bg-cyan-50
            dark:hover:bg-cyan-500/10
            hover:border-cyan-200
            dark:hover:border-cyan-500/30
            hover:text-cyan-700
            dark:hover:text-cyan-300
            transition-all
            duration-200
            cursor-pointer
          "
        >
          <span>
            {mostrarHistorial ? "Ocultar" : "Ver historial"}
          </span>

          <span className="text-[10px]">
            {mostrarHistorial ? "▲" : "▼"}
          </span>
        </button>

      </div>


      {mostrarHistorial && (

        <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">

          {historial.length === 0 ? (

            <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-7 text-center">

              <div className="w-10 h-10 mx-auto rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center mb-3">
                <span className="text-lg">
                  📋
                </span>
              </div>

              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                No hay odontogramas anteriores
              </p>

              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Los registros históricos aparecerán aquí.
              </p>

            </div>

          ) : (

            historial.map((item) => (

              <div
                key={item.id}
                className="
                  group
                  rounded-2xl
                  border
                  border-slate-200
                  dark:border-slate-700
                  bg-slate-50
                  dark:bg-slate-800/60
                  p-4
                  hover:border-cyan-200
                  dark:hover:border-cyan-500/30
                  hover:bg-white
                  dark:hover:bg-slate-800
                  transition-all
                  duration-200
                "
              >

                <div className="flex items-start justify-between gap-4">

                  <div className="min-w-0">

                    <div className="flex items-center gap-2 mb-2">

                      <span className="w-2 h-2 rounded-full bg-cyan-500 shrink-0"></span>

                      <p className="text-sm font-extrabold text-slate-800 dark:text-white">
                        {new Date(item.created_at).toLocaleDateString()}
                      </p>

                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      <span className="font-bold text-slate-700 dark:text-slate-200">
                        Diagnóstico:
                      </span>{" "}
                      {item.diagnostico || "Sin diagnóstico"}
                    </p>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                      <span className="font-bold text-slate-600 dark:text-slate-300">
                        Observaciones:
                      </span>{" "}
                      {item.observaciones || "Sin observaciones"}
                    </p>

                  </div>

                  <button
                    onClick={() => verOdontogramaHistorico(item)}
                    className="
                      shrink-0
                      px-3
                      py-2
                      rounded-xl
                      bg-white
                      dark:bg-slate-900
                      border
                      border-slate-200
                      dark:border-slate-700
                      text-cyan-700
                      dark:text-cyan-300
                      text-[11px]
                      font-extrabold
                      shadow-sm
                      hover:bg-cyan-50
                      dark:hover:bg-cyan-500/10
                      hover:border-cyan-200
                      dark:hover:border-cyan-500/30
                      transition-all
                      duration-200
                      cursor-pointer
                    "
                  >
                    Ver odontograma
                  </button>

                </div>

              </div>

            ))

          )}

        </div>

      )}

    </div>

  </div>

</div>

<div className="bg-white dark:bg-slate-900 rounded-2xl shadow border border-slate-200 dark:border-slate-700 p-6 mb-6">

  <h3 className="text-lg font-bold mb-6">
    Odontograma
  </h3>

  <div className="grid lg:grid-cols-4 gap-8 items-start">

    {/* Dientes */}
    <div className="lg:col-span-3 flex justify-center">

      <div className="grid grid-cols-8 gap-3">

        {dientes.map((diente) => (
          <Tooth
            key={diente}
            numero={diente}
            estado={datos[diente]}
            onFaceClick={handleFaceClick}
          />
        ))}

      </div>

    </div>

    {/* Leyenda */}
    {/* LEYENDA + RESUMEN */}
<div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/50 p-5">

  {/* Cabecera */}
  <div className="mb-5">
    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-600 dark:text-cyan-400 mb-1">
      Referencia clínica
    </p>

    <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
      Estados dentales
    </h4>

    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
      Identificación visual de cada estado
    </p>
  </div>

  {/* Leyenda */}
  <div className="space-y-2">

    <div className="flex items-center justify-between rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3.5 py-3">
      <div className="flex items-center gap-3">
        <span className="w-3 h-3 rounded-full bg-green-500 ring-4 ring-green-500/10"></span>
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          Sano
        </span>
      </div>
    </div>

    <div className="flex items-center justify-between rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3.5 py-3">
      <div className="flex items-center gap-3">
        <span className="w-3 h-3 rounded-full bg-red-500 ring-4 ring-red-500/10"></span>
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          Caries
        </span>
      </div>
    </div>

    <div className="flex items-center justify-between rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3.5 py-3">
      <div className="flex items-center gap-3">
        <span className="w-3 h-3 rounded-full bg-blue-500 ring-4 ring-blue-500/10"></span>
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          Restaurado
        </span>
      </div>
    </div>

    <div className="flex items-center justify-between rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3.5 py-3">
      <div className="flex items-center gap-3">
        <span className="w-3 h-3 rounded-full bg-gray-600 ring-4 ring-gray-600/10"></span>
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          Extraído
        </span>
      </div>
    </div>

  </div>

  {/* Separador */}
  <div className="my-5 border-t border-slate-200 dark:border-slate-700"></div>

  {/* Resumen */}
  <div>
    <div className="flex items-center justify-between mb-3">
      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
        Resumen clínico
      </h4>

      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        Estado actual
      </span>
    </div>

    <div className="grid grid-cols-2 gap-2">

      <div className="rounded-xl bg-green-50 dark:bg-green-500/10 border border-green-100 dark:border-green-500/20 p-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-green-600 dark:text-green-400">
          Sanos
        </p>
        <p className="text-xl font-extrabold text-green-700 dark:text-green-300 mt-1">
          {resumen.sano}
        </p>
      </div>

      <div className="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 p-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
          Caries
        </p>
        <p className="text-xl font-extrabold text-red-700 dark:text-red-300 mt-1">
          {resumen.caries}
        </p>
      </div>

      <div className="rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 p-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
          Restaurados
        </p>
        <p className="text-xl font-extrabold text-blue-700 dark:text-blue-300 mt-1">
          {resumen.restaurado}
        </p>
      </div>

      <div className="rounded-xl bg-slate-100 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 p-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Extraídos
        </p>
        <p className="text-xl font-extrabold text-slate-700 dark:text-slate-200 mt-1">
          {resumen.extraido}
        </p>
      </div>

    </div>
  </div>

</div>

  </div>

</div>


<div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm p-6 mb-6">

  <div className="flex items-start gap-3 mb-5">

    <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20 flex items-center justify-center shrink-0">
      <span className="text-base">📝</span>
    </div>

    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-600 dark:text-cyan-400 mb-1">
        Registro clínico
      </p>

      <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
        Observaciones clínicas
      </h3>

      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
        Registre hallazgos, procedimientos o información relevante de la consulta.
      </p>
    </div>

  </div>

  <input
    type="text"
    value={observaciones}
    onChange={(e) => setObservaciones(e.target.value)}
    placeholder="Escriba las observaciones clínicas..."
    className="
      w-full
      rounded-2xl
      border
      border-slate-200
      dark:border-slate-700
      bg-slate-50
      dark:bg-slate-800/70
      px-4
      py-3.5
      text-sm
      text-slate-800
      dark:text-slate-200
      placeholder:text-slate-400
      dark:placeholder:text-slate-500
      outline-none
      transition-all
      duration-200
      focus:border-cyan-400
      dark:focus:border-cyan-500
      focus:ring-4
      focus:ring-cyan-500/10
    "
  />

</div>


<div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm p-6 mb-6">

  <div className="flex items-start gap-3 mb-5">

    <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 flex items-center justify-center shrink-0">
      <span className="text-base">🩺</span>
    </div>

    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-violet-600 dark:text-violet-400 mb-1">
        Evaluación clínica
      </p>

      <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
        Diagnóstico
      </h3>

      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
        Registre el diagnóstico clínico asociado a la evaluación odontológica.
      </p>
    </div>

  </div>

  <input
    type="text"
    value={diagnostico}
    onChange={(e) => setDiagnostico(e.target.value)}
    placeholder="Ingrese el diagnóstico clínico..."
    className="
      w-full
      rounded-2xl
      border
      border-slate-200
      dark:border-slate-700
      bg-slate-50
      dark:bg-slate-800/70
      px-4
      py-3.5
      text-sm
      text-slate-800
      dark:text-slate-200
      placeholder:text-slate-400
      dark:placeholder:text-slate-500
      outline-none
      transition-all
      duration-200
      focus:border-violet-400
      dark:focus:border-violet-500
      focus:ring-4
      focus:ring-violet-500/10
    "
  />

</div>


      {selected && (
        <div
  style={{
    position: "fixed",
    top: pos.y,
    left: pos.x,
  }}
  className="
    bg-white
    dark:bg-slate-900
    text-slate-900
    dark:text-white
    border
    border-slate-300
    dark:border-slate-700
    shadow-2xl
    rounded-xl
    p-4
    z-50
    w-52
    transition-all
duration-200
  "
>
          <p className="font-bold text-slate-900 dark:text-white mb-3">
  Diente {selected.numero} - Cara {selected.face}
</p>

          <button
  className="w-full mb-2 p-2 rounded bg-green-500 hover:bg-green-600 text-white"
  onClick={() => guardarEstado("sano")}
>
  Sano
</button>

<button
  className="w-full mb-2 p-2 rounded bg-red-500 hover:bg-red-600 text-white"
  onClick={() => guardarEstado("caries")}
>
  Caries
</button>

<button
  className="w-full mb-2 p-2 rounded bg-blue-500 hover:bg-blue-600 text-white"
  onClick={() => guardarEstado("restaurado")}
>
  Restaurado
</button>

<button
  className="w-full p-2 rounded bg-gray-600 hover:bg-gray-700 text-white"
  onClick={() => guardarEstado("extraido")}
>
  Extraído
</button>
<button
  className="w-full mt-3 p-2 rounded bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600"
  onClick={() => setSelected(null)}
>
Cerrar
</button>

         
        </div>
      )}


{/* VENTANA ODONTOGRAMA HISTÓRICO */}
{odontogramaHistorico && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    
    <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 shadow-2xl p-6">
      
      {/* CABECERA */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-white">
            Odontograma histórico
          </h3>

          <p className="text-sm text-slate-500 mt-1">
            Fecha:{" "}
            {new Date(
              odontogramaHistorico.created_at
            ).toLocaleDateString("es-PE")}
          </p>
        </div>

        <button
          onClick={() => setOdontogramaHistorico(null)}
          className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600"
        >
          ✕ Cerrar
        </button>
      </div>

      {/* DIENTES HISTÓRICOS */}
      <div className="grid grid-cols-8 gap-3 mb-6">
        {dientes.map((diente) => (
          <Tooth
            key={diente}
            numero={diente}
            estado={odontogramaHistorico.datos?.[diente]}
            onFaceClick={() => {}}
          />
        ))}
      </div>

      {/* INFORMACIÓN HISTÓRICA */}
      <div className="grid md:grid-cols-2 gap-4">

        <div className="rounded-xl border p-4 bg-slate-50 dark:bg-slate-800">
          <h4 className="font-bold mb-2">
            Observaciones clínicas
          </h4>

          <p className="text-slate-600 dark:text-slate-300">
            {odontogramaHistorico.observaciones || "Sin observaciones"}
          </p>
        </div>

        <div className="rounded-xl border p-4 bg-slate-50 dark:bg-slate-800">
          <h4 className="font-bold mb-2">
            Diagnóstico
          </h4>

          <p className="text-slate-600 dark:text-slate-300">
            {odontogramaHistorico.diagnostico || "Sin diagnóstico"}
          </p>
        </div>

      </div>

    </div>
  </div>
)}

{/* BOTONES */}

<div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">

  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

    {/* Texto de apoyo */}
    <div>
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
        
      </p>

      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
        
      </p>
    </div>

    {/* Acciones */}
    <div className="flex flex-col sm:flex-row gap-3">

      <button
        onClick={exportarPDF}
        className="
          inline-flex
          items-center
          justify-center
          gap-2
          px-5
          py-3
          rounded-xl
          border
          border-slate-200
          dark:border-slate-700
          bg-white
          dark:bg-slate-800
          hover:bg-slate-50
          dark:hover:bg-slate-700
          text-slate-700
          dark:text-slate-200
          font-semibold
          text-sm
          shadow-sm
          hover:shadow
          transition-all
          duration-200
        "
      >
        <span>📄</span>
        Exportar PDF
      </button>

      <button
        onClick={guardarOdontograma}
        className="
          inline-flex
          items-center
          justify-center
          gap-2
          px-6
          py-3
          rounded-xl
          bg-cyan-600
          hover:bg-cyan-700
          dark:bg-cyan-500
          dark:hover:bg-cyan-400
          text-white
          dark:text-slate-950
          font-bold
          text-sm
          shadow-sm
          hover:shadow-md
          transition-all
          duration-200
        "
      >
        <span>💾</span>
        Guardar odontograma
      </button>

    </div>

  </div>

</div>
</div>
)}
