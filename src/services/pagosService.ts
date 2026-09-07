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
    return [];
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
   Se utiliza mientras el usuario escribe.
========================================================== */

export const buscarPacientesPorDni = async (
  dni: string
) => {
  const valor = dni.trim();

  if (!valor) {
    return [];
  }

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
      "Error al buscar coincidencias de pacientes:",
      error
    );

    return [];
  }

  return data ?? [];
};

/* ==========================================================
   OBTENER TRATAMIENTOS PENDIENTES DEL PACIENTE
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

    return [];
  }

  return (data ?? []) as Tratamiento[];
};

/* ==========================================================
   REGISTRAR PAGO
========================================================== */

export const registrarPago = async (
  pacienteId: number,
  tratamientoId: number,
  monto: number
) => {
  const { error } = await supabase
    .from("pagos")
    .insert({
      paciente_id: pacienteId,
      tratamiento_id: tratamientoId,
      monto,
      /*
       * Se mantienen estos campos porque tu tabla actual
       * los utiliza, pero ya NO se muestran al usuario.
       */
      metodo_pago: "No especificado",
      observaciones: "",
    });

  if (error) {
    console.error("Error al registrar pago:", error);
    throw error;
  }
};

/* ==========================================================
   FINALIZAR TRATAMIENTO
========================================================== */

export const finalizarTratamiento = async (
  tratamientoId: number
) => {
  const { error } = await supabase
    .from("tratamientos")
    .update({
      estado: "finalizado",
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
   Se conserva por compatibilidad con el sistema.
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

    return [];
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

    return [];
  }

  return (data ?? []) as Pago[];
};