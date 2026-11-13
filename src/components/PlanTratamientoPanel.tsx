import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import jsPDF from "jspdf";

interface Paciente {
  id: number;
  nombres: string;
  apellidos: string;
  dni: string;
  telefono: string | null;
  sexo: string | null;
}

interface CatalogoTratamiento {
  id: number;
  nombre: string;
  precio: number;
  descripcion: string | null;
  diagnostico: string | null;
  clasificacion: string | null;
  material: string | null;
  plantilla_texto: string | null;
  precio_referencial: boolean;
  activo: boolean | null;
  categoria: string;
  denticion_aplicable: "ambas" | "temporal" | "permanente";
  aplica_clasificacion_superficies: boolean;
  precio_configurado: boolean;
}

type CaraOdontograma = "top" | "right" | "bottom" | "left" | "center";
type EstadoOdontograma = "sano" | "caries" | "restaurado" | "extraido";
type ProfundidadCaries = "No especificada" | "Inicial" | "Moderada" | "Extensa";

interface DetallePlan {
  localId: string;
  catalogoTratamientoId: number | null;
  piezaDental: string;
  diagnostico: string;
  clasificacion: string;
  categoriaTratamiento: string;
  material: string;
  profundidad: ProfundidadCaries;
  nombreProcedimiento: string;
  descripcion: string;
  plantillaAplicada: string;
  precioUnitario: number;
  precioReferencial: boolean;
  cantidad: number;
  observaciones: string;
  carasOdontograma: CaraOdontograma[];
  superficiesOdontograma: string[];
  origenPropuestaId: string | null;
}

interface Consulta {
  id: number;
  procedimiento: string;
  costo: number;
  observaciones: string;
  detalles: DetallePlan[];
}

interface OdontogramaReferencia {
  id: number;
  paciente_id: number;
  cita_id: number;
  datos: Record<string, unknown> | null;
  observaciones: string | null;
  diagnostico: string | null;
  created_at: string;
  updated_at: string | null;
}

interface PiezaOdontograma {
  numero: number;
  estados: EstadoOdontograma[];
  caras: CaraOdontograma[];
}

interface PropuestaOdontograma {
  id: string;
  piezaDental: number;
  caras: CaraOdontograma[];
  superficies: string[];
  catalogoTratamientoId: number;
  diagnostico: string;
  clasificacion: string;
  categoria: string;
  aplicaClasificacionSuperficies: boolean;
  precioIngresadoManualmente: boolean;
  profundidad: ProfundidadCaries;
  material: string;
  nombreProcedimiento: string;
  descripcion: string;
  plantillaAplicada: string;
  precioUnitario: number;
  precioReferencial: boolean;
  estado: "pendiente" | "incorporada";
  planId: number | string | null;
  fechaRegistro?: string;
  fechaIncorporacion?: string;
}

const crearConsultas = (cantidad: number): Consulta[] =>
  Array.from({ length: cantidad }, (_, index) => ({
    id: index + 1,
    procedimiento: "",
    costo: 0,
    observaciones: "",
    detalles: [],
  }));

// Reparte los procedimientos importados en bloques equilibrados y en el orden
// recibido del odontograma. No establece prioridad ni criterio clínico.
const distribuirDetallesImportados = (
  consultasBase: Consulta[],
  detallesImportados: DetallePlan[]
): Consulta[] => {
  const base = consultasBase.length > 0 ? consultasBase : crearConsultas(1);
  const resultado = base.map((consulta) => ({
    ...consulta,
    detalles: consulta.detalles.filter((detalle) => !detalle.origenPropuestaId),
  }));

  if (detallesImportados.length === 0) return resultado;

  const cantidadPorConsulta = Math.floor(detallesImportados.length / resultado.length);
  const sobrantes = detallesImportados.length % resultado.length;
  let cursor = 0;

  resultado.forEach((consulta, indice) => {
    const cantidad = cantidadPorConsulta + (indice < sobrantes ? 1 : 0);
    const asignados = detallesImportados.slice(cursor, cursor + cantidad);
    cursor += cantidad;
    consulta.detalles = [...consulta.detalles, ...asignados];
  });

  return resultado;
};

const crearDetalleVacio = (): DetallePlan => ({
  localId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  catalogoTratamientoId: null,
  piezaDental: "",
  diagnostico: "",
  clasificacion: "",
  categoriaTratamiento: "Restaurador",
  material: "",
  profundidad: "No especificada",
  nombreProcedimiento: "",
  descripcion: "",
  plantillaAplicada: "",
  precioUnitario: 0,
  precioReferencial: false,
  cantidad: 1,
  observaciones: "",
  carasOdontograma: [],
  superficiesOdontograma: [],
  origenPropuestaId: null,
});

const obtenerSubtotalDetalle = (detalle: DetallePlan) =>
  Math.max(0, Number(detalle.precioUnitario) || 0) *
  Math.max(1, Number(detalle.cantidad) || 1);

const obtenerTotalConsulta = (consulta: Consulta) =>
  Math.max(0, Number(consulta.costo) || 0) +
  consulta.detalles.reduce(
    (total, detalle) => total + obtenerSubtotalDetalle(detalle),
    0
  );

const obtenerDescripcionConsulta = (consulta: Consulta) => {
  const procedimientos = consulta.detalles
    .map((detalle) => detalle.nombreProcedimiento.trim())
    .filter(Boolean);

  return [consulta.procedimiento.trim(), ...procedimientos]
    .filter(Boolean)
    .join(" | ");
};

const obtenerNombreMedico = (medico: any): string => {
  if (!medico) return "No registrado";
  if (medico.nombre_completo) return medico.nombre_completo;
  const nombre = [medico.nombres, medico.apellidos].filter(Boolean).join(" ");
  return nombre || "No registrado";
};

const PIEZAS_FDI_VALIDAS = new Set<number>([
  ...Array.from({ length: 8 }, (_, i) => 18 - i),
  ...Array.from({ length: 8 }, (_, i) => 21 + i),
  ...Array.from({ length: 8 }, (_, i) => 38 - i),
  ...Array.from({ length: 8 }, (_, i) => 41 + i),
  ...Array.from({ length: 5 }, (_, i) => 55 - i),
  ...Array.from({ length: 5 }, (_, i) => 61 + i),
  ...Array.from({ length: 5 }, (_, i) => 75 - i),
  ...Array.from({ length: 5 }, (_, i) => 81 + i),
]);

const CARAS_ODONTOGRAMA: CaraOdontograma[] = [
  "top",
  "right",
  "bottom",
  "left",
  "center",
];

const obtenerEtiquetaSuperficie = (numero: number, cara: CaraOdontograma): string => {
  const cuadrante = Math.floor(numero / 10);
  const posicion = numero % 10;
  const esArcadaSuperior = [1, 2, 5, 6].includes(cuadrante);
  const esLadoDerechoPaciente = [1, 4, 5, 8].includes(cuadrante);
  const esPosterior = posicion >= 4;

  if (cara === "center") return esPosterior ? "Oclusal" : "Incisal";
  if (cara === "top") return esArcadaSuperior ? "Vestibular" : "Lingual";
  if (cara === "bottom") return esArcadaSuperior ? "Palatina" : "Vestibular";

  const esMesial = esLadoDerechoPaciente ? cara === "right" : cara === "left";
  return esMesial ? "Mesial" : "Distal";
};

const ETIQUETAS_ESTADO: Record<EstadoOdontograma, string> = {
  sano: "Sano",
  caries: "Caries",
  restaurado: "Restaurado",
  extraido: "Extraído",
};

const obtenerPiezasOdontograma = (
  datos: Record<string, unknown> | null | undefined
): PiezaOdontograma[] => {
  if (!datos || typeof datos !== "object") return [];

  return Object.entries(datos)
    .map(([clave, valor]) => {
      const numero = Number(clave);
      if (
        clave === "_meta" ||
        !Number.isInteger(numero) ||
        !PIEZAS_FDI_VALIDAS.has(numero) ||
        !valor ||
        typeof valor !== "object" ||
        Array.isArray(valor)
      ) {
        return null;
      }

      const registroCaras = valor as Record<string, unknown>;
      const asignaciones = CARAS_ODONTOGRAMA.flatMap((cara) => {
        const estado = registroCaras[cara];
        return typeof estado === "string" &&
          ["sano", "caries", "restaurado", "extraido"].includes(estado)
          ? [{ cara, estado: estado as EstadoOdontograma }]
          : [];
      });

      if (asignaciones.length === 0) return null;

      return {
        numero,
        estados: Array.from(new Set(asignaciones.map((item) => item.estado))),
        caras: asignaciones.map((item) => item.cara),
      };
    })
    .filter((pieza): pieza is PiezaOdontograma => pieza !== null)
    .sort((a, b) => a.numero - b.numero);
};

