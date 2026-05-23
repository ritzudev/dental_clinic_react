import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Search, UserPlus, Loader2, User, Phone, Mail } from 'lucide-react';

interface Medico {
  id?: number;
  nombres: string;
  apellidos: string;
  dni: string;
  sexo: string;
  telefono: string;
  correo_profesional: string;
  especialidades: string[];
  estado?: string;
  created_at?: string;
}

export const MedicosPanel: React.FC = () => {
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [selectedMedico, setSelectedMedico] = useState<Medico | null>(null);

  // Especialidades estándar de la clínica
  const especialidadesDisponibles = [
    'Odontología General',
    'Ortodoncia Avanzada',
    'Endodoncia',
    'Implantología Dental',
    'Odontopediatría',
    'Estética Dental',
    'Periodoncia'
  ];

  // Formularios
  const [newMedico, setNewMedico] = useState<Medico>({
    nombres: '',
    apellidos: '',
    dni: '',
    sexo: 'Masculino',
    telefono: '',
    correo_profesional: '',
    especialidades: [],
  });

  const [editMedicoForm, setEditMedicoForm] = useState<Medico>({
    nombres: '',
    apellidos: '',
    dni: '',
    sexo: 'Masculino',
    telefono: '',
    correo_profesional: '',
    especialidades: [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    fetchMedicos();
  }, []);

  const fetchMedicos = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('medicos')
        .select('*')
        .order('id', { ascending: false });

      if (error) {
        console.error('Error al cargar médicos:', error);
        return;
      }
      setMedicos(data || []);
    } catch (err) {
      console.error('Error inesperado al cargar médicos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateMedico = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedico.nombres || !newMedico.apellidos || !newMedico.dni) {
      setSubmitError('Los campos Nombres, Apellidos y DNI son obligatorios.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    setSubmitMessage('');

    try {
      const { error } = await supabase
        .from('medicos')
        .insert([
          {
            ...newMedico,
            estado: 'Activo'
          }
        ]);

      if (error) {
        setSubmitError(error.message);
        return;
      }

      setSubmitMessage('¡Médico registrado con éxito!');
      
      setNewMedico({
        nombres: '',
        apellidos: '',
        dni: '',
        sexo: 'Masculino',
        telefono: '',
        correo_profesional: '',
        especialidades: [],
      });

      await fetchMedicos();

      setTimeout(() => {
        setShowCreateModal(false);
        setSubmitMessage('');
      }, 1500);

    } catch (err) {
      setSubmitError('Ocurrió un error inesperado al intentar registrar el médico.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEdit = (medico: Medico) => {
    setSelectedMedico(medico);
    setEditMedicoForm({
      ...medico,
      especialidades: [...medico.especialidades]
    });
    setShowEditModal(true);
  };

  const handleUpdateMedico = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMedico?.id) return;
    
    if (!editMedicoForm.nombres || !editMedicoForm.apellidos || !editMedicoForm.dni) {
      setSubmitError('Los campos Nombres, Apellidos y DNI son obligatorios.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    setSubmitMessage('');

    try {
      const { error } = await supabase
        .from('medicos')
        .update({
          nombres: editMedicoForm.nombres,
          apellidos: editMedicoForm.apellidos,
          dni: editMedicoForm.dni,
          sexo: editMedicoForm.sexo,
          telefono: editMedicoForm.telefono,
          correo_profesional: editMedicoForm.correo_profesional,
          especialidades: editMedicoForm.especialidades
        })
        .eq('id', selectedMedico.id);

      if (error) {
        setSubmitError(error.message);
        return;
      }

      setSubmitMessage('¡Información del médico actualizada!');
      await fetchMedicos();

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

  const openDelete = (medico: Medico) => {
    setSelectedMedico(medico);
    setShowDeleteConfirm(true);
  };

  const handleDeleteMedico = async () => {
    if (!selectedMedico?.id) return;
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('medicos')
        .delete()
        .eq('id', selectedMedico.id);

      if (error) {
        console.error(error);
        return;
      }

      await fetchMedicos();
      setShowDeleteConfirm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
      setSelectedMedico(null);
    }
  };

  const openFicha = (medico: Medico) => {
    setSelectedMedico(medico);
    setShowViewModal(true);
  };

  const handleEspecialidadChange = (esp: string, mode: 'new' | 'edit') => {
    if (mode === 'new') {
      const exists = newMedico.especialidades.includes(esp);
      const nextEsps = exists 
        ? newMedico.especialidades.filter(e => e !== esp) 
        : [...newMedico.especialidades, esp];
      setNewMedico({ ...newMedico, especialidades: nextEsps });
    } else {
      const exists = editMedicoForm.especialidades.includes(esp);
      const nextEsps = exists 
        ? editMedicoForm.especialidades.filter(e => e !== esp) 
        : [...editMedicoForm.especialidades, esp];
      setEditMedicoForm({ ...editMedicoForm, especialidades: nextEsps });
    }
  };

  const filteredMedicos = useMemo(() => {
    if (!search) return medicos;
    const s = search.toLowerCase();
    return medicos.filter(m => 
      m.nombres.toLowerCase().includes(s) || 
      m.apellidos.toLowerCase().includes(s) || 
      m.dni.includes(s)
    );
  }, [search, medicos]);

  return (
    <div className="space-y-6 flex-1 w-full max-w-7xl mx-auto">
      {/* ENCABEZADO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white">
            Médicos Especialistas
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Registro, asignación de especialidades y control de personal odontológico.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex justify-center items-center gap-2 py-3 px-5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-md shadow-cyan-500/10 active:scale-[0.98] transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          Nuevo Médico
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
          placeholder="Buscar médico por DNI, nombres o apellidos..."
          className="block w-full pl-11 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400 focus:border-transparent shadow-sm transition-all"
        />
      </div>

      {/* TABLA DE LISTADO */}
      <div className="rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all duration-300">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/30 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase border-b border-slate-200 dark:border-slate-800">
                <th className="p-4 pl-6 w-16 text-center">ID</th>
                <th className="p-4">Nombres</th>
                <th className="p-4">Apellidos</th>
                <th className="p-4">Especialidad(es)</th>
                <th className="p-4 text-center">DNI</th>
                <th className="p-4 text-center">Estado</th>
                <th className="p-4 pr-6 text-center w-60">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {isLoading ? (
                [1, 2, 3].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="p-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded mx-auto w-6"></div></td>
                    <td className="p-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-20"></div></td>
                    <td className="p-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24"></div></td>
                    <td className="p-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-36"></div></td>
                    <td className="p-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded mx-auto w-20"></div></td>
                    <td className="p-4"><div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto w-16"></div></td>
                    <td className="p-4 pr-6"><div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl mx-auto w-48"></div></td>
                  </tr>
                ))
              ) : filteredMedicos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 dark:text-slate-500 font-medium">
                    No se encontraron médicos registrados.
                  </td>
                </tr>
              ) : (
                filteredMedicos.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 font-bold text-center text-slate-400 dark:text-slate-500">{m.id}</td>
                    <td className="p-4 font-semibold text-slate-800 dark:text-slate-200">{m.nombres}</td>
                    <td className="p-4 font-semibold text-slate-800 dark:text-slate-200">{m.apellidos}</td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1.5 max-w-xs">
                        {m.especialidades.map((esp) => (
                          <span key={esp} className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 border border-cyan-100 dark:border-cyan-500/10">
                            {esp}
                          </span>
                        ))}
                        {m.especialidades.length === 0 && <span className="text-xs text-slate-400 italic">Ninguna</span>}
                      </div>
                    </td>
                    <td className="p-4 text-center font-mono text-slate-600 dark:text-slate-400">{m.dni}</td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-500/10">
                        {m.estado || 'Activo'}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-center">
                      <div className="flex justify-center gap-1.5">
                        <button onClick={() => openFicha(m)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition cursor-pointer">Ver</button>
                        <button onClick={() => openEdit(m)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-yellow-500 hover:bg-yellow-600 transition cursor-pointer">Editar</button>
                        <button onClick={() => openDelete(m)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition cursor-pointer">Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CREACIÓN */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl p-6 md:p-8 relative border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowCreateModal(false)} className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-white text-2xl font-semibold cursor-pointer">×</button>

            <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white">Registrar Nuevo Médico</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Completa los campos e indica sus especialidades clínicas.</p>
            </div>

            <form onSubmit={handleCreateMedico} className="space-y-6">
              {submitError && <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm">{submitError}</div>}
              {submitMessage && <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400 text-sm animate-pulse">{submitMessage}</div>}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Nombres *</label>
                  <input value={newMedico.nombres} onChange={(e) => setNewMedico({...newMedico, nombres: e.target.value})} type="text" required className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Apellidos *</label>
                  <input value={newMedico.apellidos} onChange={(e) => setNewMedico({...newMedico, apellidos: e.target.value})} type="text" required className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">DNI *</label>
                  <input value={newMedico.dni} onChange={(e) => setNewMedico({...newMedico, dni: e.target.value})} type="text" required className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Sexo</label>
                  <select value={newMedico.sexo} onChange={(e) => setNewMedico({...newMedico, sexo: e.target.value})} className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:text-white">
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Teléfono</label>
                  <input value={newMedico.telefono} onChange={(e) => setNewMedico({...newMedico, telefono: e.target.value})} type="text" className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Correo Profesional</label>
                  <input value={newMedico.correo_profesional} onChange={(e) => setNewMedico({...newMedico, correo_profesional: e.target.value})} type="email" className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:text-white" />
                </div>
              </div>

              {/* ESPECIALIDADES */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Especialidades</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {especialidadesDisponibles.map((esp) => {
                    const isChecked = newMedico.especialidades.includes(esp);
                    return (
                      <label key={esp} className="flex items-center gap-3 border border-slate-200 dark:border-slate-800 rounded-xl p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition">
                        <input 
                          type="checkbox" 
                          checked={isChecked} 
                          onChange={() => handleEspecialidadChange(esp, 'new')}
                          className="w-5 h-5 rounded text-cyan-600 focus:ring-cyan-500 border-slate-300 dark:border-slate-700" 
                        />
                        <span className="font-medium text-sm text-slate-700 dark:text-slate-300">{esp}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800 pt-5">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold transition cursor-pointer">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-3 rounded-xl text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 font-bold shadow-md shadow-cyan-500/10 cursor-pointer disabled:opacity-50 flex items-center gap-2">
                  {isSubmitting && <Loader2 className="animate-spin h-5 w-5 text-white" />}
                  Guardar Médico
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDICIÓN */}
      {showEditModal && selectedMedico && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl p-6 md:p-8 relative border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowEditModal(false)} className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-white text-2xl font-semibold cursor-pointer">×</button>

            <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white">Editar Información Médica</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Actualiza los datos y especialidades del profesional.</p>
            </div>

            <form onSubmit={handleUpdateMedico} className="space-y-6">
              {submitError && <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm">{submitError}</div>}
              {submitMessage && <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400 text-sm animate-pulse">{submitMessage}</div>}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Nombres *</label>
                  <input value={editMedicoForm.nombres} onChange={(e) => setEditMedicoForm({...editMedicoForm, nombres: e.target.value})} type="text" required className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Apellidos *</label>
                  <input value={editMedicoForm.apellidos} onChange={(e) => setEditMedicoForm({...editMedicoForm, apellidos: e.target.value})} type="text" required className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">DNI *</label>
                  <input value={editMedicoForm.dni} onChange={(e) => setEditMedicoForm({...editMedicoForm, dni: e.target.value})} type="text" required className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Sexo</label>
                  <select value={editMedicoForm.sexo} onChange={(e) => setEditMedicoForm({...editMedicoForm, sexo: e.target.value})} className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:text-white">
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Teléfono</label>
                  <input value={editMedicoForm.telefono} onChange={(e) => setEditMedicoForm({...editMedicoForm, telefono: e.target.value})} type="text" className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Correo Profesional</label>
                  <input value={editMedicoForm.correo_profesional} onChange={(e) => setEditMedicoForm({...editMedicoForm, correo_profesional: e.target.value})} type="email" className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:text-white" />
                </div>
              </div>

              {/* ESPECIALIDADES */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Especialidades</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {especialidadesDisponibles.map((esp) => {
                    const isChecked = editMedicoForm.especialidades.includes(esp);
                    return (
                      <label key={esp} className="flex items-center gap-3 border border-slate-200 dark:border-slate-800 rounded-xl p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition">
                        <input 
                          type="checkbox" 
                          checked={isChecked} 
                          onChange={() => handleEspecialidadChange(esp, 'edit')}
                          className="w-5 h-5 rounded text-cyan-600 focus:ring-cyan-500 border-slate-300 dark:border-slate-700" 
                        />
                        <span className="font-medium text-sm text-slate-700 dark:text-slate-300">{esp}</span>
                      </label>
                    );
                  })}
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

      {/* CONFIRMACIÓN ELIMINACIÓN */}
      {showDeleteConfirm && selectedMedico && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl p-6 relative border border-slate-200 dark:border-slate-800 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-50 dark:bg-red-950/30 text-red-500 flex items-center justify-center mb-4 border border-red-200 dark:border-red-900/30">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">¿Eliminar Médico Especialista?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Estás a punto de dar de baja a <strong className="text-slate-800 dark:text-slate-200">{selectedMedico.nombres} {selectedMedico.apellidos}</strong>. Esta acción no se puede deshacer.
            </p>

            <div className="flex gap-3 mt-6 border-t border-slate-200 dark:border-slate-800 pt-4">
              <button type="button" onClick={() => setShowDeleteConfirm(false)} className="w-1/2 py-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold transition cursor-pointer">
                Cancelar
              </button>
              <button type="button" onClick={handleDeleteMedico} disabled={isSubmitting} className="w-1/2 py-3 rounded-xl text-white bg-red-600 hover:bg-red-700 font-bold shadow-md cursor-pointer flex justify-center items-center gap-2">
                {isSubmitting && <Loader2 className="animate-spin h-5 w-5 text-white" />}
                Confirmar Baja
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETALLES FICHA */}
      {showViewModal && selectedMedico && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl p-6 md:p-8 relative border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowViewModal(false)} className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-white text-2xl font-semibold cursor-pointer">×</button>

            <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
              <h2 className="text-2xl md:text-3xl font-extrabold text-blue-900 dark:text-cyan-400">Ficha Profesional del Médico</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Credenciales y especialidades registradas en el sistema.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/40">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><User className="w-3.5 h-3.5" /> Nombres</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 text-lg mt-1">{selectedMedico.nombres}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/40">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><User className="w-3.5 h-3.5" /> Apellidos</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 text-lg mt-1">{selectedMedico.apellidos}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/40">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">DNI</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 text-lg mt-1 font-mono">{selectedMedico.dni}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/40">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sexo</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 text-lg mt-1">{selectedMedico.sexo}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/40">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> Teléfono</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 text-lg mt-1">{selectedMedico.telefono || '—'}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/40">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> Correo Profesional</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 text-base mt-1 truncate">{selectedMedico.correo_profesional || '—'}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/40 mt-5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Especialidades Asignadas</span>
              <div className="flex flex-wrap gap-2">
                {selectedMedico.especialidades.map((esp) => (
                  <span key={esp} className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 border border-cyan-100 dark:border-cyan-500/10">
                    {esp}
                  </span>
                ))}
                {selectedMedico.especialidades.length === 0 && <span className="text-sm text-slate-400 italic">Ninguna especialidad asignada.</span>}
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-200 dark:border-slate-800 pt-5 mt-6">
              <button onClick={() => setShowViewModal(false)} className="px-5 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold transition hover:bg-slate-200 cursor-pointer">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
