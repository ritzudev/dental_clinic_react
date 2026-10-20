

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


type Denticion = "temporal" | "mixta" | "permanente";

type GrupoDientes = {
  id: string;
  nombre: string;
  dientes: number[];
};

const dientesPermanentes = [
  18, 17, 16, 15, 14, 13, 12, 11,
  21, 22, 23, 24, 25, 26, 27, 28,
  48, 47, 46, 45, 44, 43, 42, 41,
  31, 32, 33, 34, 35, 36, 37, 38,
];

// Dentición temporal según la nomenclatura FDI.
const dientesTemporales = [
  55, 54, 53, 52, 51,
  61, 62, 63, 64, 65,
  85, 84, 83, 82, 81,
  71, 72, 73, 74, 75,
];

// Orden de lectura por cuadrante. En dentición mixta se muestran
// únicamente los dientes que el profesional marque como presentes.
const ordenDientesMixtos = [
  18, 17, 16, 15, 14, 13, 12, 11, 55, 54, 53, 52, 51,
  61, 62, 63, 64, 65, 21, 22, 23, 24, 25, 26, 27, 28,
  48, 47, 46, 45, 44, 43, 42, 41, 85, 84, 83, 82, 81,
  71, 72, 73, 74, 75, 31, 32, 33, 34, 35, 36, 37, 38,
];

