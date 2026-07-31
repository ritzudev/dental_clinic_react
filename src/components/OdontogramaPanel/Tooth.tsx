import type { Estado } from "./ToothTypes";


import RealTooth from "./RealTooth";

type Caras = {
  top?: Estado;
  right?: Estado;
  bottom?: Estado;
  left?: Estado;
  center?: Estado;
};

interface ToothProps {
  numero: number;
  estado?: Caras;

  onFaceClick: (
    numero: number,
    face: "top" | "right" | "bottom" | "left" | "center",
    e: React.MouseEvent
  ) => void;
}

export default function Tooth({
  numero,
  estado,
  onFaceClick,
}: ToothProps) {
  const getTipo = (numero: number) => {
  const n = numero % 10;

  if (n === 1 || n === 2) return "incisivo";

  if (n === 3) return "canino";

  if (n === 4 || n === 5) return "premolar";

  return "molar";
};

const tipo = getTipo(numero);
  return (
    <div
      
      className="
flex
flex-col
items-center
cursor-pointer
select-none
transition-all
duration-200
hover:scale-110
hover:-translate-y-1
"
    >
      {/* Número FDI */}
      <span className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
        {numero}
      </span>

<div
  className={`
    relative
    transition-all
    duration-300
  `}
  style={{
    filter: "drop-shadow(0px 2px 3px rgba(0,0,0,.18))",
  }}
>
<RealTooth
  tipo={tipo}
  colors={{
    top:
      estado?.top === "caries"
        ? "#ef4444"
        : estado?.top === "restaurado"
        ? "#3b82f6"
        : estado?.top === "extraido"
        ? "#6b7280"
        : estado?.top === "sano"
        ? "#22c55e"
        : undefined,

    left:
      estado?.left === "caries"
        ? "#ef4444"
        : estado?.left === "restaurado"
        ? "#3b82f6"
        : estado?.left === "extraido"
        ? "#6b7280"
        : estado?.left === "sano"
        ? "#22c55e"
        : undefined,

    center:
      estado?.center === "caries"
        ? "#ef4444"
        : estado?.center === "restaurado"
        ? "#3b82f6"
        : estado?.center === "extraido"
        ? "#6b7280"
        : estado?.center === "sano"
        ? "#22c55e"
        : undefined,

    right:
      estado?.right === "caries"
        ? "#ef4444"
        : estado?.right === "restaurado"
        ? "#3b82f6"
        : estado?.right === "extraido"
        ? "#6b7280"
        : estado?.right === "sano"
        ? "#22c55e"
        : undefined,

    bottom:
      estado?.bottom === "caries"
        ? "#ef4444"
        : estado?.bottom === "restaurado"
        ? "#3b82f6"
        : estado?.bottom === "extraido"
        ? "#6b7280"
        : estado?.bottom === "sano"
        ? "#22c55e"
        : undefined,
  }}
  onFaceClick={(face, e) => {
    onFaceClick(numero, face, e);
  }}
/>
</div>


    </div>
  );
}