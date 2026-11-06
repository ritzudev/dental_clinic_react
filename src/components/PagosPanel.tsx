import React, { useEffect, useRef, useState } from "react";
import {
  Search,
  UserRound,
  Phone,
  IdCard,
  CreditCard,
  ClipboardList,
  CheckCircle2,
  Clock3,
  X,
  Loader2,
  ChevronRight,
  Wallet,
  CalendarDays,
  ReceiptText,
  ArrowLeft,
} from "lucide-react";
import toast from "react-hot-toast";

import {
  buscarPacientesPorDni,
  registrarPago,
  obtenerTratamientosPendientesCobro,
} from "../services/pagosService";

import HistorialPagos from "./HistorialPagos";

interface Paciente {
  id: number;
  nombres: string;
  apellidos: string;
  dni: string;
  telefono?: string;
}

interface Tratamiento {
  id: number;
  nombre_tratamiento: string;
  costo: number | string;
  estado: string;
  fecha_inicio?: string;
}

const moneda = (valor: number | string | null | undefined) =>
  `S/ ${Number(valor || 0).toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const fechaCorta = (fecha?: string) => {
  if (!fecha) return "Sin fecha";
  const partes = fecha.split("-");
  if (partes.length === 3) {
    const [anio, mes, dia] = partes;
    return new Date(Number(anio), Number(mes) - 1, Number(dia)).toLocaleDateString(
      "es-PE",
      { day: "2-digit", month: "short", year: "numeric" }
    );
  }
  const valor = new Date(fecha);
  return Number.isNaN(valor.getTime())
    ? "Sin fecha"
    : valor.toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

const PagosPanel: React.FC = () => {
  const [dni, setDni] = useState("");
  const [pacientesEncontrados, setPacientesEncontrados] = useState<Paciente[]>([]);
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [cargandoTratamientos, setCargandoTratamientos] = useState(false);
  const [tratamientos, setTratamientos] = useState<Tratamiento[]>([]);
  const [pestana, setPestana] = useState<"tratamientos" | "historial">("tratamientos");
  const [tratamientoConfirmar, setTratamientoConfirmar] = useState<Tratamiento | null>(null);
  const [registrandoPago, setRegistrandoPago] = useState(false);
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const buscadorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let activo = true;
    const buscar = async () => {
      const valor = dni.trim();
      if (!valor || valor.length < 2 || (paciente && valor === paciente.dni)) {
        if (activo) {
          setPacientesEncontrados([]);
          setMostrarResultados(false);
          setBuscando(false);
        }
        return;
      }

      try {
        setBuscando(true);
        const resultados = await buscarPacientesPorDni(valor);
        if (activo) {
          setPacientesEncontrados(resultados || []);
          setMostrarResultados(true);
        }
      } catch (error) {
        console.error("Error buscando pacientes:", error);
        if (activo) {
          setPacientesEncontrados([]);
          setMostrarResultados(true);
        }
      } finally {
        if (activo) setBuscando(false);
      }
    };

    const timeout = window.setTimeout(buscar, 300);
    return () => {
      activo = false;
      window.clearTimeout(timeout);
    };
  }, [dni, paciente]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (buscadorRef.current && !buscadorRef.current.contains(event.target as Node)) {
        setMostrarResultados(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const cargarTratamientos = async (pacienteId: number) => {
    try {
      setCargandoTratamientos(true);
      const lista = await obtenerTratamientosPendientesCobro(pacienteId);
      setTratamientos((lista ?? []) as Tratamiento[]);
    } catch (error) {
      console.error("Error cargando tratamientos:", error);
      setTratamientos([]);
      toast.error("No se pudieron cargar los tratamientos.");
    } finally {
      setCargandoTratamientos(false);
    }
  };

  const seleccionarPaciente = async (seleccionado: Paciente) => {
    setPaciente(seleccionado);
    setDni(seleccionado.dni);
    setPacientesEncontrados([]);
    setMostrarResultados(false);
    setPestana("tratamientos");
    await cargarTratamientos(seleccionado.id);
  };

  const limpiarPaciente = () => {
    setPaciente(null);
    setTratamientos([]);
    setDni("");
    setPacientesEncontrados([]);
    setMostrarResultados(false);
    setPestana("tratamientos");
  };

  const confirmarPago = async () => {
    if (!paciente || !tratamientoConfirmar) return;

    const monto = Number(tratamientoConfirmar.costo);
    if (!Number.isFinite(monto) || monto <= 0) {
      toast.error("El tratamiento no tiene un costo válido.");
      return;
    }

    try {
      setRegistrandoPago(true);
      await registrarPago(paciente.id, tratamientoConfirmar.id, monto);
      toast.success("Pago registrado correctamente.");
      setTratamientoConfirmar(null);
      await cargarTratamientos(paciente.id);
      setPestana("historial");
    } catch (error) {
      console.error("Error registrando pago:", error);
      toast.error(
        error instanceof Error ? error.message : "No se pudo registrar el pago."
      );
    } finally {
      setRegistrandoPago(false);
    }
  };

  const totalPendiente = tratamientos.reduce(
    (total, tratamiento) => total + Number(tratamiento.costo || 0),
    0
  );

  return (
    <div className="min-h-full space-y-6 text-slate-800 dark:text-slate-100">
      {/* Encabezado del módulo */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-100 bg-cyan-50 dark:border-cyan-900/60 dark:bg-cyan-950/40">
            <Wallet className="h-6 w-6 text-cyan-700 dark:text-cyan-400" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-700 dark:text-cyan-400">
              Administración financiera
            </p>
            <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Gestión de pagos
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Consulta tratamientos pendientes y registra los pagos de cada paciente.
            </p>
          </div>
        </div>
        {paciente && (
          <button
            type="button"
            onClick={limpiarPaciente}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-cyan-300 hover:text-cyan-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-cyan-700 dark:hover:text-cyan-400 sm:self-auto"
          >
            <ArrowLeft size={16} />
            Cambiar paciente
          </button>
        )}
      </header>

      {/* Buscador */}
      <section
        ref={buscadorRef}
        className="relative z-20 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6"
      >
        <div className="mb-4 flex items-center gap-2">
          <Search className="h-5 w-5 text-cyan-700 dark:text-cyan-400" />
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Buscar paciente
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ingresa el DNI para localizar su ficha.
            </p>
          </div>
        </div>

        <div className="relative max-w-2xl">
          <IdCard className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            id="dni-paciente"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            maxLength={8}
            value={dni}
            onChange={(event) => {
              const valor = event.target.value.replace(/\D/g, "");
              setDni(valor);
              if (paciente && valor !== paciente.dni) {
                setPaciente(null);
                setTratamientos([]);
              }
            }}
            onFocus={() => {
              if (pacientesEncontrados.length > 0) setMostrarResultados(true);
            }}
            placeholder="Escribe el DNI del paciente"
            className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-12 text-sm font-medium text-slate-900 outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-cyan-500 dark:focus:bg-slate-950"
          />
          {buscando ? (
            <Loader2 className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-cyan-600" />
          ) : dni ? (
            <button
              type="button"
              onClick={limpiarPaciente}
              aria-label="Limpiar búsqueda"
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              <X size={17} />
            </button>
          ) : null}

          {mostrarResultados && (
            <div className="absolute left-0 right-0 top-[calc(100%+8px)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
              {pacientesEncontrados.length > 0 ? (
                <>
                  <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Resultados de búsqueda
                    </p>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {pacientesEncontrados.map((resultado) => (
                      <button
                        key={resultado.id}
                        type="button"
                        onClick={() => seleccionarPaciente(resultado)}
                        className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left transition last:border-0 hover:bg-cyan-50 dark:border-slate-800 dark:hover:bg-cyan-950/30"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          <UserRound size={18} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-bold text-slate-800 dark:text-white">
                            {resultado.nombres} {resultado.apellidos}
                          </span>
                          <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                            DNI {resultado.dni}
                          </span>
                        </span>
                        <ChevronRight size={18} className="text-slate-400" />
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="px-5 py-6 text-center">
                  <UserRound className="mx-auto mb-2 h-6 w-6 text-slate-400" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    No se encontraron pacientes
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Verifica el DNI ingresado.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Contenido del paciente */}
      {!paciente ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-5 py-16 text-center dark:border-slate-700 dark:bg-slate-900/40">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
            <UserRound className="h-8 w-8 text-slate-400 dark:text-slate-500" />
          </div>
          <h2 className="mt-4 text-lg font-bold text-slate-800 dark:text-white">
            Selecciona un paciente para comenzar
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
            Al seleccionar un paciente podrás consultar sus tratamientos pendientes,
            registrar pagos y revisar su historial financiero.
          </p>
        </section>
      ) : (
        <>
          {/* Ficha breve del paciente */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-cyan-100 text-xl font-bold text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300">
                  {paciente.nombres.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Paciente seleccionado
                  </p>
                  <h2 className="mt-1 truncate text-lg font-bold text-slate-900 dark:text-white">
                    {paciente.nombres} {paciente.apellidos}
                  </h2>
                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1.5">
                      <IdCard size={14} /> DNI {paciente.dni}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Phone size={14} /> {paciente.telefono || "Sin teléfono registrado"}
                    </span>
                  </div>
                </div>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-400">
                <CheckCircle2 size={14} />
                Ficha seleccionada
              </span>
            </div>
          </section>

          {/* Resumen financiero */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    Tratamientos por cobrar
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                    {cargandoTratamientos ? "—" : tratamientos.length}
                  </p>
                </div>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/40">
                  <ClipboardList className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-400">
                Cantidad de tratamientos pendientes de pago
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    Importe pendiente
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                    {cargandoTratamientos ? "—" : moneda(totalPendiente)}
                  </p>
                </div>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50 dark:bg-cyan-950/40">
                  <Wallet className="h-5 w-5 text-cyan-700 dark:text-cyan-400" />
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-400">
                Suma de los tratamientos aún no pagados
              </p>
            </div>
          </section>

          {/* Área principal */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col border-b border-slate-200 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
              <div className="px-5 pt-5 sm:px-6">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Cuenta del paciente
                </h2>
                <p className="mt-1 pb-4 text-xs text-slate-500 dark:text-slate-400">
                  Consulta y administra los movimientos de pago.
                </p>
              </div>
              <div className="flex gap-1 px-4 sm:px-5">
                <button
                  type="button"
                  onClick={() => setPestana("tratamientos")}
                  className={`inline-flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-semibold transition ${
                    pestana === "tratamientos"
                      ? "border-cyan-600 text-cyan-700 dark:border-cyan-400 dark:text-cyan-400"
                      : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                  }`}
                >
                  <ClipboardList size={16} />
                  Pendientes
                </button>
                <button
                  type="button"
                  onClick={() => setPestana("historial")}
                  className={`inline-flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-semibold transition ${
                    pestana === "historial"
                      ? "border-cyan-600 text-cyan-700 dark:border-cyan-400 dark:text-cyan-400"
                      : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                  }`}
                >
                  <ReceiptText size={16} />
                  Historial
                </button>
              </div>
            </div>

            <div className="p-5 sm:p-6">
              {pestana === "tratamientos" && (
                <div>
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-white">
                        Tratamientos pendientes de pago
                      </h3>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Registra el pago completo del tratamiento seleccionado.
                      </p>
                    </div>
                    {!cargandoTratamientos && tratamientos.length > 0 && (
                      <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                        {tratamientos.length} {tratamientos.length === 1 ? "pendiente" : "pendientes"}
                      </span>
                    )}
                  </div>

                  {cargandoTratamientos ? (
                    <div className="py-14 text-center">
                      <Loader2 className="mx-auto h-7 w-7 animate-spin text-cyan-600 dark:text-cyan-400" />
                      <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                        Consultando tratamientos...
                      </p>
                    </div>
                  ) : tratamientos.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-5 py-12 text-center dark:border-slate-700 dark:bg-slate-950/30">
                      <CheckCircle2 className="mx-auto h-9 w-9 text-emerald-500" />
                      <h4 className="mt-3 font-bold text-slate-800 dark:text-white">
                        No hay pagos pendientes
                      </h4>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Este paciente no tiene tratamientos pendientes de cobro.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                      <div className="hidden grid-cols-[minmax(0,1fr)_150px_160px] gap-4 bg-slate-50 px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-950/60 dark:text-slate-400 md:grid">
                        <span>Tratamiento</span>
                        <span>Situación</span>
                        <span className="text-right">Importe</span>
                      </div>
                      <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {tratamientos.map((tratamiento) => (
                          <article
                            key={tratamiento.id}
                            className="grid grid-cols-1 items-center gap-4 px-4 py-4 transition hover:bg-slate-50/80 dark:hover:bg-slate-800/30 sm:px-5 md:grid-cols-[minmax(0,1fr)_150px_160px]"
                          >
                            <div className="flex min-w-0 items-start gap-3">
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-50 dark:bg-cyan-950/40">
                                <ClipboardList className="h-5 w-5 text-cyan-700 dark:text-cyan-400" />
                              </span>
                              <div className="min-w-0">
                                <h4 className="font-semibold text-slate-800 dark:text-white">
                                  {tratamiento.nombre_tratamiento}
                                </h4>
                                <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                                  <CalendarDays size={13} />
                                  Inicio: {fechaCorta(tratamiento.fecha_inicio)}
                                </p>
                              </div>
                            </div>

                            <div>
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-400">
                                <Clock3 size={13} />
                                Pendiente
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-3 md:justify-end">
                              <div className="md:text-right">
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 md:hidden">
                                  Importe a pagar
                                </p>
                                <p className="text-lg font-bold tabular-nums text-slate-900 dark:text-white">
                                  {moneda(tratamiento.costo)}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setTratamientoConfirmar(tratamiento)}
                                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-cyan-700 px-3.5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-cyan-800 focus:outline-none focus:ring-4 focus:ring-cyan-500/20 dark:bg-cyan-600 dark:hover:bg-cyan-500"
                              >
                                <CreditCard size={15} />
                                Registrar pago
                              </button>
                            </div>
                          </article>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {pestana === "historial" && <HistorialPagos paciente={paciente} />}
            </div>
          </section>
        </>
      )}

      {/* Confirmación del pago */}
      {tratamientoConfirmar && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !registrandoPago) {
              setTratamientoConfirmar(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-confirmacion-pago"
            className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5 dark:border-slate-800">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400">
                  Confirmación
                </p>
                <h2
                  id="titulo-confirmacion-pago"
                  className="mt-1 text-lg font-bold text-slate-900 dark:text-white"
                >
                  Registrar pago
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setTratamientoConfirmar(null)}
                disabled={registrandoPago}
                aria-label="Cerrar"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/50">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Paciente
                </p>
                <p className="mt-1 font-semibold text-slate-800 dark:text-white">
                  {paciente?.nombres} {paciente?.apellidos}
                </p>
                <div className="my-4 border-t border-slate-200 dark:border-slate-700" />
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Tratamiento
                </p>
                <p className="mt-1 font-semibold text-slate-800 dark:text-white">
                  {tratamientoConfirmar.nombre_tratamiento}
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4 dark:border-slate-700">
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    Total a pagar
                  </span>
                  <span className="text-2xl font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                    {moneda(tratamientoConfirmar.costo)}
                  </span>
                </div>
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-500 dark:text-slate-400">
                ¿Confirmas el registro del pago completo? Esta operación se guardará
                en el módulo financiero y no modificará el estado clínico del tratamiento.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTratamientoConfirmar(null)}
                  disabled={registrandoPago}
                  className="h-11 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmarPago}
                  disabled={registrandoPago}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-cyan-700 text-sm font-bold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-cyan-600 dark:hover:bg-cyan-500"
                >
                  {registrandoPago ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      Confirmar pago
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PagosPanel;