const gruposDisponibles: GrupoDientes[] = [
  { id: "superior-derecho", nombre: "Superior derecho", dientes: [18,17,16,15,14,13,12,11,55,54,53,52,51] },
  { id: "superior-izquierdo", nombre: "Superior izquierdo", dientes: [61,62,63,64,65,21,22,23,24,25,26,27,28] },
  { id: "inferior-derecho", nombre: "Inferior derecho", dientes: [48,47,46,45,44,43,42,41,85,84,83,82,81] },
  { id: "inferior-izquierdo", nombre: "Inferior izquierdo", dientes: [71,72,73,74,75,31,32,33,34,35,36,37,38] },
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
const [denticion, setDenticion] = useState<Denticion>("permanente");
const [denticionSugerida, setDenticionSugerida] = useState<Denticion>("permanente");
const [edadPaciente, setEdadPaciente] = useState<number | null>(null);
const [dientesMixtos, setDientesMixtos] = useState<number[]>([]);

const gruposDientesActivos: GrupoDientes[] = gruposDisponibles.map((grupo) => {
  let permitidos: number[] = [];

  if (denticion === "permanente") {
    permitidos = dientesPermanentes;
  } else if (denticion === "temporal") {
    permitidos = dientesTemporales;
  } else {
    permitidos = dientesMixtos;
  }

  return {
    ...grupo,
    dientes: grupo.dientes.filter((numero) => permitidos.includes(numero)),
  };
});

const dientesActivos = gruposDientesActivos.flatMap((grupo) => grupo.dientes);

const alternarDienteMixto = (numero: number) => {
  setDientesMixtos((actuales) => {
    if (actuales.includes(numero)) {
      return actuales.filter((diente) => diente !== numero);
    }
    return ordenDientesMixtos.filter((diente) => actuales.includes(diente) || diente === numero);
  });
};

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
}, [citaId, paciente.id]);



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
  if (!citaId || !paciente.id) return;

  // La fecha de nacimiento ya pertenece a la tabla pacientes.
  // Solo la consultamos; no se modifica ninguna tabla ni columna.
  let edadCalculada: number | null = null;
  let sugerencia: Denticion = "permanente";

  const { data: datosPaciente, error: errorPaciente } = await supabase
    .from("pacientes")
    .select("fecha_nacimiento")
    .eq("id", paciente.id)
    .maybeSingle();

  if (errorPaciente) {
    console.warn("No se pudo consultar la fecha de nacimiento para sugerir la dentición:", errorPaciente.message);
  }

  if (datosPaciente?.fecha_nacimiento) {
    const nacimiento = new Date(`${datosPaciente.fecha_nacimiento}T00:00:00`);
    if (!Number.isNaN(nacimiento.getTime())) {
      const hoy = new Date();
      edadCalculada = hoy.getFullYear() - nacimiento.getFullYear();
      const aunNoCumple =
        hoy.getMonth() < nacimiento.getMonth() ||
        (hoy.getMonth() === nacimiento.getMonth() && hoy.getDate() < nacimiento.getDate());
      if (aunNoCumple) edadCalculada -= 1;
      if (edadCalculada < 0) edadCalculada = null;
    }
  }

  // Es una sugerencia orientativa, no un diagnóstico dental automático.
  if (edadCalculada !== null) {
    sugerencia = edadCalculada <= 5 ? "temporal" : edadCalculada <= 12 ? "mixta" : "permanente";
  }
  setEdadPaciente(edadCalculada);
  setDenticionSugerida(sugerencia);

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
    // Evita mostrar datos de la cita anterior cuando se abre una cita nueva.
    setDatos({});
    setObservaciones("");
    setDiagnostico("");
    setDenticion(sugerencia);
    setDientesMixtos([]);
    return;
  }

  console.log("ODONTOGRAMA CARGADO:", data);

  const datosGuardados = data.datos || {};
  const meta = datosGuardados._meta;
  const datosDentales = { ...datosGuardados };
  delete datosDentales._meta;

  setDatos(datosDentales as Record<number, Caras>);
  setObservaciones(data.observaciones || "");
  setDiagnostico(data.diagnostico || "");

  const numerosDentalesGuardados = Object.keys(datosDentales)
    .map(Number)
    .filter((numero) => ordenDientesMixtos.includes(numero));
  const hayTemporales = numerosDentalesGuardados.some((numero) => dientesTemporales.includes(numero));
  const hayPermanentes = numerosDentalesGuardados.some((numero) => dientesPermanentes.includes(numero));

  // Los odontogramas antiguos no tienen metadatos de dentición. Inferimos
  // la vista a partir de las piezas guardadas para no ocultar registros previos.
  const denticionAntiguaInferida: Denticion = hayTemporales && hayPermanentes
    ? "mixta"
    : hayTemporales
      ? "temporal"
      : hayPermanentes
        ? "permanente"
        : sugerencia;

  const denticionGuardada = meta?.denticion;
  const denticionFinal: Denticion =
    denticionGuardada === "temporal" || denticionGuardada === "mixta" || denticionGuardada === "permanente"
      ? denticionGuardada
      : denticionAntiguaInferida;
  setDenticion(denticionFinal);

  const dientesMixtosGuardados = Array.isArray(meta?.dientesMixtos)
    ? meta.dientesMixtos.filter((numero: number) => ordenDientesMixtos.includes(numero))
    : numerosDentalesGuardados;

  setDientesMixtos(ordenDientesMixtos.filter((numero) => dientesMixtosGuardados.includes(numero)));
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
          // La tabla y sus columnas no cambian: la dentición se guarda como
          // metadato dentro del JSON existente de la columna "datos".
          datos: {
            ...datos,
            _meta: {
              denticion,
              dientesMixtos: ordenDientesMixtos.filter((numero) => dientesMixtos.includes(numero)),
            },
          },
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

  // =====================================================
  // CONFIGURACIÓN GENERAL
  // =====================================================

  const W = 210;
  const H = 297;
  const margen = 15;
  const centro = W / 2;

  const C = {
    cyan: [8, 145, 178],
    cyanDark: [14, 116, 144],

    texto: [15, 23, 42],
    texto2: [51, 65, 85],
    texto3: [100, 116, 139],

    borde: [226, 232, 240],
    fondo: [248, 250, 252],
    fondoAzul: [239, 246, 255],

    sano: [34, 197, 94],
    caries: [239, 68, 68],
    restaurado: [59, 130, 246],
    extraido: [100, 116, 139],
  };

  // =====================================================
  // COLOR SEGÚN ESTADO
  // =====================================================

 const obtenerColorEstado = (
  estado?: Estado
): [number, number, number] => {
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
  // =====================================================
  // FONDO
  // =====================================================

  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, W, H, "F");

  // =====================================================
  // LOGO SIMPLE DE LA CLÍNICA
  // =====================================================

  // Diente estilizado del logo
  doc.setDrawColor(
    C.cyan[0],
    C.cyan[1],
    C.cyan[2]
  );

  doc.setLineWidth(0.9);

  const lx = margen + 5;
  const ly = 11;

  doc.line(lx - 3, ly + 1, lx - 2, ly + 8);
  doc.line(lx - 2, ly + 8, lx, ly + 13);
  doc.line(lx, ly + 13, lx + 2, ly + 8);
  doc.line(lx + 2, ly + 8, lx + 3, ly + 1);

  doc.line(lx - 3, ly + 1, lx - 1, ly);
  doc.line(lx - 1, ly, lx, ly + 2);
  doc.line(lx, ly + 2, lx + 1, ly);
  doc.line(lx + 1, ly, lx + 3, ly + 1);

  // =====================================================
  // NOMBRE DE LA CLÍNICA
  // =====================================================

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);

  doc.setTextColor(
    C.cyanDark[0],
    C.cyanDark[1],
    C.cyanDark[2]
  );

  doc.text(
    "VILLA 920 DENTAL",
    margen + 12,
    14
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);

  doc.setTextColor(
    C.texto3[0],
    C.texto3[1],
    C.texto3[2]
  );

  doc.text(
    "SALUD · ESTÉTICA · BIENESTAR",
    margen + 12,
    19
  );

  // =====================================================
  // DATOS DE LA CLÍNICA — DERECHA
  // =====================================================

  doc.setFontSize(6.2);

  doc.text(
    "Av. Javier Prado Este 996 - Of. 901 - San Isidro - Lima, 051",
    W - margen,
    10,
    { align: "right" }
  );

  doc.text(
    "Teléfono: +51 ____________________",
    W - margen,
    15,
    { align: "right" }
  );

  doc.text(
    "Documento clínico odontológico",
    W - margen,
    20,
    { align: "right" }
  );

  // =====================================================
  // LÍNEA SUPERIOR
  // =====================================================

  doc.setDrawColor(
    C.cyan[0],
    C.cyan[1],
    C.cyan[2]
  );

  doc.setLineWidth(0.8);

  doc.line(
    margen,
    25,
    W - margen,
    25
  );

  // =====================================================
  // TÍTULO PRINCIPAL
  // =====================================================

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);

  doc.setTextColor(
    C.texto[0],
    C.texto[1],
    C.texto[2]
  );

  doc.text(
    "ODONTOGRAMA CLÍNICO",
    centro,
    37,
    { align: "center" }
  );

  // =====================================================
  // TARJETA DEL PACIENTE
  // =====================================================

  doc.setFillColor(
    C.fondoAzul[0],
    C.fondoAzul[1],
    C.fondoAzul[2]
  );

  doc.setDrawColor(
    C.borde[0],
    C.borde[1],
    C.borde[2]
  );

  doc.setLineWidth(0.35);

  doc.roundedRect(
    margen,
    42,
    W - margen * 2,
    23,
    3,
    3,
    "FD"
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);

  doc.setTextColor(
    C.cyanDark[0],
    C.cyanDark[1],
    C.cyanDark[2]
  );

  doc.text(
    "PACIENTE",
    margen + 5,
    48
  );

  doc.text(
    "DNI",
    margen + 5,
    57
  );

  doc.text(
    "MÉDICO",
    100,
    48
  );

  doc.text(
    "FECHA",
    100,
    57
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);

  doc.setTextColor(
    C.texto[0],
    C.texto[1],
    C.texto[2]
  );

  doc.text(
    `${paciente.nombres} ${paciente.apellidos}`,
    margen + 25,
    48
  );

  doc.text(
    paciente.dni || "—",
    margen + 25,
    57
  );

  doc.text(
    `Dr. ${medico}`,
    125,
    48
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  doc.text(
    new Date().toLocaleDateString("es-PE"),
    125,
    57
  );

  // =====================================================
  // TÍTULO ODONTOGRAMA
  // =====================================================

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);

  doc.setTextColor(
    C.texto[0],
    C.texto[1],
    C.texto[2]
  );

  doc.text(
    "ODONTOGRAMA",
    centro,
    75,
    { align: "center" }
  );

  // =====================================================
  // TIPO DE DIENTE
  // =====================================================

  const obtenerTipoDiente = (
    numero: number
  ): "incisivo" | "canino" | "premolar" | "molar" => {

    const n = numero % 10;

    if (n === 1 || n === 2) {
      return "incisivo";
    }

    if (n === 3) {
      return "canino";
    }

    // En dentición temporal (FDI 5–8), las posiciones 4 y 5 son molares.
    const esTemporal = Math.floor(numero / 10) >= 5;
    if (!esTemporal && (n === 4 || n === 5)) {
      return "premolar";
    }

    return "molar";
  };

  // =====================================================
  // DIBUJAR CARA
  // =====================================================

  const dibujarCara = (
    puntos: [number, number][],
    estado?: Estado
  ) => {

    const color = obtenerColorEstado(estado);

    // Relleno
    doc.setFillColor(
      color[0],
      color[1],
      color[2]
    );

    doc.setDrawColor(
      71,
      85,
      105
    );

    doc.setLineWidth(0.28);

    // Dos triángulos para rellenar el cuadrilátero
    doc.triangle(
      puntos[0][0],
      puntos[0][1],
      puntos[1][0],
      puntos[1][1],
      puntos[2][0],
      puntos[2][1],
      "F"
    );

    doc.triangle(
      puntos[0][0],
      puntos[0][1],
      puntos[2][0],
      puntos[2][1],
      puntos[3][0],
      puntos[3][1],
      "F"
    );

    // Bordes
    for (let i = 0; i < 4; i++) {

      const actual = puntos[i];
      const siguiente = puntos[(i + 1) % 4];

      doc.line(
        actual[0],
        actual[1],
        siguiente[0],
        siguiente[1]
      );
    }
  };

  // =====================================================
  // DIBUJAR DIENTE
  // =====================================================

  const dibujarDiente = (
    numero: number,
    cx: number,
    y: number
  ) => {

    const caras = datos[numero] || {};

    const tipo = obtenerTipoDiente(numero);

    // ---------------------------------------------------
    // DIMENSIONES
    // ---------------------------------------------------

    let ancho = 10;
    let corona = 10;
    let raiz = 10;

    if (tipo === "incisivo") {
      ancho = 8;
      corona = 9;
      raiz = 11;
    }

    if (tipo === "canino") {
      ancho = 9;
      corona = 9;
      raiz = 12;
    }

    if (tipo === "premolar") {
      ancho = 10;
      corona = 10;
      raiz = 10;
    }

    if (tipo === "molar") {
      ancho = 11;
      corona = 11;
      raiz = 8;
    }

    const x1 = cx - ancho / 2;
    const x2 = cx + ancho / 2;

    // ---------------------------------------------------
    // CONTORNO CORONA
    // ---------------------------------------------------

    const coronaY = y;

    const puntosCorona: [number, number][] = [
      [x1 + 1, coronaY + 1],
      [x1 + ancho * 0.28, coronaY],
      [cx, coronaY + 0.7],
      [x2 - ancho * 0.28, coronaY],
      [x2 - 1, coronaY + 1],
      [x2, coronaY + 3],
      [x2 - 0.8, coronaY + corona - 1],
      [cx, coronaY + corona],
      [x1 + 0.8, coronaY + corona - 1],
      [x1, coronaY + 3],
    ];

    // ---------------------------------------------------
    // FONDO BLANCO
    // ---------------------------------------------------

    doc.setFillColor(
      255,
      255,
      255
    );

    doc.setDrawColor(
      71,
      85,
      105
    );

    doc.setLineWidth(0.45);

    for (
      let i = 1;
      i < puntosCorona.length - 1;
      i++
    ) {

      doc.triangle(
        puntosCorona[0][0],
        puntosCorona[0][1],

        puntosCorona[i][0],
        puntosCorona[i][1],

        puntosCorona[i + 1][0],
        puntosCorona[i + 1][1],

        "F"
      );
    }

    // ---------------------------------------------------
    // COORDENADAS INTERNAS
    // ---------------------------------------------------

    const yTop = coronaY + 2.5;
    const yMiddle = coronaY + corona * 0.48;
    const yBottom = coronaY + corona * 0.76;

    const xi = cx - ancho * 0.25;
    const xd = cx + ancho * 0.25;

    // ---------------------------------------------------
    // CARA SUPERIOR
    // ---------------------------------------------------

    dibujarCara(
      [
        [x1 + 1.3, yTop],
        [x2 - 1.3, yTop],
        [xd, yMiddle],
        [xi, yMiddle],
      ],
      caras.top
    );

    // ---------------------------------------------------
    // CARA IZQUIERDA
    // ---------------------------------------------------

    dibujarCara(
      [
        [x1 + 0.8, yMiddle],
        [xi, yMiddle],
        [xi, yBottom],
        [x1 + 0.8, yBottom - 0.5],
      ],
      caras.left
    );

    // ---------------------------------------------------
    // CARA CENTRAL
    // ---------------------------------------------------

    dibujarCara(
      [
        [xi, yMiddle],
        [xd, yMiddle],
        [xd, yBottom],
        [xi, yBottom],
      ],
      caras.center
    );

    // ---------------------------------------------------
    // CARA DERECHA
    // ---------------------------------------------------

    dibujarCara(
      [
        [xd, yMiddle],
        [x2 - 0.8, yMiddle + 0.2],
        [x2 - 0.8, yBottom - 0.5],
        [xd, yBottom],
      ],
      caras.right
    );

    // ---------------------------------------------------
    // CARA INFERIOR
    // ---------------------------------------------------

    dibujarCara(
      [
        [xi, yBottom],
        [xd, yBottom],
        [x2 - 1.2, coronaY + corona - 1],
        [x1 + 1.2, coronaY + corona - 1],
      ],
      caras.bottom
    );

    // ---------------------------------------------------
    // RAÍZ
    // ---------------------------------------------------

    doc.setFillColor(
      255,
      255,
      255
    );

    doc.setDrawColor(
      71,
      85,
      105
    );

    doc.setLineWidth(0.4);

    if (tipo === "molar") {

      // Raíz izquierda
      doc.triangle(
        cx - 3,
        coronaY + corona,
        cx - 0.3,
        coronaY + corona,
        cx - 1.8,
        coronaY + corona + raiz,
        "F"
      );

      // Raíz derecha
      doc.triangle(
        cx + 0.3,
        coronaY + corona,
        cx + 3,
        coronaY + corona,
        cx + 1.8,
        coronaY + corona + raiz,
        "F"
      );

      doc.line(
        cx - 3,
        coronaY + corona,
        cx - 1.8,
        coronaY + corona + raiz
      );

      doc.line(
        cx - 0.3,
        coronaY + corona,
        cx - 1.8,
        coronaY + corona + raiz
      );

      doc.line(
        cx + 0.3,
        coronaY + corona,
        cx + 1.8,
        coronaY + corona + raiz
      );

      doc.line(
        cx + 3,
        coronaY + corona,
        cx + 1.8,
        coronaY + corona + raiz
      );

    } else {

      doc.triangle(
        cx - ancho * 0.22,
        coronaY + corona,
        cx + ancho * 0.22,
        coronaY + corona,
        cx,
        coronaY + corona + raiz,
        "F"
      );

      doc.line(
        cx - ancho * 0.22,
        coronaY + corona,
        cx,
        coronaY + corona + raiz
      );

      doc.line(
        cx + ancho * 0.22,
        coronaY + corona,
        cx,
        coronaY + corona + raiz
      );
    }

    // ---------------------------------------------------
    // CONTORNO DE LA CORONA
    // ---------------------------------------------------

    doc.setDrawColor(
      71,
      85,
      105
    );

    doc.setLineWidth(0.45);

    for (
      let i = 0;
      i < puntosCorona.length;
      i++
    ) {

      const actual = puntosCorona[i];
      const siguiente =
        puntosCorona[(i + 1) % puntosCorona.length];

      doc.line(
        actual[0],
        actual[1],
        siguiente[0],
        siguiente[1]
      );
    }

    // ---------------------------------------------------
    // DIENTE EXTRAÍDO
    // ---------------------------------------------------

    const estaExtraido =
      Object.values(caras).some(
        (estado) =>
          estado === "extraido"
      );

    if (estaExtraido) {

      doc.setDrawColor(
        71,
        85,
        105
      );

      doc.setLineWidth(0.8);

      doc.line(
        x1 - 0.8,
        coronaY - 0.5,
        x2 + 0.8,
        coronaY + corona + raiz
      );

      doc.line(
        x2 + 0.8,
        coronaY - 0.5,
        x1 - 0.8,
        coronaY + corona + raiz
      );
    }

    // ---------------------------------------------------
    // NÚMERO FDI
    // ---------------------------------------------------

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(6.2);

    doc.setTextColor(
      30,
      64,
      175
    );

    doc.text(
      String(numero),
      cx,
      coronaY - 2.5,
      {
        align: "center",
      }
    );
  };

  // =====================================================
  // POSICIÓN DE LAS 4 FILAS
  // =====================================================

  // Las cuatro filas del PDF corresponden a los cuatro cuadrantes.
  // El espaciado se adapta para que la dentición mixta quepa en la página.
  const posicionesY = [84, 111, 138, 165];

  gruposDientesActivos.forEach((grupo, fila) => {
    const cantidad = grupo.dientes.length;
    if (cantidad === 0) return;

    const espacioFila = cantidad > 8 ? 12 : 13;
    const inicioFila = centro - (espacioFila * (cantidad - 1)) / 2;

    grupo.dientes.forEach((diente, index) => {
      dibujarDiente(
        diente,
        inicioFila + index * espacioFila,
        posicionesY[fila]
      );
    });
  });

  // =====================================================
  // LEYENDA CLÍNICA
  // =====================================================

  doc.setFillColor(
    C.fondoAzul[0],
    C.fondoAzul[1],
    C.fondoAzul[2]
  );

  doc.setDrawColor(
    C.borde[0],
    C.borde[1],
    C.borde[2]
  );

  doc.roundedRect(
    margen,
    193,
    W - margen * 2,
    13,
    2.5,
    2.5,
    "FD"
  );

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(7);

  doc.setTextColor(
    C.texto[0],
    C.texto[1],
    C.texto[2]
  );

  doc.text(
    "LEYENDA CLÍNICA",
    margen + 5,
    201
  );

  const leyenda = [
    {
      nombre: "Sano",
      color: C.sano,
      x: 64,
    },
    {
      nombre: "Caries",
      color: C.caries,
      x: 100,
    },
    {
      nombre: "Restaurado",
      color: C.restaurado,
      x: 137,
    },
    {
      nombre: "Extraído",
      color: C.extraido,
      x: 176,
    },
  ];

  leyenda.forEach((item) => {

    doc.setFillColor(
      item.color[0],
      item.color[1],
      item.color[2]
    );

    doc.setDrawColor(
      203,
      213,
      225
    );

    doc.roundedRect(
      item.x,
      197.5,
      5,
      5,
      1,
      1,
      "FD"
    );

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(8);

    doc.setTextColor(
      C.texto2[0],
      C.texto2[1],
      C.texto2[2]
    );

    doc.text(
      item.nombre,
      item.x + 8,
      201.5
    );
  });

  // =====================================================
  // DIAGNÓSTICO Y OBSERVACIONES
  // =====================================================

  const anchoCaja =
    (W - margen * 2 - 4) / 2;

  // -----------------------------------------------------
  // DIAGNÓSTICO
  // -----------------------------------------------------

  doc.setFillColor(
  C.fondo[0],
  C.fondo[1],
  C.fondo[2]
);

