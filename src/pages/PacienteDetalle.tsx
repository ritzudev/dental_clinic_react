
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Odontograma from "../components/Odontograma";

type Paciente = {
  id: number;
  nombres: string;
  apellidos: string;
  dni: string;
  telefono: string;
  estado: string;
};
export default function PacienteDetalle() {
const [paciente, setPaciente] = useState<Paciente | null>(null);
const [medico, setMedico] = useState("");
const [medicoId, setMedicoId] = useState<number | null>(null);
const [citaId, setCitaId] = useState<number | null>(null);


useEffect(() => {
  cargarPaciente();
  cargarMedico();
  cargarCita();
}, []);
const cargarCita = async () => {
  const pacienteId = localStorage.getItem("paciente-id");

  if (!pacienteId) return;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  // Buscar el médico actualmente logueado
  const { data: medicoData, error: medicoError } = await supabase
    .from("medicos")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  if (medicoError || !medicoData) {
    console.error("No se encontró el médico:", medicoError);
    return;
  }

  // Buscar la cita de este paciente con este médico
  const { data: citasData, error: citasError } = await supabase
  .from("citas")
  .select("id, paciente_id, medico_id, fecha, hora")
  .eq("paciente_id", Number(pacienteId))
  .eq("medico_id", medicoData.id)
  .order("fecha", { ascending: false })
  .order("hora", { ascending: false });

if (citasError) {
  console.error("ERROR BUSCANDO CITAS:", citasError);
  return;
}

console.log("===== TODAS LAS CITAS DEL PACIENTE =====");
console.log(citasData);
console.log("CANTIDAD DE CITAS:", citasData?.length);
console.log(
  "IDS DE CITAS:",
  citasData?.map((cita) => cita.id)
);

if (!citasData || citasData.length === 0) {
  console.log("No hay citas.");
  return;
}

const citaData = citasData[0];

if (!citaData) {
  console.log("No hay citas.");
  return;
}

console.log("===== CITA QUE SE USARÁ =====");
console.log(citaData);

setCitaId(citaData.id);
};


const cargarPaciente = async () => {
  const id = localStorage.getItem("paciente-id");

  if (!id) return;

  const { data, error } = await supabase
    .from("pacientes")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error(error);
    return;
  }

  setPaciente(data);
};



const cargarMedico = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.log("NO HAY USUARIO LOGUEADO");
    return;
  }

  console.log("USER ID:", user.id);

  const { data, error } = await supabase
    .from("medicos")
    .select("id,nombres, apellidos")
    .eq("auth_user_id", user.id)
    .single();

  if (error) {
    console.log("ERROR MÉDICO:", error);
    return;
  }

  console.log("MÉDICO ENCONTRADO:", data);

  setMedico(`${data.nombres} ${data.apellidos}`);
  setMedicoId(data.id);
};

if (!paciente) {
  return (
    <div className="p-6 text-center text-slate-500">
      Cargando información del paciente...
    </div>
  );
}
  return (
    <div className="p-6 space-y-6">


   {/* ODONTOGRAMA */}
<div className="bg-white dark:bg-slate-950 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
  <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">
    Odontograma
  </h2>

  <Odontograma
    paciente={paciente}
    medico={medico}
    medicoId={medicoId ?? 0}
    citaId={citaId ?? 0}
  />
</div>

    </div>
  );
}