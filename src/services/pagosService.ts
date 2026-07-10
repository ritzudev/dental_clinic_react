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

  return data as Pago[];
};

/* ==========================================================
   BUSCAR PACIENTE POR DNI
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
   OBTENER TRATAMIENTOS DEL PACIENTE
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
    console.error("Error al obtener tratamientos:", error);
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
  monto: number,
  metodoPago: string,
  observaciones: string
) => {
  const { error } = await supabase
    .from("pagos")
    .insert({
      paciente_id: pacienteId,
      tratamiento_id: tratamientoId,
      monto,
      metodo_pago: metodoPago,
      observaciones,
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
      estado: "finalizado"
    })
    .eq("id", tratamientoId);

  if (error) {
    console.error("Error al finalizar tratamiento:", error);
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
    console.error("Error al actualizar pago:", error);
    throw error;
  }
};

/* ==========================================================
   ELIMINAR PAGO
========================================================== */
export const eliminarPago = async (id: number) => {
  const { error } = await supabase
    .from("pagos")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error al eliminar pago:", error);
    throw error;
  }
};

/* ==========================================================
   RESUMEN PARA DASHBOARD
========================================================== */
export const obtenerResumenPagos = async () => {
  const { data, error } = await supabase
    .from("pagos")
    .select("monto, fecha_pago");

  if (error) {
    console.error("Error al obtener resumen:", error);
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
      tratamientos(
        nombre_tratamiento,
        estado,
        costo
      )
    `)

    .eq("paciente_id", pacienteId)

    .order("fecha_pago", { ascending: false });

  if (error) {

    console.error("Error al obtener pagos:", error);

    return [];

  }

  return (data ?? []) as Pago[];

};