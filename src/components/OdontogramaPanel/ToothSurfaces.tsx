import ToothFace from "./ToothFace";

interface Props {
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  center?: string;
}

export default function ToothSurfaces({
  top = "transparent",
  bottom = "transparent",
  left = "transparent",
  right = "transparent",
  center = "transparent",
}: Props) {
  return (
    <>
      {/* Superior */}
      <ToothFace
        points="40,20 60,20 55,35 45,35"
        color={top}
      />

      {/* Inferior */}
      <ToothFace
        points="45,65 55,65 60,80 40,80"
        color={bottom}
      />

      {/* Izquierda */}
      <ToothFace
        points="25,35 45,35 45,65 25,55"
        color={left}
      />

      {/* Derecha */}
      <ToothFace
        points="55,35 75,35 75,55 55,65"
        color={right}
      />

      {/* Centro */}
      <ToothFace
        points="45,35 55,35 55,65 45,65"
        color={center}
      />
    </>
  );
}