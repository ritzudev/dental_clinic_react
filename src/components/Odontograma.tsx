import { useState } from "react";

import Tooth from "./OdontogramaPanel/Tooth";

import type { Estado } from "./OdontogramaPanel/ToothTypes";

const dientes = [
  18,17,16,15,14,13,12,11,
  21,22,23,24,25,26,27,28,
  48,47,46,45,44,43,42,41,
  31,32,33,34,35,36,37,38
];

export default function Odontograma() {
  const [selected, setSelected] = useState<{
  numero: number;
  face: "top" | "right" | "bottom" | "left" | "center";
} | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  type Caras = {
  top?: Estado;
  right?: Estado;
  bottom?: Estado;
  left?: Estado;
  center?: Estado;
};

const [datos, setDatos] = useState<Record<number, Caras>>({});

const [observaciones, setObservaciones] = useState("");
const [diagnostico, setDiagnostico] = useState("");


  const handleFaceClick = (
  numero: number,
  face: "top" | "right" | "bottom" | "left" | "center",
  e: React.MouseEvent
) => {
  setSelected({
    numero,
    face,
  });

  setPos({
    x: e.clientX + 10,
    y: e.clientY + 10,
  });
};

  const guardarEstado = (estado: Estado) => {
  if (!selected) return;

  
setDatos((prev) => ({
  ...prev,
  [selected.numero]: {
    ...prev[selected.numero],
    [selected.face]: estado,
  },
}));

  setSelected(null);
};
const guardarOdontograma = () => {
  console.log("===== ODONTOGRAMA =====");

  console.log("Datos:", datos);

  console.log("Observaciones:", observaciones);

  console.log("Diagnóstico:", diagnostico);
};
 const resumen = {
  sano: 0,
  caries: 0,
  restaurado: 0,
  extraido: 0,
};

Object.values(datos).forEach((caras) => {
  Object.values(caras).forEach((estado) => {
    if (estado) {
      resumen[estado]++;
    }
  });
});

  return (
    <div className="p-6">
      <h2 className="text-2xl font-extrabold mb-6 text-slate-800 dark:text-white">
  Odontograma Dental
</h2>
{/* INFORMACIÓN DEL PACIENTE */}

<div className="bg-white dark:bg-slate-900 rounded-2xl shadow border border-slate-200 dark:border-slate-700 p-6 mb-6">

<h3 className="text-lg font-bold mb-5">
Información del Paciente
</h3>

<div className="grid grid-cols-1 md:grid-cols-2 gap-4">

<div>
<p><strong>👤 Paciente:</strong> ---</p>
<p><strong>🆔 DNI:</strong> ---</p>
<p><strong>🎂 Edad:</strong> ---</p>
</div>

<div>
<p><strong>⚧ Sexo:</strong> ---</p>
<p><strong>📅 Fecha:</strong> {new Date().toLocaleDateString()}</p>
<p><strong>👨‍⚕️ Médico:</strong> ---</p>
</div>

</div>

</div>
<div className="bg-white dark:bg-slate-900 rounded-2xl shadow border border-slate-200 dark:border-slate-700 p-6 mb-6">

  <h3 className="text-lg font-bold mb-6">
    Odontograma
  </h3>

  <div className="grid lg:grid-cols-4 gap-8 items-start">

    {/* Dientes */}
    <div className="lg:col-span-3 flex justify-center">

      <div className="grid grid-cols-8 gap-3">

        {dientes.map((diente) => (
          <Tooth
            key={diente}
            numero={diente}
            estado={datos[diente]}
            onFaceClick={handleFaceClick}
          />
        ))}

      </div>

    </div>

    {/* Leyenda */}
    <div className="border rounded-xl p-5 bg-slate-50 dark:bg-slate-800">

      <h4 className="text-center font-bold mb-5">
        Leyenda
      </h4>

      <div className="space-y-3">

        <div className="flex items-center gap-3">
          <span className="w-4 h-4 rounded-full bg-green-500"></span>
          <span>Sano</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="w-4 h-4 rounded-full bg-red-500"></span>
          <span>Caries</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="w-4 h-4 rounded-full bg-blue-500"></span>
          <span>Restaurado</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="w-4 h-4 rounded-full bg-gray-600"></span>
          <span>Extraído</span>
        </div>

        <hr className="my-5" />

        <h4 className="font-bold">
          Resumen
        </h4>

     <p>🟢 Sanos: {resumen.sano}</p>

<p>🔴 Caries: {resumen.caries}</p>

<p>🔵 Restaurados: {resumen.restaurado}</p>

<p>⚫ Extraídos: {resumen.extraido}</p>

      </div>

    </div>

  </div>

</div>

<div className="bg-white dark:bg-slate-900 rounded-2xl shadow border border-slate-200 dark:border-slate-700 p-6 mb-6">

  <h3 className="text-lg font-bold mb-4">
    Observaciones Clínicas
  </h3>

  <input
    type="text"
    value={observaciones}
    onChange={(e) => setObservaciones(e.target.value)}
    placeholder="Escriba observaciones clínicas..."
    className="
      w-full
      rounded-lg
      border
      border-slate-300
      dark:border-slate-700
      bg-white
      dark:bg-slate-800
      p-3
      outline-none
      focus:ring-2
      focus:ring-blue-500
    "
  />

</div>


<div className="bg-white dark:bg-slate-900 rounded-2xl shadow border border-slate-200 dark:border-slate-700 p-6 mb-6">

  <h3 className="text-lg font-bold mb-4">
    Diagnóstico
  </h3>

  <input
    type="text"
    value={diagnostico}
    onChange={(e) => setDiagnostico(e.target.value)}
    placeholder="Ingrese el diagnóstico..."
    className="
      w-full
      rounded-lg
      border
      border-slate-300
      dark:border-slate-700
      bg-white
      dark:bg-slate-800
      p-3
      outline-none
      focus:ring-2
      focus:ring-blue-500
    "
  />

</div>


      {selected && (
        <div
  style={{
    position: "fixed",
    top: pos.y,
    left: pos.x,
  }}
  className="
    bg-white
    dark:bg-slate-900
    text-slate-900
    dark:text-white
    border
    border-slate-300
    dark:border-slate-700
    shadow-2xl
    rounded-xl
    p-4
    z-50
    w-52
    transition-all
duration-200
  "
>
          <p className="font-bold text-slate-900 dark:text-white mb-3">
  Diente {selected.numero} - Cara {selected.face}
</p>

          <button
  className="w-full mb-2 p-2 rounded bg-green-500 hover:bg-green-600 text-white"
  onClick={() => guardarEstado("sano")}
>
  Sano
</button>

<button
  className="w-full mb-2 p-2 rounded bg-red-500 hover:bg-red-600 text-white"
  onClick={() => guardarEstado("caries")}
>
  Caries
</button>

<button
  className="w-full mb-2 p-2 rounded bg-blue-500 hover:bg-blue-600 text-white"
  onClick={() => guardarEstado("restaurado")}
>
  Restaurado
</button>

<button
  className="w-full p-2 rounded bg-gray-600 hover:bg-gray-700 text-white"
  onClick={() => guardarEstado("extraido")}
>
  Extraído
</button>
<button
  className="w-full mt-3 p-2 rounded bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600"
  onClick={() => setSelected(null)}
>
Cerrar
</button>

         
        </div>
      )}
      {/* BOTONES */}

<div className="flex justify-end gap-4 mt-6">

  <button
  onClick={guardarOdontograma}
    className="
      px-6
      py-2
      rounded-xl
      bg-blue-600
      hover:bg-blue-700
      text-white
      font-semibold
      shadow
    "
  >
    💾 Guardar
  </button>

  <button
    className="
      px-6
      py-2
      rounded-xl
      bg-slate-700
      hover:bg-slate-800
      text-white
      font-semibold
      shadow
    "
  >
    🖨️ Imprimir
  </button>

</div>
    </div>
  );
}