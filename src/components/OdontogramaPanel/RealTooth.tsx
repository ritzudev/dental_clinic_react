import { useState } from "react";
interface RealToothProps {
  tipo: "incisivo" | "canino" | "premolar" | "molar";

  colors?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
    center?: string;
  };

  onFaceClick?: (
  face: "top" | "right" | "bottom" | "left" | "center",
  e: React.MouseEvent<SVGPolygonElement>
) => void;
}

export default function RealTooth({
  tipo,
  colors,
  onFaceClick,
}: RealToothProps) {
  const [hoverFace, setHoverFace] = useState<
  "top" | "right" | "bottom" | "left" | "center" | null
>(null);
    let width = 62;
let height = 82;

switch (tipo) {
  case "incisivo":
    width = 42;
    height = 62;
    break;

  case "canino":
    width = 46;
    height = 66;
    break;

  case "premolar":
    width = 54;
    height = 72;
    break;

  case "molar":
    width = 62;
    height = 82;
    break;
}
  return (
    <svg
  width={width}
  height={height}
  viewBox="0 0 100 140"
>
      {/* Contorno del diente (temporal) */}
      <path
        d="
        M20 20
        C20 8 35 4 50 10
        C65 4 80 8 80 20
        C82 38 76 60 68 76
        C62 92 58 110 54 130
        C52 136 48 136 46 130
        C42 110 38 92 32 76
        C24 60 18 38 20 20
        Z
        "
        fill="white"
        stroke="#444"
        strokeWidth="2"
      />

      {/* Cara superior */}
      <polygon
  points="35,20 65,20 58,38 42,38"

  fill={
    colors?.top ??
    (hoverFace === "top" ? "#dbeafe" : "white")
  }

  stroke="#666"
  strokeWidth="1.3"

  onMouseEnter={() => setHoverFace("top")}
  onMouseLeave={() => setHoverFace(null)}

  onClick={(e) => onFaceClick?.("top", e)}

  style={{
    cursor: "pointer",
    transition: "fill .15s ease",
  }}
/>
      {/* Cara izquierda */}
<polygon
  points="22,42 42,38 42,76 26,72"

  fill={
    colors?.left ??
    (hoverFace === "left" ? "#dbeafe" : "white")
  }

  stroke="#666"

  onMouseEnter={() => setHoverFace("left")}
  onMouseLeave={() => setHoverFace(null)}

  onClick={(e) => onFaceClick?.("left", e)}

  style={{
    cursor: "pointer",
    transition: "fill .15s ease",
  }}
/>

      {/* Cara centro */}
<polygon
  points="42,38 58,38 58,76 42,76"

  fill={
    colors?.center ??
    (hoverFace === "center" ? "#dbeafe" : "white")
  }

  stroke="#666"

  onMouseEnter={() => setHoverFace("center")}
  onMouseLeave={() => setHoverFace(null)}

  onClick={(e) => onFaceClick?.("center", e)}

  style={{
    cursor: "pointer",
    transition: "fill .15s ease",
  }}
/>

  {/* Cara derecha */}
<polygon
  points="58,38 78,42 74,72 58,76"

  fill={
    colors?.right ??
    (hoverFace === "right" ? "#dbeafe" : "white")
  }

  stroke="#666"

  onMouseEnter={() => setHoverFace("right")}
  onMouseLeave={() => setHoverFace(null)}

  onClick={(e) => onFaceClick?.("right", e)}

  style={{
    cursor: "pointer",
    transition: "fill .15s ease",
  }}
/>

  {/* Cara inferior */}
<polygon
  points="42,76 58,76 65,95 35,95"

  fill={
    colors?.bottom ??
    (hoverFace === "bottom" ? "#dbeafe" : "white")
  }

  stroke="#666"

  onMouseEnter={() => setHoverFace("bottom")}
  onMouseLeave={() => setHoverFace(null)}

  onClick={(e) => onFaceClick?.("bottom", e)}

  style={{
    cursor: "pointer",
    transition: "fill .15s ease",
  }}
/>
    </svg>
  );
}