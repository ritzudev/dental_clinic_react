export type Estado = "sano" | "caries" | "extraido" | "restaurado";

export interface ToothProps {
  numero: number;
  estado?: Estado;
  onClick: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export interface ToothProps {
  numero: number;
  estado?: Estado;

  onFaceClick: (
    numero: number,
    face: "top" | "right" | "bottom" | "left" | "center",
    e: React.MouseEvent
  ) => void;
}