import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Search, UserPlus, FolderOpen, Loader2, Calendar, MapPin, User, Phone } from 'lucide-react';

interface Paciente {
  id?: number;
  nombres: string;
  apellidos: string;
  dni: string;
  telefono: string;
  fecha_nacimiento: string;
  sexo: string;
  correo: string;
  ciudad: string;
  nombre_apoderado: string;
  telefono_apoderado: string;
  direccion: string;
  estado?: string;
  created_at?: string;
}

export const PacientesPanel: React.FC = () => {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(null);

  // Formulario nuevo paciente
  const [newPaciente, setNewPaciente] = useState<Paciente>({
    nombres: '',
    apellidos: '',
    dni: '',
    telefono: '',
    fecha_nacimiento: '',
    sexo: 'Masculino',
    correo: '',
    ciudad: '',
    nombre_apoderado: '',
    telefono_apoderado: '',
    direccion: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    fetchPacientes();
  }, []);

  const fetchPacientes = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('pacientes')
        .select('*')
        .order('id', { ascending: false });

      if (error) {
        console.error('Error al cargar pacientes de Supabase:', error);
        return;
      }
      setPacientes(data || []);
    } catch (err) {
      console.error('Error inesperado al cargar pacientes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePaciente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPaciente.nombres || !newPaciente.apellidos || !newPaciente.dni) {
      setSubmitError('Los campos Nombres, Apellidos y DNI son obligatorios.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    setSubmitMessage('');

    try {
      const { error } = await supabase
        .from('pacientes')
        .insert([
          {
            ...newPaciente,
            estado: 'Activo'
          }
        ]);

      if (error) {
        setSubmitError(error.message);
        return;
      }

      setSubmitMessage('¡Paciente registrado con éxito!');
      
      // Resetear
      setNewPaciente({
        nombres: '',
        apellidos: '',
        dni: '',
        telefono: '',
        fecha_nacimiento: '',
        sexo: 'Masculino',
        correo: '',
        ciudad: '',
        nombre_apoderado: '',
        telefono_apoderado: '',
        direccion: '',
      });

      await fetchPacientes();

      setTimeout(() => {
        setShowCreateModal(false);
        setSubmitMessage('');
      }, 1500);

    } catch (err) {
      setSubmitError('Ocurrió un error inesperado al intentar registrar el paciente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openFicha = (paciente: Paciente) => {
    setSelectedPaciente(paciente);
    setShowViewModal(true);
  };

  // Filtrado reactivo (useMemo para alto rendimiento en React)
  const filteredPacientes = useMemo(() => {
    if (!search) return pacientes;
    const s = search.toLowerCase();
    return pacientes.filter(p => 
      p.nombres.toLowerCase().includes(s) || 
      p.apellidos.toLowerCase().includes(s) || 
      p.dni.includes(s)
    );
  }, [search, pacientes]);

  return (
    <div className="space-y-6 flex-1 w-full max-w-7xl mx-auto">
      {/* ENCABEZADO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white">
            Control de Pacientes
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Visualiza, busca y registra las fichas clínicas de pacientes activos de la clínica.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex justify-center items-center gap-2 py-3 px-5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-md shadow-cyan-500/10 active:scale-[0.98] transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          Registrar Paciente
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
          placeholder="Buscar paciente por DNI, nombres o apellidos..."
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
                <th className="p-4 text-center">DNI</th>
                <th className="p-4 text-center">Teléfono</th>
                <th className="p-4 text-center">Estado</th>
                <th className="p-4 pr-6 text-center w-40">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {isLoading ? (
                [1, 2, 3].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="p-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded mx-auto w-6"></div></td>
                    <td className="p-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-20"></div></td>
                    <td className="p-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24"></div></td>
                    <td className="p-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded mx-auto w-20"></div></td>
                    <td className="p-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded mx-auto w-24"></div></td>
                    <td className="p-4"><div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto w-16"></div></td>
                    <td className="p-4 pr-6"><div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl mx-auto w-20"></div></td>
                  </tr>
                ))
              ) : filteredPacientes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 dark:text-slate-500 font-medium">
                    No se encontraron pacientes registrados.
                  </td>
                </tr>
              ) : (
                filteredPacientes.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 font-bold text-center text-slate-400 dark:text-slate-500">{p.id}</td>
                    <td className="p-4 font-semibold text-slate-800 dark:text-slate-200">{p.nombres}</td>
                    <td className="p-4 font-semibold text-slate-800 dark:text-slate-200">{p.apellidos}</td>
                    <td className="p-4 text-center font-mono text-slate-600 dark:text-slate-400">{p.dni}</td>
                    <td className="p-4 text-center font-bold text-slate-700 dark:text-slate-300">{p.telefono || '—'}</td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-500/10">
                        {p.estado || 'Activo'}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-center">
                      <button 
                        onClick={() => openFicha(p)} 
                        className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 dark:bg-cyan-500 dark:hover:bg-cyan-600 transition shadow-md cursor-pointer flex items-center gap-1 mx-auto"
                      >
                        <FolderOpen className="w-3.5 h-3.5" /> Ficha
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL REGISTRO PACIENTE */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl p-6 md:p-8 relative border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowCreateModal(false)} className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-white text-2xl font-semibold cursor-pointer">×</button>

            <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white">Registrar Nuevo Paciente</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Completa las credenciales del paciente y de su apoderado si aplica.</p>
            </div>

            <form onSubmit={handleCreatePaciente} className="space-y-6">
              {submitError && <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm">{submitError}</div>}
              {submitMessage && <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400 text-sm animate-pulse">{submitMessage}</div>}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Nombres *</label>
                  <input value={newPaciente.nombres} onChange={(e) => setNewPaciente({...newPaciente, nombres: e.target.value})} type="text" required className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Apellidos *</label>
                  <input value={newPaciente.apellidos} onChange={(e) => setNewPaciente({...newPaciente, apellidos: e.target.value})} type="text" required className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">DNI *</label>
                  <input value={newPaciente.dni} onChange={(e) => setNewPaciente({...newPaciente, dni: e.target.value})} type="text" required className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Sexo</label>
                  <select value={newPaciente.sexo} onChange={(e) => setNewPaciente({...newPaciente, sexo: e.target.value})} className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:text-white">
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Teléfono</label>
                  <input value={newPaciente.telefono} onChange={(e) => setNewPaciente({...newPaciente, telefono: e.target.value})} type="text" className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Fecha Nacimiento</label>
                  <input value={newPaciente.fecha_nacimiento} onChange={(e) => setNewPaciente({...newPaciente, fecha_nacimiento: e.target.value})} type="date" className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Correo Electrónico</label>
                  <input value={newPaciente.correo} onChange={(e) => setNewPaciente({...newPaciente, correo: e.target.value})} type="email" className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Ciudad</label>
                  <input value={newPaciente.ciudad} onChange={(e) => setNewPaciente({...newPaciente, ciudad: e.target.value})} type="text" className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:text-white" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Dirección Doméstica</label>
                <input value={newPaciente.direccion} onChange={(e) => setNewPaciente({...newPaciente, direccion: e.target.value})} type="text" className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:text-white" />
              </div>

              {/* APODERADO */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-5">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4">Información del Apoderado (Opcional)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Nombre Completo del Apoderado</label>
                    <input value={newPaciente.nombre_apoderado} onChange={(e) => setNewPaciente({...newPaciente, nombre_apoderado: e.target.value})} type="text" className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Teléfono del Apoderado</label>
                    <input value={newPaciente.telefono_apoderado} onChange={(e) => setNewPaciente({...newPaciente, telefono_apoderado: e.target.value})} type="text" className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:text-white" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800 pt-5">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold transition cursor-pointer">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-3 rounded-xl text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 font-bold shadow-md shadow-cyan-500/10 cursor-pointer disabled:opacity-50 flex items-center gap-2">
                  {isSubmitting && <Loader2 className="animate-spin h-5 w-5 text-white" />}
                  Guardar Paciente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETALLES FICHA */}
      {showViewModal && selectedPaciente && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl p-6 md:p-8 relative border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowViewModal(false)} className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-white text-2xl font-semibold cursor-pointer">×</button>

            <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
              <h2 className="text-2xl md:text-3xl font-extrabold text-blue-900 dark:text-cyan-400">Ficha Clínica de Paciente</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Expediente de filiación y contacto legal del paciente.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/40">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><User className="w-3.5 h-3.5" /> Nombres</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 text-lg mt-1">{selectedPaciente.nombres}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/40">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><User className="w-3.5 h-3.5" /> Apellidos</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 text-lg mt-1">{selectedPaciente.apellidos}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/40">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Documento Nacional de Identidad (DNI)</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 text-lg mt-1 font-mono">{selectedPaciente.dni}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/40">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sexo</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 text-lg mt-1">{selectedPaciente.sexo}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/40">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> Teléfono</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 text-lg mt-1">{selectedPaciente.telefono || '—'}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/40">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Fecha de Nacimiento</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 text-lg mt-1">{selectedPaciente.fecha_nacimiento ? formatFecha(selectedPaciente.fecha_nacimiento) : '—'}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/40">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Correo Electrónico</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 text-base mt-1 truncate">{selectedPaciente.correo || '—'}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/40">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Ciudad</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 text-lg mt-1">{selectedPaciente.ciudad || '—'}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/40 mt-5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Dirección Física Completa</span>
              <p className="font-semibold text-slate-700 dark:text-slate-300 mt-1 text-sm">{selectedPaciente.direccion || 'Sin dirección registrada.'}</p>
            </div>

            {/* SECCIÓN APODERADO */}
            {selectedPaciente.nombre_apoderado && (
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/40 mt-5 space-y-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Información de Tutor o Apoderado</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Nombre Completo</span>
                    <p className="font-bold text-slate-700 dark:text-slate-300 text-sm mt-0.5">{selectedPaciente.nombre_apoderado}</p>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Contacto</span>
                    <p className="font-bold text-slate-700 dark:text-slate-300 text-sm mt-0.5">{selectedPaciente.telefono_apoderado || '—'}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end border-t border-slate-200 dark:border-slate-800 pt-5 mt-6">
              <button onClick={() => setShowViewModal(false)} className="px-5 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold transition hover:bg-slate-200 cursor-pointer">Cerrar Ficha</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const formatFecha = (fStr: string) => {
  const [year, month, day] = fStr.split('-');
  return `${day}/${month}/${year}`;
};
