import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  obtenerTratamientosPaciente,
  registrarPago,
  finalizarTratamiento,
} from "../services/pagosService";

interface Props {
  paciente: any;
  onPagoRegistrado: () => void;
}

const RegistroPago: React.FC<Props> = ({
  paciente,
  onPagoRegistrado,
}) => {

  const [tratamientos, setTratamientos] = useState<any[]>([]);
  const [tratamientoId, setTratamientoId] = useState("");
  const [metodoPago, setMetodoPago] = useState("Efectivo");
  const [observaciones, setObservaciones] = useState("");
  const [guardando, setGuardando] = useState(false);

  const tratamientoSeleccionado = tratamientos.find(
  (t) => t.id === Number(tratamientoId)
  );

  useEffect(() => {

    const cargarTratamientos = async () => {

      const lista = await obtenerTratamientosPaciente(paciente.id);

      setTratamientos(lista);

    };

    cargarTratamientos();

  }, [paciente]);

const handleRegistrarPago = async () => {

  if (!tratamientoSeleccionado) return;

  try {

    setGuardando(true);

    await registrarPago(
      paciente.id,
      tratamientoSeleccionado.id,
      Number(tratamientoSeleccionado.costo),
      metodoPago,
      observaciones
    );

    await finalizarTratamiento(tratamientoSeleccionado.id);

    toast.success("Pago registrado correctamente.");

    setTratamientoId("");
    setMetodoPago("Efectivo");
    setObservaciones("");

    const lista = await obtenerTratamientosPaciente(paciente.id);
    setTratamientos(lista);

    setTimeout(() => {
      onPagoRegistrado();
    }, 1000);

  } catch (error: any) {

    console.error(error);

    toast.error("No se pudo registrar el pago.");

  } finally {

    setGuardando(false);

  }

};


  return (

  <div className="space-y-6">

    {/* Tratamiento */}

    <div>

      <label className="block text-sm font-semibold text-slate-300 mb-2">
        Tratamiento
      </label>

      <select
        value={tratamientoId}
        onChange={(e) => setTratamientoId(e.target.value)}
        className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3 text-white"
      >

        <option value="">
          Seleccione un tratamiento
        </option>
        {tratamientos.length === 0 && (
         <option disabled>
         No existen tratamientos registrados
        </option>
        )}


{tratamientos.map((t) => (
  <option key={t.id} value={t.id}>
    {t.nombre_tratamiento}
  </option>
))}

      </select>
{tratamientoSeleccionado && (

  <div className="mt-5 bg-slate-800 border border-slate-700 rounded-2xl p-5">

    <div className="flex justify-between">

      <div>

        <p className="text-slate-400 text-sm">

          Estado del tratamiento

        </p>

        <p
  className={`text-lg font-bold capitalize ${
    tratamientoSeleccionado.estado === "pendiente"
      ? "text-yellow-400"
      : tratamientoSeleccionado.estado === "pagado"
      ? "text-emerald-400"
      : "text-cyan-400"
  }`}
>
  {tratamientoSeleccionado.estado}
</p>

      </div>

      <div className="text-right">

        <p className="text-slate-400 text-sm">

          Costo del tratamiento

        </p>

        <p className="text-3xl font-black text-emerald-400">

          S/ {Number(tratamientoSeleccionado.costo).toFixed(2)}

        </p>

      </div>

    </div>

  </div>

)}
    </div>

    

    {/* Método */}

    <div>

      <label className="block text-sm font-semibold text-slate-300 mb-2">
        Método de pago
      </label>

      <select
        value={metodoPago}
        onChange={(e) => setMetodoPago(e.target.value)}
        className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3 text-white"
      >

        <option>Efectivo</option>
        <option>Yape</option>
        <option>Plin</option>
        <option>Transferencia</option>
        <option>Tarjeta</option>

      </select>

    </div>

    {/* Observaciones */}

    <div>

      <label className="block text-sm font-semibold text-slate-300 mb-2">
        Observaciones
      </label>

      <textarea
        value={observaciones}
        onChange={(e) => setObservaciones(e.target.value)}
        rows={4}
        className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3 text-white resize-none"
      />

    </div>

    {/* Botón */}

   <button
  onClick={handleRegistrarPago}
  disabled={!tratamientoId || guardando}
  className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-2xl py-4 text-white font-bold text-lg transition"
>
  {guardando ? "Registrando..." : "Registrar Pago"}
</button>

  </div>

);

};

export default RegistroPago;