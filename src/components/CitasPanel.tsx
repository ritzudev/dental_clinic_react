import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Search, CalendarPlus, Loader2, Calendar, Clock, User, FileText, Info } from 'lucide-react';

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

  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedCita, setSelectedCita] = useState<Cita | null>(null);

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
      const { data: citasData, error: citasError } = await supabase
        .from('citas')
        .select('*, pacientes(*), medicos(*)')
        .order('fecha', { ascending: false })
        .order('hora', { ascending: false });

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
      const { data: medicosData } = await supabase
        .from('medicos')
        .select('id, nombres, apellidos, especialidades')
        .eq('estado', 'Activo')
        .order('apellidos', { ascending: true });
      
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

  const openFicha = (cita: Cita) => {
    setSelectedCita(cita);
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
        res = res.filter(c => c.fecha >= hoyStr && c.estado !== 'cancelada');
      }
    }

    // Búsqueda global
    if (search) {
      const s = search.toLowerCase();
      res = res.filter(c => 
        c.pacientes?.nombres.toLowerCase().includes(s) || 
        c.pacientes?.apellidos.toLowerCase().includes(s) || 
        c.pacientes?.dni.includes(s) || 
        c.medicos?.nombres.toLowerCase().includes(s) || 
        c.medicos?.apellidos.toLowerCase().includes(s) ||
        c.especialidad.toLowerCase().includes(s)
      );
    }

    return res;
  }, [citas, filterEstado, filterFecha, search]);

  return (
    <div className="space-y-6 flex-1 w-full max-w-7xl mx-auto">
      {/* ENCABEZADO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white">
            Gestión de Citas
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Planifica, confirma y gestiona el flujo de consultas odontológicas de la clínica.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex justify-center items-center gap-2 py-3 px-5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-md shadow-cyan-500/10 active:scale-[0.98] transition-all cursor-pointer"
        >
          <CalendarPlus className="w-4 h-4" />
          Nueva Cita
        </button>
      </div>

      {/* CONTROLES */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="relative rounded-2xl shadow-sm lg:col-span-2">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            <Search className="w-5 h-5" />
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="text"
            placeholder="Buscar cita por paciente, doctor o especialidad..."
            className="block w-full pl-11 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400 focus:border-transparent shadow-sm transition-all"
          />
        </div>

        <select 
          value={filterEstado}
          onChange={(e) => setFilterEstado(e.target.value)}
          className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 rounded-2xl p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:text-white text-sm font-semibold"
        >
          <option value="todos">Todos los Estados</option>
          <option value="pendiente">Pendientes 🟡</option>
          <option value="confirmada">Confirmadas 🔵</option>
          <option value="atendida">Atendidas 🟢</option>
          <option value="cancelada">Canceladas 🔴</option>
        </select>

        <select 
          value={filterFecha}
          onChange={(e) => setFilterFecha(e.target.value)}
          className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 rounded-2xl p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:text-white text-sm font-semibold"
        >
          <option value="todas">Cualquier Fecha</option>
          <option value="hoy">Hoy</option>
          <option value="proximas">Próximas y Activas</option>
        </select>
      </div>

      {/* TABLA */}
      <div className="rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all duration-300">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/30 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase border-b border-slate-200 dark:border-slate-800">
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
                    <td className="p-4 pl-6"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-28"></div></td>
                    <td className="p-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24"></div></td>
                    <td className="p-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-28"></div></td>
                    <td className="p-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded mx-auto w-16"></div></td>
                    <td className="p-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded mx-auto w-12"></div></td>
                    <td className="p-4"><div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto w-16"></div></td>
                    <td className="p-4 pr-6"><div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl mx-auto w-20"></div></td>
                  </tr>
                ))
              ) : filteredCitas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 dark:text-slate-500 font-medium">
                    No se encontraron citas agendadas.
                  </td>
                </tr>
              ) : (
                filteredCitas.map((cita) => (
                  <tr key={cita.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 pl-6">
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-slate-200">
                          {cita.pacientes?.nombres} {cita.pacientes?.apellidos}
                        </h4>
                        <span className="text-xs font-mono text-slate-400 dark:text-slate-500 block mt-0.5">DNI: {cita.pacientes?.dni}</span>
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-slate-700 dark:text-slate-300">
                      Dr. {cita.medicos?.nombres} {cita.medicos?.apellidos}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/10">
                        {cita.especialidad}
                      </span>
                    </td>
                    <td className="p-4 text-center font-bold text-slate-700 dark:text-slate-300">
                      {formatFecha(cita.fecha)}
                    </td>
                    <td className="p-4 text-center font-mono font-bold text-slate-600 dark:text-slate-400">
                      {cita.hora.slice(0, 5)}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black tracking-wide border shadow-sm ${
                        cita.estado === 'pendiente' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/10' :
                        cita.estado === 'confirmada' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/10' :
                        cita.estado === 'atendida' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/10' :
                        'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/10'
                      }`}>
                        {cita.estado.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-center">
                      <button 
                        onClick={() => openFicha(cita)} 
                        className="px-4 py-2 rounded-xl text-xs font-black text-white bg-blue-900 hover:bg-blue-800 dark:bg-cyan-500 dark:hover:bg-cyan-600 transition shadow-md cursor-pointer"
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
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl p-6 md:p-8 relative border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowViewModal(false)} className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-white text-2xl font-semibold cursor-pointer">×</button>

            <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
              <h2 className="text-2xl md:text-3xl font-extrabold text-blue-900 dark:text-cyan-400">Detalle de la Cita Médica</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Control de sesión y administración del estado de la cita en tiempo real.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/40">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Paciente</span>
                <p className="font-extrabold text-slate-800 dark:text-slate-200 text-base mt-1">
                  {selectedCita.pacientes?.nombres} {selectedCita.pacientes?.apellidos}
                </p>
                <p className="text-xs text-slate-500 font-mono mt-0.5">DNI: {selectedCita.pacientes?.dni}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/40">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Médico Especialista</span>
                <p className="font-extrabold text-slate-800 dark:text-slate-200 text-base mt-1">
                  Dr. {selectedCita.medicos?.nombres} {selectedCita.medicos?.apellidos}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{selectedCita.especialidad}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/40">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Fecha de Atención</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 text-base mt-1">
                  {formatFecha(selectedCita.fecha)}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/40">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Hora Citada</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 text-base mt-1 font-mono">
                  {selectedCita.hora.slice(0, 5)}
                </p>
              </div>
            </div>

            <div className="space-y-4 mt-5 text-sm">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/40">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Motivo de Consulta</span>
                <p className="text-slate-800 dark:text-slate-300 font-medium">{selectedCita.motivo_consulta || 'Sin motivo específico.'}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/40">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Descripción / Notas Adicionales</span>
                <p className="text-slate-800 dark:text-slate-300 leading-relaxed">{selectedCita.descripcion || 'Sin descripción o comentarios adicionales.'}</p>
              </div>
            </div>

            <div className="mt-6 p-5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Estado Actual</span>
                <div className="mt-1">
                  <span className={`px-3.5 py-1.5 rounded-full text-xs font-black tracking-wide border shadow-sm ${
                    selectedCita.estado === 'pendiente' ? 'bg-amber-50 text-amber-750 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-500/10' :
                    selectedCita.estado === 'confirmada' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-500/10' :
                    selectedCita.estado === 'atendida' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-500/10' :
                    'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-500/10'
                  }`}>
                    {selectedCita.estado.toUpperCase()}
                  </span>
                </div>
              </div>

              {selectedCita.estado === 'pendiente' && (
                <div className="flex gap-2">
                  <button onClick={() => updateEstadoCita(selectedCita.id!, 'confirmada')} disabled={isSubmitting} className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer shadow-md">Confirmar Cita</button>
                  <button onClick={() => updateEstadoCita(selectedCita.id!, 'cancelada')} disabled={isSubmitting} className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:scale-95 transition-all cursor-pointer shadow-md">Cancelar Cita</button>
                </div>
              )}

              {selectedCita.estado === 'confirmada' && (
                <div className="flex gap-2">
                  <button onClick={() => updateEstadoCita(selectedCita.id!, 'atendida')} disabled={isSubmitting} className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all cursor-pointer shadow-md">Marcar como Atendida</button>
                  <button onClick={() => updateEstadoCita(selectedCita.id!, 'cancelada')} disabled={isSubmitting} className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:scale-95 transition-all cursor-pointer shadow-md">Cancelar Cita</button>
                </div>
              )}

              {selectedCita.estado === 'cancelada' && (
                <div className="text-xs text-red-500 font-bold bg-red-50 dark:bg-red-950/20 px-3.5 py-2 rounded-xl">La cita ha sido cancelada y archivada.</div>
              )}

              {selectedCita.estado === 'atendida' && (
                <div className="text-xs text-emerald-500 font-bold bg-emerald-50 dark:bg-emerald-950/20 px-3.5 py-2 rounded-xl">La consulta fue completada correctamente.</div>
              )}
            </div>

            <div className="flex justify-end border-t border-slate-200 dark:border-slate-800 pt-5 mt-6">
              <button onClick={() => setShowViewModal(false)} className="px-5 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold transition hover:bg-slate-200 cursor-pointer">Cerrar Detalle</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
