
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Search, CalendarPlus, Loader2 } from 'lucide-react';
import toast from "react-hot-toast";

import { tratamientos } from './TratamientosPanel';


interface Paciente {
  id: number;
  nombres: string;
  apellidos: string;
  dni: string;
}

interface Medico {
  id: number;
  nombres: string;
  apellidos: string;
  especialidades: string[];
}

interface Cita {
  id?: number;
  paciente_id: number;
  medico_id: number;
  especialidad: string;
  fecha: string;
  hora: string;
  motivo_consulta: string;
  descripcion: string;
  estado: string; // 'pendiente', 'confirmada', 'cancelada', 'atendida'
  created_at?: string;
  pacientes?: Paciente;
  medicos?: Medico;
}

export const CitasPanel: React.FC = () => {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filtros
  
const [search, setSearch] = useState('');
const [filterEstado, setFilterEstado] = useState('todos');
const [filterFecha, setFilterFecha] = useState('todas');
const [filterEspecialidad, setFilterEspecialidad] = useState('todas');
const [filterMedico, setFilterMedico] = useState('todos');

  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedCita, setSelectedCita] = useState<Cita | null>(null);
  const [showHistoriaModal, setShowHistoriaModal] = useState(false);
  const [historiaData, setHistoriaData] = useState({
  motivo_consulta: '',
  diagnostico: '',
  tratamiento_realizado: '',
  observaciones: ''
});
  const [showTratamientoModal, setShowTratamientoModal] = useState(false);

const [tratamientoData, setTratamientoData] = useState({
  nombre_tratamiento: '',
  descripcion: '',
  costo: 0,
  estado: 'pendiente'
});


const [historiaExiste, setHistoriaExiste] = useState(false);

