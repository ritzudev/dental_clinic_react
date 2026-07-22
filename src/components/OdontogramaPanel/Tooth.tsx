import type { Estado } from "./ToothTypes";
import { getColor } from "./ToothUtils";
import ToothSvg from "./ToothSvg";
import ToothSurfaces from "./ToothSurfaces";

interface ToothProps {
  numero: number;
  estado?: Estado;
  onClick: (
    numero: number,
    e: React.MouseEvent<HTMLDivElement>
  ) => void;
}

export default function Tooth({
  numero,
  estado,
  onClick,
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
      onClick={(e) => onClick(numero, e)}
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
    ${getColor(estado)}
    transition-all
    duration-300
  `}
  style={{
    filter: "drop-shadow(0px 2px 3px rgba(0,0,0,.18))",
  }}
>
  <ToothSvg tipo={tipo}>
  <ToothSurfaces
  center="red"
/>
</ToothSvg>
</div>


    </div>
  );
}