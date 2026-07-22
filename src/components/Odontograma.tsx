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
  const [selected, setSelected] = useState<number | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [datos, setDatos] = useState<Record<number, Estado>>({});

  const handleClick = (diente: number, e: React.MouseEvent) => {
    setSelected(diente);
    setPos({
      x: e.clientX + 10,
      y: e.clientY + 10,
    });
  };

  const guardarEstado = (estado: Estado) => {
  if (!selected) return;

  setDatos((prev) => ({
    ...prev,
    [selected]: estado,
  }));

  setSelected(null);
};
 

  return (
    <div className="p-6">
      <h2 className="text-2xl font-extrabold mb-6 text-slate-800 dark:text-white">
  Odontograma Dental
</h2>

      <div className="grid grid-cols-8 gap-3 max-w-xl bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow">
        {dientes.map((diente) => (
 <Tooth
  key={diente}
  numero={diente}
  estado={datos[diente]}
  onClick={handleClick}
/>
))}
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
          <p className="font-bold text-slate-900 dark:text-white mb-3">Diente {selected}</p>

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
    </div>
  );
}