const [historiaCreadaId, setHistoriaCreadaId] = useState<number | null>(null);



  // Formulario nueva cita
  const [newCita, setNewCita] = useState({
    paciente_id: '' as string | number,
    medico_id: '' as string | number,
    especialidad: '',
    fecha: '',
    hora: '',
    motivo_consulta: '',
    descripcion: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Cargar citas con relaciones
      let query = supabase
  .from("citas")
  .select(`
      *,
      pacientes(*),
      medicos(*)
  `);

const {
  data: { user },
} = await supabase.auth.getUser();

let medicoId: number | null = null;

if (user) {
  const { data: medico } = await supabase
    .from("medicos")
    .select("id")
    .eq("auth_user_id", user.id)   // <-- usa el mismo campo que usaste en PacientesPanel
    .maybeSingle();

  medicoId = medico?.id ?? null;
}

if (medicoId) {
  query = query.eq("medico_id", medicoId);
}
const { data: citasData, error: citasError } =
  await query
    .order("fecha", { ascending: false })
    .order("hora", { ascending: false });

      if (citasError) {
        console.error('Error al cargar citas de Supabase:', citasError);
      } else {
        setCitas(citasData || []);
      }

      // 2. Cargar pacientes activos
      const { data: pacientesData } = await supabase
        .from('pacientes')
        .select('id, nombres, apellidos, dni')
        .eq('estado', 'Activo')
        .order('apellidos', { ascending: true });
      
      setPacientes(pacientesData || []);

      // 3. Cargar médicos activos
      let medicosQuery = supabase
  .from("medicos")
  .select("id, nombres, apellidos, especialidades")
  .eq("estado", "Activo");

if (medicoId) {
  medicosQuery = medicosQuery.eq("id", medicoId);
}

const { data: medicosData } = await medicosQuery.order("apellidos", {
  ascending: true,
});
      
      setMedicos(medicosData || []);

    } catch (err) {
      console.error('Error inesperado al cargar datos de citas:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar especialidades del médico seleccionado en tiempo real
  const especialidadesDelMedicoSeleccionado = useMemo(() => {
    if (!newCita.medico_id) return [];
    const medico = medicos.find(m => m.id === Number(newCita.medico_id));
    return medico ? medico.especialidades : [];
  }, [newCita.medico_id, medicos]);


// Especialidades disponibles para los filtros
const especialidadesDisponibles = useMemo(() => {
  return Array.from(
    new Set(
      medicos.flatMap(m => m.especialidades || [])
    )
  ).sort((a, b) => a.localeCompare(b));
}, [medicos]);



  const handleCreateCita = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCita.paciente_id || !newCita.medico_id || !newCita.especialidad || !newCita.fecha || !newCita.hora) {
      setSubmitError('Todos los campos obligatorios (*) son requeridos.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    setSubmitMessage('');

    try {
      const { error } = await supabase
        .from('citas')
        .insert([
          {
            paciente_id: Number(newCita.paciente_id),
            medico_id: Number(newCita.medico_id),
            especialidad: newCita.especialidad,
            fecha: newCita.fecha,
            hora: newCita.hora,
            motivo_consulta: newCita.motivo_consulta,
            descripcion: newCita.descripcion,
            estado: 'pendiente'
          }
        ]);

      if (error) {
        setSubmitError(error.message);
        return;
      }

      setSubmitMessage('¡Cita médica programada exitosamente!');
      
      setNewCita({
        paciente_id: '',
        medico_id: '',
        especialidad: '',
        fecha: '',
        hora: '',
        motivo_consulta: '',
        descripcion: '',
      });

      await fetchData();

      setTimeout(() => {
        setShowCreateModal(false);
        setSubmitMessage('');
      }, 1500);

    } catch (err) {
      setSubmitError('Ocurrió un error inesperado al agendar la cita.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateEstadoCita = async (citaId: number, nuevoEstado: string) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('citas')
        .update({ estado: nuevoEstado })
        .eq('id', citaId);

      if (error) {
        console.error('Error al actualizar estado:', error);
        return;
      }

      await fetchData();
      if (selectedCita && selectedCita.id === citaId) {
        setSelectedCita({ ...selectedCita, estado: nuevoEstado });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const guardarHistoriaClinica = async () => {
  if (!selectedCita) return;

  try {
    const { data: historiaGuardada, error } = await supabase
  .from('historias_clinicas')
  .insert([
    {
      paciente_id: selectedCita.paciente_id,
      medico_id: selectedCita.medico_id,
      cita_id: selectedCita.id,
      motivo_consulta: historiaData.motivo_consulta,
      diagnostico: historiaData.diagnostico,
      tratamiento_realizado: historiaData.tratamiento_realizado,
      observaciones: historiaData.observaciones
    }
  ])
  .select()
  .single();

    if (error) {
  console.error(error);
  toast.error(error.message);
  return;
}
setHistoriaCreadaId(historiaGuardada.id);

setShowHistoriaModal(false);

setShowTratamientoModal(true);

    toast.success('Historia clínica guardada correctamente');

    setHistoriaData({
      motivo_consulta: '',
      diagnostico: '',
      tratamiento_realizado: '',
      observaciones: ''
    });

    

  } catch (err) {
    console.error(err);
    toast.error('Error inesperado');
  }
};
const guardarTratamiento = async () => {
  if (!selectedCita || !historiaCreadaId) return;

  if (!tratamientoData.nombre_tratamiento.trim()) {
    toast.error('Ingrese el nombre del tratamiento');
    return;
  }

  try {
    const { error } = await supabase
      .from('tratamientos')
      .insert([
        {
          paciente_id: selectedCita.paciente_id,
          historia_clinica_id: historiaCreadaId,
          nombre_tratamiento: tratamientoData.nombre_tratamiento,
          descripcion: tratamientoData.descripcion,
          costo: Number(tratamientoData.costo),
          estado: tratamientoData.estado
        }
      ]);

    if (error) {
      console.error(error);
      toast.error(error.message);
      return;
    }

    toast.success('Tratamiento registrado correctamente');

    setTratamientoData({
      nombre_tratamiento: '',
      descripcion: '',
      costo: 0,
      estado: 'pendiente'
    });

    setShowTratamientoModal(false);

  } catch (err) {
    console.error(err);
    toast.error('Error al registrar tratamiento');
  }
};





  const openFicha = async (cita: Cita) => {
  setSelectedCita(cita);

  const { data, error } = await supabase
    .from('historias_clinicas')
    .select('id')
    .eq('cita_id', cita.id)
    .maybeSingle();

if (error) {
  console.error(error);
  setHistoriaExiste(false);
} else {
  setHistoriaExiste(!!data);

  if (data) {
    setHistoriaCreadaId(data.id);
  }
}

setShowViewModal(true);

};

  const formatFecha = (fStr: string) => {
    const [year, month, day] = fStr.split('-');
    return `${day}/${month}/${year}`;
  };

  // Filtrado de citas (useMemo)
  const filteredCitas = useMemo(() => {
    let res = citas;

      // Filtro por Estado
  if (filterEstado !== 'todos') {
    res = res.filter(c => c.estado === filterEstado);
  }

  // Filtro por Fecha
  if (filterFecha !== 'todas') {
    const hoyStr = new Date().toISOString().split('T')[0];

    if (filterFecha === 'hoy') {
      res = res.filter(c => c.fecha === hoyStr);
    } else if (filterFecha === 'proximas') {
      res = res.filter(
        c => c.fecha >= hoyStr && c.estado !== 'cancelada'
      );
    }
  }

  // Filtro por Especialidad
  if (filterEspecialidad !== 'todas') {
    res = res.filter(
      c => c.especialidad === filterEspecialidad
    );
  }

  // Filtro por Médico
  if (filterMedico !== 'todos') {
    res = res.filter(
      c => c.medico_id === Number(filterMedico)
    );
  }

  // Búsqueda únicamente por paciente
  if (search.trim()) {
    const s = search.toLowerCase().trim();

    res = res.filter(c =>
      c.pacientes?.nombres?.toLowerCase().includes(s) ||
      c.pacientes?.apellidos?.toLowerCase().includes(s) ||
      c.pacientes?.dni?.toLowerCase().includes(s)
    );
  }

  return res;
}, [
  citas,
  filterEstado,
  filterFecha,
  filterEspecialidad,
  filterMedico,
  search
]);
  return (
  <div className="space-y-7 flex-1 w-full max-w-7xl mx-auto">

    {/* ENCABEZADO */}
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20 flex items-center justify-center shrink-0 shadow-sm">
          <CalendarPlus className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-600 dark:text-cyan-400 mb-1">
            Agenda clínica
          </p>

          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Gestión de Citas
          </h1>

          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Planifica, confirma y gestiona las consultas odontológicas de la clínica.
          </p>
        </div>
      </div>

      <button
        onClick={() => setShowCreateModal(true)}
        className="
          inline-flex items-center justify-center gap-2
          py-3 px-5 rounded-xl
          text-sm font-bold text-white
          bg-gradient-to-r from-cyan-500 to-blue-600
          hover:from-cyan-600 hover:to-blue-700
          shadow-md shadow-cyan-500/10
          hover:shadow-lg
          active:scale-[0.98]
          transition-all duration-200
          cursor-pointer
        "
      >
        <CalendarPlus className="w-4 h-4" />
        Nueva Cita
      </button>

    </div>


    {/* RESUMEN VISUAL */}
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Citas visibles
            </p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">
              {filteredCitas.length}
            </p>
          </div>

          <div className="w-11 h-11 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 flex items-center justify-center">
            <CalendarPlus className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
          </div>
        </div>

        <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">
          Según los filtros actuales
        </p>
      </div>


      <div className="rounded-2xl border border-amber-200/70 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-950/20 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Pendientes
            </p>
            <p className="text-2xl font-extrabold text-amber-700 dark:text-amber-300 mt-2">
              {filteredCitas.filter(c => c.estado === 'pendiente').length}
            </p>
          </div>

          <div className="w-11 h-11 rounded-xl bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center">
            <span className="text-lg">🟡</span>
          </div>
        </div>

        <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-3">
          Requieren confirmación
        </p>
      </div>


      <div className="rounded-2xl border border-blue-200/70 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-950/20 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Confirmadas
            </p>
            <p className="text-2xl font-extrabold text-blue-700 dark:text-blue-300 mt-2">
              {filteredCitas.filter(c => c.estado === 'confirmada').length}
            </p>
          </div>

          <div className="w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center">
            <span className="text-lg">🔵</span>
          </div>
        </div>

        <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-3">
          Consultas programadas
        </p>
      </div>


      <div className="rounded-2xl border border-emerald-200/70 dark:border-emerald-900/30 bg-emerald-50/50 dark:bg-emerald-950/20 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Atendidas
            </p>
            <p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-2">
              {filteredCitas.filter(c => c.estado === 'atendida').length}
            </p>
          </div>

          <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center">
            <span className="text-lg">🟢</span>
          </div>
        </div>

        <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-3">
          Consultas completadas
        </p>
      </div>

    </div>


  
{/* CONTROLES */}
<div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-sm p-4">

  <div className="flex items-center gap-3 mb-5">
    <div className="w-9 h-9 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-100 dark:border-cyan-500/20 flex items-center justify-center">
      <Search className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
    </div>

    <div>
      <h3 className="text-sm font-extrabold text-slate-800 dark:text-white">
        Buscar y filtrar
      </h3>

      <p className="text-xs text-slate-400 dark:text-slate-500">
        Encuentra citas por paciente y aplica filtros específicos
      </p>
    </div>
  </div>

  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">

    {/* BUSCAR PACIENTE */}
    <div className="relative xl:col-span-2">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <Search className="w-5 h-5 text-slate-400 dark:text-slate-500" />
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        type="text"
        placeholder="Buscar paciente por nombre, apellido o DNI..."
        className="
          w-full h-12 pl-11 pr-4
          rounded-xl
          border border-slate-200 dark:border-slate-800
          bg-slate-50 dark:bg-slate-950
          text-sm font-medium
          text-slate-800 dark:text-white
          placeholder:text-slate-400 dark:placeholder:text-slate-600
          focus:outline-none
          focus:ring-2 focus:ring-cyan-500/30
          focus:border-cyan-500
          transition-all
        "
      />
    </div>

    {/* ESPECIALIDAD */}
    <select
      value={filterEspecialidad}
      onChange={(e) => setFilterEspecialidad(e.target.value)}
      className="
        h-12 w-full
        px-4
        rounded-xl
        border border-slate-200 dark:border-slate-800
        bg-slate-50 dark:bg-slate-950
        text-sm font-bold
        text-slate-700 dark:text-slate-200
        focus:outline-none
        focus:ring-2 focus:ring-cyan-500/30
        focus:border-cyan-500
        transition-all
        cursor-pointer
      "
    >
      <option value="todas">Todas las Especialidades</option>

      {especialidadesDisponibles.map((especialidad) => (
        <option key={especialidad} value={especialidad}>
          {especialidad}
        </option>
      ))}
    </select>

    {/* MÉDICO */}
    <select
      value={filterMedico}
      onChange={(e) => setFilterMedico(e.target.value)}
      className="
        h-12 w-full
        px-4
        rounded-xl
        border border-slate-200 dark:border-slate-800
        bg-slate-50 dark:bg-slate-950
        text-sm font-bold
        text-slate-700 dark:text-slate-200
        focus:outline-none
        focus:ring-2 focus:ring-cyan-500/30
        focus:border-cyan-500
        transition-all
        cursor-pointer
      "
    >
      <option value="todos">Todos los Médicos</option>

      {medicos.map((medico) => (
        <option key={medico.id} value={medico.id}>
          Dr. {medico.nombres} {medico.apellidos}
        </option>
      ))}
    </select>

    {/* ESTADO */}
    <select
      value={filterEstado}
      onChange={(e) => setFilterEstado(e.target.value)}
      className="
        h-12 w-full
        px-4
        rounded-xl
        border border-slate-200 dark:border-slate-800
        bg-slate-50 dark:bg-slate-950
        text-sm font-bold
        text-slate-700 dark:text-slate-200
        focus:outline-none
        focus:ring-2 focus:ring-cyan-500/30
        focus:border-cyan-500
        transition-all
        cursor-pointer
      "
    >
      <option value="todos">Todos los Estados</option>
      <option value="pendiente">Pendientes 🟡</option>
      <option value="confirmada">Confirmadas 🔵</option>
      <option value="atendida">Atendidas 🟢</option>
      <option value="cancelada">Canceladas 🔴</option>
    </select>

  </div>

  {/* FILTRO DE FECHA */}
  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">

    <select
      value={filterFecha}
      onChange={(e) => setFilterFecha(e.target.value)}
      className="
        h-12 w-full
        px-4
        rounded-xl
        border border-slate-200 dark:border-slate-800
        bg-slate-50 dark:bg-slate-950
        text-sm font-bold
        text-slate-700 dark:text-slate-200
        focus:outline-none
        focus:ring-2 focus:ring-cyan-500/30
        focus:border-cyan-500
        transition-all
        cursor-pointer
      "
    >
      <option value="todas">Cualquier Fecha</option>
      <option value="hoy">Hoy</option>
      <option value="proximas">Próximas y Activas</option>
    </select>

  </div>

</div>

    {/* TABLA */}
    <div className="rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all duration-300">

      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">

        <div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
            Citas agendadas
          </h2>

          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            Consulta y administra las citas registradas
          </p>
        </div>

        <div className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400">
          {filteredCitas.length} cita{filteredCitas.length !== 1 ? 's' : ''}
        </div>

      </div>

      <div className="overflow-x-auto">

        <table className="w-full text-left border-collapse">

          <thead>
            <tr className="bg-slate-50/80 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">

              <th className="p-4 pl-6">Paciente</th>
              <th className="p-4">Médico</th>
              <th className="p-4">Especialidad</th>
              <th className="p-4 text-center">Fecha</th>
              <th className="p-4 text-center">Hora</th>
              <th className="p-4 text-center">Estado</th>
              <th className="p-4 pr-6 text-center w-40">Acción</th>

            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">

            {isLoading ? (

              [1, 2, 3].map((i) => (
                <tr key={i} className="animate-pulse">

                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>

                      <div>
                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-28 mb-2"></div>
                        <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-20"></div>
                      </div>
                    </div>
                  </td>

                  <td className="p-4">
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24"></div>
                  </td>

                  <td className="p-4">
                    <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-lg w-28"></div>
                  </td>

                  <td className="p-4">
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded mx-auto w-16"></div>
                  </td>

                  <td className="p-4">
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded mx-auto w-12"></div>
                  </td>

                  <td className="p-4">
                    <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto w-20"></div>
                  </td>

                  <td className="p-4 pr-6">
                    <div className="h-9 bg-slate-200 dark:bg-slate-800 rounded-xl mx-auto w-24"></div>
                  </td>

                </tr>
              ))

            ) : filteredCitas.length === 0 ? (

              <tr>

                <td
                  colSpan={7}
                  className="p-12 text-center"
                >

                  <div className="flex flex-col items-center justify-center">

                    <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                      <CalendarPlus className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                    </div>

                    <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                      No se encontraron citas
                    </p>

                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      Prueba cambiando los filtros de búsqueda.
                    </p>

                  </div>

                </td>

              </tr>

            ) : (

              filteredCitas.map((cita) => (

                <tr
                  key={cita.id}
                  className="
                    hover:bg-slate-50/70
                    dark:hover:bg-slate-800/30
                    transition-colors duration-150
                  "
                >

                  <td className="p-4 pl-6">

                    <div className="flex items-center gap-3">

                      <div className="w-9 h-9 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-100 dark:border-cyan-500/20 flex items-center justify-center shrink-0">
                        <span className="text-xs font-extrabold text-cyan-700 dark:text-cyan-300">
                          {cita.pacientes?.nombres?.charAt(0)}
                          {cita.pacientes?.apellidos?.charAt(0)}
                        </span>
                      </div>

                      <div className="min-w-0">

                        <h4 className="font-bold text-slate-800 dark:text-slate-200">
                          {cita.pacientes?.nombres} {cita.pacientes?.apellidos}
                        </h4>

                        <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 block mt-0.5">
                          DNI: {cita.pacientes?.dni}
                        </span>

                      </div>

                    </div>

                  </td>

                  <td className="p-4">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Dr. {cita.medicos?.nombres} {cita.medicos?.apellidos}
                    </span>
                  </td>

                  <td className="p-4">

                    <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/10">
                      {cita.especialidad}
                    </span>

                  </td>

                  <td className="p-4 text-center">
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {formatFecha(cita.fecha)}
                    </span>
                  </td>

                  <td className="p-4 text-center">

                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono font-bold text-xs">
                      {cita.hora.slice(0, 5)}
                    </span>

                  </td>

                  <td className="p-4 text-center">

                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-black tracking-wide border shadow-sm ${
                      cita.estado === 'pendiente'
                        ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/10'
                        :
                      cita.estado === 'confirmada'
                        ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/10'
                        :
                      cita.estado === 'atendida'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/10'
                        :
                        'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/10'
                    }`}>
                      {cita.estado.toUpperCase()}
                    </span>

                  </td>

                  <td className="p-4 pr-6 text-center">

                    <button
                      onClick={() => openFicha(cita)}
                      className="
                        inline-flex items-center justify-center
                        px-4 py-2.5
                        rounded-xl
                        text-xs font-black
                        text-white
                        bg-blue-900
                        hover:bg-blue-800
                        dark:bg-cyan-500
                        dark:hover:bg-cyan-600
                        shadow-sm hover:shadow-md
                        transition-all duration-200
                        cursor-pointer
                      "
                    >
                      Ver Detalle
                    </button>

                  </td>

                </tr>

              ))

            )}

          </tbody>

        </table>

      </div>

    </div>

      {/* MODAL PROGRAMAR CITA */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl p-6 md:p-8 relative border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowCreateModal(false)} className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-white text-2xl font-semibold cursor-pointer">×</button>

            <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white">Programar Cita Médica</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Asigna un especialista, fecha, hora e historial de atención clínica.</p>
            </div>

            <form onSubmit={handleCreateCita} className="space-y-6">
              {submitError && <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm">{submitError}</div>}
              {submitMessage && <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400 text-sm animate-pulse">{submitMessage}</div>}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* PACIENTE */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Paciente *</label>
                  <select 
                    value={newCita.paciente_id} 
                    onChange={(e) => setNewCita({ ...newCita, paciente_id: e.target.value })}
                    required 
                    className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:text-white font-bold"
                  >
                    <option value="" disabled>-- Selecciona el paciente --</option>
                    {pacientes.map(p => (
                      <option key={p.id} value={p.id}>{p.apellidos}, {p.nombres} (DNI: {p.dni})</option>
                    ))}
                  </select>
                </div>

                {/* MÉDICO */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Médico *</label>
                  <select 
                    value={newCita.medico_id} 
                    onChange={(e) => setNewCita({ ...newCita, medico_id: e.target.value, especialidad: '' })}
                    required 
                    className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:text-white font-bold"
                  >
                    <option value="" disabled>-- Selecciona el médico --</option>
                    {medicos.map(m => <option key={m.id} value={m.id}>Dr. {m.nombres} {m.apellidos}</option>)}
                  </select>
                </div>

                {/* ESPECIALIDAD */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Especialidad de la Consulta *</label>
                  <select 
                    value={newCita.especialidad} 
                    onChange={(e) => setNewCita({ ...newCita, especialidad: e.target.value })}
                    required 
                    disabled={!newCita.medico_id}
                    className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:text-white font-bold disabled:opacity-50"
                  >
                    <option value="" disabled>-- Elige una especialidad --</option>
                    {especialidadesDelMedicoSeleccionado.map(esp => <option key={esp} value={esp}>{esp}</option>)}
                  </select>
                </div>

                {/* FECHA */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Fecha *</label>
                  <input value={newCita.fecha} onChange={(e) => setNewCita({ ...newCita, fecha: e.target.value })} type="date" required className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:text-white font-bold" />
                </div>

                {/* HORA */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Hora *</label>
                  <input value={newCita.hora} onChange={(e) => setNewCita({ ...newCita, hora: e.target.value })} type="time" required className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:text-white font-bold font-mono" />
                </div>

                {/* MOTIVO */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Motivo Consulta</label>
                  <input value={newCita.motivo_consulta} onChange={(e) => setNewCita({ ...newCita, motivo_consulta: e.target.value })} type="text" placeholder="Ej: Dolor dental, Profilaxis..." className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:text-white" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Descripción Adicional / Síntomas</label>
                <textarea value={newCita.descripcion} onChange={(e) => setNewCita({ ...newCita, descripcion: e.target.value })} rows={3} placeholder="Detalles sobre malestares, tratamiento continuo o consideraciones especiales..." className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:text-white" />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800 pt-5">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold transition cursor-pointer">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-3 rounded-xl text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 font-bold shadow-md shadow-cyan-500/10 cursor-pointer disabled:opacity-50 flex items-center gap-2">
                  {isSubmitting && <Loader2 className="animate-spin h-5 w-5 text-white" />}
                  Agendar Cita
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    

{/* MODAL DETALLE CITA Y CONTROL DE ESTADO */}
{showViewModal && selectedCita && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 dark:bg-black/75 backdrop-blur-md p-4">

    <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl">

      {/* HEADER */}
      <div className="px-6 md:px-7 pt-6 pb-5 border-b border-slate-200 dark:border-slate-800">

        <div className="flex items-start justify-between gap-4">

          <div className="flex items-center gap-4">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 3.75h8A2.25 2.25 0 0118.25 6v14.25H5.75V6A2.25 2.25 0 018 3.75z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 3.75V2.5h6v1.25M9 9h6M9 13h6M9 17h3"
                />
              </svg>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-400">
                Gestión de consulta
              </p>

              <h2 className="mt-0.5 text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white">
                Detalle de la Cita Médica
              </h2>

              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Información y control de la atención médica.
              </p>
            </div>

          </div>

          <button
            onClick={() => setShowViewModal(false)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

        </div>

      </div>


      {/* INFORMACIÓN PRINCIPAL */}
      <div className="px-6 md:px-7 py-5">

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">


          {/* PACIENTE */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-4">

            <div className="flex items-start gap-3">

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 7.25a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 20a7.5 7.5 0 0115 0"
                  />
                </svg>
              </div>

              <div className="min-w-0">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Paciente
                </span>

                <p className="mt-1 truncate text-sm font-extrabold text-slate-800 dark:text-white">
                  {selectedCita.pacientes?.nombres} {selectedCita.pacientes?.apellidos}
                </p>

                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                  <span>DNI</span>
                  <span className="font-mono font-semibold">
                    {selectedCita.pacientes?.dni}
                  </span>
                </div>
              </div>

            </div>

          </div>


          {/* MÉDICO */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-4">

            <div className="flex items-start gap-3">

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4v16M7 9h10M7 15h10"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.5 4a3.5 3.5 0 017 0"
                  />
                </svg>
              </div>

              <div className="min-w-0">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Médico Especialista
                </span>

                <p className="mt-1 truncate text-sm font-extrabold text-slate-800 dark:text-white">
                  Dr. {selectedCita.medicos?.nombres} {selectedCita.medicos?.apellidos}
                </p>

                <p className="mt-1 truncate text-[11px] text-slate-500 dark:text-slate-400">
                  {selectedCita.especialidad}
                </p>
              </div>

            </div>

          </div>


          {/* FECHA */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-4">

            <div className="flex items-start gap-3">

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <rect
                    x="4"
                    y="5"
                    width="16"
                    height="15"
                    rx="2"
                  />
                  <path
                    strokeLinecap="round"
                    d="M8 3v4M16 3v4M4 9h16"
                  />
                </svg>
              </div>

              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Fecha de Atención
                </span>

                <p className="mt-1 text-sm font-extrabold text-slate-800 dark:text-white">
                  {formatFecha(selectedCita.fecha)}
                </p>
              </div>

            </div>

          </div>


          {/* HORA */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-4">

            <div className="flex items-start gap-3">

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <circle cx="12" cy="12" r="8.5" />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 7v5l3 2"
                  />
                </svg>
              </div>

              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Hora Citada
                </span>

                <p className="mt-1 font-mono text-sm font-extrabold text-slate-800 dark:text-white">
                  {selectedCita.hora.slice(0, 5)}
                </p>
              </div>

            </div>

          </div>

        </div>


        {/* MOTIVO */}
        <div className="mt-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">

          <div className="flex items-center gap-3">

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 6.5A2.5 2.5 0 017.5 4h9A2.5 2.5 0 0119 6.5v6a2.5 2.5 0 01-2.5 2.5h-5L7 19v-4H7.5A2.5 2.5 0 015 12.5v-6z"
                />
              </svg>
            </div>

            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Motivo de Consulta
              </span>

              <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-200">
                {selectedCita.motivo_consulta || 'Sin motivo específico.'}
              </p>
            </div>

          </div>

        </div>


        {/* DESCRIPCIÓN */}
        <div className="mt-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">

          <div className="flex items-start gap-3">

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7 4h10a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2z"
                />
                <path
                  strokeLinecap="round"
                  d="M8 9h8M8 13h8M8 17h5"
                />
              </svg>
            </div>

            <div className="min-w-0">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Descripción / Notas Adicionales
              </span>

              <p className="mt-1 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {selectedCita.descripcion || 'Sin descripción o comentarios adicionales.'}
              </p>
            </div>

          </div>

        </div>


        {/* ESTADO Y ACCIONES */}
        <div className="mt-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-4">

          <div className="flex flex-col gap-4">

            {/* ESTADO */}
            <div className="flex items-center justify-between gap-4">

              <div className="flex items-center gap-3">

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <circle cx="12" cy="12" r="8.5" />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 12l2.5 2.5L16 9"
                    />
                  </svg>
                </div>

                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Estado Actual
                  </span>

                  <span
                    className={`mt-1 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-wide border ${
                      selectedCita.estado === 'pendiente'
                        ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-500/10'
                        : selectedCita.estado === 'confirmada'
                        ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-500/10'
                        : selectedCita.estado === 'atendida'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-500/10'
                        : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-500/10'
                    }`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {selectedCita.estado.toUpperCase()}
                  </span>
                </div>

              </div>

            </div>


            {/* ACCIONES */}
            {selectedCita.estado === 'pendiente' && (
              <div className="flex flex-col sm:flex-row gap-2">

                <button
                  onClick={() => updateEstadoCita(selectedCita.id!, 'confirmada')}
                  disabled={isSubmitting}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] transition-all cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Confirmar Cita
                </button>

                <button
                  onClick={() => updateEstadoCita(selectedCita.id!, 'cancelada')}
                  disabled={isSubmitting}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:scale-[0.98] transition-all cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 6l12 12M6 18L18 6"
                    />
                  </svg>
                  Cancelar Cita
                </button>

              </div>
            )}


            {selectedCita.estado === 'confirmada' && (
              <div className="flex flex-col sm:flex-row gap-2">

                <button
                  onClick={() => updateEstadoCita(selectedCita.id!, 'atendida')}
                  disabled={isSubmitting}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] transition-all cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 12h14M13 6l6 6-6 6"
                    />
                  </svg>
                  Marcar como Atendida
                </button>

                <button
                  onClick={() => updateEstadoCita(selectedCita.id!, 'cancelada')}
                  disabled={isSubmitting}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:scale-[0.98] transition-all cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 6l12 12M6 18L18 6"
                    />
                  </svg>
                  Cancelar Cita
                </button>

              </div>
            )}


            {selectedCita.estado === 'cancelada' && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-950/20 px-3.5 py-2.5 text-xs font-bold text-red-600 dark:text-red-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path
                    strokeLinecap="round"
                    d="M9 9l6 6M15 9l-6 6"
                  />
                </svg>
                La cita ha sido cancelada y archivada.
              </div>
            )}


            {selectedCita.estado === 'atendida' && (
              <div className="flex flex-col gap-3">

                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 px-3.5 py-2.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  La consulta fue completada correctamente.
                </div>


                {!historiaExiste ? (

                  <button
                    onClick={() => setShowHistoriaModal(true)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-700 active:scale-[0.98] transition-all cursor-pointer shadow-sm"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M7 4h10a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 9h6M9 13h4"
                      />
                    </svg>
                    Registrar Historia Clínica
                  </button>

                ) : (

                  <div className="flex flex-col gap-2">

                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Historia clínica registrada
                    </div>

                    <button
                      
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all cursor-pointer shadow-sm"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 4h12v16H6z"
                        />
                        <path
                          strokeLinecap="round"
                          d="M9 8h6M9 12h6M9 16h4"
                        />
                      </svg>
                      Abrir Historial Clínico
                    </button>

                  </div>

                )}

              </div>
            )}

          </div>

        </div>

      </div>


      {/* FOOTER */}
      <div className="flex justify-end border-t border-slate-200 dark:border-slate-800 px-6 md:px-7 py-4">

        <button
          onClick={() => setShowViewModal(false)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-bold text-slate-700 dark:text-slate-300 transition hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
        >
          Cerrar Detalle
        </button>

      </div>

    </div>

  </div>
)}






{showHistoriaModal && selectedCita && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 dark:bg-black/70 backdrop-blur-md p-3 sm:p-5">

    <div className="w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl">

      {/* HEADER */}
      <div className="flex items-start justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800">

        <div className="flex items-center gap-4">

          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5h6M9 3h6a2 2 0 012 2v1h1a2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h1V5a2 2 0 012-2z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 11h8M8 15h6"
              />
            </svg>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-400">
              Registro clínico
            </p>

            <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">
              Registrar Historia Clínica
            </h2>

            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Registre la información clínica correspondiente a esta consulta.
            </p>
          </div>

        </div>

        <button
          onClick={() => setShowHistoriaModal(false)}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

      </div>


      {/* INFORMACIÓN DE LA CITA */}
      <div className="px-6 pt-5">

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Paciente
            </p>
            <p className="mt-1 text-sm font-bold text-slate-800 dark:text-white truncate">
              {selectedCita.pacientes?.nombres} {selectedCita.pacientes?.apellidos}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              DNI
            </p>
            <p className="mt-1 text-sm font-bold text-slate-800 dark:text-white">
              {selectedCita.pacientes?.dni}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Especialidad
            </p>
            <p className="mt-1 text-sm font-bold text-slate-800 dark:text-white truncate">
              {selectedCita.especialidad}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Fecha de consulta
            </p>
            <p className="mt-1 text-sm font-bold text-slate-800 dark:text-white">
              {formatFecha(selectedCita.fecha)}
            </p>
          </div>

        </div>

      </div>


      {/* FORMULARIO */}
      <div className="px-6 py-5">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">


          {/* MOTIVO DE CONSULTA */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">

            <div className="flex items-center gap-2.5 mb-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 10h8M8 14h5"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M20 11.5a8.5 8.5 0 01-8.5 8.5 8.5 8.5 0 01-4.27-1.14L4 20l1.14-3.23A8.5 8.5 0 1119.85 9"
                  />
                </svg>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 dark:text-white">
                  Motivo de Consulta
                </label>
                <p className="text-[11px] text-slate-400">
                  Motivo principal de la atención
                </p>
              </div>

            </div>

            <textarea
              value={historiaData.motivo_consulta}
              onChange={(e) =>
                setHistoriaData({
                  ...historiaData,
                  motivo_consulta: e.target.value
                })
              }
              rows={3}
              placeholder="Describa el motivo por el cual el paciente acude a consulta..."
              className="w-full resize-none rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/50 px-3.5 py-3 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10"
            />

          </div>


          {/* DIAGNÓSTICO */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">

            <div className="flex items-center gap-2.5 mb-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <circle cx="11" cy="11" r="6.5" />
                  <path
                    strokeLinecap="round"
                    d="M16 16l4 4"
                  />
                  <path
                    strokeLinecap="round"
                    d="M8.5 11h5M11 8.5v5"
                  />
                </svg>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 dark:text-white">
                  Diagnóstico
                </label>
                <p className="text-[11px] text-slate-400">
                  Evaluación clínica realizada
                </p>
              </div>

            </div>

            <textarea
              value={historiaData.diagnostico}
              onChange={(e) =>
                setHistoriaData({
                  ...historiaData,
                  diagnostico: e.target.value
                })
              }
              rows={3}
              placeholder="Ingrese el diagnóstico clínico..."
              className="w-full resize-none rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/50 px-3.5 py-3 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10"
            />

          </div>


          {/* TRATAMIENTO REALIZADO */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">

            <div className="flex items-center gap-2.5 mb-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 3v18M3 12h18"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M7 7l10 10M17 7L7 17"
                  />
                </svg>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 dark:text-white">
                  Tratamiento Realizado
                </label>
                <p className="text-[11px] text-slate-400">
                  Procedimiento realizado durante la consulta
                </p>
              </div>

            </div>

            <textarea
              value={historiaData.tratamiento_realizado}
              onChange={(e) =>
                setHistoriaData({
                  ...historiaData,
                  tratamiento_realizado: e.target.value
                })
              }
              rows={3}
              placeholder="Describa el tratamiento o procedimiento realizado..."
              className="w-full resize-none rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/50 px-3.5 py-3 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10"
            />

          </div>


          {/* OBSERVACIONES */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">

            <div className="flex items-center gap-2.5 mb-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M7 4h10a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 9h8M8 13h6M8 17h4"
                  />
                </svg>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 dark:text-white">
                  Observaciones
                </label>
                <p className="text-[11px] text-slate-400">
                  Información adicional de la consulta
                </p>
              </div>

            </div>

            <textarea
              value={historiaData.observaciones}
              onChange={(e) =>
                setHistoriaData({
                  ...historiaData,
                  observaciones: e.target.value
                })
              }
              rows={3}
              placeholder="Agregue observaciones clínicas relevantes..."
              className="w-full resize-none rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/50 px-3.5 py-3 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10"
            />

          </div>

        </div>

      </div>


      {/* FOOTER */}
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/30">

        <button
          onClick={() => setShowHistoriaModal(false)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold text-slate-600 dark:text-slate-300 transition hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          Cancelar
        </button>

        <button
          onClick={guardarHistoriaClinica}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:from-cyan-700 hover:to-cyan-600"
        >
          Guardar Historia Clínica
        </button>

      </div>

    </div>

  </div>
)}

{showTratamientoModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 dark:bg-black/70 backdrop-blur-md">

    <div
      className="
        relative w-full max-w-2xl
        max-h-[92vh] overflow-y-auto
        rounded-3xl
        border border-slate-200 dark:border-slate-800
        bg-white dark:bg-slate-900
        shadow-2xl
      "
    >

      {/* ENCABEZADO */}
      <div className="px-6 md:px-8 pt-6 md:pt-7 pb-5 border-b border-slate-200 dark:border-slate-800">

        <div className="flex items-start justify-between gap-4">

          <div className="flex items-start gap-4">

            <div
              className="
                w-12 h-12 shrink-0
                rounded-2xl
                bg-blue-50 dark:bg-blue-500/10
                border border-blue-200 dark:border-blue-500/20
                flex items-center justify-center
              "
            >
              <svg
                className="w-6 h-6 text-blue-600 dark:text-blue-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v12m6-6H6"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20 12a8 8 0 11-16 0 8 8 0 0116 0z"
                />
              </svg>
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400 mb-1">
                Plan de atención
              </p>

              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Registrar Tratamiento
              </h2>

              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Registra el tratamiento indicado para el paciente.
              </p>
            </div>

          </div>

          <button
            onClick={() => setShowTratamientoModal(false)}
            className="
              w-9 h-9 shrink-0
              rounded-xl
              flex items-center justify-center
              text-slate-400
              hover:text-slate-700 dark:hover:text-white
              hover:bg-slate-100 dark:hover:bg-slate-800
              transition-all
              cursor-pointer
            "
            aria-label="Cerrar"
          >
            <span className="text-2xl leading-none">×</span>
          </button>

        </div>

        {/* PACIENTE */}
        {selectedCita && (
          <div className="mt-5 rounded-2xl border border-blue-100 dark:border-blue-500/10 bg-blue-50/60 dark:bg-blue-950/20 px-4 py-3">

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">

              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-blue-500 dark:text-blue-400">
                  Paciente
                </p>

                <p className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mt-1">
                  {selectedCita.pacientes?.nombres} {selectedCita.pacientes?.apellidos}
                </p>
              </div>

              <div className="text-left sm:text-right">
                <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  DNI: {selectedCita.pacientes?.dni}
                </p>

                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  {selectedCita.especialidad}
                </p>
              </div>

            </div>

          </div>
        )}

      </div>


      {/* FORMULARIO */}
      <div className="p-6 md:p-8 space-y-5">

        {/* NOMBRE */}
        <div>

          <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Nombre del tratamiento
          </label>

          <div className="relative">

            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center pointer-events-none">
              <span className="text-sm text-blue-600 dark:text-blue-400">
                🦷
              </span>
            </div>

                        <select
              value={tratamientoData.nombre_tratamiento}
              onChange={(e) => {
                const tratamiento = tratamientos.find(
                  (t) => t.nombre === e.target.value
                );

                

                setTratamientoData({
                  ...tratamientoData,
                  nombre_tratamiento: tratamiento?.nombre || '',
                  descripcion: tratamiento?.descripcion || '',
                  costo: tratamiento?.precio || 0
                });
              }}
              className="
                w-full
                h-14
                pl-16 pr-4
                rounded-xl
                border border-slate-200 dark:border-slate-800
                bg-slate-50 dark:bg-slate-950
                text-sm font-semibold
                text-slate-800 dark:text-slate-200
                outline-none
                focus:border-cyan-500
                focus:ring-4 focus:ring-cyan-500/10
                transition-all
              "
            >
              <option value="">
                Seleccione un tratamiento
              </option>

              {tratamientos.map((tratamiento) => (
                <option
                  key={tratamiento.id}
                  value={tratamiento.nombre}
                >
                  {tratamiento.nombre}
                </option>
              ))}
            </select>

          </div>

        </div>


        {/* DESCRIPCIÓN */}
        <div>

          <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Descripción
          </label>

          <textarea
            rows={5}
            value={tratamientoData.descripcion}
            onChange={(e) =>
              setTratamientoData({
                ...tratamientoData,
                descripcion: e.target.value
              })
            }
            placeholder="Describe brevemente el procedimiento, indicaciones o detalles del tratamiento..."
            className="
              w-full
              rounded-xl
              border border-slate-200 dark:border-slate-800
              bg-slate-50 dark:bg-slate-950
              px-4 py-3
              text-sm
              text-slate-800 dark:text-slate-200
              placeholder:text-slate-400 dark:placeholder:text-slate-600
              outline-none
              resize-none
              focus:border-cyan-500
              focus:ring-4 focus:ring-cyan-500/10
              transition-all
            "
          />

        </div>


        {/* COSTO */}
        <div
          className="
            rounded-2xl
            border border-emerald-200 dark:border-emerald-500/20
            bg-emerald-50/60 dark:bg-emerald-950/20
            p-5
          "
        >

          <label className="block text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-2">
            Costo del tratamiento
          </label>

          <div className="flex items-center gap-3">

            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-500/20">
              <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                S/
              </span>
            </div>

            <div className="flex-1">

              <input
                type="number"
                value={tratamientoData.costo}
                onChange={(e) =>
                  setTratamientoData({
                    ...tratamientoData,
                    costo: Number(e.target.value)
                  })
                }
                min="0"
                step="0.01"
                className="
                  w-full
                  h-12
                  rounded-xl
                  border border-emerald-200 dark:border-emerald-500/20
                  bg-white dark:bg-slate-900
                  px-4
                  text-lg font-extrabold
                  text-slate-800 dark:text-white
                  outline-none
                  focus:border-emerald-500
                  focus:ring-4 focus:ring-emerald-500/10
                  transition-all
                "
              />

            </div>

          </div>

          <p className="text-[11px] text-emerald-700/70 dark:text-emerald-400/70 mt-2">
            Ingresa el costo correspondiente al tratamiento indicado.
          </p>

        </div>

      </div>


      {/* FOOTER */}
      <div
        className="
          px-6 md:px-8 py-5
          border-t border-slate-200 dark:border-slate-800
          bg-slate-50/70 dark:bg-slate-950/40
          flex flex-col-reverse sm:flex-row
          sm:justify-end
          gap-3
        "
      >

        <button
          onClick={() => setShowTratamientoModal(false)}
          className="
            px-5 py-3
            rounded-xl
            border border-slate-200 dark:border-slate-700
            bg-white dark:bg-slate-900
            text-sm font-bold
            text-slate-600 dark:text-slate-300
            hover:bg-slate-100 dark:hover:bg-slate-800
            transition-all
            cursor-pointer
          "
        >
          Cancelar
        </button>

        <button
          onClick={guardarTratamiento}
          className="
            inline-flex items-center justify-center gap-2
            px-5 py-3
            rounded-xl
            bg-gradient-to-r from-cyan-500 to-blue-600
            hover:from-cyan-600 hover:to-blue-700
            text-sm font-extrabold text-white
            shadow-md shadow-cyan-500/10
            hover:shadow-lg
            active:scale-[0.98]
            transition-all
            cursor-pointer
          "
        >
          <span className="text-base">✓</span>
          Guardar Tratamiento
        </button>

      </div>

    </div>
  </div>
)}


      
    
{/*showVerHistoriaModal && historiaSeleccionada && (
  <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">

    <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl shadow-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800">

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">
          Historia Clínica
        </h2>

        <button
          onClick={() => setShowVerHistoriaModal(false)}
          className="text-2xl text-slate-400 hover:text-red-500"
        >
          ×
        </button>
      </div>

      <div className="space-y-5">

        <div>
  <p className="text-sm font-bold text-slate-500">
    Motivo de consulta
  </p>

  {editandoHistoria ? (

    <textarea
      rows={3}
      value={historiaSeleccionada.motivo_consulta}
      onChange={(e)=>
        setHistoriaSeleccionada({
          ...historiaSeleccionada,
          motivo_consulta:e.target.value
        })
      }
      className="mt-1 w-full border rounded-xl p-3"
    />

  ) : (

    <div className="mt-1 p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white">
      {historiaSeleccionada.motivo_consulta}
    </div>

  )}

</div>

        <div>
  <p className="text-sm font-bold text-slate-500">
    Diagnóstico
  </p>

  {editandoHistoria ? (

    <textarea
      rows={3}
      value={historiaSeleccionada.diagnostico}
      onChange={(e)=>
        setHistoriaSeleccionada({
          ...historiaSeleccionada,
          diagnostico:e.target.value
        })
      }
      className="mt-1 w-full border rounded-xl p-3"
    />

  ) : (

    <div className="mt-1 p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white">
      {historiaSeleccionada.diagnostico}
    </div>

  )}

</div>

        <div>
  <p className="text-sm font-bold text-slate-500">
    Tratamiento realizado
  </p>

  {editandoHistoria ? (

    <textarea
      rows={3}
      value={historiaSeleccionada.tratamiento_realizado}
      onChange={(e)=>
        setHistoriaSeleccionada({
          ...historiaSeleccionada,
          tratamiento_realizado:e.target.value
        })
      }
      className="mt-1 w-full border rounded-xl p-3"
    />

  ) : (

    <div className="mt-1 p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white">
      {historiaSeleccionada.tratamiento_realizado}
    </div>

  )}

</div>

        <div>
  <p className="text-sm font-bold text-slate-500">
    Observaciones
  </p>

  {editandoHistoria ? (

    <textarea
      rows={4}
      value={historiaSeleccionada.observaciones}
      onChange={(e)=>
        setHistoriaSeleccionada({
          ...historiaSeleccionada,
          observaciones:e.target.value
        })
      }
      className="mt-1 w-full border rounded-xl p-3"
    />

  ) : (

    <div className="mt-1 p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white min-h-[90px]">
      {historiaSeleccionada.observaciones || "Sin observaciones"}
    </div>

  )}

</div>

<hr className="border-slate-700 my-6" />

<div className="grid grid-cols-2 gap-4 text-sm">

  <div>
    <p className="text-slate-500 font-bold">
      ID Historia
    </p>

    <p className="text-white">
      {historiaSeleccionada.id}
    </p>
  </div>

  <div>
    <p className="text-slate-500 font-bold">
      Cita
    </p>

    <p className="text-white">
      #{historiaSeleccionada.cita_id}
    </p>
  </div>

</div>


      </div>

     <div className="flex justify-end gap-3 mt-8">

  {editandoHistoria ? (

    <>
      <button
        onClick={guardarCambiosHistoria}
        className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
      >
        Guardar Cambios
      </button>

      <button
        onClick={() => setEditandoHistoria(false)}
        className="px-5 py-3 rounded-xl bg-slate-500 hover:bg-slate-400 text-white"
      >
        Cancelar
      </button>
    </>

  ) : (

    <button
      onClick={() => setEditandoHistoria(true)}
      className="px-5 py-3 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-white font-bold"
    >
      Editar
    </button>

  )}

  <button
    onClick={() => setShowVerHistoriaModal(false)}
    className="px-5 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold"
  >
    Cerrar
  </button>

</div>

    </div>

  </div>
)*/}
  </div>
  
  
)}

