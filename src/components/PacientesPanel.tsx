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

  FileText,
  VenusAndMars,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  ContactRound,
  IdCard,
  Filter,
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

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedPaciente, setSelectedPaciente] =
    useState<Paciente | null>(null);

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
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data: perfil, error } = await supabase
        .from('perfiles')
        .select('rol')
        .eq('id', user.id)
        .single();

      if (error || !perfil) {
        setIsLoading(false);
        return;
      }

      setUserRole(perfil.rol);

      if (perfil.rol === 'medico') {
        const { data: medico } = await supabase
          .from('medicos')
          .select('id')
          .eq('auth_user_id', user.id)
          .single();

        if (medico) {
          setMedicoId(medico.id);
          await fetchPacientes('medico', medico.id);
        } else {
          setIsLoading(false);
        }
      } else {
        await fetchPacientes(perfil.rol);
      }
    } catch (error) {
      console.error('Error al inicializar pacientes:', error);
      setIsLoading(false);
    }
  };

  const fetchPacientes = async (
    rol?: string,
    medicoId?: number
  ) => {
    setIsLoading(true);

    try {
      let query = supabase.from('pacientes').select('*');

      if (rol === 'medico' && medicoId) {
        const { data: citas, error: citasError } = await supabase
          .from('citas')
          .select('paciente_id')
          .eq('medico_id', medicoId);

        if (citasError) throw citasError;

        const ids = [...new Set(citas?.map((c) => c.paciente_id) ?? [])];

        if (ids.length === 0) {
          setPacientes([]);
          return;
        }

        query = query.in('id', ids);
      }

      const { data, error } = await query.order('id', {
        ascending: false,
      });

      if (error) {
        console.error('Error al cargar pacientes de Supabase:', error);
        return;
      }

      setPacientes(data || []);
    } catch (error) {
      console.error('Error inesperado al cargar pacientes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePaciente = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !newPaciente.nombres.trim() ||
      !newPaciente.apellidos.trim() ||
      !newPaciente.dni.trim()
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
      const { error } = await supabase.from('pacientes').insert([
        {
          ...newPaciente,
          estado: 'Activo',
        },
      ]);

      if (error) {
        setSubmitError(error.message);
        return;
      }

      setSubmitMessage('¡Paciente registrado con éxito!');

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

      await fetchPacientes(userRole, medicoId ?? undefined);

      setTimeout(() => {
        setShowCreateModal(false);
        setSubmitMessage('');
      }, 1500);
    } catch (error) {
      console.error('Error al registrar paciente:', error);
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

  const filteredPacientes = useMemo(() => {
    const termino = search.trim().toLowerCase();

    if (!termino) return pacientes;

    return pacientes.filter((paciente) => {
      const nombre = `${paciente.nombres || ''} ${
        paciente.apellidos || ''
      }`.toLowerCase();

      return (
        nombre.includes(termino) ||
        (paciente.dni || '').toLowerCase().includes(termino)
      );
    });
  }, [search, pacientes]);

  const formatFecha = (fStr: string) => {
    if (!fStr) return '—';

    const [year, month, day] = fStr.split('-');

    if (!year || !month || !day) return fStr;

    return `${day}/${month}/${year}`;
  };

  const getInitials = (paciente: Paciente) => {
    const nombre = paciente.nombres?.charAt(0) || '';
    const apellido = paciente.apellidos?.charAt(0) || '';

    return `${nombre}${apellido}`.toUpperCase();
  };

  const actualizarCampo = (
    campo: keyof Paciente,
    valor: string
  ) => {
    setNewPaciente((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  };

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400/10';

  const labelClass =
    'mb-2 block text-xs font-bold text-slate-600 dark:text-slate-300';

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-6 pb-10">
      {/* ENCABEZADO */}
      <section className="relative isolate overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="pointer-events-none absolute -right-20 -top-28 -z-10 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 right-1/4 -z-10 h-64 w-64 rounded-full bg-blue-500/5 blur-3xl" />

        <div className="flex flex-col gap-6 p-6 sm:p-8 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-100 bg-cyan-50 text-cyan-700 dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-300">
              <Users className="h-7 w-7" />
            </div>

            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Gestión clínica
                </span>

                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-bold text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Expedientes protegidos
                </span>
              </div>

              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                Pacientes
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                Administra los expedientes, consulta los datos personales y
                accede a la información odontológica de tus pacientes.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                  Expedientes clínicos
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  Información centralizada
                </span>
              </div>
            </div>
          </div>

          {userRole !== 'medico' && (
            <button
              type="button"
              onClick={() => {
                setSubmitError('');
                setSubmitMessage('');
                setShowCreateModal(true);
              }}
              className="inline-flex shrink-0 items-center justify-center gap-2.5 rounded-xl bg-slate-900 px-5 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-slate-900/10 transition hover:-translate-y-0.5 hover:bg-slate-800 active:translate-y-0 dark:bg-cyan-500 dark:text-slate-950 dark:shadow-cyan-950/20 dark:hover:bg-cyan-400 cursor-pointer"
            >
              <UserPlus className="h-4 w-4" />
              Registrar paciente
              <ChevronRight className="h-4 w-4 opacity-60" />
            </button>
          )}
        </div>
      </section>

      {/* INDICADORES */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300">
            <Users className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Total de pacientes
            </p>
            <p className="mt-1 text-2xl font-black tabular-nums text-slate-900 dark:text-white">
              {isLoading ? '—' : pacientes.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
            <Search className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Resultados de búsqueda
            </p>
            <p className="mt-1 text-2xl font-black tabular-nums text-slate-900 dark:text-white">
              {isLoading ? '—' : filteredPacientes.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Acceso clínico
            </p>
            <p className="mt-1 truncate text-sm font-extrabold text-slate-900 dark:text-white">
              {userRole === 'medico'
                ? 'Pacientes asignados'
                : 'Gestión de expedientes'}
            </p>
          </div>
        </div>
      </div>

      {/* BÚSQUEDA */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <Filter className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Buscar pacientes
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Encuentra un expediente por nombre o documento.
              </p>
            </div>
          </div>

          <div className="relative w-full lg:max-w-xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="DNI, nombres o apellidos..."
              aria-label="Buscar pacientes por DNI, nombres o apellidos"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-12 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-cyan-400 dark:focus:bg-slate-950"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Limpiar búsqueda"
                className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {search ? (
              <>
                Resultados para{' '}
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  “{search}”
                </span>
              </>
            ) : (
              'Consulta los expedientes registrados en el sistema.'
            )}
          </p>

          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1.5 text-xs font-extrabold text-cyan-800 dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-300">
            <UserRound className="h-3.5 w-3.5" />
            {isLoading ? 'Cargando…' : `${filteredPacientes.length} expedientes`}
          </span>
        </div>
      </section>

      {/* TABLA DE PACIENTES */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300">
              <FolderOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Expedientes de pacientes
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Información personal y acceso odontológico
              </p>
            </div>
          </div>

          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Directorio clínico
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-950/60">
                <th className="w-20 px-5 py-4 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  ID
                </th>
                <th className="px-5 py-4 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Paciente
                </th>
                <th className="px-5 py-4 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Documento
                </th>
                <th className="px-5 py-4 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Contacto
                </th>
                <th className="px-5 py-4 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Estado
                </th>
                <th className="px-5 py-4 text-right text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index}>
                    {Array.from({ length: 6 }).map((__, cell) => (
                      <td key={cell} className="px-5 py-5">
                        <div
                          className={`animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800 ${
                            cell === 1 ? 'h-10 w-48' : 'h-4 w-20'
                          }`}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredPacientes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500">
                      <Search className="h-7 w-7" />
                    </div>
                    <h3 className="mt-4 text-sm font-extrabold text-slate-800 dark:text-white">
                      No se encontraron pacientes
                    </h3>
                    <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-slate-500 dark:text-slate-400">
                      {search
                        ? 'Prueba con otro nombre, apellido o número de DNI.'
                        : 'Todavía no hay pacientes registrados en este directorio.'}
                    </p>
                    {search && (
                      <button
                        type="button"
                        onClick={() => setSearch('')}
                        className="mt-4 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-cyan-700 transition hover:bg-cyan-50 dark:text-cyan-300 dark:hover:bg-cyan-500/10"
                      >
                        <X className="h-3.5 w-3.5" />
                        Limpiar búsqueda
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredPacientes.map((p) => (
                  <tr
                    key={p.id}
                    className="group transition-colors hover:bg-cyan-50/40 dark:hover:bg-cyan-500/[0.04]"
                  >
                    <td className="px-5 py-4">
                      <span className="inline-flex rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 font-mono text-xs font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        #{p.id}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-100 bg-gradient-to-br from-cyan-50 to-blue-50 text-sm font-black text-cyan-800 dark:border-cyan-500/20 dark:from-cyan-500/10 dark:to-blue-500/10 dark:text-cyan-300">
                          {getInitials(p) || <User className="h-5 w-5" />}
                          <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900" />
                        </div>

                        <div className="min-w-0">
                          <p className="max-w-[240px] truncate text-sm font-extrabold text-slate-800 dark:text-slate-100">
                            {p.nombres} {p.apellidos}
                          </p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {p.sexo || 'No especificado'}
                            {p.fecha_nacimiento && (
                              <>
                                <span className="mx-1.5 text-slate-300 dark:text-slate-600">
                                  ·
                                </span>
                                {formatFecha(p.fecha_nacimiento)}
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <IdCard className="h-4 w-4 shrink-0 text-slate-400" />
                        <span className="font-mono text-sm font-bold text-slate-700 dark:text-slate-300">
                          {p.dni || '—'}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex max-w-[210px] items-start gap-2">
                        <Phone className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-700 dark:text-slate-300">
                            {p.telefono || 'Sin teléfono'}
                          </p>
                          {p.correo && (
                            <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                              {p.correo}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        {p.estado || 'Activo'}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openFicha(p)}
                          title="Ver ficha del paciente"
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-cyan-500/40 dark:hover:bg-cyan-500/10 dark:hover:text-cyan-300"
                        >
                          <FolderOpen className="h-4 w-4" />
                          <span>Ficha</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            localStorage.setItem('paciente-id', String(p.id));
                            setView('paciente-detalle');
                          }}
                          title="Abrir odontograma"
                          className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-3 py-2.5 text-xs font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-cyan-700 active:translate-y-0 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400"
                        >
                          <Stethoscope className="h-4 w-4" />
                          <span>Odonto</span>
                          <ArrowUpRight className="h-3.5 w-3.5 opacity-70" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50/70 px-5 py-3.5 dark:border-slate-800 dark:bg-slate-950/40 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Información correspondiente a los expedientes disponibles para tu
            perfil.
          </p>
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
            {isLoading
              ? 'Actualizando información…'
              : `${filteredPacientes.length} de ${pacientes.length} pacientes`}
          </span>
        </div>
      </section>

      {/* MODAL: REGISTRAR PACIENTE */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-5">
          <div className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="relative shrink-0 overflow-hidden border-b border-slate-200 px-5 py-5 dark:border-slate-800 sm:px-7">
              <div className="pointer-events-none absolute -right-8 -top-16 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl" />

              <div className="relative flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300">
                    <UserPlus className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-700 dark:text-cyan-400">
                      Nuevo expediente
                    </span>
                    <h2 className="mt-1 text-xl font-black text-slate-900 dark:text-white">
                      Registrar paciente
                    </h2>
                    <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                      Completa los datos para crear el expediente clínico.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  aria-label="Cerrar registro"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <form
              onSubmit={handleCreatePaciente}
              className="min-h-0 space-y-7 overflow-y-auto p-5 sm:p-7"
            >
              {submitError && (
                <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                  <p>{submitError}</p>
                </div>
              )}

              {submitMessage && (
                <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                  <p>{submitMessage}</p>
                </div>
              )}

              {/* DATOS PERSONALES */}
              <div>
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300">
                    <ContactRound className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      Datos personales
                    </h3>
                    <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                      Identificación básica del paciente
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>
                      Nombres <span className="text-rose-500">*</span>
                    </label>
                    <input
                      className={inputClass}
                      type="text"
                      autoComplete="given-name"
                      placeholder="Nombres del paciente"
                      value={newPaciente.nombres}
                      onChange={(e) =>
                        actualizarCampo('nombres', e.target.value)
                      }
                      required
                    />
                  </div>

                  <div>
                    <label className={labelClass}>
                      Apellidos <span className="text-rose-500">*</span>
                    </label>
                    <input
                      className={inputClass}
                      type="text"
                      autoComplete="family-name"
                      placeholder="Apellidos del paciente"
                      value={newPaciente.apellidos}
                      onChange={(e) =>
                        actualizarCampo('apellidos', e.target.value)
                      }
                      required
                    />
                  </div>

                  <div>
                    <label className={labelClass}>
                      DNI <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <IdCard className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        className={`${inputClass} pl-10`}
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        placeholder="Número de documento"
                        value={newPaciente.dni}
                        onChange={(e) =>
                          actualizarCampo('dni', e.target.value)
                        }
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Sexo</label>
                    <select
                      className={inputClass}
                      value={newPaciente.sexo}
                      onChange={(e) =>
                        actualizarCampo('sexo', e.target.value)
                      }
                    >
                      <option value="Masculino">Masculino</option>
                      <option value="Femenino">Femenino</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>Fecha de nacimiento</label>
                    <input
                      className={inputClass}
                      type="date"
                      value={newPaciente.fecha_nacimiento}
                      onChange={(e) =>
                        actualizarCampo('fecha_nacimiento', e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Teléfono</label>
                    <input
                      className={inputClass}
                      type="tel"
                      autoComplete="tel"
                      placeholder="Número de contacto"
                      value={newPaciente.telefono}
                      onChange={(e) =>
                        actualizarCampo('telefono', e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Correo electrónico</label>
                    <input
                      className={inputClass}
                      type="email"
                      autoComplete="email"
                      placeholder="correo@ejemplo.com"
                      value={newPaciente.correo}
                      onChange={(e) =>
                        actualizarCampo('correo', e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Ciudad</label>
                    <div className="relative">
                      <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        className={`${inputClass} pl-10`}
                        type="text"
                        placeholder="Ciudad o distrito"
                        value={newPaciente.ciudad}
                        onChange={(e) =>
                          actualizarCampo('ciudad', e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className={labelClass}>Dirección</label>
                    <div className="relative">
                      <MapPinned className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                      <textarea
                        className={`${inputClass} min-h-[84px] resize-y pl-10`}
                        rows={2}
                        placeholder="Dirección de residencia"
                        value={newPaciente.direccion}
                        onChange={(e) =>
                          actualizarCampo('direccion', e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* TUTOR O APODERADO */}
              <div className="rounded-2xl border border-cyan-100 bg-cyan-50/50 p-4 dark:border-cyan-500/20 dark:bg-cyan-500/[0.04] sm:p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-100 bg-white text-cyan-700 dark:border-cyan-500/20 dark:bg-slate-900 dark:text-cyan-300">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      Tutor o apoderado
                    </h3>
                    <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                      Datos opcionales del contacto responsable
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Nombre completo</label>
                    <input
                      className={inputClass}
                      type="text"
                      placeholder="Nombre del tutor o apoderado"
                      value={newPaciente.nombre_apoderado}
                      onChange={(e) =>
                        actualizarCampo('nombre_apoderado', e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Teléfono del apoderado</label>
                    <input
                      className={inputClass}
                      type="tel"
                      placeholder="Número de contacto"
                      value={newPaciente.telefono_apoderado}
                      onChange={(e) =>
                        actualizarCampo('telefono_apoderado', e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 dark:border-slate-800 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-6 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                  {isSubmitting ? 'Guardando…' : 'Guardar paciente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: FICHA DEL PACIENTE */}
      {showViewModal && selectedPaciente && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-5">
          <div className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            {/* CABECERA DE FICHA */}
            <div className="relative shrink-0 overflow-hidden border-b border-slate-200 dark:border-slate-800">
              <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />

              <div className="relative flex items-start justify-between gap-4 p-5 sm:p-7">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-100 bg-gradient-to-br from-cyan-50 to-blue-50 text-lg font-black text-cyan-800 dark:border-cyan-500/20 dark:from-cyan-500/10 dark:to-blue-500/10 dark:text-cyan-300 sm:h-16 sm:w-16">
                    {getInitials(selectedPaciente) || (
                      <User className="h-7 w-7" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-100 bg-cyan-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-cyan-800 dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-300">
                        <FileText className="h-3 w-3" />
                        Ficha clínica
                      </span>

                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        {selectedPaciente.estado || 'Activo'}
                      </span>
                    </div>

                    <h2 className="break-words text-lg font-black tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                      {selectedPaciente.nombres} {selectedPaciente.apellidos}
                    </h2>

                    <p className="mt-1.5 flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                      <IdCard className="h-3.5 w-3.5" />
                      DNI: {selectedPaciente.dni || '—'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowViewModal(false)}
                  aria-label="Cerrar ficha clínica"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* CONTENIDO DE FICHA */}
            <div className="min-h-0 space-y-7 overflow-y-auto p-5 sm:p-7">
              {/* IDENTIFICACIÓN */}
              <section>
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300">
                    <ContactRound className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      Información del paciente
                    </h3>
                    <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                      Datos de identificación registrados
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                    <span className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      <User className="h-3.5 w-3.5" />
                      Nombres
                    </span>
                    <p className="mt-2.5 break-words text-sm font-bold text-slate-800 dark:text-slate-200">
                      {selectedPaciente.nombres || '—'}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                    <span className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      <UserRound className="h-3.5 w-3.5" />
                      Apellidos
                    </span>
                    <p className="mt-2.5 break-words text-sm font-bold text-slate-800 dark:text-slate-200">
                      {selectedPaciente.apellidos || '—'}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                    <span className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      <IdCard className="h-3.5 w-3.5" />
                      Documento
                    </span>
                    <p className="mt-2.5 break-words font-mono text-sm font-bold text-slate-800 dark:text-slate-200">
                      {selectedPaciente.dni || '—'}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                    <span className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      <VenusAndMars className="h-3.5 w-3.5" />
                      Sexo
                    </span>
                    <p className="mt-2.5 text-sm font-bold text-slate-800 dark:text-slate-200">
                      {selectedPaciente.sexo || '—'}
                    </p>
                  </div>
                </div>
              </section>

              {/* CONTACTO Y RESIDENCIA */}
              <section>
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                    <MapPinned className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      Contacto y ubicación
                    </h3>
                    <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                      Información de contacto y residencia
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-cyan-300 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-cyan-500/30">
                    <span className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      <Phone className="h-3.5 w-3.5" />
                      Teléfono
                    </span>
                    <p className="mt-2.5 break-words text-sm font-bold text-slate-800 dark:text-slate-200">
                      {selectedPaciente.telefono || '—'}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-cyan-300 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-cyan-500/30">
                    <span className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      <Calendar className="h-3.5 w-3.5" />
                      Fecha de nacimiento
                    </span>
                    <p className="mt-2.5 text-sm font-bold text-slate-800 dark:text-slate-200">
                      {selectedPaciente.fecha_nacimiento
                        ? formatFecha(selectedPaciente.fecha_nacimiento)
                        : '—'}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-cyan-300 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-cyan-500/30">
                    <span className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      <Mail className="h-3.5 w-3.5" />
                      Correo electrónico
                    </span>
                    <p className="mt-2.5 break-all text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {selectedPaciente.correo || '—'}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-cyan-300 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-cyan-500/30">
                    <span className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      <MapPin className="h-3.5 w-3.5" />
                      Ciudad
                    </span>
                    <p className="mt-2.5 break-words text-sm font-bold text-slate-800 dark:text-slate-200">
                      {selectedPaciente.ciudad || '—'}
                    </p>
                  </div>
                </div>

                <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                  <span className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    <MapPinned className="h-3.5 w-3.5" />
                    Dirección
                  </span>
                  <p className="mt-2.5 break-words text-sm font-semibold leading-6 text-slate-700 dark:text-slate-300">
                    {selectedPaciente.direccion || 'Sin dirección registrada.'}
                  </p>
                </div>
              </section>

              {/* TUTOR O APODERADO */}
              {selectedPaciente.nombre_apoderado && (
                <section className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-5 dark:border-cyan-500/20 dark:bg-cyan-500/[0.04]">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-100 bg-white text-cyan-700 shadow-sm dark:border-cyan-500/20 dark:bg-slate-900 dark:text-cyan-300">
                      <ShieldCheck className="h-4 w-4" />
                    </div>

                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        Tutor o apoderado
                      </h3>
                      <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                        Contacto registrado
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-cyan-100/80 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-900/70">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Nombre completo
                      </span>
                      <p className="mt-2 break-words text-sm font-bold text-slate-700 dark:text-slate-300">
                        {selectedPaciente.nombre_apoderado}
                      </p>
                    </div>

                    <div className="rounded-xl border border-cyan-100/80 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-900/70">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Teléfono
                      </span>
                      <p className="mt-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                        {selectedPaciente.telefono_apoderado || '—'}
                      </p>
                    </div>
                  </div>
                </section>
              )}

              {/* PIE DE FICHA */}
              <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                <p className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  Información del expediente del paciente
                </p>

                <button
                  type="button"
                  onClick={() => setShowViewModal(false)}
                  className="group inline-flex items-center justify-center gap-2.5 rounded-xl border border-slate-800 bg-slate-900 px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 active:translate-y-0 dark:border-cyan-400/30 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400"
                >
                  <X className="h-4 w-4 opacity-70 transition-transform duration-200 group-hover:rotate-90" />
                  Cerrar ficha
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};