const obtenerPropuestasOdontograma = (
  datos: Record<string, unknown> | null | undefined
): PropuestaOdontograma[] => {
  if (!datos || typeof datos !== "object") return [];

  const meta = datos._meta;
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return [];

  const propuestas = (meta as Record<string, unknown>).procedimientosPropuestos;
  if (!Array.isArray(propuestas)) return [];

  return propuestas.flatMap((elemento) => {
    if (
      !elemento ||
      typeof elemento !== "object" ||
      Array.isArray(elemento)
    ) {
      return [];
    }

    const item = elemento as Record<string, unknown>;
    const id = String(item.id || "");
    const piezaDental = Number(item.piezaDental);
    const catalogoTratamientoId = Number(item.catalogoTratamientoId);
    const nombreProcedimiento = String(item.nombreProcedimiento || "").trim();

    if (
      !id ||
      !Number.isInteger(piezaDental) ||
      !PIEZAS_FDI_VALIDAS.has(piezaDental) ||
      !Number.isInteger(catalogoTratamientoId) ||
      catalogoTratamientoId <= 0 ||
      !nombreProcedimiento
    ) {
      return [];
    }

    const caras = Array.isArray(item.caras)
      ? item.caras.filter(
          (cara): cara is CaraOdontograma =>
            typeof cara === "string" &&
            CARAS_ODONTOGRAMA.includes(cara as CaraOdontograma)
        )
      : [];
    const superficies = Array.isArray(item.superficies)
      ? item.superficies.filter((superficie): superficie is string => typeof superficie === "string")
      : caras.map((cara) => obtenerEtiquetaSuperficie(piezaDental, cara));
    const profundidadValor = item.profundidad;
    const profundidad: ProfundidadCaries =
      profundidadValor === "Inicial" || profundidadValor === "Moderada" || profundidadValor === "Extensa"
        ? profundidadValor
        : "No especificada";
    const categoria = ["Preventivo", "Restaurador", "Pulpar", "Quirurgico"].includes(String(item.categoria))
      ? String(item.categoria)
      : "Restaurador";
    const aplicaClasificacionSuperficies = typeof item.aplicaClasificacionSuperficies === "boolean"
      ? item.aplicaClasificacionSuperficies
      : categoria === "Restaurador";
    const clasificacion =
      !aplicaClasificacionSuperficies || item.clasificacion === "No aplica"
        ? "No aplica"
        : caras.length > 0
          ? caras.length === 1
            ? "Simple"
            : caras.length === 2
              ? "Compuesta"
              : "Compleja"
          : item.clasificacion === "Compuesta" || item.clasificacion === "Compleja"
            ? item.clasificacion
            : item.clasificacion === "Profunda"
              ? "Compuesta"
              : "Simple";

    return [
      {
        id,
        piezaDental,
        caras,
        superficies,
        catalogoTratamientoId,
        diagnostico: String(item.diagnostico || ""),
        clasificacion,
        categoria,
        aplicaClasificacionSuperficies,
        precioIngresadoManualmente: Boolean(item.precioIngresadoManualmente),
        profundidad,
        material: String(item.material || ""),
        nombreProcedimiento,
        descripcion: String(item.descripcion || ""),
        plantillaAplicada: String(item.plantillaAplicada || ""),
        precioUnitario: Math.max(0, Number(item.precioUnitario) || 0),
        precioReferencial: Boolean(item.precioReferencial),
        estado: item.estado === "incorporada" ? "incorporada" : "pendiente",
        planId:
          typeof item.planId === "number" || typeof item.planId === "string"
            ? item.planId
            : null,
        fechaRegistro:
          typeof item.fechaRegistro === "string" ? item.fechaRegistro : undefined,
        fechaIncorporacion:
          typeof item.fechaIncorporacion === "string"
            ? item.fechaIncorporacion
            : undefined,
      },
    ];
  });
};

