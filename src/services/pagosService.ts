
import { supabase } from "../lib/supabase";
import type { Pago, Tratamiento } from "../types/pago";

/* ==========================================================
   OBTENER TODOS LOS PAGOS
========================================================== */

export const obtenerPagos = async (): Promise<Pago[]> => {
  const { data, error } = await supabase
    .from("pagos")
    .select(`
      *,
      pacientes (
        nombres,
        apellidos,
        dni
      ),
      tratamientos (
        nombre_tratamiento,
        estado,
        costo
      )
    `)
    .order("fecha_pago", { ascending: false });

  if (error) {
    console.error("Error al obtener pagos:", error);
    throw error;
  }

  return (data ?? []) as Pago[];
};

/* ==========================================================
   BUSCAR PACIENTE POR DNI EXACTO
========================================================== */

export const buscarPacientePorDni = async (dni: string) => {
  const { data, error } = await supabase
    .from("pacientes")
    .select("*")
    .eq("dni", dni)
    .single();

  if (error) {
    console.error("Error al buscar paciente:", error);
    return null;
  }

  return data;
};

/* ==========================================================
   BUSCAR PACIENTES POR DNI PARCIAL
========================================================== */

export const buscarPacientesPorDni = async (
  dni: string
) => {
  const valor = dni.trim();

  if (!valor) return [];

  const { data, error } = await supabase
    .from("pacientes")
    .select(`
      id,
      nombres,
      apellidos,
      dni,
      telefono
    `)
    .ilike("dni", `${valor}%`)
    .order("apellidos", { ascending: true })
    .limit(8);

  if (error) {
    console.error(
      "Error al buscar pacientes:",
      error
    );

    throw error;
  }

  return data ?? [];
};

/* ==========================================================
   OBTENER TRATAMIENTOS PENDIENTES
   FUNCIÓN ORIGINAL: SE CONSERVA POR COMPATIBILIDAD
========================================================== */

export const obtenerTratamientosPaciente = async (
  pacienteId: number
): Promise<Tratamiento[]> => {
  const { data, error } = await supabase
    .from("tratamientos")
    .select("*")
    .eq("paciente_id", pacienteId)
    .eq("estado", "pendiente")
    .order("fecha_inicio", { ascending: false });

  if (error) {
    console.error(
      "Error al obtener tratamientos:",
      error
    );

    throw error;
  }

  return (data ?? []) as Tratamiento[];
};

/* ==========================================================
   OBTENER TRATAMIENTOS PENDIENTES DE COBRO

   El estado clínico del tratamiento es independiente
   del estado financiero.

   Un tratamiento con un pago registrado no vuelve
   a aparecer en la lista de cobros.
========================================================== */

export const obtenerTratamientosPendientesCobro = async (
  pacienteId: number
): Promise<Tratamiento[]> => {

  // Obtener tratamientos del paciente.
  const { data: tratamientos, error: errorTratamientos } =
    await supabase
      .from("tratamientos")
      .select("*")
      .eq("paciente_id", pacienteId)
      .order("fecha_inicio", { ascending: false });

  if (errorTratamientos) {
    console.error(
      "Error al obtener tratamientos:",
      errorTratamientos
    );

    throw errorTratamientos;
  }

  // Obtener pagos relacionados con sus tratamientos.
  const { data: pagos, error: errorPagos } =
    await supabase
      .from("pagos")
      .select("tratamiento_id")
      .eq("paciente_id", pacienteId)
      .not("tratamiento_id", "is", null);

  if (errorPagos) {
    console.error(
      "Error al consultar pagos existentes:",
      errorPagos
    );

    throw errorPagos;
  }

  // Identificar tratamientos que ya tienen un pago.
  const tratamientosPagados = new Set<number>(
    (pagos ?? [])
      .map((pago) => pago.tratamiento_id)
      .filter((id): id is number => id !== null)
  );

  // Mostrar solamente tratamientos sin pago registrado.
  return ((tratamientos ?? []) as Tratamiento[]).filter(
    (tratamiento) => !tratamientosPagados.has(tratamiento.id)
  );
};

/* ==========================================================
   REGISTRAR PAGO COMPLETO

   - Verifica que el tratamiento pertenezca al paciente.
   - Verifica que el importe corresponda al costo total.
   - Evita registrar otro pago si ya existe uno.
   - No modifica el estado clínico del tratamiento.
========================================================== */

