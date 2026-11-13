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
type CaraDental = "top" | "right" | "bottom" | "left" | "center";
type ClasificacionCaries = "Simple" | "Compuesta" | "Compleja" | "No aplica";
type CategoriaTratamiento = "Preventivo" | "Restaurador" | "Pulpar" | "Quirurgico";
type ProfundidadCaries = "No especificada" | "Inicial" | "Moderada" | "Extensa";

type GrupoDientes = {
  id: string;
  nombre: string;
  dientes: number[];
};

type Caras = {
  top?: Estado;
  right?: Estado;
  bottom?: Estado;
  left?: Estado;
  center?: Estado;
};

interface CatalogoTratamientoCaries {
  id: number;
  nombre: string;
  precio: number | string;
  descripcion: string | null;
  diagnostico: string | null;
  clasificacion: string | null;
  material: string | null;
  plantilla_texto: string | null;
  precio_referencial: boolean;
  categoria: CategoriaTratamiento;
  denticion_aplicable: "ambas" | "temporal" | "permanente";
  aplica_clasificacion_superficies: boolean;
  precio_configurado: boolean;
}

interface PropuestaTratamientoOdontograma {
  id: string;
  piezaDental: number;
  caras: CaraDental[];
  superficies: string[];
  catalogoTratamientoId: number;
  diagnostico: string;
  clasificacion: ClasificacionCaries;
  categoria: CategoriaTratamiento;
  aplicaClasificacionSuperficies: boolean;
  profundidad: ProfundidadCaries;
  material: string;
  nombreProcedimiento: string;
  descripcion: string;
  plantillaAplicada: string;
  precioUnitario: number;
  precioReferencial: boolean;
  precioIngresadoManualmente: boolean;
  estado: "pendiente" | "incorporada";
  planId: number | string | null;
  fechaRegistro: string;
  fechaIncorporacion?: string;
}

const dientesPermanentes = [
  18, 17, 16, 15, 14, 13, 12, 11,
  21, 22, 23, 24, 25, 26, 27, 28,
  48, 47, 46, 45, 44, 43, 42, 41,
  31, 32, 33, 34, 35, 36, 37, 38,
];

const dientesTemporales = [
  55, 54, 53, 52, 51,
  61, 62, 63, 64, 65,
  85, 84, 83, 82, 81,
  71, 72, 73, 74, 75,
];

const ordenDientesMixtos = [
  18, 17, 16, 15, 14, 13, 12, 11, 55, 54, 53, 52, 51,
  61, 62, 63, 64, 65, 21, 22, 23, 24, 25, 26, 27, 28,
  48, 47, 46, 45, 44, 43, 42, 41, 85, 84, 83, 82, 81,
  71, 72, 73, 74, 75, 31, 32, 33, 34, 35, 36, 37, 38,
];

const gruposDisponibles: GrupoDientes[] = [
  { id: "superior-derecho", nombre: "Superior derecho", dientes: [18, 17, 16, 15, 14, 13, 12, 11, 55, 54, 53, 52, 51] },
  { id: "superior-izquierdo", nombre: "Superior izquierdo", dientes: [61, 62, 63, 64, 65, 21, 22, 23, 24, 25, 26, 27, 28] },
  { id: "inferior-derecho", nombre: "Inferior derecho", dientes: [48, 47, 46, 45, 44, 43, 42, 41, 85, 84, 83, 82, 81] },
  { id: "inferior-izquierdo", nombre: "Inferior izquierdo", dientes: [71, 72, 73, 74, 75, 31, 32, 33, 34, 35, 36, 37, 38] },
];

const CARAS_DENTALES: CaraDental[] = ["top", "right", "bottom", "left", "center"];

const obtenerClasificacionPorSuperficies = (cantidad: number): ClasificacionCaries => {
  if (cantidad <= 1) return "Simple";
  if (cantidad === 2) return "Compuesta";
  return "Compleja";
};

const obtenerDenticionPieza = (numero: number): "temporal" | "permanente" => {
  const cuadrante = Math.floor(numero / 10);
  return [5, 6, 7, 8].includes(cuadrante) ? "temporal" : "permanente";
};

const CATEGORIAS_TRATAMIENTO: Array<{
  valor: CategoriaTratamiento;
  titulo: string;
  descripcion: string;
}> = [
  { valor: "Preventivo", titulo: "Preventivos", descripcion: "Manejo no restaurador y prevención" },
  { valor: "Restaurador", titulo: "Restauradores", descripcion: "Restauraciones y coronas" },
  { valor: "Pulpar", titulo: "Terapia pulpar", descripcion: "Tratamientos de la pulpa dental" },
  { valor: "Quirurgico", titulo: "Quirúrgicos", descripcion: "Extracciones indicadas" },
];

const obtenerProfundidadValida = (valor: unknown): ProfundidadCaries => {
  return valor === "Inicial" || valor === "Moderada" || valor === "Extensa"
    ? valor
    : "No especificada";
};

const obtenerEtiquetaSuperficie = (numero: number, cara: CaraDental): string => {
  const cuadrante = Math.floor(numero / 10);
  const posicion = numero % 10;
  const esSuperior = [1, 2, 5, 6].includes(cuadrante);
  const esLadoDerechoPaciente = [1, 4, 5, 8].includes(cuadrante);
  const esPosterior = posicion >= 4;

  if (cara === "center") return esPosterior ? "Oclusal" : "Incisal";

  if (cara === "top") return esSuperior ? "Vestibular" : "Lingual";
  if (cara === "bottom") return esSuperior ? "Palatina" : "Vestibular";

  const esMesial = esLadoDerechoPaciente ? cara === "right" : cara === "left";
  return esMesial ? "Mesial" : "Distal";
};