export const PlanTratamientoPanel = () => {
  const [buscarPaciente, setBuscarPaciente] = useState("");
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [pacienteSeleccionado, setPacienteSeleccionado] =
    useState<Paciente | null>(null);
  const [catalogo, setCatalogo] = useState<CatalogoTratamiento[]>([]);
  const [cargandoCatalogo, setCargandoCatalogo] = useState(true);
  const [errorCatalogo, setErrorCatalogo] = useState("");
  const [odontogramaReferencia, setOdontogramaReferencia] =
    useState<OdontogramaReferencia | null>(null);
  const [cargandoOdontograma, setCargandoOdontograma] = useState(false);
  const [errorOdontograma, setErrorOdontograma] = useState("");
  const [cantidadConsultas, setCantidadConsultas] = useState(1);
  const [costoTotal, setCostoTotal] = useState(0);
  const [tituloPlan, setTituloPlan] = useState("");
  const [consultas, setConsultas] = useState<Consulta[]>(crearConsultas(1));
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState<"exito" | "error" | "aviso">("aviso");

  const totalConsultas = useMemo(
    () => consultas.reduce((total, consulta) => total + obtenerTotalConsulta(consulta), 0),
    [consultas]
  );

  const cantidadProcedimientos = useMemo(
    () => consultas.reduce((total, consulta) => total + consulta.detalles.length, 0),
    [consultas]
  );

  const piezasOdontograma = useMemo(
    () => obtenerPiezasOdontograma(odontogramaReferencia?.datos),
    [odontogramaReferencia?.datos]
  );

  const propuestasOdontograma = useMemo(
    () => obtenerPropuestasOdontograma(odontogramaReferencia?.datos),
    [odontogramaReferencia?.datos]
  );

  const propuestasPendientesOdontograma = useMemo(
    () => propuestasOdontograma.filter((propuesta) => propuesta.estado === "pendiente"),
    [propuestasOdontograma]
  );

  useEffect(() => {
    const cargarCatalogo = async () => {
      setCargandoCatalogo(true);
      setErrorCatalogo("");

      const { data, error } = await supabase
        .from("catalogo_tratamientos")
        .select(
          "id,nombre,precio,descripcion,diagnostico,clasificacion,material,plantilla_texto,precio_referencial,activo,categoria,denticion_aplicable,aplica_clasificacion_superficies,precio_configurado"
        )
        .eq("activo", true)
        .order("nombre", { ascending: true });

      if (error) {
        console.error("Error al cargar el catálogo de tratamientos:", error);
        setErrorCatalogo(
          "No se pudo cargar el catálogo. Puedes continuar registrando procedimientos manualmente."
        );
        setCatalogo([]);
      } else {
        setCatalogo((data || []) as CatalogoTratamiento[]);
      }

      setCargandoCatalogo(false);
    };

    void cargarCatalogo();
  }, []);

  useEffect(() => {
    const pacienteId = pacienteSeleccionado?.id;

    if (!pacienteId) {
      setOdontogramaReferencia(null);
      setErrorOdontograma("");
      setCargandoOdontograma(false);
      return;
    }

    let cancelado = false;

    const cargarUltimoOdontograma = async () => {
      setCargandoOdontograma(true);
      setErrorOdontograma("");
      setOdontogramaReferencia(null);

      const { data, error } = await supabase
        .from("odontogramas")
        .select(
          "id,paciente_id,cita_id,datos,observaciones,diagnostico,created_at,updated_at"
        )
        .eq("paciente_id", pacienteId)
        .order("updated_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cancelado) return;

      if (error) {
        console.error("Error al consultar el último odontograma del paciente:", error);
        setErrorOdontograma(
          "No se pudo consultar el odontograma guardado. Puedes continuar con el plan y registrar la pieza FDI manualmente."
        );
        setCantidadConsultas(1);
        setConsultas(crearConsultas(1));
        setOdontogramaReferencia(null);
      } else {
        const datosOdontograma = (data?.datos || {}) as Record<string, unknown>;
        const metaOdontograma = datosOdontograma._meta;
        const meta = metaOdontograma && typeof metaOdontograma === "object" && !Array.isArray(metaOdontograma)
          ? metaOdontograma as Record<string, unknown>
          : {};
        const cantidadGuardada = Number(meta.consultasEstimadas);
        const cantidadInicial = Number.isInteger(cantidadGuardada) && cantidadGuardada >= 1 && cantidadGuardada <= 20
          ? cantidadGuardada
          : 1;

        setCantidadConsultas(cantidadInicial);
        setConsultas(crearConsultas(cantidadInicial));
        setOdontogramaReferencia((data || null) as OdontogramaReferencia | null);
      }

      setCargandoOdontograma(false);
    };

    void cargarUltimoOdontograma();

    return () => {
      cancelado = true;
    };
  }, [pacienteSeleccionado?.id]);

  // Importa únicamente propuestas pendientes y las distribuye automáticamente
  // entre las consultas seleccionadas, sin volver a pedir al médico los datos clínicos.
  useEffect(() => {
    if (
      !pacienteSeleccionado ||
      !odontogramaReferencia ||
      cargandoOdontograma ||
      odontogramaReferencia.paciente_id !== pacienteSeleccionado.id ||
      propuestasPendientesOdontograma.length === 0
    ) {
      return;
    }

    setConsultas((anteriores) => {
      const idsYaAgregados = new Set(
        anteriores.flatMap((consulta) =>
          consulta.detalles
            .map((detalle) => detalle.origenPropuestaId)
            .filter((id): id is string => Boolean(id))
        )
      );

      const propuestasNuevas = propuestasPendientesOdontograma.filter(
        (propuesta) => !idsYaAgregados.has(propuesta.id)
      );

      if (propuestasNuevas.length === 0) return anteriores;

      const detallesImportadosExistentes = anteriores.flatMap((consulta) =>
        consulta.detalles.filter((detalle) => Boolean(detalle.origenPropuestaId))
      );

      const detallesNuevos: DetallePlan[] = propuestasNuevas.map((propuesta) => ({
        localId: `odonto-${propuesta.id}`,
        catalogoTratamientoId: propuesta.catalogoTratamientoId,
        piezaDental: String(propuesta.piezaDental),
        diagnostico: propuesta.diagnostico,
        clasificacion: propuesta.clasificacion,
        categoriaTratamiento: propuesta.categoria,
        material: propuesta.material,
        profundidad: propuesta.profundidad,
        nombreProcedimiento: propuesta.nombreProcedimiento,
        descripcion: propuesta.descripcion,
        plantillaAplicada: propuesta.plantillaAplicada,
        precioUnitario: propuesta.precioUnitario,
        precioReferencial: propuesta.precioReferencial,
        cantidad: 1,
        observaciones: "",
        carasOdontograma: propuesta.caras,
        superficiesOdontograma: propuesta.superficies,
        origenPropuestaId: propuesta.id,
      }));

      return distribuirDetallesImportados(anteriores, [
        ...detallesImportadosExistentes,
        ...detallesNuevos,
      ]);
    });
  }, [
    pacienteSeleccionado?.id,
    odontogramaReferencia?.id,
    cargandoOdontograma,
    propuestasPendientesOdontograma,
  ]);

  useEffect(() => {
    if (pacienteSeleccionado) {
      setPacientes([]);
      return;
    }

    const termino = buscarPaciente.trim();
    if (!termino) {
      setPacientes([]);
      return;
    }

    let cancelado = false;
    const temporizador = window.setTimeout(async () => {
      const terminoSeguro = termino.replace(/[%_,]/g, " ").trim();
      const { data, error } = await supabase
        .from("pacientes")
        .select("id,nombres,apellidos,dni,telefono,sexo")
        .or(
          `dni.ilike.%${terminoSeguro}%,nombres.ilike.%${terminoSeguro}%,apellidos.ilike.%${terminoSeguro}%`
        )
        .limit(8);

      if (cancelado) return;

      if (error) {
        console.error("Error al buscar pacientes:", error);
        setPacientes([]);
        return;
      }

      setPacientes((data || []) as Paciente[]);
    }, 300);

    return () => {
      cancelado = true;
      window.clearTimeout(temporizador);
    };
  }, [buscarPaciente, pacienteSeleccionado]);

  const mostrarMensaje = (
    texto: string,
    tipo: "exito" | "error" | "aviso" = "aviso"
  ) => {
    setMensaje(texto);
    setTipoMensaje(tipo);
  };

  const seleccionarPaciente = (paciente: Paciente) => {
    if (pacienteSeleccionado?.id !== paciente.id) {
      setCantidadConsultas(1);
      setConsultas(crearConsultas(1));
      setOdontogramaReferencia(null);
      setTituloPlan("");
      setCostoTotal(0);
    }
    setPacienteSeleccionado(paciente);
    setBuscarPaciente(`${paciente.nombres} ${paciente.apellidos}`);
    setPacientes([]);
    setMensaje("");
  };

  const limpiarPlan = () => {
    setBuscarPaciente("");
    setPacientes([]);
    setPacienteSeleccionado(null);
    setCantidadConsultas(1);
    setCostoTotal(0);
    setTituloPlan("");
    setConsultas(crearConsultas(1));
    setMensaje("");
    setOdontogramaReferencia(null);
  };

  const cambiarCantidadConsultas = (cantidad: number) => {
    const cantidadValida = Math.min(20, Math.max(1, Math.floor(cantidad || 1)));
    if (cantidadValida === consultas.length) {
      setCantidadConsultas(cantidadValida);
      return;
    }

    if (cantidadValida < consultas.length) {
      const sesionesQueSeEliminarian = consultas.slice(cantidadValida);
      const contienenInformacionManual = sesionesQueSeEliminarian.some(
        (consulta) =>
          consulta.detalles.some((detalle) => !detalle.origenPropuestaId) ||
          consulta.procedimiento.trim() !== "" ||
          consulta.observaciones.trim() !== "" ||
          consulta.costo > 0
      );

      if (contienenInformacionManual) {
        mostrarMensaje(
          "No se puede reducir la cantidad porque una de las consultas que se quitarían contiene información agregada manualmente. Mueve o retira primero esa información.",
          "aviso"
        );
        return;
      }
    }

    const detallesImportados = consultas.flatMap((consulta) =>
      consulta.detalles.filter((detalle) => Boolean(detalle.origenPropuestaId))
    );

    setCantidadConsultas(cantidadValida);
    setConsultas((anteriores) => {
      const consultasVacias = crearConsultas(cantidadValida);
      const nuevasConsultas = Array.from({ length: cantidadValida }, (_, indice) => {
        const existente = anteriores[indice];
        return existente
          ? {
              ...existente,
              detalles: existente.detalles.filter((detalle) => !detalle.origenPropuestaId),
            }
          : consultasVacias[indice];
      });

      return distribuirDetallesImportados(nuevasConsultas, detallesImportados);
    });

    if (detallesImportados.length > 0) {
      mostrarMensaje(
        `${detallesImportados.length} procedimiento(s) importado(s) se reorganizaron automáticamente entre ${cantidadValida} consulta(s). Revisa la distribución clínica antes de guardar.`,
        "aviso"
      );
    }
  };

  const redistribuirProcedimientosImportados = () => {
    const detallesImportados = consultas
      .flatMap((consulta) => consulta.detalles)
      .filter((detalle) => Boolean(detalle.origenPropuestaId))
      .sort((a, b) => Number(a.piezaDental) - Number(b.piezaDental));

    if (detallesImportados.length === 0) {
      mostrarMensaje("No hay procedimientos importados del odontograma para redistribuir.", "aviso");
      return;
    }

    setConsultas((anteriores) =>
      distribuirDetallesImportados(anteriores, detallesImportados)
    );
    mostrarMensaje(
      `${detallesImportados.length} procedimiento(s) importado(s) redistribuido(s) entre ${consultas.length} consulta(s). Verifica que la organización sea clínicamente adecuada.`,
      "aviso"
    );
  };

  const distribuirCosto = (total: number) => {
    const totalValido = Math.max(0, Number(total) || 0);
    setCostoTotal(totalValido);

    const cantidad = consultas.length;
    const importeBase = Math.floor((totalValido / cantidad) * 100) / 100;
    let acumulado = 0;

    setConsultas((anteriores) =>
      anteriores.map((consulta, index) => {
        const importe =
          index === anteriores.length - 1
            ? Math.round((totalValido - acumulado) * 100) / 100
            : importeBase;
        acumulado += importe;
        return { ...consulta, costo: importe };
      })
    );
  };

  const actualizarConsulta = (
    id: number,
    campo: "procedimiento" | "costo" | "observaciones",
    valor: string | number
  ) => {
    setConsultas((anteriores) =>
      anteriores.map((consulta) =>
        consulta.id === id ? { ...consulta, [campo]: valor } : consulta
      )
    );
  };

  const agregarDetalle = (consultaId: number) => {
    setConsultas((anteriores) =>
      anteriores.map((consulta) =>
        consulta.id === consultaId
          ? { ...consulta, detalles: [...consulta.detalles, crearDetalleVacio()] }
          : consulta
      )
    );
  };

  const eliminarDetalle = (consultaId: number, localId: string) => {
    setConsultas((anteriores) =>
      anteriores.map((consulta) =>
        consulta.id === consultaId
          ? {
              ...consulta,
              detalles: consulta.detalles.filter((detalle) => detalle.localId !== localId),
            }
          : consulta
      )
    );
  };

  const moverDetalle = (
    consultaOrigenId: number,
    consultaDestinoId: number,
    localId: string
  ) => {
    if (consultaOrigenId === consultaDestinoId) return;

    setConsultas((anteriores) => {
      const consultaOrigen = anteriores.find(
        (consulta) => consulta.id === consultaOrigenId
      );
      const detalle = consultaOrigen?.detalles.find(
        (item) => item.localId === localId
      );

      if (!detalle) return anteriores;

      return anteriores.map((consulta) => {
        if (consulta.id === consultaOrigenId) {
          return {
            ...consulta,
            detalles: consulta.detalles.filter((item) => item.localId !== localId),
          };
        }
        if (consulta.id === consultaDestinoId) {
          return { ...consulta, detalles: [...consulta.detalles, detalle] };
        }
        return consulta;
      });
    });
  };

  const actualizarDetalle = <K extends keyof DetallePlan,>(
    consultaId: number,
    localId: string,
    campo: K,
    valor: DetallePlan[K]
  ) => {
    setConsultas((anteriores) =>
      anteriores.map((consulta) =>
        consulta.id === consultaId
          ? {
              ...consulta,
              detalles: consulta.detalles.map((detalle) => {
                if (detalle.localId !== localId) return detalle;

                const actualizado = { ...detalle, [campo]: valor } as DetallePlan;

                // Si cambia la pieza o la profundidad de un detalle manual vinculado al catálogo,
                // se vuelve a completar la plantilla con los datos disponibles.
                if (
                  (campo === "piezaDental" || campo === "profundidad") &&
                  detalle.catalogoTratamientoId
                ) {
                  const tratamiento = catalogo.find(
                    (item) => item.id === detalle.catalogoTratamientoId
                  );
                  if (tratamiento?.plantilla_texto) {
                    const piezaValor = campo === "piezaDental" ? String(valor || "{pieza}") : detalle.piezaDental || "{pieza}";
                    const profundidadValor = campo === "profundidad" ? String(valor) : detalle.profundidad;
                    actualizado.plantillaAplicada = tratamiento.plantilla_texto
                      .replace(/\{pieza\}/g, piezaValor)
                      .replace(/\{superficies\}/g, detalle.superficiesOdontograma.join(", ") || "No especificadas")
                      .replace(/\{profundidad\}/g, profundidadValor)
                      .replace(/\{clasificacion\}/g, (detalle.clasificacion || "").toLowerCase());
                  }
                }

                return actualizado;
              }),
            }
          : consulta
      )
    );
  };

  const seleccionarTratamientoCatalogo = (
    consultaId: number,
    localId: string,
    catalogoId: string
  ) => {
    if (!catalogoId) {
      actualizarDetalle(consultaId, localId, "catalogoTratamientoId", null);
      return;
    }

    const tratamiento = catalogo.find((item) => item.id === Number(catalogoId));
    if (!tratamiento) return;

    setConsultas((anteriores) =>
      anteriores.map((consulta) =>
        consulta.id === consultaId
          ? {
              ...consulta,
              detalles: consulta.detalles.map((detalle) =>
                detalle.localId === localId
                  ? {
                      ...detalle,
                      catalogoTratamientoId: tratamiento.id,
                      nombreProcedimiento: tratamiento.nombre,
                      diagnostico: tratamiento.diagnostico || "",
                      clasificacion: tratamiento.aplica_clasificacion_superficies
                        ? tratamiento.clasificacion || ""
                        : "No aplica",
                      categoriaTratamiento: tratamiento.categoria || "Restaurador",
                      material: tratamiento.material || "",
                      descripcion: tratamiento.descripcion || "",
                      plantillaAplicada: (tratamiento.plantilla_texto || "")
                        .replace(/\{pieza\}/g, detalle.piezaDental || "{pieza}")
                        .replace(/\{superficies\}/g, detalle.superficiesOdontograma.join(", ") || "No especificadas")
                        .replace(/\{profundidad\}/g, detalle.profundidad)
                        .replace(/\{clasificacion\}/g, String(tratamiento.clasificacion || "").toLowerCase()),
                      precioUnitario: Number(tratamiento.precio) || 0,
                      precioReferencial: Boolean(tratamiento.precio_referencial),
                    }
                  : detalle
              ),
            }
          : consulta
      )
    );
  };

  const validarPlan = (): string | null => {
    if (!pacienteSeleccionado) return "Primero selecciona un paciente.";
    if (!tituloPlan.trim()) return "Escribe el título del plan de tratamiento.";

    const hayContenidoEnElPlan = consultas.some(
      (consulta) => Boolean(consulta.procedimiento.trim()) || consulta.detalles.length > 0
    );
    if (!hayContenidoEnElPlan) {
      return "Agrega al menos un procedimiento o una indicación en alguna consulta.";
    }

    for (const consulta of consultas) {
      // Las consultas vacías se pueden conservar como sesiones pendientes de planificación.
      if (!consulta.procedimiento.trim() && consulta.detalles.length === 0) {
        continue;
      }

      for (const detalle of consulta.detalles) {
        if (!detalle.nombreProcedimiento.trim()) {
          return `Indica el nombre del procedimiento en la consulta ${consulta.id}.`;
        }
        if (
          !Number.isFinite(Number(detalle.precioUnitario)) ||
          Number(detalle.precioUnitario) < 0
        ) {
          return `Revisa el precio del procedimiento "${detalle.nombreProcedimiento}".`;
        }
        if (
          !Number.isInteger(Number(detalle.cantidad)) ||
          Number(detalle.cantidad) < 1
        ) {
          return `La cantidad de "${detalle.nombreProcedimiento}" debe ser un número entero mayor que cero.`;
        }
        if (detalle.piezaDental.trim()) {
          const pieza = Number(detalle.piezaDental);
          if (!Number.isInteger(pieza) || !PIEZAS_FDI_VALIDAS.has(pieza)) {
            return `La pieza dental "${detalle.piezaDental}" no corresponde a una numeración FDI válida.`;
          }
        }
      }
    }

    return null;
  };

  const exportarPDF = async () => {
    if (!pacienteSeleccionado) {
      mostrarMensaje("Selecciona un paciente antes de exportar el PDF.", "error");
      return;
    }

    let nombreMedico = "No registrado";
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (authData.user) {
        const { data: medico } = await supabase
          .from("medicos")
          .select("*")
          .eq("auth_user_id", authData.user.id)
          .maybeSingle();
        nombreMedico = obtenerNombreMedico(medico);
      }
    } catch (error) {
      console.warn("No se pudo recuperar el nombre del médico para el PDF:", error);
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
    const colorPrincipal: [number, number, number] = [8, 145, 178];
    const colorTexto: [number, number, number] = [30, 41, 59];
    const colorSecundario: [number, number, number] = [100, 116, 139];
    const colorLinea: [number, number, number] = [226, 232, 240];
    let y = 18;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(17);
    doc.setTextColor(...colorPrincipal);
    doc.text("VILLA 920 DENTAL", margin, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...colorSecundario);
    doc.text("SALUD · ESTÉTICA · BIENESTAR", margin, y + 5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...colorTexto);
    doc.text("PLAN DE TRATAMIENTO", pageWidth - margin, y + 1, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...colorSecundario);
    doc.text(`Fecha de emisión: ${fechaEmision}`, pageWidth - margin, y + 6, {
      align: "right",
    });

    y += 15;
    doc.setDrawColor(...colorPrincipal);
    doc.setLineWidth(0.7);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(...colorLinea);
    doc.roundedRect(margin, y, contentWidth, 34, 2, 2, "FD");

    const col2 = margin + contentWidth / 2 + 4;
    const dibujarDato = (label: string, value: string, x: number, yy: number) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(...colorSecundario);
      doc.text(label.toUpperCase(), x, yy);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...colorTexto);
      const lineas = doc.splitTextToSize(value || "No registrado", contentWidth / 2 - 12);
      doc.text(lineas.slice(0, 2), x, yy + 5);
    };

    dibujarDato(
      "Paciente",
      `${pacienteSeleccionado.nombres} ${pacienteSeleccionado.apellidos}`,
      margin + 5,
      y + 7
    );
    dibujarDato("DNI", pacienteSeleccionado.dni, col2, y + 7);
    dibujarDato("Teléfono", pacienteSeleccionado.telefono || "No registrado", margin + 5, y + 21);
    dibujarDato("Profesional", nombreMedico, col2, y + 21);

    y += 42;
    doc.setFillColor(236, 254, 255);
    doc.setDrawColor(165, 243, 252);
    doc.roundedRect(margin, y, contentWidth, 16, 2, 2, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...colorPrincipal);
    doc.text("NOMBRE DEL PLAN", margin + 4, y + 6);
    doc.setFontSize(10);
    doc.setTextColor(...colorTexto);
    doc.text(
      doc.splitTextToSize(
        tituloPlan.trim() || "Plan de tratamiento odontológico",
        contentWidth - 8
      ).slice(0, 1),
      margin + 4,
      y + 12
    );
    y += 24;

    if (odontogramaReferencia) {
      const lineasReferencia: string[] = [];
      if (odontogramaReferencia.diagnostico?.trim()) {
        lineasReferencia.push(
          `Diagnóstico registrado: ${odontogramaReferencia.diagnostico.trim()}`
        );
      }
      if (odontogramaReferencia.observaciones?.trim()) {
        lineasReferencia.push(`Observaciones: ${odontogramaReferencia.observaciones.trim()}`);
      }
      if (piezasOdontograma.length > 0) {
        const resumenPiezas = piezasOdontograma
          .map(
            (pieza) =>
              `${pieza.numero} (${pieza.estados
                .map((estado) => ETIQUETAS_ESTADO[estado])
                .join(", ")})`
          )
          .join(" · ");
        lineasReferencia.push(`Piezas registradas en odontograma: ${resumenPiezas}`);
      }
      if (propuestasOdontograma.length > 0) {
        lineasReferencia.push(
          `Propuestas de tratamiento: ${propuestasOdontograma.length} (${propuestasPendientesOdontograma.length} pendientes)`
        );
      }

      if (lineasReferencia.length > 0) {
        const textoReferencia = lineasReferencia.flatMap((linea) =>
          doc.splitTextToSize(linea, contentWidth - 10)
        );
        const altoReferencia = Math.max(16, textoReferencia.length * 4 + 10);

        if (y + altoReferencia > pageHeight - 25) {
          doc.addPage();
          y = 18;
        }

        doc.setFillColor(240, 249, 255);
        doc.setDrawColor(186, 230, 253);
        doc.roundedRect(margin, y, contentWidth, altoReferencia, 2, 2, "FD");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(...colorPrincipal);
        doc.text("REFERENCIA DEL ODONTOGRAMA", margin + 4, y + 6);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(...colorTexto);
        doc.text(textoReferencia, margin + 4, y + 11);
        y += altoReferencia + 6;
      }
    }

    const dibujarEncabezadoTabla = () => {
      doc.setFillColor(8, 145, 178);
      doc.rect(margin, y, contentWidth, 8, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(255, 255, 255);
      doc.text("CONSULTA", margin + 3, y + 5.3);
      doc.text("PROCEDIMIENTOS / DESCRIPCIÓN", margin + 25, y + 5.3);
      doc.text("COSTO", pageWidth - margin - 3, y + 5.3, { align: "right" });
      y += 8;
    };

    dibujarEncabezadoTabla();

    consultas.forEach((consulta) => {
      const lineas: string[] = [];
      if (consulta.procedimiento.trim()) lineas.push(consulta.procedimiento.trim());
      consulta.detalles.forEach((detalle) => {
        const pieza = detalle.piezaDental ? `Pieza ${detalle.piezaDental}: ` : "";
        const clasificacion = detalle.clasificacion ? ` (${detalle.clasificacion})` : "";
        const material = detalle.material ? ` · ${detalle.material}` : "";
        lineas.push(
          `${pieza}${detalle.nombreProcedimiento}${clasificacion}${material} · ${detalle.cantidad} x S/. ${Number(detalle.precioUnitario).toFixed(2)}`
        );
        if (detalle.diagnostico) lineas.push(`Diagnóstico: ${detalle.diagnostico}`);
        if (detalle.descripcion?.trim()) lineas.push(`Descripción: ${detalle.descripcion.trim()}`);
        if (detalle.superficiesOdontograma.length > 0) {
          lineas.push(`Superficies afectadas: ${detalle.superficiesOdontograma.join(", ")}`);
        }
        if (detalle.profundidad !== "No especificada") {
          lineas.push(`Profundidad clínica: ${detalle.profundidad}`);
        }
        if (detalle.plantillaAplicada.trim()) {
          lineas.push(`Plantilla: ${detalle.plantillaAplicada.trim()}`);
        }
        if (detalle.precioReferencial) lineas.push("Precio referencial del catálogo.");
        if (detalle.observaciones) lineas.push(`Observación: ${detalle.observaciones}`);
      });
      if (consulta.observaciones.trim()) lineas.push(`Notas: ${consulta.observaciones.trim()}`);
      if (consulta.costo > 0) {
        lineas.push(`Importe manual de consulta: S/. ${Number(consulta.costo).toFixed(2)}`);
      }

      const texto = lineas.join("\n") || "Sin descripción";
      const textoEnvuelto = doc.splitTextToSize(texto, contentWidth - 58);
      const altoFila = Math.max(12, textoEnvuelto.length * 4 + 6);

      if (y + altoFila > pageHeight - 25) {
        doc.addPage();
        y = 18;
        dibujarEncabezadoTabla();
      }

      doc.setDrawColor(...colorLinea);
      doc.setFillColor(255, 255, 255);
      doc.rect(margin, y, contentWidth, altoFila, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...colorTexto);
      doc.text(String(consulta.id).padStart(2, "0"), margin + 4, y + 7);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...colorTexto);
      doc.text(textoEnvuelto, margin + 25, y + 6);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text(
        `S/. ${obtenerTotalConsulta(consulta).toFixed(2)}`,
        pageWidth - margin - 3,
        y + 7,
        { align: "right" }
      );
      y += altoFila;
    });

    y += 7;
    if (y + 25 > pageHeight - 20) {
      doc.addPage();
      y = 20;
    }

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(...colorLinea);
    doc.roundedRect(margin, y, contentWidth, 23, 2, 2, "FD");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...colorSecundario);
    doc.text("Consultas programadas", margin + 5, y + 8);
    doc.text("Procedimientos registrados", margin + 5, y + 16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colorTexto);
    doc.text(String(consultas.length), margin + 66, y + 8);
    doc.text(String(cantidadProcedimientos), margin + 66, y + 16);
    doc.setFontSize(8);
    doc.setTextColor(...colorSecundario);
    doc.text("COSTO TOTAL DEL PLAN", pageWidth - margin - 5, y + 8, { align: "right" });
    doc.setFontSize(13);
    doc.setTextColor(...colorPrincipal);
    doc.text(`S/. ${totalConsultas.toFixed(2)}`, pageWidth - margin - 5, y + 17, {
      align: "right",
    });

    const totalPaginas = doc.getNumberOfPages();
    for (let pagina = 1; pagina <= totalPaginas; pagina += 1) {
      doc.setPage(pagina);
      doc.setDrawColor(...colorLinea);
      doc.line(margin, pageHeight - 13, pageWidth - margin, pageHeight - 13);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...colorSecundario);
      doc.text("Documento de planificación del tratamiento odontológico.", margin, pageHeight - 8);
      doc.text(
        `VILLA 920 DENTAL · Página ${pagina} de ${totalPaginas}`,
        pageWidth - margin,
        pageHeight - 8,
        { align: "right" }
      );
    }

    const apellidoArchivo = pacienteSeleccionado.apellidos
      .trim()
      .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]+/g, "_");
    const nombreArchivo = `Plan_Tratamiento_${apellidoArchivo}_${today.toISOString().slice(0, 10)}.pdf`;
    doc.save(nombreArchivo);
    mostrarMensaje("PDF del plan de tratamiento generado correctamente.", "exito");
  };

  const guardarPlan = async () => {
    const errorValidacion = validarPlan();
    if (errorValidacion) {
      mostrarMensaje(errorValidacion, "error");
      return;
    }

    const consultasActivas = consultas.filter(
      (consulta) =>
        Boolean(consulta.procedimiento.trim()) ||
        consulta.detalles.length > 0 ||
        Boolean(consulta.observaciones.trim()) ||
        consulta.costo > 0
    );
    const numeroPorConsultaId = new Map<number, number>();
    consultasActivas.forEach((consulta, indice) => {
      numeroPorConsultaId.set(consulta.id, indice + 1);
    });

    setGuardando(true);
    setMensaje("");

    let planCreadoId: string | number | null = null;
    let consultasInsertadas = false;
    let detallesInsertados = false;

    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        throw new Error("No se pudo validar tu sesión. Inicia sesión nuevamente.");
      }

      const { data: medico, error: medicoError } = await supabase
        .from("medicos")
        .select("*")
        .eq("auth_user_id", authData.user.id)
        .maybeSingle();

      if (medicoError || !medico) {
        throw new Error(
          "No se encontró un médico vinculado a tu usuario. Verifica el registro de medicos.auth_user_id."
        );
      }

      const { data: plan, error: planError } = await supabase
        .from("planes_tratamiento")
        .insert({
          paciente_id: pacienteSeleccionado!.id,
          medico_id: medico.id,
          titulo: tituloPlan.trim(),
          cantidad_consultas: consultasActivas.length,
          costo_total: Number(totalConsultas.toFixed(2)),
          estado: "pendiente",
        })
        .select()
        .single();

      if (planError || !plan) {
        throw new Error(planError?.message || "No se pudo crear el plan de tratamiento.");
      }
      planCreadoId = plan.id as string | number;

      const consultasParaGuardar = consultasActivas.map((consulta) => ({
        plan_id: plan.id,
        numero_consulta: numeroPorConsultaId.get(consulta.id) ?? consulta.id,
        descripcion: obtenerDescripcionConsulta(consulta) || "Consulta odontológica",
        costo: Number(obtenerTotalConsulta(consulta).toFixed(2)),
        estado: "pendiente",
        observaciones: consulta.observaciones.trim() || null,
      }));

      const { data: consultasGuardadas, error: consultasError } = await supabase
        .from("plan_consultas")
        .insert(consultasParaGuardar)
        .select("id,numero_consulta");

      if (consultasError || !consultasGuardadas) {
        throw new Error(
          consultasError?.message || "El plan se creó, pero no se pudieron guardar sus consultas."
        );
      }
      consultasInsertadas = true;

      const consultaIdPorNumero = new Map<number, string | number>();
      consultasGuardadas.forEach((consulta: any) => {
        consultaIdPorNumero.set(Number(consulta.numero_consulta), consulta.id as string | number);
      });

      const idsPropuestasIncluidas = Array.from(
        new Set(
          consultasActivas
            .flatMap((consulta) =>
              consulta.detalles.map((detalle) => detalle.origenPropuestaId)
            )
            .filter((id): id is string => Boolean(id))
        )
      );

      const detallesParaGuardar = consultasActivas.flatMap((consulta) =>
        consulta.detalles.map((detalle) => {
          const notas = [
            detalle.observaciones.trim(),
            detalle.superficiesOdontograma.length > 0
              ? `Superficies afectadas: ${detalle.superficiesOdontograma.join(", ")}`
              : "",
            detalle.profundidad !== "No especificada"
              ? `Profundidad clínica: ${detalle.profundidad}`
              : "",
            detalle.precioReferencial ? "Precio referencial según catálogo." : "",
          ]
            .filter(Boolean)
            .join(" | ");

          const descripcionPersistida = [
            detalle.descripcion.trim(),
            detalle.profundidad !== "No especificada"
              ? `Profundidad clínica: ${detalle.profundidad}`
              : "",
          ]
            .filter(Boolean)
            .join(" | ");

          return {
            plan_id: plan.id,
            plan_consulta_id: consultaIdPorNumero.get(
              numeroPorConsultaId.get(consulta.id) ?? consulta.id
            ) ?? null,
            catalogo_tratamiento_id: detalle.catalogoTratamientoId,
            pieza_dental: detalle.piezaDental.trim() ? Number(detalle.piezaDental) : null,
            diagnostico: detalle.diagnostico.trim() || null,
            clasificacion: detalle.clasificacion.trim() || null,
            categoria_tratamiento: detalle.categoriaTratamiento.trim() || null,
            material: detalle.material.trim() || null,
            nombre_procedimiento: detalle.nombreProcedimiento.trim(),
            descripcion: descripcionPersistida || null,
            plantilla_aplicada: detalle.plantillaAplicada.trim() || null,
            precio_unitario: Number(detalle.precioUnitario),
            cantidad: Number(detalle.cantidad),
            estado: "pendiente",
            observaciones: notas || null,
          };
        })
      );

      if (detallesParaGuardar.length > 0) {
        const { error: detallesError } = await supabase
          .from("plan_detalles")
          .insert(detallesParaGuardar);

        if (detallesError) {
          throw new Error(
            `El plan y sus consultas se guardaron, pero hubo un problema al registrar los procedimientos: ${detallesError.message}`
          );
        }
      }
      // Si no hay detalles (solo indicaciones/consultas vacías), este paso
      // también se considera completado para no revertir un plan válido.
      detallesInsertados = true;

      const { error: eventoError } = await supabase.from("plan_eventos").insert({
        plan_id: plan.id,
        plan_detalle_id: null,
        historia_clinica_id: null,
        medico_id: medico.id,
        tipo_evento: "plan_creado",
        estado_anterior: null,
        estado_nuevo: "pendiente",
        descripcion: "Se creó un nuevo plan de tratamiento.",
        datos_anteriores: null,
        datos_nuevos: {
          titulo: tituloPlan.trim(),
          cantidad_consultas: consultasActivas.length,
          cantidad_procedimientos: detallesParaGuardar.length,
          costo_total: Number(totalConsultas.toFixed(2)),
          odontograma_id: odontogramaReferencia?.id ?? null,
          odontograma_cita_id: odontogramaReferencia?.cita_id ?? null,
          odontograma_fecha: odontogramaReferencia
            ? odontogramaReferencia.updated_at || odontogramaReferencia.created_at
            : null,
          propuestas_odontograma_ids: idsPropuestasIncluidas,
        },
      });

      let errorMarcarPropuestas = "";

      // Solo se marcan las propuestas que realmente fueron incluidas en este plan.
      if (idsPropuestasIncluidas.length > 0 && odontogramaReferencia) {
        const datosActuales: Record<string, unknown> = {
          ...(odontogramaReferencia.datos || {}),
        };
        const metaOriginal = datosActuales._meta;
        const metaActual =
          metaOriginal && typeof metaOriginal === "object" && !Array.isArray(metaOriginal)
            ? (metaOriginal as Record<string, unknown>)
            : {};
        const listaOriginal = metaActual.procedimientosPropuestos;
        const propuestasOriginales = Array.isArray(listaOriginal) ? listaOriginal : [];
        const idsIncluidos = new Set(idsPropuestasIncluidas);
        const fechaIncorporacion = new Date().toISOString();

        const propuestasActualizadas = propuestasOriginales.map((elemento) => {
          if (!elemento || typeof elemento !== "object" || Array.isArray(elemento)) {
            return elemento;
          }
          const propuesta = elemento as Record<string, unknown>;
          if (!idsIncluidos.has(String(propuesta.id))) return elemento;
          return {
            ...propuesta,
            estado: "incorporada",
            planId: plan.id,
            fechaIncorporacion,
          };
        });

        const datosActualizados: Record<string, unknown> = {
          ...datosActuales,
          _meta: {
            ...metaActual,
            procedimientosPropuestos: propuestasActualizadas,
          },
        };

        const { error: errorActualizacion } = await supabase
          .from("odontogramas")
          .update({
            datos: datosActualizados,
            updated_at: fechaIncorporacion,
          })
          .eq("id", odontogramaReferencia.id);

        if (errorActualizacion) {
          console.error(
            "El plan se guardó, pero no se pudieron marcar las propuestas:",
            errorActualizacion
          );
          errorMarcarPropuestas = errorActualizacion.message;
        } else {
          setOdontogramaReferencia((actual) =>
            actual
              ? {
                  ...actual,
                  datos: datosActualizados,
                  updated_at: fechaIncorporacion,
                }
              : actual
          );
        }
      }

      if (eventoError || errorMarcarPropuestas) {
        const avisos: string[] = [];
        if (eventoError) {
          console.warn("El plan se guardó, pero no se pudo registrar el evento:", eventoError);
          avisos.push("El plan se guardó, pero no se pudo completar el registro de auditoría.");
        }
        if (errorMarcarPropuestas) {
          avisos.push(
            "El plan se guardó, pero no se pudieron marcar las propuestas del odontograma como incorporadas. Verifica ese registro antes de volver a crear otro plan con ellas."
          );
        }
        mostrarMensaje(avisos.join(" "), "aviso");
      } else {
        mostrarMensaje(
          "Plan de tratamiento guardado correctamente, incluidos sus procedimientos y propuestas del odontograma.",
          "exito"
        );
      }

      setCostoTotal(0);
    } catch (error) {
      console.error("Error al guardar el plan de tratamiento:", error);

      if (planCreadoId !== null && !detallesInsertados) {
        try {
          if (consultasInsertadas) {
            await supabase.from("plan_consultas").delete().eq("plan_id", planCreadoId);
          }
          await supabase.from("planes_tratamiento").delete().eq("id", planCreadoId);
        } catch (errorLimpieza) {
          console.error("No se pudo revertir el registro incompleto:", errorLimpieza);
        }
      }

      const mensajeError =
        error instanceof Error
          ? error.message
          : "Ocurrió un error inesperado al guardar el plan.";
      mostrarMensaje(mensajeError, "error");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Plan de Tratamiento
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Planificación clínica y seguimiento del tratamiento odontológico.
        </p>
      </div>

      {/* SELECCIÓN DEL PACIENTE */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400 text-xl">
              👤
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Paciente</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Selecciona al paciente para iniciar su plan de tratamiento.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={limpiarPlan}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-semibold transition"
          >
            Limpiar
          </button>
        </div>

        <div className="p-6">
          <div className="max-w-2xl">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Buscar paciente
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">🔎</span>
              <input
                value={buscarPaciente}
                onChange={(e) => {
                  setBuscarPaciente(e.target.value);
                  if (pacienteSeleccionado) {
                    setPacienteSeleccionado(null);
                    setConsultas(crearConsultas(cantidadConsultas));
                    setTituloPlan("");
                    setCostoTotal(0);
                  }
                }}
                placeholder="Buscar por DNI, nombres o apellidos..."
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl pl-11 pr-4 py-3.5 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10"
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Escribe al menos parte del DNI o nombre del paciente.
            </p>
          </div>

          {pacientes.length > 0 && (
            <div className="mt-4 max-w-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-lg">
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
                <p className="text-xs uppercase tracking-wider font-bold text-slate-500">
                  Pacientes encontrados
                </p>
              </div>
              {pacientes.map((paciente) => (
                <button
                  key={paciente.id}
                  type="button"
                  onClick={() => seleccionarPaciente(paciente)}
                  className="w-full text-left px-4 py-4 flex items-center gap-4 border-b border-slate-200 dark:border-slate-800 last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition"
                >
                  <div className="w-10 h-10 shrink-0 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400 font-bold">
                    {paciente.nombres?.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-slate-900 dark:text-white font-semibold truncate">
                      {paciente.nombres} {paciente.apellidos}
                    </p>
                    <p className="text-sm text-slate-500 mt-0.5">DNI: {paciente.dni}</p>
                  </div>
                  <span className="ml-auto text-slate-400 text-lg">→</span>
                </button>
              ))}
            </div>
          )}

          {pacienteSeleccionado && (
            <div className="mt-6 rounded-2xl border border-cyan-200 dark:border-cyan-500/20 bg-gradient-to-br from-cyan-50 via-white to-slate-50 dark:from-cyan-500/5 dark:via-slate-950 dark:to-slate-950 overflow-hidden">
              <div className="px-5 py-4 border-b border-cyan-100 dark:border-cyan-500/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400 text-xl font-bold">
                    {pacienteSeleccionado.nombres?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-cyan-600 dark:text-cyan-400 font-bold">
                      Paciente seleccionado
                    </p>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                      {pacienteSeleccionado.nombres} {pacienteSeleccionado.apellidos}
                    </h3>
                  </div>
                </div>
                <span className="inline-flex items-center gap-2 w-fit px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Paciente activo
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-slate-200 dark:bg-slate-800/50">
                <div className="bg-white dark:bg-slate-950/80 p-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">DNI</p>
                  <p className="text-slate-900 dark:text-white font-semibold mt-1">{pacienteSeleccionado.dni}</p>
                </div>
                <div className="bg-white dark:bg-slate-950/80 p-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Teléfono</p>
                  <p className="text-slate-900 dark:text-white font-semibold mt-1">{pacienteSeleccionado.telefono || "No registrado"}</p>
                </div>
                <div className="bg-white dark:bg-slate-950/80 p-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Sexo</p>
                  <p className="text-slate-900 dark:text-white font-semibold mt-1">{pacienteSeleccionado.sexo || "No registrado"}</p>
                </div>
                <div className="bg-white dark:bg-slate-950/80 p-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Estado</p>
                  <p className="text-emerald-600 dark:text-emerald-400 font-semibold mt-1">Listo para tratamiento</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {pacienteSeleccionado && (
        <>
          {/* REFERENCIA DEL ODONTOGRAMA GUARDADO */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-600 dark:text-cyan-400 mb-1">
                  Referencia clínica
                </p>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Odontograma del paciente
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Consulta el último registro guardado antes de definir los procedimientos.
                </p>
              </div>
              {odontogramaReferencia && (
                <span className="w-fit rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-800 dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-300">
                  Actualizado: {new Date(odontogramaReferencia.updated_at || odontogramaReferencia.created_at).toLocaleDateString("es-PE")}
                </span>
              )}
            </div>

            {cargandoOdontograma && (
              <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                Consultando el último odontograma guardado...
              </p>
            )}

            {!cargandoOdontograma && errorOdontograma && (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
                {errorOdontograma}
              </p>
            )}

            {!cargandoOdontograma && !errorOdontograma && !odontogramaReferencia && (
              <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
                Este paciente todavía no tiene un odontograma guardado. Puedes continuar con la planificación y consignar la pieza dental manualmente.
              </p>
            )}

            {odontogramaReferencia && odontogramaReferencia.paciente_id === pacienteSeleccionado.id && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <div className="rounded-xl border border-violet-100 bg-violet-50/70 p-4 dark:border-violet-500/20 dark:bg-violet-500/5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-violet-700 dark:text-violet-300 mb-1">
                      Diagnóstico registrado
                    </p>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                      {odontogramaReferencia.diagnostico?.trim() || "Sin diagnóstico registrado en el odontograma."}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                      Observaciones clínicas
                    </p>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                      {odontogramaReferencia.observaciones?.trim() || "Sin observaciones registradas en el odontograma."}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">Piezas registradas</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Piezas y caras que tienen estados registrados en el odontograma.
                      </p>
                    </div>
                    <span className="w-fit rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {piezasOdontograma.length} {piezasOdontograma.length === 1 ? "pieza" : "piezas"}
                    </span>
                  </div>

                  {piezasOdontograma.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      El odontograma está guardado, pero aún no contiene estados de caras dentales registrados.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {piezasOdontograma.map((pieza) => (
                        <span
                          key={pieza.numero}
                          title={`Superficies: ${pieza.caras.map((cara) => obtenerEtiquetaSuperficie(pieza.numero, cara)).join(", ")}`}
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                        >
                          <strong className="text-slate-900 dark:text-white">{pieza.numero}</strong>
                          <span className="text-slate-600 dark:text-slate-300">
                            {pieza.estados.map((estado) => ETIQUETAS_ESTADO[estado]).join(" / ")}
                          </span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {propuestasOdontograma.length > 0 && (
                  <div className="rounded-xl border border-cyan-200 bg-cyan-50/60 p-4 dark:border-cyan-500/20 dark:bg-cyan-500/5">
                    <div className="mb-3">
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        Tratamientos seleccionados en el odontograma
                      </h3>
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                        Las propuestas pendientes se importan con sus datos clínicos y se distribuyen automáticamente según la cantidad de consultas seleccionada. Puedes cambiar la consulta de cada procedimiento antes de guardar.
                      </p>
                    </div>
                    <div className="space-y-2">
                      {propuestasOdontograma.map((propuesta) => (
                        <div
                          key={propuesta.id}
                          className="flex flex-col gap-2 rounded-lg border border-white bg-white p-3 dark:border-slate-700 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                              Pieza {propuesta.piezaDental} · {propuesta.nombreProcedimiento}
                            </p>
                            <p className="mt-1 text-xs font-semibold text-cyan-700 dark:text-cyan-300">
                              {propuesta.categoria} · {propuesta.clasificacion}
                              {propuesta.material ? ` · ${propuesta.material}` : ""}
                            </p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                              {propuesta.superficies.length > 0
                                ? `Superficies: ${propuesta.superficies.join(", ")}`
                                : "Sin superficies específicas registradas"}
                            </p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                              Profundidad clínica: {propuesta.profundidad}
                            </p>
                            <p className="mt-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                              S/. {propuesta.precioUnitario.toFixed(2)}
                              {propuesta.precioReferencial && " · Precio referencial"}
                            </p>
                          </div>
                          <span
                            className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-bold ${
                              propuesta.estado === "incorporada"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                                : "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
                            }`}
                          >
                            {propuesta.estado === "incorporada"
                              ? "Ya incorporada a un plan"
                              : "Pendiente · cargada en el plan"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Las superficies registradas son una referencia clínica. La clasificación se calcula por cantidad de superficies (1 simple, 2 compuesta, 3 o más compleja); la profundidad se registra por separado. El odontólogo valida los hallazgos y confirma el tratamiento y material.
                </p>
              </div>
            )}
          </section>

          {/* CONFIGURACIÓN DEL PLAN */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Configuración del tratamiento</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Define las consultas y organiza los procedimientos clínicos.
                </p>
              </div>
              <div className="w-full lg:max-w-md">
                <label className="text-sm text-slate-600 dark:text-slate-400">Título del plan de tratamiento</label>
                <input
                  type="text"
                  value={tituloPlan}
                  onChange={(e) => setTituloPlan(e.target.value)}
                  placeholder="Ej. Tratamiento integral odontológico"
                  className="mt-2 w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full lg:w-auto">
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-slate-600 dark:text-slate-400">Consultas estimadas</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={cantidadConsultas}
                    onChange={(e) => cambiarCantidadConsultas(Number(e.target.value))}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white outline-none transition focus:border-cyan-500"
                  />
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    Cantidad recibida del odontograma. Puedes ajustarla aquí y los procedimientos importados se redistribuirán automáticamente.
                  </p>
                </div>
                <div>
                  <label className="text-sm text-slate-600 dark:text-slate-400">Importe manual a distribuir (opcional)</label>
                  <div className="flex mt-2">
                    <span className="flex items-center px-3 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 border-r-0 rounded-l-xl text-slate-600 dark:text-slate-300">S/.</span>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={costoTotal}
                      onFocus={(e) => e.currentTarget.select()}
                      onChange={(e) => setCostoTotal(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full sm:w-40 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-r-xl px-4 py-3 text-slate-900 dark:text-white outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-cyan-50 dark:bg-cyan-500/5 border border-cyan-200 dark:border-cyan-500/20">
              <div>
                <p className="text-slate-900 dark:text-white font-semibold">Distribución del importe manual</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Se distribuirá entre las consultas. Los procedimientos del catálogo se sumarán por separado.
                </p>
              </div>
              <button
                type="button"
                onClick={() => distribuirCosto(costoTotal)}
                className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold transition shadow-sm"
              >
                Distribuir importe
              </button>
            </div>
          </section>

          {/* CONSULTAS Y PROCEDIMIENTOS */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Planificación de consultas</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Los procedimientos del odontograma se distribuyen automáticamente entre las consultas estimadas. Revisa la propuesta y utiliza el selector de cada procedimiento para cambiarlo de sesión cuando sea necesario.
                </p>
              </div>
              <div className="flex flex-col sm:items-end gap-2">
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  Total del plan: <span className="text-cyan-600 dark:text-cyan-400 font-bold">S/. {totalConsultas.toFixed(2)}</span>
                </div>
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <button
                    type="button"
                    onClick={redistribuirProcedimientosImportados}
                    disabled={!consultas.some((consulta) => consulta.detalles.some((detalle) => Boolean(detalle.origenPropuestaId)))}
                    className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 text-xs font-semibold transition"
                  >
                    Reorganizar tratamientos
                  </button>
                  <button
                    type="button"
                    onClick={() => cambiarCantidadConsultas(consultas.length + 1)}
                    disabled={consultas.length >= 20}
                    className="px-3 py-2 rounded-lg border border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100 disabled:opacity-50 dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-300 text-xs font-semibold transition"
                  >
                    + Agregar consulta
                  </button>
                </div>
              </div>
            </div>

            {propuestasPendientesOdontograma.length > 0 && (
              <div className="mb-5 rounded-xl border border-cyan-200 bg-cyan-50/70 px-4 py-3 text-xs text-cyan-900 dark:border-cyan-500/20 dark:bg-cyan-500/5 dark:text-cyan-200">
                <strong>Distribución automática orientativa:</strong> el sistema reparte los procedimientos por cantidad y orden de registro. No determina prioridades clínicas ni decide etapas de tratamiento; el odontólogo debe revisar y confirmar cada consulta.
              </div>
            )}

            {errorCatalogo && (
              <div className="mb-5 p-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300 text-sm">
                {errorCatalogo}
              </div>
            )}
            {cargandoCatalogo && (
              <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">Cargando catálogo de tratamientos...</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {consultas.map((consulta) => (
                <article key={consulta.id} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-bold text-cyan-600 dark:text-cyan-400">Consulta {consulta.id}</h3>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">Sesión {consulta.id}</span>
                  </div>

                  <label className="text-sm text-slate-600 dark:text-slate-400">Resumen o indicaciones de la consulta</label>
                  <textarea
                    rows={3}
                    value={consulta.procedimiento}
                    onChange={(e) => actualizarConsulta(consulta.id, "procedimiento", e.target.value)}
                    placeholder="Ej. Evaluación, control, indicaciones generales..."
                    className="mt-2 w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10 resize-y"
                  />

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Procedimientos clínicos</p>
                    <button
                      type="button"
                      onClick={() => agregarDetalle(consulta.id)}
                      className="px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition"
                    >
                      + Agregar
                    </button>
                  </div>

                  {consulta.detalles.length === 0 && (
                    <div className="mt-3 p-3 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
                      Todavía no hay procedimientos agregados a esta consulta.
                    </div>
                  )}

                  <div className="mt-3 space-y-4">
                    {consulta.detalles.map((detalle, indice) => (
                      <div key={detalle.localId} className="rounded-xl border border-cyan-200 dark:border-cyan-500/20 bg-white dark:bg-slate-900 p-3 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold uppercase tracking-wide text-cyan-700 dark:text-cyan-300">Procedimiento {indice + 1}</span>
                          <button
                            type="button"
                            onClick={() => eliminarDetalle(consulta.id, detalle.localId)}
                            className="text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400"
                          >
                            Eliminar
                          </button>
                        </div>

                        {detalle.origenPropuestaId && (
                          <div className="rounded-lg border border-cyan-100 bg-cyan-50 p-2 dark:border-cyan-500/20 dark:bg-cyan-500/5">
                            <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-cyan-700 dark:text-cyan-300">
                              Procedimiento importado del odontograma
                            </p>
                            <label className="mb-1 block text-xs text-slate-600 dark:text-slate-400">
                              Asignar a consulta
                            </label>
                            <select
                              value={consulta.id}
                              onChange={(e) =>
                                moverDetalle(consulta.id, Number(e.target.value), detalle.localId)
                              }
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                            >
                              {consultas.map((destino) => (
                                <option key={destino.id} value={destino.id}>
                                  Consulta {destino.id}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div>
                          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Seleccionar del catálogo</label>
                          <select
                            value={detalle.catalogoTratamientoId ?? ""}
                            onChange={(e) => seleccionarTratamientoCatalogo(consulta.id, detalle.localId, e.target.value)}
                            disabled={Boolean(detalle.origenPropuestaId)}
                            className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-cyan-500 disabled:opacity-70"
                          >
                            <option value="">Procedimiento manual / sin catálogo</option>
                            {catalogo.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.categoria} · {item.nombre} · {item.precio_configurado
                                ? `S/. ${Number(item.precio).toFixed(2)}${item.precio_referencial ? " (referencial)" : ""}`
                                : "Precio por configurar"}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Nombre del procedimiento</label>
                          <input
                            value={detalle.nombreProcedimiento}
                            onChange={(e) => actualizarDetalle(consulta.id, detalle.localId, "nombreProcedimiento", e.target.value)}
                            placeholder="Nombre del procedimiento"
                            disabled={Boolean(detalle.origenPropuestaId)}
                            className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-cyan-500 disabled:opacity-70"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Pieza dental (FDI)</label>
                            <input
                              value={detalle.piezaDental}
                              onChange={(e) => actualizarDetalle(consulta.id, detalle.localId, "piezaDental", e.target.value.replace(/\D/g, "").slice(0, 2))}
                              placeholder="Ej. 16 o 55"
                              inputMode="numeric"
                              disabled={Boolean(detalle.origenPropuestaId)}
                              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-cyan-500 disabled:opacity-70"
                            />
                            {piezasOdontograma.length > 0 && (
                              <select
                                value=""
                                onChange={(e) => {
                                  if (e.target.value) {
                                    actualizarDetalle(consulta.id, detalle.localId, "piezaDental", e.target.value);
                                  }
                                }}
                                disabled={Boolean(detalle.origenPropuestaId)}
                                className="mt-2 w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-700 dark:text-slate-300 outline-none focus:border-cyan-500 disabled:opacity-70"
                              >
                                <option value="">Tomar pieza del odontograma...</option>
                                {piezasOdontograma.map((pieza) => (
                                  <option key={pieza.numero} value={pieza.numero}>
                                    {pieza.numero} · {pieza.estados.map((estado) => ETIQUETAS_ESTADO[estado]).join(" / ")}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Diagnóstico</label>
                            <input
                              value={detalle.diagnostico}
                              onChange={(e) => actualizarDetalle(consulta.id, detalle.localId, "diagnostico", e.target.value)}
                              placeholder="Diagnóstico"
                              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-cyan-500"
                            />
                            {odontogramaReferencia?.diagnostico?.trim() && (
                              <button
                                type="button"
                                onClick={() => actualizarDetalle(consulta.id, detalle.localId, "diagnostico", odontogramaReferencia.diagnostico!.trim())}
                                className="mt-2 text-left text-[11px] font-semibold text-cyan-700 hover:text-cyan-800 dark:text-cyan-300 dark:hover:text-cyan-200"
                              >
                                Usar diagnóstico del odontograma
                              </button>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Categoría del tratamiento</label>
                          <input
                            value={detalle.categoriaTratamiento}
                            onChange={(e) => actualizarDetalle(consulta.id, detalle.localId, "categoriaTratamiento", e.target.value)}
                            placeholder="Ej. Restaurador, Pulpar, Preventivo"
                            disabled={Boolean(detalle.origenPropuestaId)}
                            className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-cyan-500 disabled:opacity-70"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Clasificación</label>
                            <input
                              value={detalle.clasificacion}
                              onChange={(e) => actualizarDetalle(consulta.id, detalle.localId, "clasificacion", e.target.value)}
                              placeholder="Ej. Simple"
                              disabled={Boolean(detalle.origenPropuestaId)}
                              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-cyan-500 disabled:opacity-70"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Material</label>
                            <input
                              value={detalle.material}
                              onChange={(e) => actualizarDetalle(consulta.id, detalle.localId, "material", e.target.value)}
                              placeholder="Ej. Resina"
                              disabled={Boolean(detalle.origenPropuestaId)}
                              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-cyan-500 disabled:opacity-70"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Profundidad clínica</label>
                            <select
                              value={detalle.profundidad}
                              onChange={(e) => actualizarDetalle(consulta.id, detalle.localId, "profundidad", e.target.value as ProfundidadCaries)}
                              disabled={Boolean(detalle.origenPropuestaId)}
                              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-cyan-500 disabled:opacity-70"
                            >
                              <option value="No especificada">No especificada</option>
                              <option value="Inicial">Inicial</option>
                              <option value="Moderada">Moderada</option>
                              <option value="Extensa">Extensa</option>
                            </select>
                          </div>
                          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
                            <p className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">Superficies registradas</p>
                            <p className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                              {detalle.superficiesOdontograma.length > 0 ? detalle.superficiesOdontograma.join(", ") : "No especificadas"}
                            </p>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Descripción</label>
                          <textarea
                            rows={2}
                            value={detalle.descripcion}
                            onChange={(e) => actualizarDetalle(consulta.id, detalle.localId, "descripcion", e.target.value)}
                            placeholder="Descripción clínica del procedimiento"
                            className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-cyan-500 resize-y"
                          />
                        </div>

                        {detalle.plantillaAplicada && (
                          <div className="rounded-lg bg-cyan-50 dark:bg-cyan-500/5 border border-cyan-100 dark:border-cyan-500/20 p-2">
                            <p className="text-xs font-semibold text-cyan-800 dark:text-cyan-300 mb-1">Plantilla aplicada del catálogo</p>
                            <p className="text-xs text-cyan-900 dark:text-cyan-100 whitespace-pre-wrap">{detalle.plantillaAplicada}</p>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Precio unitario (S/.)</label>
                            <input
                              type="number"
                              min={0}
                              step="0.01"
                              value={detalle.precioUnitario}
                              onChange={(e) => actualizarDetalle(consulta.id, detalle.localId, "precioUnitario", Math.max(0, Number(e.target.value) || 0))}
                              disabled={Boolean(detalle.origenPropuestaId)}
                              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-cyan-500 disabled:opacity-70"
                            />
                            {detalle.precioReferencial && (
                              <p className="mt-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                                Precio referencial obtenido del catálogo.
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Cantidad</label>
                            <input
                              type="number"
                              min={1}
                              step={1}
                              value={detalle.cantidad}
                              onChange={(e) => actualizarDetalle(consulta.id, detalle.localId, "cantidad", Math.max(1, Math.floor(Number(e.target.value) || 1)))}
                              disabled={Boolean(detalle.origenPropuestaId)}
                              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-cyan-500 disabled:opacity-70"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Observaciones del procedimiento</label>
                          <textarea
                            rows={2}
                            value={detalle.observaciones}
                            onChange={(e) => actualizarDetalle(consulta.id, detalle.localId, "observaciones", e.target.value)}
                            placeholder="Observaciones clínicas"
                            className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-cyan-500 resize-y"
                          />
                        </div>

                        <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800 pt-2 text-sm">
                          <span className="text-slate-500 dark:text-slate-400">Subtotal</span>
                          <span className="font-bold text-slate-900 dark:text-white">S/. {obtenerSubtotalDetalle(detalle).toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 space-y-3 border-t border-slate-200 dark:border-slate-800 pt-4">
                    <div>
                      <label className="block text-sm text-slate-600 dark:text-slate-400">Importe manual / adicional de la consulta (S/.)</label>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={consulta.costo}
                        onChange={(e) => actualizarConsulta(consulta.id, "costo", Math.max(0, Number(e.target.value) || 0))}
                        className="mt-2 w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-600 dark:text-slate-400">Observaciones de la consulta</label>
                      <textarea
                        rows={2}
                        value={consulta.observaciones}
                        onChange={(e) => actualizarConsulta(consulta.id, "observaciones", e.target.value)}
                        placeholder="Notas generales de esta consulta..."
                        className="mt-2 w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-cyan-500 resize-y"
                      />
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-slate-100 dark:bg-slate-900 px-3 py-2">
                      <span className="text-xs text-slate-500 dark:text-slate-400">Total de la consulta</span>
                      <span className="font-bold text-cyan-700 dark:text-cyan-300">S/. {obtenerTotalConsulta(consulta).toFixed(2)}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <p className="text-sm text-slate-500 dark:text-slate-400">Costo total del plan</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">S/. {totalConsultas.toFixed(2)}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <p className="text-sm text-slate-500 dark:text-slate-400">Consultas programadas</p>
                <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400 mt-1">{consultas.length}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <p className="text-sm text-slate-500 dark:text-slate-400">Procedimientos detallados</p>
                <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400 mt-1">{cantidadProcedimientos}</p>
              </div>
            </div>
          </section>

          {mensaje && (
            <div
              className={`p-4 rounded-xl border text-sm ${
                tipoMensaje === "exito"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-300"
                  : tipoMensaje === "error"
                    ? "bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-300"
                    : "bg-cyan-50 border-cyan-200 text-cyan-800 dark:bg-cyan-500/5 dark:border-cyan-500/20 dark:text-cyan-300"
              }`}
            >
              {mensaje}
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <button
              type="button"
              onClick={exportarPDF}
              className="px-6 py-3 rounded-xl border border-cyan-600 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-50 dark:hover:bg-cyan-500/10 font-semibold transition"
            >
              📄 Exportar PDF
            </button>
            <button
              type="button"
              onClick={guardarPlan}
              disabled={guardando || cargandoCatalogo}
              className="px-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold shadow-lg transition"
            >
              {guardando ? "Guardando..." : "💾 Guardar plan de tratamiento"}
            </button>
          </div>
        </>
      )}
    </div>
  );
};