doc.setDrawColor(
  C.borde[0],
  C.borde[1],
  C.borde[2]
);

  doc.roundedRect(
    margen,
    211,
    anchoCaja,
    22,
    2.5,
    2.5,
    "FD"
  );

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(7);

  doc.setTextColor(
    C.cyanDark[0],
    C.cyanDark[1],
    C.cyanDark[2]
  );

  doc.text(
    "DIAGNÓSTICO",
    margen + 5,
    218
  );

  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.setFontSize(6.8);

  doc.setTextColor(
    C.texto2[0],
    C.texto2[1],
    C.texto2[2]
  );

  const diagnosticoTexto =
    diagnostico || "Sin diagnóstico";

  const diagnosticoLineas =
    doc.splitTextToSize(
      diagnosticoTexto,
      anchoCaja - 10
    );

  doc.text(
    diagnosticoLineas.slice(0, 2),
    margen + 5,
    224
  );

  // -----------------------------------------------------
  // OBSERVACIONES
  // -----------------------------------------------------

  const xObservaciones =
    margen + anchoCaja + 4;
doc.setFillColor(
  C.fondo[0],
  C.fondo[1],
  C.fondo[2]
);

doc.setDrawColor(
  C.borde[0],
  C.borde[1],
  C.borde[2]
);

  doc.roundedRect(
    xObservaciones,
    211,
    anchoCaja,
    22,
    2.5,
    2.5,
    "FD"
  );

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(7);

  doc.setTextColor(
    C.cyanDark[0],
    C.cyanDark[1],
    C.cyanDark[2]
  );

  doc.text(
    "OBSERVACIONES CLÍNICAS",
    xObservaciones + 5,
    218
  );

  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.setFontSize(6.8);

  doc.setTextColor(
    C.texto2[0],
    C.texto2[1],
    C.texto2[2]
  );

  const observacionesTexto =
    observaciones ||
    "Sin observaciones clínicas.";

  const observacionesLineas =
    doc.splitTextToSize(
      observacionesTexto,
      anchoCaja - 10
    );

  doc.text(
    observacionesLineas.slice(0, 2),
    xObservaciones + 5,
    224
  );

  // =====================================================
  // RESUMEN ODONTOLÓGICO
  // =====================================================

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(8);

  doc.setTextColor(
    C.cyanDark[0],
    C.cyanDark[1],
    C.cyanDark[2]
  );

  doc.text(
    "RESUMEN ODONTOLÓGICO",
    margen,
    241
  );

  // =====================================================
  // ICONO DE DIENTE PARA RESUMEN
  // =====================================================

 // =====================================================
