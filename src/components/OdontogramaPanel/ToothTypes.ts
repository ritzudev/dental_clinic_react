export type Estado = "sano" | "caries" | "extraido" | "restaurado";

export interface ToothProps {
  numero: number;
  estado?: Estado;
  onClick: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export interface ToothPopupProps {
  numero: number;
  estado?: Estado;
  onGuardar: (estado: Estado) => void;
  onCerrar: () => void;
}