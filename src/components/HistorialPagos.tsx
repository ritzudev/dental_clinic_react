import { useEffect, useState } from "react";
import { obtenerPagosPaciente } from "../services/pagosService";

interface Props {
  paciente: any;
}

const HistorialPagos: React.FC<Props> = ({ paciente }) => {

  const [pagos, setPagos] = useState<any[]>([]);

  useEffect(() => {

    const cargarPagos = async () => {

      const lista = await obtenerPagosPaciente(paciente.id);

      setPagos(lista);

    };

    cargarPagos();

  }, [paciente]);
const formatearFecha = (fecha: string) => {
  const meses = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
  ];

  const f = new Date(fecha);

  return `${String(f.getDate()).padStart(2, "0")} ${
    meses[f.getMonth()]
  } ${f.getFullYear()}`;
};
  return (

    <div className="space-y-4">

      <h2 className="text-2xl font-bold text-white">

        Historial de pagos

      </h2>

      {pagos.length === 0 ? (

        <div className="text-slate-400">

          Este paciente aún no registra pagos.

        </div>

      ) : (

        pagos.map((pago) => (
<div
  key={pago.id}
  className="bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 hover:border-cyan-500 transition"
>

  <div className="flex justify-between items-start">

    <div>

      <p className="text-white font-bold text-lg">
        🦷 {pago.tratamientos?.nombre_tratamiento}
      </p>

      <div className="flex items-center gap-6 mt-2 text-sm text-slate-400">

        <span>
          📅 {formatearFecha(pago.fecha_pago)}
        </span>

        <span>
          💳 {pago.metodo_pago}
        </span>

      </div>

    </div>

    <div className="text-emerald-400 text-xl font-black">

      S/ {Number(pago.monto).toFixed(2)}

    </div>

  </div>

</div>
        ))

      )}

    </div>

  );

};

export default HistorialPagos;