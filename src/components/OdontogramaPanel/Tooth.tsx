
import type { MouseEvent } from "react";
import RealTooth from "./RealTooth";
import type {
  Estado,
  CarasDentales,
  CaraDental,
} from "./ToothTypes";

interface ToothProps {
  numero: number;
  estado?: CarasDentales;

  onFaceClick: (
    numero: number,
    face: CaraDental,
    e: MouseEvent<SVGPolygonElement>
  ) => void;
}

/**
 * Clasifica el diente usando la numeración FDI.
 *
 * Permanentes:
 * 1 y 2: incisivos
 * 3: canino
 * 4 y 5: premolares
 * 6, 7 y 8: molares
 *
 * Temporales:
 * 1 y 2: incisivos
 * 3: canino
 * 4 y 5: molares
 */
function getTipoDiente(
  numero: number
): "incisivo" | "canino" | "premolar" | "molar" {
  const cuadrante = Math.floor(numero / 10);
  const posicion = numero % 10;

  const esTemporal = cuadrante >= 5 && cuadrante <= 8;

  if (posicion === 1 || posicion === 2) {
    return "incisivo";
  }

  if (posicion === 3) {
    return "canino";
  }

  if (esTemporal) {
    return "molar";
  }

  if (posicion === 4 || posicion === 5) {
    return "premolar";
  }

  return "molar";
}

/**
 * Colores de representación clínica.
 */
function getColorEstado(estado?: Estado): string | undefined {
  switch (estado) {
    case "caries":
      return "#ef4444";

    case "restaurado":
      return "#3b82f6";

    case "extraido":
      return "#6b7280";

    case "sano":
      return "#22c55e";

    default:
      return undefined;
  }
}

export default function Tooth({
  numero,
  estado,
  onFaceClick,
}: ToothProps) {
  const tipo = getTipoDiente(numero);

  return (
    <div
      className="
        flex flex-col items-center
        cursor-pointer select-none
        transition-all duration-200
        hover:scale-110 hover:-translate-y-1
      "
    >
      {/* Número FDI */}
      <span className="mb-1 text-xs font-bold text-slate-600 dark:text-slate-300">
        {numero}
      </span>

      {/* Dibujo dental */}
      <div
        className="relative transition-all duration-300"
        style={{
          filter: "drop-shadow(0px 2px 3px rgba(0,0,0,.18))",
        }}
      >
        <RealTooth
          tipo={tipo}
          colors={{
            top: getColorEstado(estado?.top),
            right: getColorEstado(estado?.right),
            bottom: getColorEstado(estado?.bottom),
            left: getColorEstado(estado?.left),
            center: getColorEstado(estado?.center),
          }}
          onFaceClick={(face, e) => {
            onFaceClick(numero, face, e);
          }}
        />
      </div>
    </div>
  );
}
