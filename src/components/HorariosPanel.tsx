import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Plus, Loader2, Edit, Trash2, Info } from 'lucide-react';

interface Horario {
  id?: number;
  medico_id: number;
  dia: string;
  hora_inicio: string;
  hora_fin: string;
  created_at?: string;
}

interface Medico {
  id: number;
  nombres: string;
  apellidos: string;
  dni: string;
  telefono: string;
  correo_profesional: string;
  especialidades: string[];
  estado: string;
  horarios?: Horario[];
}

export const HorariosPanel: React.FC = () => {
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [listMedicosRaw, setListMedicosRaw] = useState<Medico[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [selectedHorario, setSelectedHorario] = useState<Horario | null>(null);
  const [selectedMedicoName, setSelectedMedicoName] = useState('');

  const diasSemana = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];

  // Formularios
  const [newHorarioForm, setNewHorarioForm] = useState({
    medico_id: '' as string | number,
    dias: [] as string[],
    hora_inicio: '08:00',
    hora_fin: '13:00',
  });

  const [editHorarioForm, setEditHorarioForm] = useState<Horario>({
    id: undefined,
    medico_id: 0,
    dia: 'Lunes',
    hora_inicio: '',
    hora_fin: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    fetchMedicosConHorarios();
  }, []);

  const fetchMedicosConHorarios = async () => {
    setIsLoading(true);
    try {
      // 1. Cargar Médicos
      const { data: medicosData, error: medicosError } = await supabase
        .from('medicos')
        .select('*')
        .order('id', { ascending: false });

      if (medicosError) {
        console.error('Error al cargar médicos:', medicosError);
        return;
      }

      setListMedicosRaw(medicosData || []);

      // 2. Cargar Horarios
      const { data: horariosData, error: horariosError } = await supabase
        .from('horarios')
        .select('*')
        .order('id', { ascending: true });

      if (horariosError) {
        console.error('Error al cargar horarios:', horariosError);
        return;
      }

      // 3. Mapear
      const medicosMapeados = (medicosData || []).map((medico: any) => {
        const medHorarios = (horariosData || []).filter((h: any) => h.medico_id === medico.id);
        
        const ordenDias: { [key: string]: number } = {
          'Lunes': 1, 'Martes': 2, 'Miercoles': 3, 'Jueves': 4, 'Viernes': 5, 'Sabado': 6
        };
        
        medHorarios.sort((a: any, b: any) => (ordenDias[a.dia] || 99) - (ordenDias[b.dia] || 99));

        return {
          ...medico,
          horarios: medHorarios
        };
      });

      setMedicos(medicosMapeados);
    } catch (err) {
      console.error('Error inesperado al cargar datos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateHorarios = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHorarioForm.medico_id) {
      setSubmitError('Debes seleccionar un médico.');
      return;
    }

    if (newHorarioForm.dias.length === 0) {
      setSubmitError('Debes seleccionar al menos un día de atención.');
      return;
    }

    if (!newHorarioForm.hora_inicio || !newHorarioForm.hora_fin) {
      setSubmitError('Las horas de inicio y fin son requeridas.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    setSubmitMessage('');

    try {
      const horariosAInsertar = newHorarioForm.dias.map(dia => ({
        medico_id: Number(newHorarioForm.medico_id),
        dia,
        hora_inicio: newHorarioForm.hora_inicio,
        hora_fin: newHorarioForm.hora_fin,
      }));

      const { error } = await supabase
        .from('horarios')
        .insert(horariosAInsertar);

      if (error) {
        setSubmitError(error.message);
        return;
      }

      setSubmitMessage('¡Horarios creados con éxito!');
      
      setNewHorarioForm({
        medico_id: '',
        dias: [],
        hora_inicio: '08:00',
        hora_fin: '13:00',
      });

      await fetchMedicosConHorarios();

      setTimeout(() => {
        setShowCreateModal(false);
        setSubmitMessage('');
      }, 1500);

    } catch (err) {
      setSubmitError('Ocurrió un error inesperado al registrar los horarios.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEdit = (horario: Horario, medico: Medico) => {
    setSelectedHorario(horario);
    setSelectedMedicoName(`Dr. ${medico.nombres} ${medico.apellidos}`);
    
    setEditHorarioForm({
      id: horario.id,
      medico_id: horario.medico_id,
      dia: horario.dia,
      hora_inicio: horario.hora_inicio.slice(0, 5),
      hora_fin: horario.hora_fin.slice(0, 5),
    });
    
    setShowEditModal(true);
  };

  const handleUpdateHorario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHorario?.id) return;

    if (!editHorarioForm.hora_inicio || !editHorarioForm.hora_fin) {
      setSubmitError('Las horas de inicio y fin son obligatorias.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    setSubmitMessage('');

    try {
      const { error } = await supabase
        .from('horarios')
        .update({
          dia: editHorarioForm.dia,
          hora_inicio: editHorarioForm.hora_inicio,
          hora_fin: editHorarioForm.hora_fin
        })
        .eq('id', selectedHorario.id);

      if (error) {
        setSubmitError(error.message);
        return;
      }

      setSubmitMessage('¡Horario actualizado!');
      await fetchMedicosConHorarios();

      setTimeout(() => {
        setShowEditModal(false);
        setSubmitMessage('');
      }, 1500);

    } catch (err) {
      setSubmitError('Ocurrió un error al actualizar los datos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDelete = (horario: Horario, medico: Medico) => {
    setSelectedHorario(horario);
    setSelectedMedicoName(`Dr. ${medico.nombres} ${medico.apellidos}`);
    setShowDeleteConfirm(true);
  };

  const handleDeleteHorario = async () => {
    if (!selectedHorario?.id) return;
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('horarios')
        .delete()
        .eq('id', selectedHorario.id);

      if (error) {
        console.error('Error al eliminar horario:', error);
        return;
      }

      await fetchMedicosConHorarios();
      setShowDeleteConfirm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
      setSelectedHorario(null);
    }
  };

  const filteredMedicos = useMemo(() => {
    if (!search) return medicos;
    const s = search.toLowerCase();
    return medicos.filter(m => 
      m.nombres.toLowerCase().includes(s) || 
      m.apellidos.toLowerCase().includes(s) || 
      m.especialidades.some(esp => esp.toLowerCase().includes(s))
    );
  }, [search, medicos]);

  const handleCheckboxChange = (dia: string) => {
    const exists = newHorarioForm.dias.includes(dia);
    const nextDias = exists 
      ? newHorarioForm.dias.filter(d => d !== dia)
      : [...newHorarioForm.dias, dia];
    setNewHorarioForm({ ...newHorarioForm, dias: nextDias });
  };

  return (
    <div className="space-y-6 flex-1 w-full max-w-7xl mx-auto">
      {/* ENCABEZADO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white">
            Horarios de Atención
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Planificación semanal y disponibilidad de los odontólogos y especialistas.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex justify-center items-center gap-2 py-3 px-5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-md shadow-cyan-500/10 active:scale-[0.98] transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Configurar Horario
        </button>
      </div>

      {/* BUSCADOR */}
      <div className="relative rounded-2xl shadow-sm">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
          <Search className="w-5 h-5" />
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          type="text"
          placeholder="Buscar disponibilidad por médico o especialidad..."
          className="block w-full pl-11 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400 focus:border-transparent shadow-sm transition-all"
        />
      </div>

      {/* GRID */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-2/3"></div>
                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
                </div>
              </div>
              <div className="space-y-2 pt-4">
                <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl w-full"></div>
                <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl w-full"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredMedicos.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center bg-white dark:bg-slate-900/50">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">Sin resultados</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">No se encontraron especialistas o especialidades que coincidan con la búsqueda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMedicos.map((medico) => (
            <div 
              key={medico.id} 
              className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 hover:shadow-lg dark:hover:shadow-slate-950/20 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/60">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-md">
                    {medico.nombres.charAt(0)}
                  </div>
                  <div className="overflow-hidden">
                    <h3 className="font-extrabold text-slate-800 dark:text-white truncate">
                      Dr. {medico.nombres} {medico.apellidos}
                    </h3>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {medico.especialidades.slice(0, 2).map(esp => (
                        <span key={esp} className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {esp}
                        </span>
                      ))}
                      {medico.especialidades.length > 2 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          +{medico.especialidades.length - 2}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-5 space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Disponibilidad Semanal</h4>
                  
                  {!medico.horarios || medico.horarios.length === 0 ? (
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-dashed border-slate-200 dark:border-slate-800/80 text-center">
                      <p className="text-xs text-slate-400 dark:text-slate-500 italic">Sin horarios configurados.</p>
                      <button 
                        onClick={() => {
                          setNewHorarioForm({ ...newHorarioForm, medico_id: medico.id });
                          setShowCreateModal(true);
                        }} 
                        className="mt-2 text-xs font-bold text-cyan-500 hover:text-cyan-600 dark:text-cyan-400 dark:hover:text-cyan-300 cursor-pointer bg-transparent border-0"
                      >
                        + Asignar horario
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                      {medico.horarios.map((h) => (
                        <div 
                          key={h.id}
                          className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-900/60 transition-colors group"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="inline-flex items-center justify-center w-11 text-xs font-black uppercase rounded-lg py-1 px-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/10">
                              {h.dia.slice(0, 3)}
                            </span>
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                              {h.hora_inicio.slice(0, 5)} - {h.hora_fin.slice(0, 5)}
                            </span>
                          </div>

                          <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => openEdit(h, medico)}
                              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-yellow-500 transition-colors cursor-pointer"
                              title="Editar"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => openDelete(h, medico)}
                              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-red-500 transition-colors cursor-pointer"
                              title="Eliminar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Disponible
                </span>
                <span className="font-mono text-[10px]">{medico.horarios?.length || 0} Días</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL CONFIGURAR HORARIO */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl p-6 md:p-8 relative border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowCreateModal(false)} className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-white text-2xl font-semibold cursor-pointer">×</button>

            <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white">Configurar Horario Semanal</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Crea de forma masiva los días y horas de atención de un odontólogo.</p>
            </div>

            <form onSubmit={handleCreateHorarios} className="space-y-6">
              {submitError && <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm">{submitError}</div>}
              {submitMessage && <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400 text-sm animate-pulse">{submitMessage}</div>}

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Seleccionar Médico Especialista *</label>
                <select 
                  value={newHorarioForm.medico_id} 
                  onChange={(e) => setNewHorarioForm({ ...newHorarioForm, medico_id: e.target.value })}
                  required
                  className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl p-3.5 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:text-white font-bold"
                >
                  <option value="" disabled>-- Elige un médico del listado --</option>
                  {listMedicosRaw.map(m => (
                    <option key={m.id} value={m.id}>
                      Dr. {m.nombres} {m.apellidos} ({m.especialidades.join(', ')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Días de Atención *</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {diasSemana.map((dia) => {
                    const isChecked = newHorarioForm.dias.includes(dia);
                    return (
                      <label key={dia} className="flex items-center gap-3 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition">
                        <input 
                          type="checkbox" 
                          checked={isChecked} 
                          onChange={() => handleCheckboxChange(dia)}
                          className="w-5 h-5 rounded text-cyan-600 focus:ring-cyan-500 border-slate-300 dark:border-slate-700" 
                        />
                        <span className="font-bold text-sm text-slate-700 dark:text-slate-300">{dia}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Hora de Inicio *</label>
                  <input 
                    value={newHorarioForm.hora_inicio} 
                    onChange={(e) => setNewHorarioForm({ ...newHorarioForm, hora_inicio: e.target.value })}
                    type="time" 
                    required 
                    className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:text-white font-mono font-bold" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Hora de Fin *</label>
                  <input 
                    value={newHorarioForm.hora_fin} 
                    onChange={(e) => setNewHorarioForm({ ...newHorarioForm, hora_fin: e.target.value })}
                    type="time" 
                    required 
                    className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:text-white font-mono font-bold" 
                  />
                </div>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-2xl flex gap-3">
                <Info className="w-6 h-6 text-blue-500 flex-shrink-0" />
                <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed font-medium">
                  Al guardar, se insertará un registro de horario por cada día seleccionado. Si un día ya cuenta con un horario configurado, te recomendamos editarlo individualmente.
                </p>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800 pt-5">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold transition cursor-pointer">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-3 rounded-xl text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 font-bold shadow-md shadow-cyan-500/10 cursor-pointer disabled:opacity-50 flex items-center gap-2">
                  {isSubmitting && <Loader2 className="animate-spin h-5 w-5 text-white" />}
                  Guardar Horarios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDITAR HORARIO */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl p-6 md:p-8 relative border border-slate-200 dark:border-slate-800">
            <button onClick={() => setShowEditModal(false)} className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-white text-2xl font-semibold cursor-pointer">×</button>

            <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
              <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">Modificar Horario</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Ajusta la disponibilidad semanal del <strong className="text-slate-700 dark:text-slate-300">{selectedMedicoName}</strong>.</p>
            </div>

            <form onSubmit={handleUpdateHorario} className="space-y-6">
              {submitError && <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm">{submitError}</div>}
              {submitMessage && <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400 text-sm animate-pulse">{submitMessage}</div>}

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Día de Atención *</label>
                <select 
                  value={editHorarioForm.dia} 
                  onChange={(e) => setEditHorarioForm({ ...editHorarioForm, dia: e.target.value })}
                  required
                  className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:text-white font-bold"
                >
                  {diasSemana.map(dia => <option key={dia} value={dia}>{dia}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 font-mono">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Hora de Inicio *</label>
                  <input 
                    value={editHorarioForm.hora_inicio} 
                    onChange={(e) => setEditHorarioForm({ ...editHorarioForm, hora_inicio: e.target.value })}
                    type="time" 
                    required 
                    className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:text-white font-bold" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Hora de Fin *</label>
                  <input 
                    value={editHorarioForm.hora_fin} 
                    onChange={(e) => setEditHorarioForm({ ...editHorarioForm, hora_fin: e.target.value })}
                    type="time" 
                    required 
                    className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:text-white font-bold" 
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800 pt-5">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold transition cursor-pointer">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-3 rounded-xl text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 font-bold shadow-md shadow-cyan-500/10 cursor-pointer disabled:opacity-50 flex items-center gap-2">
                  {isSubmitting && <Loader2 className="animate-spin h-5 w-5 text-white" />}
                  Actualizar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMACIÓN ELIMINACIÓN HORARIO */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl p-6 relative border border-slate-200 dark:border-slate-800 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-50 dark:bg-red-950/30 text-red-500 flex items-center justify-center mb-4 border border-red-200 dark:border-red-900/30">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">¿Eliminar este horario?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Estás por quitar la disponibilidad del día <strong className="text-slate-800 dark:text-slate-200">{selectedHorario?.dia} ({selectedHorario?.hora_inicio.slice(0,5)} - {selectedHorario?.hora_fin.slice(0,5)})</strong> para el <strong className="text-slate-800 dark:text-slate-200">{selectedMedicoName}</strong>.
            </p>

            <div className="flex gap-3 mt-6 border-t border-slate-200 dark:border-slate-800 pt-4">
              <button type="button" onClick={() => setShowDeleteConfirm(false)} className="w-1/2 py-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold transition cursor-pointer">
                Cancelar
              </button>
              <button type="button" onClick={handleDeleteHorario} disabled={isSubmitting} className="w-1/2 py-3 rounded-xl text-white bg-red-600 hover:bg-red-700 font-bold shadow-md cursor-pointer flex justify-center items-center gap-2">
                {isSubmitting && <Loader2 className="animate-spin h-5 w-5 text-white" />}
                Eliminar Horario
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
