
import type { MouseEvent } from "react";


export type Estado =
  | "sano"
  | "caries"
  | "extraido"
  | "restaurado";


export type CaraDental =
  | "top"
  | "right"
  | "bottom"
  | "left"
  | "center";


export interface CarasDentales {
  top?: Estado;
  right?: Estado;
  bottom?: Estado;
  left?: Estado;
  center?: Estado;
}


export interface ToothProps {
  numero: number;
  estado?: Estado | CarasDentales;

  onClick?: (e: MouseEvent<HTMLDivElement>) => void;

  onFaceClick?: (
    numero: number,
    face: CaraDental,
    e: MouseEvent
  ) => void;
}
