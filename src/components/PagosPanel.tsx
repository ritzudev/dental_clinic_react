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
} from "lucide-react";
import toast from "react-hot-toast";

import {
  buscarPacientesPorDni,
  registrarPago,
  finalizarTratamiento,
  obtenerTratamientosPaciente,
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

const PagosPanel: React.FC = () => {
  const [dni, setDni] = useState("");
  const [pacientesEncontrados, setPacientesEncontrados] = useState<
    Paciente[]
  >([]);

  const [paciente, setPaciente] = useState<Paciente | null>(null);

  const [buscando, setBuscando] = useState(false);
  const [cargandoTratamientos, setCargandoTratamientos] = useState(false);

  const [tratamientos, setTratamientos] = useState<Tratamiento[]>([]);

  const [pestana, setPestana] = useState<"tratamientos" | "historial">(
    "tratamientos"
  );

  const [tratamientoConfirmar, setTratamientoConfirmar] =
    useState<Tratamiento | null>(null);

  const [registrandoPago, setRegistrandoPago] = useState(false);

  const [mostrarResultados, setMostrarResultados] = useState(false);

  const buscadorRef = useRef<HTMLDivElement>(null);

  /* ==========================================================
     BUSCAR PACIENTES MIENTRAS SE ESCRIBE EL DNI
  ========================================================== */

  useEffect(() => {
    const buscar = async () => {
      const valor = dni.trim();

      if (!valor) {
        setPacientesEncontrados([]);
        setMostrarResultados(false);
        return;
      }

      if (valor.length < 2) {
        setPacientesEncontrados([]);
        setMostrarResultados(false);
        return;
      }

      try {
        setBuscando(true);

        const resultados = await buscarPacientesPorDni(valor);

        setPacientesEncontrados(resultados);
        setMostrarResultados(true);
      } catch (error) {
        console.error("Error buscando pacientes:", error);
        setPacientesEncontrados([]);
      } finally {
        setBuscando(false);
      }
    };

    const timeout = setTimeout(buscar, 300);

    return () => clearTimeout(timeout);
  }, [dni]);

  /* ==========================================================
     CERRAR RESULTADOS AL HACER CLICK AFUERA
  ========================================================== */

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        buscadorRef.current &&
        !buscadorRef.current.contains(event.target as Node)
      ) {
        setMostrarResultados(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  /* ==========================================================
     CARGAR TRATAMIENTOS
  ========================================================== */

  const cargarTratamientos = async (pacienteId: number) => {
    try {
      setCargandoTratamientos(true);

      const lista = await obtenerTratamientosPaciente(pacienteId);

      setTratamientos((lista ?? []) as Tratamiento[]);
    } catch (error) {
      console.error("Error cargando tratamientos:", error);
      setTratamientos([]);
      toast.error("No se pudieron cargar los tratamientos.");
    } finally {
      setCargandoTratamientos(false);
    }
  };

  /* ==========================================================
     SELECCIONAR PACIENTE
  ========================================================== */

  const seleccionarPaciente = async (pacienteSeleccionado: Paciente) => {
    setPaciente(pacienteSeleccionado);

    setDni(pacienteSeleccionado.dni);

    setPacientesEncontrados([]);
    setMostrarResultados(false);

    setPestana("tratamientos");

    await cargarTratamientos(pacienteSeleccionado.id);
  };

  /* ==========================================================
     LIMPIAR PACIENTE
  ========================================================== */

  const limpiarPaciente = () => {
    setPaciente(null);
    setTratamientos([]);
    setDni("");
    setPacientesEncontrados([]);
    setMostrarResultados(false);
    setPestana("tratamientos");
  };

  /* ==========================================================
     ABRIR CONFIRMACIÓN DE PAGO
  ========================================================== */

  const solicitarRegistroPago = (tratamiento: Tratamiento) => {
    setTratamientoConfirmar(tratamiento);
  };

  /* ==========================================================
     CONFIRMAR Y REGISTRAR PAGO
  ========================================================== */

  const confirmarPago = async () => {
    if (!paciente || !tratamientoConfirmar) {
      return;
    }

    try {
      setRegistrandoPago(true);

      const monto = Number(tratamientoConfirmar.costo);

      if (!Number.isFinite(monto) || monto <= 0) {
        toast.error("El tratamiento no tiene un costo válido.");
        return;
      }

      /*
       * El servicio conserva los campos internos que necesita
       * Supabase, pero el usuario NO los ve en la interfaz.
       */
      await registrarPago(
        paciente.id,
        tratamientoConfirmar.id,
        monto
      );

      await finalizarTratamiento(tratamientoConfirmar.id);

      toast.success("Pago registrado correctamente.");

      setTratamientoConfirmar(null);

      await cargarTratamientos(paciente.id);

      /*
       * Después de pagar mostramos el historial para que
       * el usuario vea inmediatamente el pago registrado.
       */
      setPestana("historial");
    } catch (error) {
      console.error("Error registrando pago:", error);

      toast.error("No se pudo registrar el pago.");
    } finally {
      setRegistrandoPago(false);
    }
  };

  return (
    <div className="min-h-full">
      {/* ======================================================
          ENCABEZADO
      ====================================================== */}

      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div
            className="
              w-11 h-11
              rounded-2xl
              bg-cyan-50 dark:bg-cyan-950/30
              border border-cyan-200 dark:border-cyan-900/50
              flex items-center justify-center
            "
          >
            <CreditCard className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
          </div>

          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              Pagos
            </h1>

            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Gestión de pagos de tratamientos odontológicos.
            </p>
          </div>
        </div>
      </div>

      {/* ======================================================
          LAYOUT PRINCIPAL
      ====================================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-5 items-start">
        {/* ====================================================
            PANEL LATERAL
        ==================================================== */}

        <aside
          ref={buscadorRef}
          className="
            bg-white dark:bg-slate-900
            border border-slate-200 dark:border-slate-800
            rounded-3xl
            shadow-sm
            overflow-visible
            lg:sticky lg:top-5
            z-20
          "
        >
          {/* CABECERA */}

          <div
            className="
              px-5 py-4
              border-b border-slate-200 dark:border-slate-800
            "
          >
            <div className="flex items-center gap-3">
              <div
                className="
                  w-10 h-10
                  rounded-xl
                  bg-slate-100 dark:bg-slate-800
                  flex items-center justify-center
                "
              >
                <Search
                  size={19}
                  className="text-cyan-600 dark:text-cyan-400"
                />
              </div>

              <div>
                <h2 className="font-bold text-slate-900 dark:text-white">
                  Buscar paciente
                </h2>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Busque por DNI
                </p>
              </div>
            </div>
          </div>

          {/* BUSCADOR */}

          <div className="p-5">
            <label
              htmlFor="dni-paciente"
              className="
                block
                text-xs
                font-bold
                uppercase
                tracking-wide
                text-slate-500 dark:text-slate-400
                mb-2
              "
            >
              DNI del paciente
            </label>

            <div className="relative">
              <IdCard
                size={18}
                className="
                  absolute
                  left-3
                  top-1/2
                  -translate-y-1/2
                  text-slate-400
                  pointer-events-none
                "
              />

              <input
                id="dni-paciente"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                maxLength={8}
                value={dni}
                onChange={(e) => {
                  const valor = e.target.value.replace(/\D/g, "");

                  setDni(valor);

                  if (paciente && valor !== paciente.dni) {
                    setPaciente(null);
                    setTratamientos([]);
                  }
                }}
                onFocus={() => {
                  if (pacientesEncontrados.length > 0) {
                    setMostrarResultados(true);
                  }
                }}
                placeholder="Ej. 12345678"
                className="
                  w-full
                  h-12
                  pl-10 pr-10
                  rounded-xl
                  bg-slate-50 dark:bg-slate-950
                  border border-slate-200 dark:border-slate-700
                  text-slate-900 dark:text-white
                  placeholder:text-slate-400
                  outline-none
                  focus:border-cyan-500
                  focus:ring-2
                  focus:ring-cyan-500/10
                  transition
                "
              />

              {buscando && (
                <Loader2
                  size={18}
                  className="
                    absolute
                    right-3
                    top-1/2
                    -translate-y-1/2
                    text-cyan-500
                    animate-spin
                  "
                />
              )}

              {!buscando && dni && (
                <button
                  type="button"
                  onClick={limpiarPaciente}
                  className="
                    absolute
                    right-2
                    top-1/2
                    -translate-y-1/2
                    w-8 h-8
                    rounded-lg
                    flex items-center justify-center
                    text-slate-400
                    hover:text-slate-700
                    dark:hover:text-white
                    hover:bg-slate-200
                    dark:hover:bg-slate-800
                    transition
                  "
                  title="Limpiar búsqueda"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* ==================================================
                RESULTADOS DE BÚSQUEDA
            ================================================== */}

            {mostrarResultados && (
              <div
                className="
                  mt-2
                  rounded-2xl
                  bg-white dark:bg-slate-900
                  border border-slate-200 dark:border-slate-700
                  shadow-xl
                  overflow-hidden
                "
              >
                {pacientesEncontrados.length > 0 ? (
                  <>
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        Pacientes encontrados
                      </p>
                    </div>

                    <div className="max-h-64 overflow-y-auto">
                      {pacientesEncontrados.map((pacienteResultado) => (
                        <button
                          key={pacienteResultado.id}
                          type="button"
                          onClick={() =>
                            seleccionarPaciente(pacienteResultado)
                          }
                          className="
                            w-full
                            text-left
                            px-4 py-3
                            flex items-center gap-3
                            hover:bg-cyan-50
                            dark:hover:bg-cyan-950/30
                            transition
                            border-b
                            border-slate-100
                            dark:border-slate-800
                            last:border-b-0
                          "
                        >
                          <div
                            className="
                              w-9 h-9
                              rounded-full
                              bg-slate-100 dark:bg-slate-800
                              flex items-center justify-center
                              shrink-0
                            "
                          >
                            <UserRound
                              size={17}
                              className="text-slate-500 dark:text-slate-400"
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                              {pacienteResultado.nombres}{" "}
                              {pacienteResultado.apellidos}
                            </p>

                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              DNI {pacienteResultado.dni}
                            </p>
                          </div>

                          <ChevronRight
                            size={17}
                            className="text-slate-400 shrink-0"
                          />
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="p-5 text-center">
                    <UserRound
                      size={24}
                      className="mx-auto text-slate-400 mb-2"
                    />

                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      No se encontraron pacientes
                    </p>

                    <p className="text-xs text-slate-400 mt-1">
                      Verifique el DNI ingresado.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* PACIENTE SELECCIONADO */}

            {paciente && (
              <div
                className="
                  mt-5
                  rounded-2xl
                  bg-cyan-50 dark:bg-cyan-950/20
                  border border-cyan-200 dark:border-cyan-900/50
                  p-4
                "
              >
                <div className="flex items-center gap-3">
                  <div
                    className="
                      w-11 h-11
                      rounded-full
                      bg-gradient-to-br
                      from-cyan-500
                      to-blue-600
                      flex items-center justify-center
                      text-white
                      font-black
                      shrink-0
                    "
                  >
                    {paciente.nombres.charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 dark:text-white truncate">
                      {paciente.nombres} {paciente.apellidos}
                    </p>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      DNI {paciente.dni}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <Phone size={14} />

                    <span>
                      {paciente.telefono || "Sin teléfono registrado"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 size={14} />

                    <span>Paciente seleccionado</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* ====================================================
            CONTENIDO DERECHO
        ==================================================== */}

        <section
          className="
            min-w-0
            bg-white dark:bg-slate-900
            border border-slate-200 dark:border-slate-800
            rounded-3xl
            shadow-sm
            overflow-hidden
          "
        >
          {/* SIN PACIENTE */}

          {!paciente && (
            <div className="min-h-[560px] flex items-center justify-center p-8">
              <div className="text-center max-w-md">
                <div
                  className="
                    mx-auto
                    w-20 h-20
                    rounded-3xl
                    bg-slate-100 dark:bg-slate-800
                    flex items-center justify-center
                    mb-5
                  "
                >
                  <UserRound
                    size={36}
                    className="text-slate-400 dark:text-slate-500"
                  />
                </div>

                <h2 className="text-xl font-black text-slate-800 dark:text-white">
                  Seleccione un paciente
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  Ingrese el DNI en el buscador lateral y seleccione al
                  paciente para consultar sus tratamientos y registrar pagos.
                </p>
              </div>
            </div>
          )}

          {/* PACIENTE SELECCIONADO */}

          {paciente && (
            <>
              {/* ==================================================
                  CABECERA PACIENTE
              ================================================== */}

              <div
                className="
                  px-6 py-5
                  bg-slate-50/70 dark:bg-slate-950/30
                  border-b border-slate-200 dark:border-slate-800
                "
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div
                      className="
                        w-14 h-14
                        rounded-2xl
                        bg-gradient-to-br
                        from-cyan-500
                        to-blue-600
                        flex items-center justify-center
                        text-white
                        text-xl
                        font-black
                        shrink-0
                      "
                    >
                      {paciente.nombres.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <h2 className="text-xl font-black text-slate-900 dark:text-white truncate">
                        {paciente.nombres} {paciente.apellidos}
                      </h2>

                      <div className="flex flex-wrap items-center gap-3 mt-1">
                        <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <IdCard size={14} />
                          DNI {paciente.dni}
                        </span>

                        {paciente.telefono && (
                          <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                            <Phone size={14} />
                            {paciente.telefono}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={limpiarPaciente}
                    className="
                      shrink-0
                      w-10 h-10
                      rounded-xl
                      text-slate-400
                      hover:text-slate-700
                      dark:hover:text-white
                      hover:bg-slate-200
                      dark:hover:bg-slate-800
                      flex items-center justify-center
                      transition
                    "
                    title="Cambiar paciente"
                  >
                    <X size={19} />
                  </button>
                </div>
              </div>

              {/* ==================================================
                  PESTAÑAS
              ================================================== */}

              <div className="border-b border-slate-200 dark:border-slate-800">
                <div className="flex">
                  <button
                    type="button"
                    onClick={() => setPestana("tratamientos")}
                    className={`
                      flex-1
                      px-5 py-4
                      text-sm font-bold
                      border-b-2
                      flex items-center justify-center gap-2
                      transition
                      ${
                        pestana === "tratamientos"
                          ? "border-cyan-500 text-cyan-600 dark:text-cyan-400"
                          : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white"
                      }
                    `}
                  >
                    <ClipboardList size={17} />
                    Tratamientos pendientes
                  </button>

                  <button
                    type="button"
                    onClick={() => setPestana("historial")}
                    className={`
                      flex-1
                      px-5 py-4
                      text-sm font-bold
                      border-b-2
                      flex items-center justify-center gap-2
                      transition
                      ${
                        pestana === "historial"
                          ? "border-cyan-500 text-cyan-600 dark:text-cyan-400"
                          : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white"
                      }
                    `}
                  >
                    <CreditCard size={17} />
                    Historial de pagos
                  </button>
                </div>
              </div>

              {/* ==================================================
                  CONTENIDO
              ================================================== */}

              <div className="p-6">
                {/* =================================================
                    TRATAMIENTOS
                ================================================= */}

                {pestana === "tratamientos" && (
                  <div>
                    <div className="flex items-center justify-between gap-4 mb-5">
                      <div>
                        <h3 className="font-black text-slate-900 dark:text-white">
                          Tratamientos pendientes
                        </h3>

                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                          Seleccione un tratamiento para registrar su pago.
                        </p>
                      </div>

                      {!cargandoTratamientos && (
                        <span
                          className="
                            px-3 py-1.5
                            rounded-full
                            bg-amber-50 dark:bg-amber-950/30
                            border border-amber-200 dark:border-amber-900/50
                            text-xs font-bold
                            text-amber-600 dark:text-amber-400
                          "
                        >
                          {tratamientos.length}{" "}
                          {tratamientos.length === 1
                            ? "pendiente"
                            : "pendientes"}
                        </span>
                      )}
                    </div>

                    {/* CARGANDO */}

                    {cargandoTratamientos && (
                      <div className="py-16 text-center">
                        <Loader2
                          size={30}
                          className="
                            mx-auto
                            text-cyan-500
                            animate-spin
                          "
                        />

                        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                          Cargando tratamientos...
                        </p>
                      </div>
                    )}

                    {/* SIN PENDIENTES */}

                    {!cargandoTratamientos &&
                      tratamientos.length === 0 && (
                        <div
                          className="
                            py-14
                            text-center
                            rounded-2xl
                            border border-dashed
                            border-slate-300 dark:border-slate-700
                            bg-slate-50 dark:bg-slate-950/40
                          "
                        >
                          <div
                            className="
                              mx-auto
                              w-14 h-14
                              rounded-2xl
                              bg-emerald-50 dark:bg-emerald-950/30
                              flex items-center justify-center
                              mb-4
                            "
                          >
                            <CheckCircle2
                              size={28}
                              className="text-emerald-500"
                            />
                          </div>

                          <h4 className="font-bold text-slate-800 dark:text-white">
                            Todo está al día
                          </h4>

                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Este paciente no tiene tratamientos pendientes de
                            pago.
                          </p>
                        </div>
                      )}

                    {/* LISTA */}

                    {!cargandoTratamientos &&
                      tratamientos.length > 0 && (
                        <div className="space-y-3">
                          {tratamientos.map((tratamiento) => (
                            <div
                              key={tratamiento.id}
                              className="
                                rounded-2xl
                                border border-slate-200 dark:border-slate-800
                                bg-white dark:bg-slate-950/40
                                p-5
                                hover:border-cyan-300
                                dark:hover:border-cyan-800
                                transition
                              "
                            >
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                                <div className="flex items-start gap-4">
                                  <div
                                    className="
                                      w-11 h-11
                                      rounded-xl
                                      bg-cyan-50 dark:bg-cyan-950/30
                                      flex items-center justify-center
                                      shrink-0
                                    "
                                  >
                                    <ClipboardList
                                      size={20}
                                      className="text-cyan-600 dark:text-cyan-400"
                                    />
                                  </div>

                                  <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white">
                                      {tratamiento.nombre_tratamiento}
                                    </h4>

                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                      <span
                                        className="
                                          inline-flex
                                          items-center
                                          gap-1.5
                                          px-2.5 py-1
                                          rounded-full
                                          bg-amber-50 dark:bg-amber-950/30
                                          border border-amber-200 dark:border-amber-900/50
                                          text-xs
                                          font-bold
                                          text-amber-600 dark:text-amber-400
                                        "
                                      >
                                        <Clock3 size={12} />
                                        Pendiente
                                      </span>

                                      {tratamiento.fecha_inicio && (
                                        <span className="text-xs text-slate-500 dark:text-slate-400">
                                          Inicio:{" "}
                                          {new Date(
                                            tratamiento.fecha_inicio
                                          ).toLocaleDateString("es-PE")}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between md:justify-end gap-5">
                                  <div className="text-left md:text-right">
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                      Total
                                    </p>

                                    <p className="text-xl font-black text-slate-900 dark:text-white">
                                      S/{" "}
                                      {Number(
                                        tratamiento.costo || 0
                                      ).toFixed(2)}
                                    </p>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      solicitarRegistroPago(tratamiento)
                                    }
                                    className="
                                      px-4 py-2.5
                                      rounded-xl
                                      bg-cyan-600
                                      hover:bg-cyan-500
                                      text-white
                                      text-sm
                                      font-bold
                                      whitespace-nowrap
                                      transition
                                    "
                                  >
                                    Registrar pago
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                )}

                {/* =================================================
                    HISTORIAL
                ================================================= */}

                {pestana === "historial" && (
                  <HistorialPagos paciente={paciente} />
                )}
              </div>
            </>
          )}
        </section>
      </div>

      {/* ========================================================
          MODAL DE CONFIRMACIÓN
      ======================================================== */}

      {tratamientoConfirmar && (
        <div
          className="
            fixed
            inset-0
            z-[100]
            bg-black/60
            backdrop-blur-sm
            flex
            items-center
            justify-center
            p-4
          "
        >
          <div
            className="
              w-full
              max-w-md
              bg-white dark:bg-slate-900
              border border-slate-200 dark:border-slate-800
              rounded-3xl
              shadow-2xl
              overflow-hidden
            "
          >
            {/* HEADER */}

            <div
              className="
                px-6 py-5
                border-b border-slate-200 dark:border-slate-800
                flex items-center justify-between
              "
            >
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-cyan-600 dark:text-cyan-400">
                  Confirmar pago
                </p>

                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                  Registrar pago
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setTratamientoConfirmar(null)}
                disabled={registrandoPago}
                className="
                  w-9 h-9
                  rounded-xl
                  flex items-center justify-center
                  text-slate-400
                  hover:text-slate-700
                  dark:hover:text-white
                  hover:bg-slate-100
                  dark:hover:bg-slate-800
                  transition
                "
              >
                <X size={19} />
              </button>
            </div>

            {/* CONTENIDO */}

            <div className="p-6">
              <div
                className="
                  rounded-2xl
                  bg-slate-50 dark:bg-slate-950/50
                  border border-slate-200 dark:border-slate-800
                  p-5
                "
              >
                <div className="flex items-start gap-3">
                  <div
                    className="
                      w-11 h-11
                      rounded-xl
                      bg-cyan-50 dark:bg-cyan-950/30
                      flex items-center justify-center
                      shrink-0
                    "
                  >
                    <CreditCard
                      size={21}
                      className="text-cyan-600 dark:text-cyan-400"
                    />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Tratamiento
                    </p>

                    <p className="font-bold text-slate-900 dark:text-white mt-1">
                      {tratamientoConfirmar.nombre_tratamiento}
                    </p>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    Total a pagar
                  </span>

                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    S/{" "}
                    {Number(tratamientoConfirmar.costo || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              <p className="text-sm text-slate-500 dark:text-slate-400 leading-6 mt-5">
                ¿Confirmar el pago completo de este tratamiento? Al confirmar,
                el tratamiento quedará finalizado.
              </p>

              {/* BOTONES */}

              <div className="grid grid-cols-2 gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setTratamientoConfirmar(null)}
                  disabled={registrandoPago}
                  className="
                    h-11
                    rounded-xl
                    border border-slate-200 dark:border-slate-700
                    bg-white dark:bg-slate-800
                    text-slate-700 dark:text-slate-300
                    font-bold
                    text-sm
                    hover:bg-slate-50
                    dark:hover:bg-slate-700
                    transition
                  "
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={confirmarPago}
                  disabled={registrandoPago}
                  className="
                    h-11
                    rounded-xl
                    bg-cyan-600
                    hover:bg-cyan-500
                    disabled:bg-slate-400
                    dark:disabled:bg-slate-700
                    text-white
                    font-bold
                    text-sm
                    flex items-center justify-center gap-2
                    transition
                  "
                >
                  {registrandoPago ? (
                    <>
                      <Loader2 size={17} className="animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={17} />
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