// ICONO DE DIENTE PEQUEÑO PARA RESUMEN
// =====================================================

const dibujarIconoDiente = (
  x: number,
  y: number,
  color: [number, number, number]
) => {

  doc.setFillColor(
    color[0],
    color[1],
    color[2]
  );

  // Corona pequeña
  doc.roundedRect(
    x - 3,
    y - 4.5,
    6,
    7,
    1.8,
    1.8,
    "F"
  );

  // Raíz izquierda
  doc.triangle(
    x - 2.7,
    y + 1.5,
    x - 0.3,
    y + 1.5,
    x - 1.5,
    y + 7,
    "F"
  );

  // Raíz derecha
  doc.triangle(
    x + 0.3,
    y + 1.5,
    x + 2.7,
    y + 1.5,
    x + 1.5,
    y + 7,
    "F"
  );

  // Brillo pequeño
  doc.setFillColor(
    255,
    255,
    255
  );

  doc.roundedRect(
    x + 0.8,
    y - 3.2,
    0.9,
    2.2,
    0.4,
    0.4,
    "F"
  );
};
  // =====================================================
  // TARJETAS RESUMEN
  // =====================================================

  const dibujarTarjetaResumen = (
    x: number,
    titulo: string,
    valor: number,
    color: number[]
  ) => {

    const ancho = 43;
    const alto = 20;

    // Fondo suave del color
    const fondoColor = [
      Math.min(255, color[0] + 205),
      Math.min(255, color[1] + 205),
      Math.min(255, color[2] + 205),
    ];

    doc.setFillColor(
      fondoColor[0],
      fondoColor[1],
      fondoColor[2]
    );

    doc.setDrawColor(
      color[0],
      color[1],
      color[2]
    );

    doc.setLineWidth(0.25);

    doc.roundedRect(
      x,
      245,
      ancho,
      alto,
      2.5,
      2.5,
      "FD"
    );

    // Icono
    dibujarIconoDiente(
      x + 8,
      254,
      color as [number, number, number]
    );

    // Título
    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(5.8);

    doc.setTextColor(
      C.texto2[0],
      C.texto2[1],
      C.texto2[2]
    );

    doc.text(
      titulo,
      x + 15,
      251.5
    );

    // Número
    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(11);

    doc.setTextColor(
      color[0],
      color[1],
      color[2]
    );

    doc.text(
      String(valor),
      x + 15,
      260
    );
  };

  dibujarTarjetaResumen(
    margen,
    "Sanos",
    resumen.sano,
    C.sano
  );

  dibujarTarjetaResumen(
    margen + 44,
    "Caries",
    resumen.caries,
    C.caries
  );

  dibujarTarjetaResumen(
    margen + 88,
    "Restaurados",
    resumen.restaurado,
    C.restaurado
  );

  dibujarTarjetaResumen(
    margen + 132,
    "Extraídos",
    resumen.extraido,
    C.extraido
  );

  // =====================================================
  // FIRMA
  // =====================================================

  doc.setDrawColor(
    100,
    116,
    139
  );

  doc.setLineWidth(0.35);

  doc.line(
    65,
    276,
    145,
    276
  );

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(7.5);

  doc.setTextColor(
    C.texto2[0],
    C.texto2[1],
    C.texto2[2]
  );

  doc.text(
    `Dr. ${medico}`,
    centro,
    282,
    {
      align: "center",
    }
  );

  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.setFontSize(6.3);

  doc.text(
    "Firma y sello del médico",
    centro,
    287,
    {
      align: "center",
    }
  );

  // =====================================================
  // PIE DE DOCUMENTO
  // =====================================================

  doc.setDrawColor(
    C.borde[0],
    C.borde[1],
    C.borde[2]
  );

  doc.setLineWidth(0.25);

  doc.line(
    margen,
    291,
    W - margen,
    291
  );

  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.setFontSize(5.5);

  doc.setTextColor(
    C.texto3[0],
    C.texto3[1],
    C.texto3[2]
  );

  doc.text(
    "VILLA 920 DENTAL · Documento clínico odontológico",
    centro,
    295,
    {
      align: "center",
    }
  );

  // =====================================================
  // GUARDAR PDF
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

