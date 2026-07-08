export interface Pago {
  id: number;
  paciente_id: number;
  tratamiento_id: number | null;
  monto: number;
  metodo_pago: string | null;
  fecha_pago: string;
  observaciones: string | null;
  created_at: string;

  pacientes?: {
    nombres: string;
    apellidos: string;
    dni: string;
  };

  tratamientos?: {
    nombre_tratamiento: string;
    estado: string;
    costo: number;
  };
}

export interface Tratamiento {
  id: number;
  nombre_tratamiento: string;
  descripcion: string;
  estado: string;
  costo: number;
  fecha_inicio: string;
}