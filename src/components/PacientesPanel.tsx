import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import {
  Search,
  UserPlus,
  FolderOpen,
  Loader2,
  Calendar,
  MapPin,
  User,
  Phone,
  Mail,
  MapPinned,
  ShieldCheck,
  ChevronRight,
  Users,
  UserRound,
  Stethoscope,
  X,
  ClipboardPlus,
} from 'lucide-react';

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

export const PacientesPanel: React.FC<{ setView: (v: string) => void }> = ({
  setView,
}) => {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [userRole, setUserRole] = useState('');
  const [medicoId, setMedicoId] = useState<number | null>(null);

  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedPaciente, setSelectedPaciente] =
    useState<Paciente | null>(null);

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
    inicializar();
  }, []);

  const inicializar = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    // obtener rol
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', user.id)
      .single();

    if (!perfil) return;

    setUserRole(perfil.rol);

    if (perfil.rol === 'medico') {
      const { data: medico } = await supabase
        .from('medicos')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (medico) {
        setMedicoId(medico.id);
        fetchPacientes('medico', medico.id);
      }
    } else {
      fetchPacientes(perfil.rol);
    }
  };

  const fetchPacientes = async (
    rol?: string,
    medicoId?: number
  ) => {
    setIsLoading(true);

    try {
      let query = supabase
        .from('pacientes')
        .select('*');

      if (rol === 'medico' && medicoId) {
        const { data: citas } = await supabase
          .from('citas')
          .select('paciente_id')
          .eq('medico_id', medicoId);

        const ids = citas?.map((c) => c.paciente_id) ?? [];

        if (ids.length === 0) {
          setPacientes([]);
          setIsLoading(false);
          return;
        }

        query = query.in('id', ids);
      }

      const { data, error } = await query.order('id', {
        ascending: false,
      });

      if (error) {
        console.error(
          'Error al cargar pacientes de Supabase:',
          error
        );
        return;
      }

      setPacientes(data || []);
    } catch (err) {
      console.error(
        'Error inesperado al cargar pacientes:',
        err
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePaciente = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (
      !newPaciente.nombres ||
      !newPaciente.apellidos ||
      !newPaciente.dni
    ) {
      setSubmitError(
        'Los campos Nombres, Apellidos y DNI son obligatorios.'
      );
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
            estado: 'Activo',
          },
        ]);

      if (error) {
        setSubmitError(error.message);
        return;
      }

      setSubmitMessage(
        '¡Paciente registrado con éxito!'
      );

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

      await fetchPacientes(
        userRole,
        medicoId ?? undefined
      );

      setTimeout(() => {
        setShowCreateModal(false);
        setSubmitMessage('');
      }, 1500);
    } catch (err) {
      setSubmitError(
        'Ocurrió un error inesperado al intentar registrar el paciente.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const openFicha = (paciente: Paciente) => {
    setSelectedPaciente(paciente);
    setShowViewModal(true);
  };

  // Filtrado reactivo
  const filteredPacientes = useMemo(() => {
    if (!search) return pacientes;

    const s = search.toLowerCase();

    return pacientes.filter(
      (p) =>
        p.nombres.toLowerCase().includes(s) ||
        p.apellidos.toLowerCase().includes(s) ||
        p.dni.includes(s)
    );
  }, [search, pacientes]);

  const formatFecha = (fStr: string) => {
    const [year, month, day] = fStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const getInitials = (paciente: Paciente) => {
    const nombre = paciente.nombres?.charAt(0) || '';
    const apellido = paciente.apellidos?.charAt(0) || '';

    return `${nombre}${apellido}`.toUpperCase();
  };

  return (
    <div className="w-full max-w-[1500px] mx-auto pb-10 space-y-6">

      {/* ========================================================= */}
      {/* ENCABEZADO CLÍNICO */}
      {/* ========================================================= */}

      <section className="relative overflow-hidden rounded-[28px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">

        {/* Decoración clínica */}
        <div className="absolute -right-20 -top-24 w-80 h-80 rounded-full bg-cyan-500/5 dark:bg-cyan-400/5 blur-3xl pointer-events-none" />
        <div className="absolute right-20 bottom-0 w-40 h-40 rounded-full bg-blue-500/5 dark:bg-blue-500/5 blur-3xl pointer-events-none" />

        <div className="relative p-6 md:p-8">

          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-7">

            <div className="flex items-start gap-4">

              <div className="hidden sm:flex w-14 h-14 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-100 dark:border-cyan-900/60 items-center justify-center shrink-0">
                <Users className="w-7 h-7 text-cyan-600 dark:text-cyan-400" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">

                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold uppercase tracking-wide">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Gestión clínica
                  </span>

                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-[11px] font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Expedientes protegidos
                  </span>

                </div>

                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Pacientes
                </h1>

                <p className="mt-2 max-w-2xl text-sm md:text-[15px] leading-6 text-slate-500 dark:text-slate-400">
                  Administre los expedientes de sus pacientes,
                  consulte sus datos personales y acceda
                  rápidamente a su información odontológica.
                </p>
              </div>

            </div>

            {userRole !== 'medico' && (
              <button
  onClick={() => setShowCreateModal(true)}
  className="group inline-flex items-center justify-center gap-3 px-5 py-3.5 rounded-2xl
    bg-slate-900 dark:bg-cyan-500
    text-white dark:text-slate-950
    text-sm font-extrabold
    border border-slate-800 dark:border-cyan-400/30
    shadow-lg shadow-slate-900/10 dark:shadow-cyan-500/10
    hover:bg-slate-800 dark:hover:bg-cyan-400
    hover:-translate-y-0.5
    active:translate-y-0
    transition-all duration-200
    cursor-pointer shrink-0"
>
  <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-white/10 dark:bg-slate-950/10">
    <UserPlus className="w-4 h-4" />
  </span>

  <span>Registrar paciente</span>

  <ChevronRight className="w-4 h-4 opacity-50 group-hover:translate-x-1 transition-transform" />
</button>
            )}

          </div>
        </div>
      </section>


      {/* ========================================================= */}
      {/* BUSCADOR + CONTEXTO */}
      {/* ========================================================= */}

      <section className="rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-4 md:p-5">

        <div className="flex flex-col lg:flex-row lg:items-center gap-4">

          <div className="relative flex-1">

            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            </div>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              type="text"
              placeholder="Buscar por DNI, nombres o apellidos..."
              className="w-full pl-12 pr-11 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 dark:focus:border-cyan-500 transition-all"
            />

            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                type="button"
                aria-label="Limpiar búsqueda"
              >
                <X className="w-4 h-4" />
              </button>
            )}

          </div>

          <div className="flex items-center justify-between lg:justify-end gap-3">

            <div className="inline-flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-100 dark:border-cyan-900/50">
              <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center">
                <UserRound className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500">
                  Expedientes
                </p>
                <p className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                  {filteredPacientes.length}
                </p>
              </div>
            </div>

          </div>
        </div>

        {search && (
          <div className="mt-3 px-1 text-xs text-slate-400 dark:text-slate-500">
            Mostrando resultados para{' '}
            <span className="font-bold text-slate-600 dark:text-slate-300">
              "{search}"
            </span>
          </div>
        )}

      </section>


      {/* ========================================================= */}
      {/* LISTADO DE PACIENTES */}
      {/* ========================================================= */}

      <section className="overflow-hidden rounded-[26px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">

        {/* Cabecera del listado */}

        <div className="px-5 md:px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

          <div className="flex items-center gap-3">

            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-950 flex items-center justify-center">
              <ClipboardPlus className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </div>

            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Expedientes de pacientes
              </h2>

              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                Información personal y acceso clínico
              </p>
            </div>

          </div>

          <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 dark:text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Pacientes activos
          </div>

        </div>


        {/* TABLA */}

        <div className="overflow-x-auto">

          <table className="w-full text-left border-collapse min-w-[850px]">

            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800">

                <th className="px-5 py-4 text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500 w-20 text-center">
                  ID
                </th>

                <th className="px-5 py-4 text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
                  Paciente
                </th>

                <th className="px-5 py-4 text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
                  Documento
                </th>

                <th className="px-5 py-4 text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
                  Contacto
                </th>

                <th className="px-5 py-4 text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
                  Estado
                </th>

                <th className="px-5 py-4 text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500 text-right">
                  Acciones
                </th>

              </tr>
            </thead>


            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">

              {isLoading ? (

                [1, 2, 3, 4].map((i) => (
                  <tr key={i} className="animate-pulse">

                    <td className="px-5 py-5">
                      <div className="h-8 w-8 mx-auto rounded-xl bg-slate-200 dark:bg-slate-800" />
                    </td>

                    <td className="px-5 py-5">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-xl bg-slate-200 dark:bg-slate-800" />
                        <div className="space-y-2">
                          <div className="h-3.5 w-32 rounded bg-slate-200 dark:bg-slate-800" />
                          <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-800" />
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-5">
                      <div className="h-4 w-20 rounded bg-slate-200 dark:bg-slate-800" />
                    </td>

                    <td className="px-5 py-5">
                      <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-800" />
                    </td>

                    <td className="px-5 py-5">
                      <div className="h-6 w-16 rounded-full bg-slate-200 dark:bg-slate-800" />
                    </td>

                    <td className="px-5 py-5">
                      <div className="h-9 w-32 ml-auto rounded-xl bg-slate-200 dark:bg-slate-800" />
                    </td>

                  </tr>
                ))

              ) : filteredPacientes.length === 0 ? (

                <tr>

                  <td colSpan={6} className="px-6 py-16">

                    <div className="flex flex-col items-center justify-center text-center">

                      <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-950 flex items-center justify-center mb-4">
                        <Search className="w-7 h-7 text-slate-300 dark:text-slate-700" />
                      </div>

                      <h3 className="text-sm font-extrabold text-slate-700 dark:text-slate-200">
                        No se encontraron pacientes
                      </h3>

                      <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400 dark:text-slate-500">
                        {search
                          ? 'Pruebe con otro nombre, apellido o número de DNI.'
                          : 'Todavía no hay pacientes registrados en este expediente.'}
                      </p>

                      {search && (
                        <button
                          onClick={() => setSearch('')}
                          className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                        >
                          Limpiar búsqueda
                        </button>
                      )}

                    </div>

                  </td>

                </tr>

              ) : (

                filteredPacientes.map((p) => (

                  <tr
                    key={p.id}
                    className="group hover:bg-cyan-50/30 dark:hover:bg-cyan-950/10 transition-colors duration-200"
                  >

                    {/* ID */}

                    <td className="px-5 py-5 text-center">

                      <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-950 text-[11px] font-extrabold text-slate-500 dark:text-slate-500">
                        #{p.id}
                      </span>

                    </td>


                    {/* PACIENTE */}

                    <td className="px-5 py-5">

                      <div className="flex items-center gap-3.5">

                        <div className="relative shrink-0">

                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-100 to-blue-100 dark:from-cyan-950/60 dark:to-blue-950/60 border border-cyan-200/60 dark:border-cyan-900/50 flex items-center justify-center">
                            <span className="text-xs font-extrabold text-cyan-700 dark:text-cyan-300">
                              {getInitials(p)}
                            </span>
                          </div>

                          <span className="absolute -right-1 -bottom-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />

                        </div>

                        <div className="min-w-0">

                          <p className="font-extrabold text-sm text-slate-900 dark:text-white truncate max-w-[230px]">
                            {p.nombres} {p.apellidos}
                          </p>

                          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                            <UserRound className="w-3 h-3" />
                            <span>{p.sexo || 'No especificado'}</span>

                            {p.fecha_nacimiento && (
                              <>
                                <span className="text-slate-300 dark:text-slate-700">
                                  •
                                </span>
                                <span>
                                  {formatFecha(p.fecha_nacimiento)}
                                </span>
                              </>
                            )}
                          </div>

                        </div>

                      </div>

                    </td>


                    {/* DNI */}

                    <td className="px-5 py-5">

                      <div className="flex flex-col">

                        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500">
                          DNI
                        </span>

                        <span className="mt-1 font-mono text-sm font-bold text-slate-700 dark:text-slate-300">
                          {p.dni}
                        </span>

                      </div>

                    </td>


                    {/* CONTACTO */}

                    <td className="px-5 py-5">

                      <div className="flex flex-col gap-1.5">

                        {p.telefono ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                            <Phone className="w-3.5 h-3.5 text-cyan-500" />
                            {p.telefono}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-slate-600">
                            Sin teléfono
                          </span>
                        )}

                        {p.correo && (
                          <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 max-w-[190px] truncate">
                            <Mail className="w-3.5 h-3.5 shrink-0" />
                            {p.correo}
                          </span>
                        )}

                      </div>

                    </td>


                    {/* ESTADO */}

                    <td className="px-5 py-5">

                      <span className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold">

                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />

                        {p.estado || 'Activo'}

                      </span>

                    </td>


                    {/* ACCIONES */}

                    <td className="px-5 py-5">

                      <div className="flex justify-end items-center gap-2">

                        {/* FICHA */}

                       <button
  onClick={() => openFicha(p)}
  className="group inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl
    bg-white dark:bg-slate-900
    text-slate-700 dark:text-slate-200
    border border-slate-200 dark:border-slate-700
    text-xs font-extrabold
    shadow-sm
    hover:bg-slate-50 dark:hover:bg-slate-800
    hover:border-cyan-300 dark:hover:border-cyan-500/40
    hover:text-cyan-700 dark:hover:text-cyan-300
    hover:-translate-y-0.5
    active:translate-y-0
    transition-all duration-200
    cursor-pointer"
>
  <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-cyan-50 dark:group-hover:bg-cyan-500/10 transition-colors">
    <FolderOpen className="w-3.5 h-3.5" />
  </span>

  <span>Ficha</span>

  <ChevronRight className="w-3.5 h-3.5 opacity-40 group-hover:translate-x-0.5 transition-transform" />
</button>

                        {/* ODONTO */}

                        <button
                          onClick={() => {
                            localStorage.setItem(
                              'paciente-id',
                              String(p.id)
                            );

                            setView('paciente-detalle');
                          }}
                          className="group/odonto inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500 dark:bg-cyan-500 text-white dark:text-slate-950 text-xs font-extrabold hover:bg-cyan-600 dark:hover:bg-cyan-400 transition shadow-sm cursor-pointer"
                        >
                          <Stethoscope className="w-3.5 h-3.5" />
                          Odonto
                          <ChevronRight className="w-3 h-3 opacity-60 group-hover/odonto:translate-x-0.5 transition-transform" />
                        </button>

                      </div>

                    </td>

                  </tr>

                ))
              )}

            </tbody>

          </table>

        </div>
      </section>


      {/* ========================================================= */}
      {/* MODAL REGISTRO PACIENTE */}
      {/* ========================================================= */}

      {showCreateModal && (

        <div className="fixed inset-0 bg-slate-950/50 dark:bg-black/70 backdrop-blur-md flex justify-center items-center z-50 p-4">

          <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-[28px] shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] overflow-y-auto">

            {/* Modal Header */}

            <div className="sticky top-0 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 md:px-8 py-5">

              <div className="flex items-start justify-between gap-4">

                <div className="flex items-center gap-3">

                  <div className="w-11 h-11 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-100 dark:border-cyan-900/50 flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                  </div>

                  <div>
                    <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white">
                      Registrar paciente
                    </h2>

                    <p className="text-xs md:text-sm text-slate-400 dark:text-slate-500 mt-0.5">
                      Cree un nuevo expediente clínico.
                    </p>
                  </div>

                </div>

                <button
                  onClick={() => setShowCreateModal(false)}
                  className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                  type="button"
                  aria-label="Cerrar"
                >
                  <X className="w-4 h-4" />
                </button>

              </div>

            </div>


            <form
              onSubmit={handleCreatePaciente}
              className="p-6 md:p-8 space-y-7"
            >

              {/* Mensajes */}

              {submitError && (
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 text-sm">
                  <div className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-950/60 flex items-center justify-center shrink-0">
                    !
                  </div>
                  <p className="pt-1 font-medium">
                    {submitError}
                  </p>
                </div>
              )}

              {submitMessage && (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 text-emerald-600 dark:text-emerald-400 text-sm">
                  <ShieldCheck className="w-5 h-5 shrink-0" />
                  <p className="font-bold">
                    {submitMessage}
                  </p>
                </div>
              )}


              {/* Datos personales */}

              <div>

                <div className="flex items-center gap-3 mb-5">

                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-950 flex items-center justify-center">
                    <UserRound className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  </div>

                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800 dark:text-white">
                      Datos personales
                    </h3>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                      Información principal del paciente
                    </p>
                  </div>

                </div>


                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                      Nombres *
                    </label>

                    <input
                      value={newPaciente.nombres}
                      onChange={(e) =>
                        setNewPaciente({
                          ...newPaciente,
                          nombres: e.target.value,
                        })
                      }
                      type="text"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 transition"
                    />
                  </div>


                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                      Apellidos *
                    </label>

                    <input
                      value={newPaciente.apellidos}
                      onChange={(e) =>
                        setNewPaciente({
                          ...newPaciente,
                          apellidos: e.target.value,
                        })
                      }
                      type="text"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 transition"
                    />
                  </div>


                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                      DNI *
                    </label>

                    <input
                      value={newPaciente.dni}
                      onChange={(e) =>
                        setNewPaciente({
                          ...newPaciente,
                          dni: e.target.value,
                        })
                      }
                      type="text"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm font-mono font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 transition"
                    />
                  </div>


                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                      Sexo
                    </label>

                    <select
                      value={newPaciente.sexo}
                      onChange={(e) =>
                        setNewPaciente({
                          ...newPaciente,
                          sexo: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 transition"
                    >
                      <option value="Masculino">
                        Masculino
                      </option>
                      <option value="Femenino">
                        Femenino
                      </option>
                    </select>
                  </div>


                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                      Teléfono
                    </label>

                    <input
                      value={newPaciente.telefono}
                      onChange={(e) =>
                        setNewPaciente({
                          ...newPaciente,
                          telefono: e.target.value,
                        })
                      }
                      type="text"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 transition"
                    />
                  </div>


                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                      Fecha de nacimiento
                    </label>

                    <input
                      value={newPaciente.fecha_nacimiento}
                      onChange={(e) =>
                        setNewPaciente({
                          ...newPaciente,
                          fecha_nacimiento:
                            e.target.value,
                        })
                      }
                      type="date"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 transition"
                    />
                  </div>


                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                      Correo electrónico
                    </label>

                    <input
                      value={newPaciente.correo}
                      onChange={(e) =>
                        setNewPaciente({
                          ...newPaciente,
                          correo: e.target.value,
                        })
                      }
                      type="email"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 transition"
                    />
                  </div>


                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                      Ciudad
                    </label>

                    <input
                      value={newPaciente.ciudad}
                      onChange={(e) =>
                        setNewPaciente({
                          ...newPaciente,
                          ciudad: e.target.value,
                        })
                      }
                      type="text"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 transition"
                    />
                  </div>

                </div>

              </div>


              {/* Dirección */}

              <div>

                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                  Dirección domiciliaria
                </label>

                <div className="relative">

                  <MapPinned className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-600" />

                  <input
                    value={newPaciente.direccion}
                    onChange={(e) =>
                      setNewPaciente({
                        ...newPaciente,
                        direccion: e.target.value,
                      })
                    }
                    type="text"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 transition"
                  />

                </div>

              </div>


              {/* Apoderado */}

              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-5">

                <div className="flex items-center gap-3 mb-5">

                  <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  </div>

                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800 dark:text-white">
                      Tutor o apoderado
                    </h3>

                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                      Información opcional para menores o pacientes dependientes
                    </p>
                  </div>

                </div>


                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                      Nombre completo
                    </label>

                    <input
                      value={newPaciente.nombre_apoderado}
                      onChange={(e) =>
                        setNewPaciente({
                          ...newPaciente,
                          nombre_apoderado:
                            e.target.value,
                        })
                      }
                      type="text"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 transition"
                    />
                  </div>


                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                      Teléfono del apoderado
                    </label>

                    <input
                      value={newPaciente.telefono_apoderado}
                      onChange={(e) =>
                        setNewPaciente({
                          ...newPaciente,
                          telefono_apoderado:
                            e.target.value,
                        })
                      }
                      type="text"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 transition"
                    />
                  </div>

                </div>

              </div>


              {/* Footer */}

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">

                <button
                  type="button"
                  onClick={() =>
                    setShowCreateModal(false)
                  }
                  className="px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-900 dark:bg-cyan-500 text-white dark:text-slate-950 text-sm font-extrabold hover:bg-slate-800 dark:hover:bg-cyan-400 shadow-lg shadow-slate-900/10 dark:shadow-cyan-500/10 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting && (
                    <Loader2 className="animate-spin h-4 w-4" />
                  )}

                  {isSubmitting
                    ? 'Guardando...'
                    : 'Guardar paciente'}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}


      {/* ========================================================= */}
      {/* MODAL DETALLES FICHA */}
      {/* ========================================================= */}

      {showViewModal && selectedPaciente && (

        <div className="fixed inset-0 bg-slate-950/50 dark:bg-black/70 backdrop-blur-md flex justify-center items-center z-50 p-4">

          <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-[28px] shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] overflow-y-auto">
            {/* Header */}

          
            {/* Header */}
<div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 md:px-8 py-5">

  <div className="flex items-center justify-between gap-4">

    <div className="flex items-center gap-4 min-w-0">

      {/* Avatar */}
      <div className="w-14 h-14 rounded-2xl bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20 flex items-center justify-center flex-shrink-0">
        <span className="text-base font-extrabold text-cyan-700 dark:text-cyan-300">
          {getInitials(selectedPaciente)}
        </span>
      </div>

      {/* Información */}
      <div className="min-w-0">

        <div className="flex flex-wrap items-center gap-2">

          <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white truncate">
            {selectedPaciente.nombres}{' '}
            {selectedPaciente.apellidos}
          </h2>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {selectedPaciente.estado || 'Activo'}
          </span>

        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">

          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Ficha clínica
          </p>

          <span className="hidden sm:block w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />

          <p className="text-xs text-slate-400 dark:text-slate-500">
            DNI {selectedPaciente.dni}
          </p>

        </div>

      </div>

    </div>

    {/* Cerrar */}
    <button
      onClick={() => setShowViewModal(false)}
      className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200 cursor-pointer flex-shrink-0"
      type="button"
      aria-label="Cerrar ficha"
    >
      <X className="w-4 h-4" />
    </button>

  </div>

</div>

            <div className="p-6 md:p-8">

              {/* Identificación */}

              {/* Identificación */}

<div className="mb-8">

  <div className="flex items-center gap-3 mb-4">

    <div className="w-9 h-9 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-100 dark:border-cyan-500/20 flex items-center justify-center">
      <Stethoscope className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
    </div>

    <div>
      <h3 className="text-sm font-extrabold text-slate-800 dark:text-white">
        Información del paciente
      </h3>

      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
        Datos personales e identificación
      </p>
    </div>

  </div>


  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

    {/* Nombres */}
    <div className="group p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-cyan-300 dark:hover:border-cyan-500/30 hover:shadow-sm transition-all duration-200">

      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
        <User className="w-3.5 h-3.5" />
        Nombres
      </span>

      <p className="font-extrabold text-slate-800 dark:text-slate-200 text-sm mt-2.5">
        {selectedPaciente.nombres}
      </p>

    </div>


    {/* Apellidos */}
    <div className="group p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-cyan-300 dark:hover:border-cyan-500/30 hover:shadow-sm transition-all duration-200">

      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
        <User className="w-3.5 h-3.5" />
        Apellidos
      </span>

      <p className="font-extrabold text-slate-800 dark:text-slate-200 text-sm mt-2.5">
        {selectedPaciente.apellidos}
      </p>

    </div>


    {/* DNI */}
    <div className="group p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-cyan-300 dark:hover:border-cyan-500/30 hover:shadow-sm transition-all duration-200">

      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        Documento de identidad
      </span>

      <p className="font-mono font-extrabold text-slate-800 dark:text-slate-200 text-sm mt-2.5">
        {selectedPaciente.dni}
      </p>

    </div>


    {/* Sexo */}
    <div className="group p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-cyan-300 dark:hover:border-cyan-500/30 hover:shadow-sm transition-all duration-200">

      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        Sexo
      </span>

      <p className="font-extrabold text-slate-800 dark:text-slate-200 text-sm mt-2.5">
        {selectedPaciente.sexo || '—'}
      </p>

    </div>

  </div>

</div>

             {/* Contacto */}

<div className="mb-8">

  <div className="flex items-center gap-3 mb-4">

    <div className="w-9 h-9 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-100 dark:border-cyan-500/20 flex items-center justify-center">
      <Phone className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
    </div>

    <div>
      <h3 className="text-sm font-extrabold text-slate-800 dark:text-white">
        Contacto y ubicación
      </h3>

      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
        Información de contacto y residencia
      </p>
    </div>

  </div>


  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

    {/* Teléfono */}
    <div className="group p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-cyan-300 dark:hover:border-cyan-500/30 hover:shadow-sm transition-all duration-200">

      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
        <Phone className="w-3.5 h-3.5" />
        Teléfono
      </span>

      <p className="font-extrabold text-slate-800 dark:text-slate-200 text-sm mt-2.5">
        {selectedPaciente.telefono || '—'}
      </p>

    </div>


    {/* Fecha de nacimiento */}
    <div className="group p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-cyan-300 dark:hover:border-cyan-500/30 hover:shadow-sm transition-all duration-200">

      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
        <Calendar className="w-3.5 h-3.5" />
        Fecha de nacimiento
      </span>

      <p className="font-extrabold text-slate-800 dark:text-slate-200 text-sm mt-2.5">
        {selectedPaciente.fecha_nacimiento
          ? formatFecha(selectedPaciente.fecha_nacimiento)
          : '—'}
      </p>

    </div>


    {/* Correo */}
    <div className="group p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-cyan-300 dark:hover:border-cyan-500/30 hover:shadow-sm transition-all duration-200">

      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
        <Mail className="w-3.5 h-3.5" />
        Correo electrónico
      </span>

      <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm mt-2.5 truncate">
        {selectedPaciente.correo || '—'}
      </p>

    </div>


    {/* Ciudad */}
    <div className="group p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-cyan-300 dark:hover:border-cyan-500/30 hover:shadow-sm transition-all duration-200">

      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
        <MapPin className="w-3.5 h-3.5" />
        Ciudad
      </span>

      <p className="font-extrabold text-slate-800 dark:text-slate-200 text-sm mt-2.5">
        {selectedPaciente.ciudad || '—'}
      </p>

    </div>

  </div>


  {/* Dirección */}
  <div className="mt-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-cyan-300 dark:hover:border-cyan-500/30 hover:shadow-sm transition-all duration-200">

    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
      <MapPinned className="w-3.5 h-3.5" />
      Dirección
    </span>

    <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm mt-2.5">
      {selectedPaciente.direccion || 'Sin dirección registrada.'}
    </p>

  </div>

</div>


            
          {/* Apoderado */}

{selectedPaciente.nombre_apoderado && (

  <div className="mb-2 p-5 rounded-2xl bg-cyan-50/70 dark:bg-cyan-500/5 border border-cyan-100 dark:border-cyan-500/20">

    <div className="flex items-center gap-3 mb-5">

      <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-cyan-100 dark:border-cyan-500/20 flex items-center justify-center shadow-sm">
        <ShieldCheck className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
      </div>

      <div>
        <h3 className="text-sm font-extrabold text-slate-800 dark:text-white">
          Tutor o apoderado
        </h3>

        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
          Contacto registrado
        </p>
      </div>

    </div>


    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

      {/* Nombre */}
      <div className="p-4 rounded-xl bg-white/80 dark:bg-slate-900/70 border border-cyan-100/80 dark:border-slate-800">

        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Nombre completo
        </span>

        <p className="font-bold text-slate-700 dark:text-slate-300 text-sm mt-2">
          {selectedPaciente.nombre_apoderado}
        </p>

      </div>


      {/* Teléfono */}
      <div className="p-4 rounded-xl bg-white/80 dark:bg-slate-900/70 border border-cyan-100/80 dark:border-slate-800">

        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Teléfono
        </span>

        <p className="font-bold text-slate-700 dark:text-slate-300 text-sm mt-2">
          {selectedPaciente.telefono_apoderado || '—'}
        </p>

      </div>

    </div>

  </div>

)}

              {/* Footer */}

              <div className="flex justify-end pt-6 mt-6 border-t border-slate-200 dark:border-slate-800">

                <button
  onClick={() => setShowViewModal(false)}
  className="group inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl
    bg-slate-900 dark:bg-cyan-500
    text-white dark:text-slate-950
    border border-slate-800 dark:border-cyan-400/30
    text-sm font-extrabold
    shadow-sm
    hover:bg-slate-800 dark:hover:bg-cyan-400
    hover:-translate-y-0.5
    active:translate-y-0
    transition-all duration-200
    cursor-pointer"
>
  <X className="w-4 h-4 opacity-70 group-hover:rotate-90 transition-transform duration-200" />
  <span>Cerrar ficha</span>
</button>

              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
};