// El resumen cuenta dientes únicos por estado, no cada cara dental.
dientesActivos.forEach((numero) => {
  const caras = datos[numero];
  if (!caras) return;

  const estados = Object.values(caras);
  (Object.keys(resumen) as Array<keyof typeof resumen>).forEach((estado) => {
    if (estados.includes(estado as Estado)) {
      resumen[estado] += 1;
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

  <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-600 dark:text-cyan-400 mb-1">
        Odontograma inteligente
      </p>
      <h3 className="text-lg font-extrabold mb-1">Dentición del paciente</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        {edadPaciente === null
          ? "Seleccionamos una vista inicial; confirma que coincida con la boca del paciente."
          : `Edad: ${edadPaciente} ${edadPaciente === 1 ? "año" : "años"}. Sugerencia por edad: ${denticionSugerida === "temporal" ? "temporal" : denticionSugerida === "mixta" ? "mixta" : "permanente"}. Confirma según la evaluación clínica.`}
      </p>
    </div>
    <div className="w-full sm:w-64">
      <label htmlFor="denticion-paciente" className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">
        Ajustar dentición si es necesario
      </label>
      <select
        id="denticion-paciente"
        value={denticion}
        onChange={(e) => setDenticion(e.target.value as Denticion)}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
      >
        <option value="temporal">Dentición temporal</option>
        <option value="mixta">Dentición mixta</option>
        <option value="permanente">Dentición permanente</option>
      </select>
    </div>
  </div>

  {denticion === "mixta" && (
    <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-500/30 dark:bg-amber-500/5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-4">
        <div>
          <h4 className="font-extrabold text-slate-900 dark:text-white">Selecciona los dientes presentes</h4>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">Marca únicamente las piezas que el odontólogo confirme que están presentes en la boca del paciente.</p>
        </div>
        <span className="text-xs font-bold text-amber-800 dark:text-amber-300">{dientesMixtos.length} seleccionados</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {gruposDisponibles.map((grupo) => (
          <div key={grupo.id} className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-xs font-extrabold text-slate-600 dark:text-slate-300 mb-3">{grupo.nombre}</p>
            <div className="flex flex-wrap gap-2">
              {grupo.dientes.map((numero) => {
                const activo = dientesMixtos.includes(numero);
                return (
                  <button
                    key={numero}
                    type="button"
                    onClick={() => alternarDienteMixto(numero)}
                    aria-pressed={activo}
                    className={`min-w-10 rounded-lg border px-2.5 py-2 text-xs font-extrabold transition-colors ${
                      activo
                        ? "border-cyan-600 bg-cyan-600 text-white dark:border-cyan-400 dark:bg-cyan-400 dark:text-slate-950"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:border-cyan-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {numero}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )}

  <h3 className="text-lg font-bold mb-2">Odontograma</h3>
  <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
    {denticion === "temporal" ? "Dentición temporal · nomenclatura FDI" : denticion === "mixta" ? "Dentición mixta · dientes seleccionados" : "Dentición permanente · nomenclatura FDI"}
    {" · "}{dientesActivos.length} dientes visibles
  </p>

  <div className="grid lg:grid-cols-4 gap-8 items-start">

    {/* Dientes agrupados por cuadrante FDI */}
    <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
      {gruposDientesActivos.map((grupo) => (
        <div key={grupo.id} className="min-w-0 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 p-3">
          <p className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 mb-3">{grupo.nombre}</p>
          {grupo.dientes.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500 py-2">Sin dientes seleccionados</p>
          ) : (
            <div className="grid grid-cols-4 gap-2 justify-items-center">
              {grupo.dientes.map((diente) => (
                <Tooth
                  key={diente}
                  numero={diente}
                  estado={datos[diente]}
                  onFaceClick={handleFaceClick}
                />
              ))}
            </div>
          )}
        </div>
      ))}
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

      {/* DIENTES HISTÓRICOS: respeta la dentición guardada en ese registro */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {(() => {
          const datosHistoricos = odontogramaHistorico.datos || {};
          const metaHistorica = datosHistoricos._meta;
          const tipoHistorico: Denticion =
            metaHistorica?.denticion === "temporal" || metaHistorica?.denticion === "mixta" || metaHistorica?.denticion === "permanente"
              ? metaHistorica.denticion
              : "permanente";
          const dientesHistoricosMixtos: number[] = Array.isArray(metaHistorica?.dientesMixtos)
            ? metaHistorica.dientesMixtos
            : [];
          const permitidosHistoricos = tipoHistorico === "temporal"
            ? dientesTemporales
            : tipoHistorico === "mixta"
              ? dientesHistoricosMixtos
              : dientesPermanentes;

          return gruposDisponibles.map((grupo) => {
            const dientesGrupo = grupo.dientes.filter((numero) => permitidosHistoricos.includes(numero));
            return (
              <div key={grupo.id} className="rounded-xl border border-slate-200 dark:border-slate-700 p-3">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-3">{grupo.nombre}</p>
                <div className="grid grid-cols-4 gap-2 justify-items-center">
                  {dientesGrupo.map((diente) => (
                    <Tooth
                      key={diente}
                      numero={diente}
                      estado={datosHistoricos[diente]}
                      onFaceClick={() => {}}
                    />
                  ))}
                </div>
              </div>
            );
          });
        })()}
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
