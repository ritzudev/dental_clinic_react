import type { Estado } from "./ToothTypes";
import { getNombreEstado } from "./ToothUtils";

interface Props {
  selected: number | null;
  pos: {
    x: number;
    y: number;
  };
  datos: Record<number, Estado>;
  guardarEstado: (estado: Estado) => void;
  cerrar: () => void;
}

export default function ToothPopup({
  selected,
  pos,
  datos,
  guardarEstado,
  cerrar,
}: Props) {
  if (!selected) return null;

  return (
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
      "
    >
      <p className="font-bold mb-3">
        Diente {selected}
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
        className="w-full mb-2 p-2 rounded bg-gray-600 hover:bg-gray-700 text-white"
        onClick={() => guardarEstado("extraido")}
      >
        Extraído
      </button>

      <button
        className="w-full mt-3 p-2 rounded bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600"
        onClick={cerrar}
      >
        Cerrar
      </button>

      {datos[selected] && (
        <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">
          Estado: <b>{getNombreEstado(datos[selected])}</b>
        </p>
      )}
    </div>
  );
}