export const registrarPago = async (
  pacienteId: number,
  tratamientoId: number,
  monto: number
) => {

  if (
    !Number.isFinite(monto) ||
    monto <= 0
  ) {
    throw new Error("El monto del pago no es válido.");
  }

  // Verificar que el tratamiento pertenezca al paciente.
  const { data: tratamiento, error: errorTratamiento } =
    await supabase
      .from("tratamientos")
      .select("id, paciente_id, costo")
      .eq("id", tratamientoId)
      .eq("paciente_id", pacienteId)
      .maybeSingle();

  if (errorTratamiento) {
    console.error(
      "Error al verificar tratamiento:",
      errorTratamiento
    );

    throw errorTratamiento;
  }

  if (!tratamiento) {
    throw new Error(
      "El tratamiento no pertenece al paciente seleccionado."
    );
  }

  const costoTotal = Number(tratamiento.costo);

  if (
    !Number.isFinite(costoTotal) ||
    costoTotal <= 0
  ) {
    throw new Error(
      "El tratamiento no tiene un costo válido."
    );
  }

  // Comprobar que se esté registrando el pago completo.
  const montoEnCentimos = Math.round(monto * 100);
  const costoEnCentimos = Math.round(costoTotal * 100);

  if (montoEnCentimos !== costoEnCentimos) {
    throw new Error(
      "El importe debe coincidir con el costo total del tratamiento."
    );
  }

  // Evitar registrar un segundo pago para el mismo tratamiento.
  const { data: pagoExistente, error: errorPago } =
    await supabase
      .from("pagos")
      .select("id")
      .eq("paciente_id", pacienteId)
      .eq("tratamiento_id", tratamientoId)
      .limit(1);

  if (errorPago) {
    console.error(
      "Error al verificar pagos anteriores:",
      errorPago
    );

    throw errorPago;
  }

  if (pagoExistente && pagoExistente.length > 0) {
    throw new Error(
      "Este tratamiento ya tiene un pago registrado."
    );
  }

  // Registrar el pago en Supabase.
  const { error } = await supabase
    .from("pagos")
    .insert({
      paciente_id: pacienteId,
      tratamiento_id: tratamientoId,
      monto: costoTotal
    });

  if (error) {
    console.error(
      "Error al registrar pago:",
      error
    );

    throw error;
  }
};

/* ==========================================================
   FINALIZAR TRATAMIENTO

   Se conserva por compatibilidad con otras partes
   del sistema. No se ejecuta al registrar un pago.
========================================================== */

export const finalizarTratamiento = async (
  tratamientoId: number
) => {
  const { error } = await supabase
    .from("tratamientos")
    .update({
      estado: "finalizado"
    })
    .eq("id", tratamientoId);

  if (error) {
    console.error(
      "Error al finalizar tratamiento:",
      error
    );

    throw error;
  }
};

/* ==========================================================
   ACTUALIZAR PAGO
========================================================== */

export const actualizarPago = async (
  id: number,
  datos: {
    monto: number;
    metodo_pago: string;
    observaciones: string;
  }
) => {
  const { error } = await supabase
    .from("pagos")
    .update(datos)
    .eq("id", id);

  if (error) {
    console.error(
      "Error al actualizar pago:",
      error
    );

    throw error;
  }
};

/* ==========================================================
   ELIMINAR PAGO
========================================================== */

export const eliminarPago = async (
  id: number
) => {
  const { error } = await supabase
    .from("pagos")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(
      "Error al eliminar pago:",
      error
    );

    throw error;
  }
};

/* ==========================================================
   RESUMEN PARA DASHBOARD
   SE CONSERVA POR COMPATIBILIDAD
========================================================== */

export const obtenerResumenPagos = async () => {
  const { data, error } = await supabase
    .from("pagos")
    .select("monto, fecha_pago");

  if (error) {
    console.error(
      "Error al obtener resumen:",
      error
    );

    throw error;
  }

  return data ?? [];
};

/* ==========================================================
   OBTENER PAGOS DE UN PACIENTE
========================================================== */

export const obtenerPagosPaciente = async (
  pacienteId: number
): Promise<Pago[]> => {
  const { data, error } = await supabase
    .from("pagos")
    .select(`
      *,
      tratamientos (
        nombre_tratamiento,
        estado,
        costo
      )
    `)
    .eq("paciente_id", pacienteId)
    .order("fecha_pago", { ascending: false });

  if (error) {
    console.error(
      "Error al obtener pagos del paciente:",
      error
    );

    throw error;
  }

  return (data ?? []) as Pago[];
};