const obtenerPlantillaAplicada = (
  plantilla: string,
  pieza: number,
  superficies: string[],
  profundidad: ProfundidadCaries,
  clasificacion: ClasificacionCaries
): string =>
  plantilla
    .replace(/\{pieza\}/g, String(pieza))
    .replace(/\{superficies\}/g, superficies.join(", "))
    .replace(/\{profundidad\}/g, profundidad)
    .replace(/\{clasificacion\}/g, clasificacion.toLowerCase());

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
    face: CaraDental;
  } | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [datos, setDatos] = useState<Record<number, Caras>>({});
  const [denticion, setDenticion] = useState<Denticion>("permanente");
  const [denticionSugerida, setDenticionSugerida] = useState<Denticion>("permanente");
  const [edadPaciente, setEdadPaciente] = useState<number | null>(null);
  const [dientesMixtos, setDientesMixtos] = useState<number[]>([]);
  const [observaciones, setObservaciones] = useState("");
  const [diagnostico, setDiagnostico] = useState("");
  const [mensajeGuardado, setMensajeGuardado] = useState("");
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [historial, setHistorial] = useState<any[]>([]);
  const [odontogramaHistorico, setOdontogramaHistorico] = useState<any | null>(null);

  // Propuestas clínicas guardadas dentro de odontogramas.datos._meta.
  const [propuestasTratamiento, setPropuestasTratamiento] = useState<PropuestaTratamientoOdontograma[]>([]);
  const [consultasEstimadas, setConsultasEstimadas] = useState<number>(1);
  const [mostrarModalCaries, setMostrarModalCaries] = useState(false);
  const [piezaCariesActiva, setPiezaCariesActiva] = useState<number | null>(null);
  const [caraCariesActiva, setCaraCariesActiva] = useState<CaraDental | null>(null);
  const [clasificacionCaries, setClasificacionCaries] = useState<ClasificacionCaries>("Simple");
  const [profundidadCaries, setProfundidadCaries] = useState<ProfundidadCaries>("No especificada");
  const [categoriaTratamientoSeleccionada, setCategoriaTratamientoSeleccionada] = useState<CategoriaTratamiento>("Restaurador");
  const [opcionesCatalogoCaries, setOpcionesCatalogoCaries] = useState<CatalogoTratamientoCaries[]>([]);
  const [tratamientoCariesSeleccionado, setTratamientoCariesSeleccionado] = useState("");
  const [precioManualCaries, setPrecioManualCaries] = useState("");
  const [cargandoOpcionesCaries, setCargandoOpcionesCaries] = useState(false);
  const [guardandoPropuestaCaries, setGuardandoPropuestaCaries] = useState(false);
  const [errorPropuestaCaries, setErrorPropuestaCaries] = useState("");

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

  useEffect(() => {
    if (mostrarHistorial) {
      void cargarHistorial();
    }
  }, [mostrarHistorial]);

  useEffect(() => {
    void cargarOdontograma();
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

    let edadCalculada: number | null = null;
    let sugerencia: Denticion = "permanente";

    const { data: datosPaciente, error: errorPaciente } = await supabase
      .from("pacientes")
      .select("fecha_nacimiento")
      .eq("id", paciente.id)
      .maybeSingle();

    if (errorPaciente) {
      console.warn(
        "No se pudo consultar la fecha de nacimiento para sugerir la dentición:",
        errorPaciente.message
      );
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
      setDatos({});
      setObservaciones("");
      setDiagnostico("");
      setDenticion(sugerencia);
      setDientesMixtos([]);
      setPropuestasTratamiento([]);
      setConsultasEstimadas(1);
      return;
    }

    console.log("ODONTOGRAMA CARGADO:", data);

    const datosGuardados = (data.datos || {}) as Record<string, any>;
    const meta = datosGuardados._meta;
    const consultasGuardadas = Number(meta?.consultasEstimadas);
    const consultasValidas = Number.isInteger(consultasGuardadas) && consultasGuardadas >= 1 && consultasGuardadas <= 20
      ? consultasGuardadas
      : 1;
    setConsultasEstimadas(consultasValidas);
    const datosDentales = { ...datosGuardados };
    delete datosDentales._meta;

    setDatos(datosDentales as Record<number, Caras>);
    setObservaciones(data.observaciones || "");
    setDiagnostico(data.diagnostico || "");

    const propuestasGuardadas = Array.isArray(meta?.procedimientosPropuestos)
      ? meta.procedimientosPropuestos
      : [];

    setPropuestasTratamiento(
      propuestasGuardadas
        .filter((item: any) => item && typeof item === "object")
        .map((item: any) => ({
          ...item,
          id: String(item.id || `propuesta-${item.piezaDental}-${Date.now()}`),
          piezaDental: Number(item.piezaDental),
          caras: Array.isArray(item.caras)
            ? item.caras.filter((cara: unknown): cara is CaraDental =>
                typeof cara === "string" && CARAS_DENTALES.includes(cara as CaraDental)
              )
            : [],
          catalogoTratamientoId: Number(item.catalogoTratamientoId),
          categoria: ["Preventivo", "Restaurador", "Pulpar", "Quirurgico"].includes(item.categoria)
            ? item.categoria
            : "Restaurador",
          aplicaClasificacionSuperficies: typeof item.aplicaClasificacionSuperficies === "boolean"
            ? item.aplicaClasificacionSuperficies
            : true,
          clasificacion:
            item.clasificacion === "No aplica" || item.aplicaClasificacionSuperficies === false
              ? "No aplica"
              : Array.isArray(item.caras) && item.caras.length > 0
                ? obtenerClasificacionPorSuperficies(item.caras.length)
                : item.clasificacion === "Compuesta" || item.clasificacion === "Compleja"
                  ? item.clasificacion
                  : item.clasificacion === "Profunda"
                    ? "Compuesta"
                    : "Simple",
          profundidad: obtenerProfundidadValida(item.profundidad),
          superficies:
            Array.isArray(item.superficies) && item.superficies.length > 0
              ? item.superficies.filter((superficie: unknown): superficie is string => typeof superficie === "string")
              : Array.isArray(item.caras)
                ? item.caras
                    .filter((cara: unknown): cara is CaraDental =>
                      typeof cara === "string" && CARAS_DENTALES.includes(cara as CaraDental)
                    )
                    .map((cara: CaraDental) => obtenerEtiquetaSuperficie(Number(item.piezaDental), cara))
                : [],
          material: String(item.material || ""),
          precioUnitario: Number(item.precioUnitario) || 0,
          precioReferencial: Boolean(item.precioReferencial),
          precioIngresadoManualmente: Boolean(item.precioIngresadoManualmente),
          estado: item.estado === "incorporada" ? "incorporada" : "pendiente",
          planId: item.planId ?? null,
        }))
        .filter((item: PropuestaTratamientoOdontograma) =>
          Number.isInteger(item.piezaDental) && item.piezaDental > 0
        )
    );

    const numerosDentalesGuardados = Object.keys(datosDentales)
      .map(Number)
      .filter((numero) => ordenDientesMixtos.includes(numero));
    const hayTemporales = numerosDentalesGuardados.some((numero) => dientesTemporales.includes(numero));
    const hayPermanentes = numerosDentalesGuardados.some((numero) => dientesPermanentes.includes(numero));

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

  const handleFaceClick = (numero: number, face: CaraDental, e: React.MouseEvent) => {
    setSelected({ numero, face });
    setPos({ x: e.clientX + 10, y: e.clientY + 10 });
  };

  const obtenerCarasCariesPieza = (numero: number, caraNueva?: CaraDental): CaraDental[] =>
    CARAS_DENTALES.filter((cara) => {
      const estado = cara === caraNueva ? "caries" : datos[numero]?.[cara];
      return estado === "caries";
    });

  const quitarPropuestaPendienteDePieza = (numero: number) => {
    // Si cambia el estado de una superficie, retiramos la propuesta pendiente
    // completa para evitar conservar una clasificación o precio desactualizados.
    // Las propuestas ya incorporadas a un plan se conservan como historial.
    setPropuestasTratamiento((anteriores) =>
      anteriores.filter(
        (propuesta) =>
          propuesta.piezaDental !== numero || propuesta.estado !== "pendiente"
      )
    );
  };

  const cargarOpcionesCatalogoCaries = async (
    propuestaExistente?: PropuestaTratamientoOdontograma
  ) => {
    setCargandoOpcionesCaries(true);
    setOpcionesCatalogoCaries([]);
    setTratamientoCariesSeleccionado("");
    setPrecioManualCaries("");

    const { data, error } = await supabase
      .from("catalogo_tratamientos")
      .select(
        "id,nombre,precio,descripcion,diagnostico,clasificacion,material,plantilla_texto,precio_referencial,categoria,denticion_aplicable,aplica_clasificacion_superficies,precio_configurado"
      )
      .eq("activo", true)
      .eq("diagnostico", "Caries")
      .order("categoria", { ascending: true })
      .order("precio", { ascending: true });

    if (error) {
      console.error("Error al cargar tratamientos de caries:", error);
      setErrorPropuestaCaries("No se pudo cargar el catálogo clínico. Verifica que se haya ejecutado la actualización del catálogo en Supabase.");
      setCargandoOpcionesCaries(false);
      return;
    }

    const opciones = (data || []) as CatalogoTratamientoCaries[];
    setOpcionesCatalogoCaries(opciones);

    const categoriaExistente = propuestaExistente?.categoria;
    const categoriaInicial: CategoriaTratamiento = categoriaExistente || "Restaurador";
    setCategoriaTratamientoSeleccionada(categoriaInicial);

    const opcionExistente = propuestaExistente
      ? opciones.find((item) => item.id === propuestaExistente.catalogoTratamientoId)
      : undefined;

    setTratamientoCariesSeleccionado(String(opcionExistente?.id ?? ""));
    if (propuestaExistente?.precioIngresadoManualmente) {
      setPrecioManualCaries(String(propuestaExistente.precioUnitario));
    }

    if (opciones.length === 0) {
      setErrorPropuestaCaries(
        "No hay opciones activas para caries en el catálogo. Revisa la actualización del catálogo."
      );
    }

    setCargandoOpcionesCaries(false);
  };

  const abrirConfiguracionCaries = async (pieza: number, cara: CaraDental) => {
    const carasAfectadas = obtenerCarasCariesPieza(pieza, cara);
    const clasificacion = obtenerClasificacionPorSuperficies(carasAfectadas.length);
    const propuestaExistente = propuestasTratamiento.find(
      (item) => item.piezaDental === pieza && item.estado === "pendiente"
    );

    // Una nueva selección de superficie puede cambiar la clasificación.
    // Retiramos la propuesta pendiente anterior para que nunca llegue al plan
    // con un precio o una clasificación que ya no corresponden. Si la clase
    // no cambió, el tratamiento anterior se puede volver a seleccionar.
    setPropuestasTratamiento((anteriores) =>
      anteriores.filter(
        (item) => item.piezaDental !== pieza || item.estado !== "pendiente"
      )
    );

    setPiezaCariesActiva(pieza);
    setCaraCariesActiva(cara);
    setClasificacionCaries(clasificacion);
    setProfundidadCaries(propuestaExistente?.profundidad || "No especificada");
    setCategoriaTratamientoSeleccionada(propuestaExistente?.categoria || "Restaurador");
    setErrorPropuestaCaries("");
    setMostrarModalCaries(true);

    await cargarOpcionesCatalogoCaries(propuestaExistente);
  };

  const guardarEstado = (estado: Estado) => {
    if (!selected) return;

    const pieza = selected.numero;
    const cara = selected.face;

    setDatos((prev) => ({
      ...prev,
      [pieza]: {
        ...prev[pieza],
        [cara]: estado,
      },
    }));

    setSelected(null);

    if (estado === "caries") {
      void abrirConfiguracionCaries(pieza, cara);
    } else {
      quitarPropuestaPendienteDePieza(pieza);
    }
  };

  const confirmarPropuestaCaries = async () => {
    if (piezaCariesActiva === null || caraCariesActiva === null) return;

    setGuardandoPropuestaCaries(true);
    setErrorPropuestaCaries("");

    try {
      // Se cuentan todas las caras marcadas como caries en esa pieza,
      // incluyendo la cara que acaba de seleccionarse.
      const carasAfectadas = obtenerCarasCariesPieza(
        piezaCariesActiva,
        caraCariesActiva
      );

      if (carasAfectadas.length === 0) {
        throw new Error("No hay superficies registradas como caries en esta pieza.");
      }

      const clasificacionSuperficiesActual = obtenerClasificacionPorSuperficies(carasAfectadas.length);
      if (clasificacionSuperficiesActual !== clasificacionCaries) {
        throw new Error(
          "La cantidad de superficies cambió. Cierra esta ventana y vuelve a configurar el tratamiento."
        );
      }

      const tratamiento = opcionesCatalogoCaries.find(
        (item) => String(item.id) === tratamientoCariesSeleccionado
      );

      if (!tratamiento) {
        throw new Error("Selecciona un tratamiento disponible del catálogo.");
      }

      const aplicaClasificacion = Boolean(tratamiento.aplica_clasificacion_superficies);
      const clasificacionFinal: ClasificacionCaries = aplicaClasificacion
        ? clasificacionSuperficiesActual
        : "No aplica";
      const precioCatalogo = Number(tratamiento.precio);
      const precioIngresadoManualmente = !Boolean(tratamiento.precio_configurado);
      const precio = precioIngresadoManualmente
        ? Number(precioManualCaries)
        : precioCatalogo;

      if (!Number.isFinite(precio) || precio <= 0) {
        throw new Error(
          precioIngresadoManualmente
            ? "Este tratamiento aún no tiene precio configurado en el catálogo. Ingresa un importe mayor que cero para esta propuesta."
            : "El precio del catálogo no es válido."
        );
      }

      const plantillaOriginal = String(tratamiento.plantilla_texto || "").trim();

      if (!Number.isFinite(precio) || precio < 0) {
        throw new Error("El catálogo contiene un precio no válido.");
      }

      if (!plantillaOriginal) {
        throw new Error("El tratamiento seleccionado no tiene una plantilla registrada en el catálogo.");
      }

      const superficies = carasAfectadas.map((cara) =>
        obtenerEtiquetaSuperficie(piezaCariesActiva, cara)
      );
      const plantillaAplicada = obtenerPlantillaAplicada(
        plantillaOriginal,
        piezaCariesActiva,
        superficies,
        profundidadCaries,
        clasificacionFinal
      );

      const propuestaExistente = propuestasTratamiento.find(
        (item) => item.piezaDental === piezaCariesActiva && item.estado === "pendiente"
      );

      const propuesta: PropuestaTratamientoOdontograma = {
        id:
          propuestaExistente?.id ||
          `odonto-${piezaCariesActiva}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        piezaDental: piezaCariesActiva,
        caras: carasAfectadas,
        superficies,
        catalogoTratamientoId: Number(tratamiento.id),
        diagnostico: tratamiento.diagnostico || "Caries",
        clasificacion: clasificacionFinal,
        categoria: tratamiento.categoria || categoriaTratamientoSeleccionada,
        aplicaClasificacionSuperficies: aplicaClasificacion,
        profundidad: profundidadCaries,
        material: tratamiento.material || "",
        nombreProcedimiento: tratamiento.nombre,
        descripcion: tratamiento.descripcion || "",
        plantillaAplicada,
        precioUnitario: precio,
        precioReferencial: precioIngresadoManualmente ? false : Boolean(tratamiento.precio_referencial),
        precioIngresadoManualmente,
        estado: "pendiente",
        planId: null,
        fechaRegistro: propuestaExistente?.fechaRegistro || new Date().toISOString(),
      };

      setPropuestasTratamiento((anteriores) => {
        const existe = anteriores.some((item) => item.id === propuesta.id);
        return existe
          ? anteriores.map((item) => (item.id === propuesta.id ? propuesta : item))
          : [...anteriores, propuesta];
      });

      setMostrarModalCaries(false);
      setPiezaCariesActiva(null);
      setCaraCariesActiva(null);
    } catch (error) {
      console.error("Error al preparar el tratamiento:", error);
      setErrorPropuestaCaries(
        error instanceof Error ? error.message : "No se pudo agregar el tratamiento."
      );
    } finally {
      setGuardandoPropuestaCaries(false);
    }
  };

  const cancelarModalCaries = () => {
    // El hallazgo de caries permanece marcado en la cara dental.
    // El médico puede continuar seleccionando otras caras y configurar
    // el tratamiento cuando haya terminado de registrar las superficies.
    setMostrarModalCaries(false);
    setPiezaCariesActiva(null);
    setCaraCariesActiva(null);
    setErrorPropuestaCaries("");
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
            datos: {
              ...datos,
              _meta: {
                denticion,
                dientesMixtos: ordenDientesMixtos.filter((numero) => dientesMixtos.includes(numero)),
                consultasEstimadas,
                procedimientosPropuestos: propuestasTratamiento,
              },
            },
            observaciones,
            diagnostico,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "cita_id" }
        );

      if (error) {
        console.error("ERROR AL GUARDAR ODONTOGRAMA:", error);
        console.error("Mensaje:", error.message);
        console.error("Detalles:", error.details);
        console.error("Hint:", error.hint);
        console.error("Código:", error.code);
        alert(`Error al guardar:\n\n${error.message}\n\nDetalles: ${error.details || "Sin detalles"}`);
        return;
      }

      setMensajeGuardado("Odontograma guardado correctamente.");
      window.setTimeout(() => setMensajeGuardado(""), 2500);
    } catch (error) {
      console.error("ERROR INESPERADO:", error);
      alert("Ocurrió un error al guardar el odontograma.");
    }
  };

  const exportarPDF = () => {
    const doc = new jsPDF("p", "mm", "a4");
    const W = 210;
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

    const obtenerColorEstado = (estado?: Estado): [number, number, number] => {
      switch (estado) {
        case "sano": return [34, 197, 94];
        case "caries": return [239, 68, 68];
        case "restaurado": return [59, 130, 246];
        case "extraido": return [107, 114, 128];
        default: return [255, 255, 255];
      }
    };

    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, W, 297, "F");

    doc.setDrawColor(C.cyan[0], C.cyan[1], C.cyan[2]);
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

    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(C.cyanDark[0], C.cyanDark[1], C.cyanDark[2]);
    doc.text("VILLA 920 DENTAL", margen + 12, 14);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(C.texto3[0], C.texto3[1], C.texto3[2]);
    doc.text("SALUD · ESTÉTICA · BIENESTAR", margen + 12, 19);

    doc.setFontSize(6.2);
    doc.text("Av. Javier Prado Este 996 - Of. 901 - San Isidro - Lima, 051", W - margen, 10, { align: "right" });
    doc.text("Teléfono: +51 ____________________", W - margen, 15, { align: "right" });
    doc.text("Documento clínico odontológico", W - margen, 20, { align: "right" });

    doc.setDrawColor(C.cyan[0], C.cyan[1], C.cyan[2]);
    doc.setLineWidth(0.8);
    doc.line(margen, 25, W - margen, 25);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(C.texto[0], C.texto[1], C.texto[2]);
    doc.text("ODONTOGRAMA CLÍNICO", centro, 37, { align: "center" });

    doc.setFillColor(C.fondoAzul[0], C.fondoAzul[1], C.fondoAzul[2]);
    doc.setDrawColor(C.borde[0], C.borde[1], C.borde[2]);
    doc.setLineWidth(0.35);
    doc.roundedRect(margen, 42, W - margen * 2, 23, 3, 3, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(C.cyanDark[0], C.cyanDark[1], C.cyanDark[2]);
    doc.text("PACIENTE", margen + 5, 48);
    doc.text("DNI", margen + 5, 57);
    doc.text("MÉDICO", 100, 48);
    doc.text("FECHA", 100, 57);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(C.texto[0], C.texto[1], C.texto[2]);
    doc.text(`${paciente.nombres} ${paciente.apellidos}`, margen + 25, 48);
    doc.text(paciente.dni || "—", margen + 25, 57);
    doc.text(`Dr. ${medico}`, 125, 48);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(new Date().toLocaleDateString("es-PE"), 125, 57);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(C.texto[0], C.texto[1], C.texto[2]);
    doc.text("ODONTOGRAMA", centro, 75, { align: "center" });

    const obtenerTipoDiente = (numero: number): "incisivo" | "canino" | "premolar" | "molar" => {
      const n = numero % 10;
      if (n === 1 || n === 2) return "incisivo";
      if (n === 3) return "canino";
      const esTemporal = Math.floor(numero / 10) >= 5;
      if (!esTemporal && (n === 4 || n === 5)) return "premolar";
      return "molar";
    };

    const dibujarCara = (puntos: [number, number][], estado?: Estado) => {
      const color = obtenerColorEstado(estado);
      doc.setFillColor(color[0], color[1], color[2]);
      doc.setDrawColor(71, 85, 105);
      doc.setLineWidth(0.28);
      doc.triangle(puntos[0][0], puntos[0][1], puntos[1][0], puntos[1][1], puntos[2][0], puntos[2][1], "F");
      doc.triangle(puntos[0][0], puntos[0][1], puntos[2][0], puntos[2][1], puntos[3][0], puntos[3][1], "F");
      for (let i = 0; i < 4; i += 1) {
        const actual = puntos[i];
        const siguiente = puntos[(i + 1) % 4];
        doc.line(actual[0], actual[1], siguiente[0], siguiente[1]);
      }
    };

    const dibujarDiente = (numero: number, cx: number, y: number) => {
      const caras = datos[numero] || {};
      const tipo = obtenerTipoDiente(numero);
      let ancho = 10;
      let corona = 10;
      let raiz = 10;
      if (tipo === "incisivo") { ancho = 8; corona = 9; raiz = 11; }
      if (tipo === "canino") { ancho = 9; corona = 9; raiz = 12; }
      if (tipo === "premolar") { ancho = 10; corona = 10; raiz = 10; }
      if (tipo === "molar") { ancho = 11; corona = 11; raiz = 8; }

      const x1 = cx - ancho / 2;
      const x2 = cx + ancho / 2;
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

      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(71, 85, 105);
      doc.setLineWidth(0.45);
      for (let i = 1; i < puntosCorona.length - 1; i += 1) {
        doc.triangle(
          puntosCorona[0][0], puntosCorona[0][1],
          puntosCorona[i][0], puntosCorona[i][1],
          puntosCorona[i + 1][0], puntosCorona[i + 1][1],
          "F"
        );
      }

      const yTop = coronaY + 2.5;
      const yMiddle = coronaY + corona * 0.48;
      const yBottom = coronaY + corona * 0.76;
      const xi = cx - ancho * 0.25;
      const xd = cx + ancho * 0.25;

      dibujarCara([[x1 + 1.3, yTop], [x2 - 1.3, yTop], [xd, yMiddle], [xi, yMiddle]], caras.top);
      dibujarCara([[x1 + 0.8, yMiddle], [xi, yMiddle], [xi, yBottom], [x1 + 0.8, yBottom - 0.5]], caras.left);
      dibujarCara([[xi, yMiddle], [xd, yMiddle], [xd, yBottom], [xi, yBottom]], caras.center);
      dibujarCara([[xd, yMiddle], [x2 - 0.8, yMiddle + 0.2], [x2 - 0.8, yBottom - 0.5], [xd, yBottom]], caras.right);
      dibujarCara([[xi, yBottom], [xd, yBottom], [x2 - 1.2, coronaY + corona - 1], [x1 + 1.2, coronaY + corona - 1]], caras.bottom);

      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(71, 85, 105);
      doc.setLineWidth(0.4);
      if (tipo === "molar") {
        doc.triangle(cx - 3, coronaY + corona, cx - 0.3, coronaY + corona, cx - 1.8, coronaY + corona + raiz, "F");
        doc.triangle(cx + 0.3, coronaY + corona, cx + 3, coronaY + corona, cx + 1.8, coronaY + corona + raiz, "F");
        doc.line(cx - 3, coronaY + corona, cx - 1.8, coronaY + corona + raiz);
        doc.line(cx - 0.3, coronaY + corona, cx - 1.8, coronaY + corona + raiz);
        doc.line(cx + 0.3, coronaY + corona, cx + 1.8, coronaY + corona + raiz);
        doc.line(cx + 3, coronaY + corona, cx + 1.8, coronaY + corona + raiz);
      } else {
        doc.triangle(cx - ancho * 0.22, coronaY + corona, cx + ancho * 0.22, coronaY + corona, cx, coronaY + corona + raiz, "F");
        doc.line(cx - ancho * 0.22, coronaY + corona, cx, coronaY + corona + raiz);
        doc.line(cx + ancho * 0.22, coronaY + corona, cx, coronaY + corona + raiz);
      }

      doc.setDrawColor(71, 85, 105);
      doc.setLineWidth(0.45);
      for (let i = 0; i < puntosCorona.length; i += 1) {
        const actual = puntosCorona[i];
        const siguiente = puntosCorona[(i + 1) % puntosCorona.length];
        doc.line(actual[0], actual[1], siguiente[0], siguiente[1]);
      }

      const estaExtraido = Object.values(caras).some((estado) => estado === "extraido");
      if (estaExtraido) {
        doc.setDrawColor(71, 85, 105);
        doc.setLineWidth(0.8);
        doc.line(x1 - 0.8, coronaY - 0.5, x2 + 0.8, coronaY + corona + raiz);
        doc.line(x2 + 0.8, coronaY - 0.5, x1 - 0.8, coronaY + corona + raiz);
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.2);
      doc.setTextColor(30, 64, 175);
      doc.text(String(numero), cx, coronaY - 2.5, { align: "center" });
    };

    const posicionesY = [84, 111, 138, 165];
    gruposDientesActivos.forEach((grupo, fila) => {
      const cantidad = grupo.dientes.length;
      if (cantidad === 0) return;
      const espacioFila = cantidad > 8 ? 12 : 13;
      const inicioFila = centro - (espacioFila * (cantidad - 1)) / 2;
      grupo.dientes.forEach((diente, index) => {
        dibujarDiente(diente, inicioFila + index * espacioFila, posicionesY[fila]);
      });
    });

    doc.setFillColor(C.fondoAzul[0], C.fondoAzul[1], C.fondoAzul[2]);
    doc.setDrawColor(C.borde[0], C.borde[1], C.borde[2]);
    doc.roundedRect(margen, 193, W - margen * 2, 13, 2.5, 2.5, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(C.texto[0], C.texto[1], C.texto[2]);
    doc.text("LEYENDA CLÍNICA", margen + 5, 201);

    const leyenda = [
      { nombre: "Sano", color: C.sano, x: 64 },
      { nombre: "Caries", color: C.caries, x: 100 },
      { nombre: "Restaurado", color: C.restaurado, x: 137 },
      { nombre: "Extraído", color: C.extraido, x: 176 },
    ];
    leyenda.forEach((item) => {
      doc.setFillColor(item.color[0], item.color[1], item.color[2]);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(item.x, 197.5, 5, 5, 1, 1, "FD");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(C.texto2[0], C.texto2[1], C.texto2[2]);
      doc.text(item.nombre, item.x + 8, 201.5);
    });

    const anchoCaja = (W - margen * 2 - 4) / 2;
    doc.setFillColor(C.fondo[0], C.fondo[1], C.fondo[2]);
    doc.setDrawColor(C.borde[0], C.borde[1], C.borde[2]);
    doc.roundedRect(margen, 211, anchoCaja, 22, 2.5, 2.5, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(C.cyanDark[0], C.cyanDark[1], C.cyanDark[2]);
    doc.text("DIAGNÓSTICO", margen + 5, 218);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);
    doc.setTextColor(C.texto2[0], C.texto2[1], C.texto2[2]);
    const diagnosticoLineas = doc.splitTextToSize(diagnostico || "Sin diagnóstico", anchoCaja - 10);
    doc.text(diagnosticoLineas.slice(0, 2), margen + 5, 224);

    const xObservaciones = margen + anchoCaja + 4;
    doc.setFillColor(C.fondo[0], C.fondo[1], C.fondo[2]);
    doc.setDrawColor(C.borde[0], C.borde[1], C.borde[2]);
    doc.roundedRect(xObservaciones, 211, anchoCaja, 22, 2.5, 2.5, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(C.cyanDark[0], C.cyanDark[1], C.cyanDark[2]);
    doc.text("OBSERVACIONES CLÍNICAS", xObservaciones + 5, 218);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);
    doc.setTextColor(C.texto2[0], C.texto2[1], C.texto2[2]);
    const observacionesLineas = doc.splitTextToSize(observaciones || "Sin observaciones clínicas.", anchoCaja - 10);
    doc.text(observacionesLineas.slice(0, 2), xObservaciones + 5, 224);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(C.cyanDark[0], C.cyanDark[1], C.cyanDark[2]);
    doc.text("RESUMEN ODONTOLÓGICO", margen, 241);

    const dibujarIconoDiente = (x: number, y: number, color: [number, number, number]) => {
      doc.setFillColor(color[0], color[1], color[2]);
      doc.roundedRect(x - 3, y - 4.5, 6, 7, 1.8, 1.8, "F");
      doc.triangle(x - 2.7, y + 1.5, x - 0.3, y + 1.5, x - 1.5, y + 7, "F");
      doc.triangle(x + 0.3, y + 1.5, x + 2.7, y + 1.5, x + 1.5, y + 7, "F");
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(x + 0.8, y - 3.2, 0.9, 2.2, 0.4, 0.4, "F");
    };

    const dibujarTarjetaResumen = (x: number, titulo: string, valor: number, color: number[]) => {
      const ancho = 43;
      const alto = 20;
      const fondoColor = [
        Math.min(255, color[0] + 205),
        Math.min(255, color[1] + 205),
        Math.min(255, color[2] + 205),
      ];
      doc.setFillColor(fondoColor[0], fondoColor[1], fondoColor[2]);
      doc.setDrawColor(color[0], color[1], color[2]);
      doc.setLineWidth(0.25);
      doc.roundedRect(x, 245, ancho, alto, 2.5, 2.5, "FD");
      dibujarIconoDiente(x + 8, 254, color as [number, number, number]);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(5.8);
      doc.setTextColor(C.texto2[0], C.texto2[1], C.texto2[2]);
      doc.text(titulo, x + 15, 251.5);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(color[0], color[1], color[2]);
      doc.text(String(valor), x + 15, 260);
    };

    dibujarTarjetaResumen(margen, "Sanos", resumen.sano, C.sano);
    dibujarTarjetaResumen(margen + 44, "Caries", resumen.caries, C.caries);
    dibujarTarjetaResumen(margen + 88, "Restaurados", resumen.restaurado, C.restaurado);
    dibujarTarjetaResumen(margen + 132, "Extraídos", resumen.extraido, C.extraido);

    // Se conserva el resumen odontológico y se omite el bloque de firma.
    doc.setDrawColor(C.borde[0], C.borde[1], C.borde[2]);
    doc.setLineWidth(0.25);
    doc.line(margen, 291, W - margen, 291);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.5);
    doc.setTextColor(C.texto3[0], C.texto3[1], C.texto3[2]);
    doc.text("VILLA 920 DENTAL · Documento clínico odontológico", centro, 295, { align: "center" });

    const apellidoArchivo = paciente.apellidos.trim().replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]+/g, "_");
    doc.save(`odontograma-${apellidoArchivo || "paciente"}.pdf`);
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

  const propuestasPendientes = propuestasTratamiento.filter((item) => item.estado === "pendiente");

  const carasAfectadasModal =
    piezaCariesActiva !== null
      ? obtenerCarasCariesPieza(piezaCariesActiva, caraCariesActiva || undefined)
      : [];

  const denticionPiezaActiva = piezaCariesActiva !== null
    ? obtenerDenticionPieza(piezaCariesActiva)
    : "permanente";

  const opcionesCategoriaCaries = opcionesCatalogoCaries.filter((item) => {
    const categoriaCorrecta = item.categoria === categoriaTratamientoSeleccionada;
    const aplicaDenticion = item.denticion_aplicable === "ambas" || item.denticion_aplicable === denticionPiezaActiva;
    const aplicaClasificacion = !item.aplica_clasificacion_superficies || item.clasificacion === clasificacionCaries;
    return categoriaCorrecta && aplicaDenticion && aplicaClasificacion;
  });

  const tratamientoSeleccionadoActual = opcionesCategoriaCaries.find(
    (item) => String(item.id) === tratamientoCariesSeleccionado
  );
  const precioManualValido = Number.isFinite(Number(precioManualCaries)) && Number(precioManualCaries) > 0;
  const puedeAgregarPropuesta = Boolean(
    tratamientoSeleccionadoActual &&
    (tratamientoSeleccionadoActual.precio_configurado || precioManualValido)
  );

  return (
    <div className="min-h-full w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 p-4 md:p-6">
      {mensajeGuardado && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-xl bg-green-600 text-white rounded-2xl shadow-2xl px-6 py-5 flex items-center gap-4 border-2 border-green-400">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white text-green-600 text-2xl font-bold shrink-0">✓</div>
          <div>
            <p className="text-lg font-bold">Odontograma guardado correctamente</p>
            <p className="text-sm text-green-100 mt-1">Los cambios fueron guardados en el sistema.</p>
          </div>
        </div>
      )}

      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20 flex items-center justify-center">
            <span className="text-lg">🦷</span>
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Odontograma Dental</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Registro y seguimiento del estado dental del paciente</p>
          </div>
        </div>
      </div>

      {/* INFORMACIÓN DEL PACIENTE + HISTORIAL */}
      <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-6">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.15fr]">
          <div className="p-6 md:p-7 border-b xl:border-b-0 xl:border-r border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20 flex items-center justify-center shrink-0 shadow-sm">
                <span className="text-lg font-extrabold text-cyan-700 dark:text-cyan-300">{paciente.nombres?.charAt(0)}{paciente.apellidos?.charAt(0)}</span>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-600 dark:text-cyan-400 mb-1">Paciente</p>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white truncate">{paciente.nombres} {paciente.apellidos}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Ficha odontológica · Información clínica</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70 p-4 transition-colors">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500 mb-1.5">DNI</p>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{paciente.dni}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70 p-4 transition-colors">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500 mb-1.5">Teléfono</p>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{paciente.telefono}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70 p-4 transition-colors">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500 mb-1.5">Estado</p>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400 truncate">{paciente.estado}</p>
                </div>
              </div>
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70 p-4 transition-colors">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500 mb-1.5">Médico</p>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">Dr. {medico}</p>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-7">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 mb-1">Seguimiento</p>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Historial odontológico</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Registros clínicos anteriores del paciente</p>
              </div>
              <button
                onClick={() => setMostrarHistorial(!mostrarHistorial)}
                className="shrink-0 inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-cyan-50 dark:hover:bg-cyan-500/10 hover:border-cyan-200 dark:hover:border-cyan-500/30 hover:text-cyan-700 dark:hover:text-cyan-300 transition-all duration-200 cursor-pointer"
              >
                <span>{mostrarHistorial ? "Ocultar" : "Ver historial"}</span>
                <span className="text-[10px]">{mostrarHistorial ? "▲" : "▼"}</span>
              </button>
            </div>

            {mostrarHistorial && (
              <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                {historial.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-7 text-center">
                    <div className="w-10 h-10 mx-auto rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center mb-3"><span className="text-lg">📋</span></div>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No hay odontogramas anteriores</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Los registros históricos aparecerán aquí.</p>
                  </div>
                ) : (
                  historial.map((item) => (
                    <div key={item.id} className="group rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-4 hover:border-cyan-200 dark:hover:border-cyan-500/30 hover:bg-white dark:hover:bg-slate-800 transition-all duration-200">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="w-2 h-2 rounded-full bg-cyan-500 shrink-0" />
                            <p className="text-sm font-extrabold text-slate-800 dark:text-white">{new Date(item.created_at).toLocaleDateString()}</p>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300"><span className="font-bold text-slate-700 dark:text-slate-200">Diagnóstico:</span>{" "}{item.diagnostico || "Sin diagnóstico"}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5"><span className="font-bold text-slate-600 dark:text-slate-300">Observaciones:</span>{" "}{item.observaciones || "Sin observaciones"}</p>
                        </div>
                        <button onClick={() => verOdontogramaHistorico(item)} className="shrink-0 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-cyan-700 dark:text-cyan-300 text-[11px] font-extrabold shadow-sm hover:bg-cyan-50 dark:hover:bg-cyan-500/10 hover:border-cyan-200 dark:hover:border-cyan-500/30 transition-all duration-200 cursor-pointer">Ver odontograma</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DENTICIÓN Y ODONTOGRAMA */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow border border-slate-200 dark:border-slate-700 p-6 mb-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-600 dark:text-cyan-400 mb-1">Odontograma inteligente</p>
            <h3 className="text-lg font-extrabold mb-1">Dentición del paciente</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {edadPaciente === null
                ? "Seleccionamos una vista inicial; confirma que coincida con la boca del paciente."
                : `Edad: ${edadPaciente} ${edadPaciente === 1 ? "año" : "años"}. Sugerencia por edad: ${denticionSugerida === "temporal" ? "temporal" : denticionSugerida === "mixta" ? "mixta" : "permanente"}. Confirma según la evaluación clínica.`}
            </p>
          </div>
          <div className="w-full sm:w-64">
            <label htmlFor="denticion-paciente" className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">Ajustar dentición si es necesario</label>
            <select id="denticion-paciente" value={denticion} onChange={(e) => setDenticion(e.target.value as Denticion)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white">
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
                        <button key={numero} type="button" onClick={() => alternarDienteMixto(numero)} aria-pressed={activo} className={`min-w-10 rounded-lg border px-2.5 py-2 text-xs font-extrabold transition-colors ${activo ? "border-cyan-600 bg-cyan-600 text-white dark:border-cyan-400 dark:bg-cyan-400 dark:text-slate-950" : "border-slate-200 bg-slate-50 text-slate-600 hover:border-cyan-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"}`}>
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
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {gruposDientesActivos.map((grupo) => (
              <div key={grupo.id} className="min-w-0 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 p-3">
                <p className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 mb-3">{grupo.nombre}</p>
                {grupo.dientes.length === 0 ? (
                  <p className="text-xs text-slate-400 dark:text-slate-500 py-2">Sin dientes seleccionados</p>
                ) : (
                  <div className="grid grid-cols-4 gap-2 justify-items-center">
                    {grupo.dientes.map((diente) => (
                      <Tooth key={diente} numero={diente} estado={datos[diente]} onFaceClick={handleFaceClick} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/50 p-5">
            <div className="mb-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-600 dark:text-cyan-400 mb-1">Referencia clínica</p>
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white">Estados dentales</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Identificación visual de cada estado</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3.5 py-3"><div className="flex items-center gap-3"><span className="w-3 h-3 rounded-full bg-green-500 ring-4 ring-green-500/10" /><span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Sano</span></div></div>
              <div className="flex items-center justify-between rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3.5 py-3"><div className="flex items-center gap-3"><span className="w-3 h-3 rounded-full bg-red-500 ring-4 ring-red-500/10" /><span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Caries</span></div></div>
              <div className="flex items-center justify-between rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3.5 py-3"><div className="flex items-center gap-3"><span className="w-3 h-3 rounded-full bg-blue-500 ring-4 ring-blue-500/10" /><span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Restaurado</span></div></div>
              <div className="flex items-center justify-between rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3.5 py-3"><div className="flex items-center gap-3"><span className="w-3 h-3 rounded-full bg-gray-600 ring-4 ring-gray-600/10" /><span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Extraído</span></div></div>
            </div>
            <div className="my-5 border-t border-slate-200 dark:border-slate-700" />
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">Resumen clínico</h4>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Estado actual</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-green-50 dark:bg-green-500/10 border border-green-100 dark:border-green-500/20 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-green-600 dark:text-green-400">Sanos</p><p className="text-xl font-extrabold text-green-700 dark:text-green-300 mt-1">{resumen.sano}</p></div>
                <div className="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">Caries</p><p className="text-xl font-extrabold text-red-700 dark:text-red-300 mt-1">{resumen.caries}</p></div>
                <div className="rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Restaurados</p><p className="text-xl font-extrabold text-blue-700 dark:text-blue-300 mt-1">{resumen.restaurado}</p></div>
                <div className="rounded-xl bg-slate-100 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Extraídos</p><p className="text-xl font-extrabold text-slate-700 dark:text-slate-200 mt-1">{resumen.extraido}</p></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TRATAMIENTOS PROPUESTOS */}
      {propuestasTratamiento.length > 0 && (
        <div className="mb-6 rounded-[24px] border border-cyan-200 bg-white p-6 shadow-sm dark:border-cyan-500/20 dark:bg-slate-900">
          <div className="mb-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-600 dark:text-cyan-400">Planificación clínica</p>
            <h3 className="mt-1 text-lg font-extrabold text-slate-900 dark:text-white">Tratamientos propuestos</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Procedimientos seleccionados por el odontólogo a partir de los hallazgos del odontograma.</p>
          </div>
          <div className="space-y-3">
            {propuestasTratamiento.map((propuesta) => (
              <div key={propuesta.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-cyan-100 px-2.5 py-1 text-xs font-extrabold text-cyan-800 dark:bg-cyan-500/10 dark:text-cyan-300">Pieza {propuesta.piezaDental}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{propuesta.clasificacion} · {propuesta.caras.length} {propuesta.caras.length === 1 ? "superficie" : "superficies"}</span>
                  </div>
                  <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white">{propuesta.nombreProcedimiento}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Material: {propuesta.material}{" · "}Superficies: {propuesta.superficies.join(", ")}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Profundidad clínica: {propuesta.profundidad}</p>
                  <p className="mt-2 text-sm font-extrabold text-slate-800 dark:text-slate-200">S/. {propuesta.precioUnitario.toFixed(2)}{propuesta.precioReferencial && <span className="ml-2 text-[10px] font-semibold text-amber-600 dark:text-amber-400">Precio referencial</span>}</p>
                  {propuesta.plantillaAplicada && <p className="mt-2 max-w-3xl text-xs text-slate-500 dark:text-slate-400">{propuesta.plantillaAplicada}</p>}
                  <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${propuesta.estado === "incorporada" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" : "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"}`}>
                    {propuesta.estado === "incorporada" ? `Incorporada al plan${propuesta.planId ? ` #${propuesta.planId}` : ""}` : "Pendiente de incorporar al plan"}
                  </span>
                </div>
                {propuesta.estado === "pendiente" && (
                  <button type="button" onClick={() => setPropuestasTratamiento((anteriores) => anteriores.filter((item) => item.id !== propuesta.id))} className="self-start rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:border-rose-500/20 dark:text-rose-400 dark:hover:bg-rose-500/10 sm:self-center">
                    Quitar propuesta
                  </button>
                )}
              </div>
            ))}
          </div>
          {propuestasPendientes.length > 0 && <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">Recuerda pulsar «Guardar odontograma» para conservar estas propuestas en Supabase. Después estarán disponibles en el Plan de Tratamiento.</p>}
        </div>
      )}

      {/* OBSERVACIONES CLÍNICAS */}
      <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm p-6 mb-6">
        <div className="flex items-start gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20 flex items-center justify-center shrink-0"><span className="text-base">📝</span></div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-600 dark:text-cyan-400 mb-1">Registro clínico</p>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Observaciones clínicas</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Registre hallazgos, procedimientos o información relevante de la consulta.</p>
          </div>
        </div>
        <input type="text" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Escriba las observaciones clínicas..." className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 px-4 py-3.5 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition-all duration-200 focus:border-cyan-400 dark:focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10" />
      </div>

      {/* DIAGNÓSTICO */}
      <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm p-6 mb-6">
        <div className="flex items-start gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 flex items-center justify-center shrink-0"><span className="text-base">🩺</span></div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-violet-600 dark:text-violet-400 mb-1">Evaluación clínica</p>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Diagnóstico</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Registre el diagnóstico clínico asociado a la evaluación odontológica.</p>
          </div>
        </div>
        <input type="text" value={diagnostico} onChange={(e) => setDiagnostico(e.target.value)} placeholder="Ingrese el diagnóstico clínico..." className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 px-4 py-3.5 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition-all duration-200 focus:border-violet-400 dark:focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10" />
      </div>

      {/* PLANIFICACIÓN INICIAL DE CONSULTAS */}
      <div className="mb-6 rounded-[24px] border border-cyan-200 bg-white p-6 shadow-sm dark:border-cyan-500/20 dark:bg-slate-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-600 dark:text-cyan-400">Planificación inicial</p>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Consultas estimadas para el tratamiento</h3>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
              Indica cuántas consultas estima el odontólogo para organizar los procedimientos. Esta cantidad se enviará al Plan de Tratamiento y podrá ajustarse allí.
            </p>
          </div>
          <div className="w-full sm:w-44">
            <label htmlFor="consultas-estimadas-odontograma" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Número de consultas
            </label>
            <input
              id="consultas-estimadas-odontograma"
              type="number"
              min={1}
              max={20}
              step={1}
              value={consultasEstimadas}
              onChange={(e) => {
                const valor = Number(e.target.value);
                if (!Number.isFinite(valor)) return;
                setConsultasEstimadas(Math.min(20, Math.max(1, Math.floor(valor || 1))));
              }}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-center text-lg font-bold text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
            <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">De 1 a 20 consultas</p>
          </div>
        </div>
        <div className="mt-4 rounded-xl bg-cyan-50 px-4 py-3 text-xs text-cyan-900 dark:bg-cyan-500/10 dark:text-cyan-200">
          El Plan de Tratamiento utilizará esta estimación para distribuir los procedimientos completos. Las superficies de una misma pieza permanecerán juntas; la distribución será una propuesta que el odontólogo podrá revisar.
        </div>
      </div>

      {/* MENÚ DE ESTADO DE CARA DENTAL */}
      {selected && (
        <div style={{ position: "fixed", top: Math.min(pos.y, window.innerHeight - 300), left: Math.min(pos.x, window.innerWidth - 240) }} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 shadow-2xl rounded-xl p-4 z-50 w-52 transition-all duration-200">
          <p className="font-bold text-slate-900 dark:text-white mb-3">Diente {selected.numero} - {obtenerEtiquetaSuperficie(selected.numero, selected.face)}</p>
          <button className="w-full mb-2 p-2 rounded bg-green-500 hover:bg-green-600 text-white" onClick={() => guardarEstado("sano")}>Sano</button>
          <button className="w-full mb-2 p-2 rounded bg-red-500 hover:bg-red-600 text-white" onClick={() => guardarEstado("caries")}>Caries</button>
          <button className="w-full mb-2 p-2 rounded bg-blue-500 hover:bg-blue-600 text-white" onClick={() => guardarEstado("restaurado")}>Restaurado</button>
          <button className="w-full p-2 rounded bg-gray-600 hover:bg-gray-700 text-white" onClick={() => guardarEstado("extraido")}>Extraído</button>
          <button className="w-full mt-3 p-2 rounded bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600" onClick={() => setSelected(null)}>Cerrar</button>
        </div>
      )}

      {/* CONFIGURACIÓN DE CARIES Y PROPUESTA DE TRATAMIENTO */}
      {mostrarModalCaries && piezaCariesActiva !== null && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                Selección de tratamiento clínico
              </p>
              <h3 className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">
                Pieza {piezaCariesActiva} · {carasAfectadasModal.length} {carasAfectadasModal.length === 1 ? "superficie afectada" : "superficies afectadas"}
              </h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                La clasificación se calcula según el número de superficies marcadas como caries. La profundidad se registra por separado.
              </p>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4 dark:border-cyan-500/20 dark:bg-cyan-500/5">
                <p className="text-xs font-bold uppercase tracking-wide text-cyan-800 dark:text-cyan-300">Superficies registradas</p>
                <p className="mt-1 text-sm font-semibold text-cyan-950 dark:text-cyan-100">
                  {carasAfectadasModal.map((cara) => obtenerEtiquetaSuperficie(piezaCariesActiva, cara)).join(" · ") || "Sin superficies"}
                </p>
                <p className="mt-2 text-xs text-cyan-800 dark:text-cyan-300">
                  {clasificacionCaries} por cantidad de superficies. Esta clasificación y el precio por superficies se aplican a las restauraciones que así lo indiquen en el catálogo.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">
                  Profundidad clínica (evaluación del odontólogo)
                </label>
                <select
                  value={profundidadCaries}
                  onChange={(e) => setProfundidadCaries(e.target.value as ProfundidadCaries)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                >
                  <option value="No especificada">No especificada</option>
                  <option value="Inicial">Inicial</option>
                  <option value="Moderada">Moderada</option>
                  <option value="Extensa">Extensa</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">
                  Categoría del tratamiento
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {CATEGORIAS_TRATAMIENTO.map((categoria) => (
                    <button
                      key={categoria.valor}
                      type="button"
                      onClick={() => {
                        setCategoriaTratamientoSeleccionada(categoria.valor);
                        setTratamientoCariesSeleccionado("");
                        setPrecioManualCaries("");
                      }}
                      className={`rounded-xl border px-3 py-2.5 text-left transition ${
                        categoriaTratamientoSeleccionada === categoria.valor
                          ? "border-cyan-500 bg-cyan-50 text-cyan-900 ring-2 ring-cyan-500/10 dark:bg-cyan-500/10 dark:text-cyan-200"
                          : "border-slate-200 bg-white text-slate-700 hover:border-cyan-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                      }`}
                    >
                      <span className="block text-xs font-extrabold">{categoria.titulo}</span>
                      <span className="mt-1 block text-[10px] leading-4 opacity-70">{categoria.descripcion}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">
                  Seleccionar procedimiento del catálogo
                </label>
                <select
                  value={tratamientoCariesSeleccionado}
                  onChange={(e) => {
                    setTratamientoCariesSeleccionado(e.target.value);
                    setPrecioManualCaries("");
                  }}
                  disabled={cargandoOpcionesCaries || opcionesCategoriaCaries.length === 0}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-cyan-500 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                >
                  <option value="">
                    {cargandoOpcionesCaries
                      ? "Cargando tratamientos..."
                      : opcionesCategoriaCaries.length === 0
                        ? "No hay opciones para esta categoría o dentición"
                        : "Selecciona un procedimiento"}
                  </option>
                  {opcionesCategoriaCaries.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nombre} · {item.precio_configurado
                        ? `S/. ${Number(item.precio).toFixed(2)}${item.precio_referencial ? " (referencial)" : ""}`
                        : "Precio por configurar"}
                    </option>
                  ))}
                </select>

                {tratamientoSeleccionadoActual && (
                  <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{tratamientoSeleccionadoActual.nombre}</p>
                    {tratamientoSeleccionadoActual.descripcion && (
                      <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-400">{tratamientoSeleccionadoActual.descripcion}</p>
                    )}
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      Material o insumo: {tratamientoSeleccionadoActual.material || "No especificado"}
                    </p>
                    {tratamientoSeleccionadoActual.precio_configurado ? (
                      <p className="mt-1 text-xs font-bold text-cyan-700 dark:text-cyan-300">
                        Precio de catálogo: S/. {Number(tratamientoSeleccionadoActual.precio).toFixed(2)}
                        {tratamientoSeleccionadoActual.precio_referencial ? " · Referencial" : ""}
                      </p>
                    ) : (
                      <div className="mt-3">
                        <label className="mb-1 block text-xs font-bold text-amber-800 dark:text-amber-300">
                          Precio para esta propuesta (S/.)
                        </label>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={precioManualCaries}
                          onChange={(e) => setPrecioManualCaries(e.target.value)}
                          placeholder="Ingrese el precio aprobado por la clínica"
                          className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-amber-500 dark:border-amber-500/40 dark:bg-slate-950 dark:text-white"
                        />
                        <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-300">
                          Este importe se guardará en la propuesta del paciente; no modifica el precio general del catálogo.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {errorPropuestaCaries && (
                <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
                  {errorPropuestaCaries}
                </p>
              )}
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={cancelarModalCaries}
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Seguir registrando caras
              </button>
              <button
                type="button"
                disabled={guardandoPropuestaCaries || cargandoOpcionesCaries || !tratamientoCariesSeleccionado || !puedeAgregarPropuesta}
                onClick={confirmarPropuestaCaries}
                className="rounded-xl bg-cyan-600 px-5 py-3 text-sm font-bold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {guardandoPropuestaCaries ? "Agregando..." : "Agregar propuesta"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VENTANA ODONTOGRAMA HISTÓRICO */}
      {odontogramaHistorico && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 shadow-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Odontograma histórico</h3>
                <p className="text-sm text-slate-500 mt-1">Fecha: {new Date(odontogramaHistorico.created_at).toLocaleDateString("es-PE")}</p>
              </div>
              <button onClick={() => setOdontogramaHistorico(null)} className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600">✕ Cerrar</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {(() => {
                const datosHistoricos = odontogramaHistorico.datos || {};
                const metaHistorica = datosHistoricos._meta;
                const tipoHistorico: Denticion = metaHistorica?.denticion === "temporal" || metaHistorica?.denticion === "mixta" || metaHistorica?.denticion === "permanente" ? metaHistorica.denticion : "permanente";
                const dientesHistoricosMixtos: number[] = Array.isArray(metaHistorica?.dientesMixtos) ? metaHistorica.dientesMixtos : [];
                const permitidosHistoricos = tipoHistorico === "temporal" ? dientesTemporales : tipoHistorico === "mixta" ? dientesHistoricosMixtos : dientesPermanentes;

                return gruposDisponibles.map((grupo) => {
                  const dientesGrupo = grupo.dientes.filter((numero) => permitidosHistoricos.includes(numero));
                  return (
                    <div key={grupo.id} className="rounded-xl border border-slate-200 dark:border-slate-700 p-3">
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-3">{grupo.nombre}</p>
                      <div className="grid grid-cols-4 gap-2 justify-items-center">
                        {dientesGrupo.map((diente) => (
                          <Tooth key={diente} numero={diente} estado={datosHistoricos[diente]} onFaceClick={() => {}} />
                        ))}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-xl border p-4 bg-slate-50 dark:bg-slate-800">
                <h4 className="font-bold mb-2">Observaciones clínicas</h4>
                <p className="text-slate-600 dark:text-slate-300">{odontogramaHistorico.observaciones || "Sin observaciones"}</p>
              </div>
              <div className="rounded-xl border p-4 bg-slate-50 dark:bg-slate-800">
                <h4 className="font-bold mb-2">Diagnóstico</h4>
                <p className="text-slate-600 dark:text-slate-300">{odontogramaHistorico.diagnostico || "Sin diagnóstico"}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BOTONES */}
      <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200" />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1" />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={exportarPDF} className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm shadow-sm hover:shadow transition-all duration-200"><span>📄</span>Exportar PDF</button>
            <button onClick={guardarOdontograma} className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 dark:bg-cyan-500 dark:hover:bg-cyan-400 text-white dark:text-slate-950 font-bold text-sm shadow-sm hover:shadow-md transition-all duration-200"><span>💾</span>Guardar odontograma</button>
          </div>
        </div>
      </div>
    </div>
  );
}
