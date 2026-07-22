import type { Estado } from "./ToothTypes";

export const getColor = (estado?: Estado) => {
  switch (estado) {
    case "caries":
      return "text-red-500";

    case "sano":
      return "text-green-500";

    case "extraido":
      return "text-gray-500";

    case "restaurado":
      return "text-blue-500";

    default:
      return "text-white dark:text-slate-200";
  }
};

export const getNombreEstado = (estado?: Estado) => {
  switch (estado) {
    case "sano":
      return "Sano";

    case "caries":
      return "Caries";

    case "restaurado":
      return "Restaurado";

    case "extraido":
      return "Extraído";

    default:
      return "";
  }
};