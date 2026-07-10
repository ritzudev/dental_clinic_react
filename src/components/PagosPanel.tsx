import { useEffect, useState } from "react";
import {
  Search,
  DollarSign,
  Calendar,
  Wallet
} from "lucide-react";
import { buscarPacientePorDni,obtenerResumenPagos,} from "../services/pagosService";
import RegistroPago from "./RegistroPago";
import HistorialPagos from "./HistorialPagos";

export const PagosPanel: React.FC = () => {

  const [dni, setDni] = useState("");
  interface Paciente { id: number;nombres: string; apellidos: string;dni: string;telefono?: string;}
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [mostrarModalPaciente, setMostrarModalPaciente] = useState(false);
  const [pestanaPago, setPestanaPago] = useState<"registro" | "historial">("registro");
  const [buscando, setBuscando] = useState(false);
  const [totalHoy, setTotalHoy] = useState(0);
const [totalMes, setTotalMes] = useState(0);
const [totalCobrado, setTotalCobrado] = useState(0);

  const buscarPaciente = async () => {

  if (!dni.trim()) {

    alert("Ingrese un DNI.");

    return;

  }

  try {

    setBuscando(true);

    const resultado = await buscarPacientePorDni(dni);

    if (!resultado) {

      alert("Paciente no encontrado.");

      return;

    }

    setPaciente(resultado);
    setPestanaPago("registro");

    setMostrarModalPaciente(true);

  } catch (error) {

    console.error(error);

    alert("Ocurrió un error al buscar el paciente.");

  } finally {

    setBuscando(false);

  }
};



const cargarResumen = async () => {

  const pagos = await obtenerResumenPagos();

  const hoy = new Date();

  const hoyTexto = hoy.toISOString().split("T")[0];

  const mes = hoy.getMonth();
  const anio = hoy.getFullYear();

  let sumaHoy = 0;
  let sumaMes = 0;
  let sumaTotal = 0;

  pagos.forEach((p: any) => {

    const monto = Number(p.monto);

    sumaTotal += monto;

    if (p.fecha_pago === hoyTexto) {
      sumaHoy += monto;
    }

    const fecha = new Date(p.fecha_pago);

    if (
      fecha.getMonth() === mes &&
      fecha.getFullYear() === anio
    ) {
      sumaMes += monto;
    }

  });

  setTotalHoy(sumaHoy);
  setTotalMes(sumaMes);
  setTotalCobrado(sumaTotal);

};

useEffect(() => {
  cargarResumen();
}, []);

  return (
    

    <div className="space-y-8">

      {/* TITULO */}

      <div>

        <h1 className="text-4xl font-black text-white">

          Gestión de Pagos

        </h1>

        <p className="text-slate-400 mt-2">

          Registro y control de pagos de tratamientos odontológicos.

        </p>

      </div>

      {/* RESUMEN */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6">

          <div className="flex justify-between">

            <div>

              <p className="text-slate-400">

                Hoy

              </p>

              <h2 className="text-3xl font-black text-emerald-400 mt-2">

                S/ {totalHoy.toFixed(2)}

              </h2>

            </div>

            <DollarSign className="text-emerald-400"/>

          </div>

        </div>

        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6">

          <div className="flex justify-between">

            <div>

              <p className="text-slate-400">

                Este mes

              </p>

              <h2 className="text-3xl font-black text-cyan-400 mt-2">

                S/ {totalMes.toFixed(2)}

              </h2>

            </div>

            <Calendar className="text-cyan-400"/>

          </div>

        </div>

       

        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6">

          <div className="flex justify-between">

            <div>

              <p className="text-slate-400">

                Cobrado

              </p>

              <h2 className="text-3xl font-black text-violet-400 mt-2">

               S/ {totalCobrado.toFixed(2)}

              </h2>

            </div>

            <Wallet className="text-violet-400"/>

          </div>

        </div>

      </div>

      {/* BUSCADOR */}

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">

        <h2 className="text-2xl font-bold text-white mb-2">

          Buscar paciente

        </h2>

        <p className="text-slate-400 mb-6">

          Escriba el DNI del paciente para registrar o consultar pagos.

        </p>

        <div className="flex gap-4">

          <input

            value={dni}

            onChange={(e)=>setDni(e.target.value)}

            placeholder="Ingrese DNI"

            className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white"

          />

          <button

  onClick={buscarPaciente}

  disabled={buscando}

  className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 rounded-2xl px-8 text-white font-bold flex items-center gap-2"

>

            <Search size={20}/>

            {buscando ? "Buscando..." : "Buscar"}

          </button>

        </div>

      </div>
{mostrarModalPaciente && paciente && (

  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">

   <div className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl w-full max-w-7xl max-h-[92vh] overflow-hidden flex flex-col">

  <div className="px-8 py-6 border-b border-slate-800 flex items-center justify-between">

    <div className="flex items-center gap-5">

        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-3xl font-black text-white">

            {paciente.nombres.charAt(0)}

        </div>

        <div>

            <h2 className="text-3xl font-black text-white">

                {paciente.nombres} {paciente.apellidos}

            </h2>

            <p className="text-slate-400">

                DNI: {paciente.dni}

            </p>

            <p className="text-slate-500">

                {paciente.telefono || "Sin teléfono"}

            </p>

        </div>

    </div>

    <button
        onClick={() => {
        setMostrarModalPaciente(false);
        setPestanaPago("registro");
}}
        className="text-slate-400 hover:text-red-400 text-4xl font-bold transition"
    >
        ×
    </button>

</div>

  {/* PESTAÑAS */}

  <div className="bg-slate-950 border-b border-slate-800">

    <div className="flex">

      <button

        onClick={() => setPestanaPago("registro")}

        className={`flex-1 py-5 text-lg font-bold border-b-4 transition-all ${
    pestanaPago === "registro"
        ? "border-cyan-500 text-cyan-400"
        : "border-transparent text-slate-500 hover:text-white"
      }`}

      >

        💳 Registrar Pago

      </button>

      <button

        onClick={() => setPestanaPago("historial")}

        className={`flex-1 py-5 text-lg font-bold border-b-4 transition-all ${
    pestanaPago === "historial"
        ? "border-cyan-500 text-cyan-400"
        : "border-transparent text-slate-500 hover:text-white"     
      }`}

      >

        📋 Historial de Pagos

      </button>

    </div>

  </div>

  {/* CONTENIDO */}

  <div className="flex-1 overflow-y-auto p-8 min-h-[520px]">

  {pestanaPago === "registro" && (
  <RegistroPago
    paciente={paciente}
    onPagoRegistrado={async () => {
  await cargarResumen();
  setMostrarModalPaciente(false);
  setPestanaPago("registro");
}}
  />
)}

  {pestanaPago === "historial" && (
    <HistorialPagos paciente={paciente} />
  )}

</div>

</div>

  </div>

)}
    </div>

  );

}