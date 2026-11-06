
import { useEffect, useState } from "react";
import type { FC } from "react";
import { CalendarDays, CreditCard, ReceiptText, Wallet } from "lucide-react";
import { obtenerPagosPaciente } from "../services/pagosService";

interface Props {
  paciente: {
    id: number;
  };
}

interface Pago {
  id: number;
  monto: number | string;
  fecha_pago: string;
  metodo_pago: string | null;
  tratamientos?: {
    nombre_tratamiento?: string;
  } | null;
}

const HistorialPagos: FC<Props> = ({ paciente }) => {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let activo = true;

    const cargarPagos = async () => {
      try {
        setCargando(true);
        setError(false);

        const lista = await obtenerPagosPaciente(paciente.id);

        if (activo) {
          setPagos(lista || []);
        }
      } catch (err) {
        console.error("Error cargando historial de pagos:", err);

        if (activo) {
          setError(true);
          setPagos([]);
        }
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    };

    cargarPagos();

    return () => {
      activo = false;
    };
  }, [paciente.id]);

  const formatearFecha = (fecha: string) => {
    if (!fecha) return "Fecha no disponible";

    const partes = fecha.split("-");

    if (partes.length === 3) {
      const [anio, mes, dia] = partes;
      const fechaLocal = new Date(
        Number(anio),
        Number(mes) - 1,
        Number(dia)
      );

      return fechaLocal.toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }

    const fechaNormal = new Date(fecha);

    if (Number.isNaN(fechaNormal.getTime())) {
      return "Fecha no disponible";
    }

    return fechaNormal.toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const totalPagado = pagos.reduce(
    (total, pago) => total + Number(pago.monto || 0),
    0
  );

  return (
    <section className="space-y-5">

      {/* ENCABEZADO */}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

        <div className="flex items-center gap-3">
          <div className="
            w-11 h-11 rounded-xl
            flex items-center justify-center
            bg-cyan-50 dark:bg-cyan-950/40
            border border-cyan-100 dark:border-cyan-900/60
          ">
            <ReceiptText
              size={21}
              className="text-cyan-700 dark:text-cyan-400"
            />
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">
              Historial de pagos
            </h2>

            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Registro de pagos realizados por el paciente
            </p>
          </div>
        </div>

        {!cargando && !error && pagos.length > 0 && (
          <div className="
            flex items-center gap-3
            rounded-xl px-4 py-3
            bg-emerald-50 dark:bg-emerald-950/30
            border border-emerald-100 dark:border-emerald-900/50
          ">
            <div className="
              w-9 h-9 rounded-lg
              bg-white dark:bg-emerald-900/40
              flex items-center justify-center
            ">
              <Wallet
                size={18}
                className="text-emerald-600 dark:text-emerald-400"
              />
            </div>

            <div>
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                Total pagado
              </p>

              <p className="text-lg font-bold text-emerald-800 dark:text-emerald-300">
                S/ {totalPagado.toFixed(2)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* CARGANDO */}

      {cargando && (
        <div className="
          rounded-2xl border border-slate-200 dark:border-slate-800
          bg-white dark:bg-slate-900/50
          py-14 text-center
        ">
          <div className="
            w-9 h-9 mx-auto rounded-full
            border-4 border-cyan-100 dark:border-cyan-950
            border-t-cyan-600 dark:border-t-cyan-400
            animate-spin
          " />

          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Cargando historial de pagos...
          </p>
        </div>
      )}

      {/* ERROR */}

      {!cargando && error && (
        <div className="
          rounded-2xl border border-red-200 dark:border-red-900/50
          bg-red-50 dark:bg-red-950/20
          p-6 text-center
        ">
          <p className="font-semibold text-red-700 dark:text-red-400">
            No se pudo cargar el historial.
          </p>

          <p className="text-sm text-red-600 dark:text-red-300 mt-1">
            Verifica tu conexión e inténtalo nuevamente.
          </p>
        </div>
      )}

      {/* SIN PAGOS */}

      {!cargando && !error && pagos.length === 0 && (
        <div className="
          rounded-2xl border border-dashed
          border-slate-300 dark:border-slate-700
          bg-slate-50/70 dark:bg-slate-900/30
          py-14 px-5 text-center
        ">
          <div className="
            w-14 h-14 mx-auto rounded-2xl
            bg-white dark:bg-slate-800
            border border-slate-200 dark:border-slate-700
            flex items-center justify-center
          ">
            <ReceiptText
              size={25}
              className="text-slate-400 dark:text-slate-500"
            />
          </div>

          <h3 className="mt-4 font-bold text-slate-800 dark:text-white">
            Sin pagos registrados
          </h3>

          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Este paciente todavía no registra pagos de tratamientos.
          </p>
        </div>
      )}

      {/* LISTADO DE PAGOS */}

      {!cargando && !error && pagos.length > 0 && (
        <div className="
          rounded-2xl overflow-hidden
          border border-slate-200 dark:border-slate-800
          bg-white dark:bg-slate-900/50
        ">

          <div className="
            px-5 py-4
            border-b border-slate-200 dark:border-slate-800
            flex items-center justify-between
            bg-slate-50/80 dark:bg-slate-900
          ">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white">
                Pagos registrados
              </h3>

              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {pagos.length} {pagos.length === 1 ? "registro" : "registros"}
              </p>
            </div>

            <span className="
              px-3 py-1.5 rounded-full
              text-xs font-semibold
              bg-emerald-50 dark:bg-emerald-950/40
              text-emerald-700 dark:text-emerald-400
              border border-emerald-200 dark:border-emerald-900/50
            ">
              Pagos realizados
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">

            {pagos.map((pago) => (
              <div
                key={pago.id}
                className="
                  px-5 py-5
                  flex flex-col sm:flex-row
                  sm:items-center sm:justify-between
                  gap-4
                  hover:bg-slate-50 dark:hover:bg-slate-800/40
                  transition-colors
                "
              >

                <div className="flex items-start gap-3 min-w-0">

                  <div className="
                    w-10 h-10 shrink-0 rounded-xl
                    bg-cyan-50 dark:bg-cyan-950/40
                    flex items-center justify-center
                  ">
                    <CreditCard
                      size={19}
                      className="text-cyan-700 dark:text-cyan-400"
                    />
                  </div>

                  <div className="min-w-0">

                    <p className="font-semibold text-slate-800 dark:text-white truncate">
                      {pago.tratamientos?.nombre_tratamiento ||
                        "Pago de tratamiento"}
                    </p>

                    <div className="
                      flex flex-wrap items-center gap-x-4 gap-y-2
                      mt-2 text-xs text-slate-500 dark:text-slate-400
                    ">
                      <span className="flex items-center gap-1.5">
                        <CalendarDays size={14} />
                        {formatearFecha(pago.fecha_pago)}
                      </span>

                      <span className="flex items-center gap-1.5">
                        <CreditCard size={14} />
                        {pago.metodo_pago || "Método no especificado"}
                      </span>
                    </div>

                  </div>
                </div>

                <div className="sm:text-right sm:shrink-0">

                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                    Importe pagado
                  </p>

                  <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
                    S/ {Number(pago.monto || 0).toFixed(2)}
                  </p>

                  <span className="
                    inline-flex items-center gap-1
                    mt-1 text-xs font-semibold
                    text-emerald-700 dark:text-emerald-400
                  ">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Registrado
                  </span>

                </div>

              </div>
            ))}

          </div>
        </div>
      )}

    </section>
  );
};

export default HistorialPagos;
