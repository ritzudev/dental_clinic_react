interface Props {
  points: string;
  color?: string;
  onClick?: () => void;
}

export default function ToothFace({
  points,
  color = "white",
  onClick,
}: Props) {
  return (
    <polygon
      points={points}
      fill={color}
      stroke="#555"
      strokeWidth="1.3"
      onClick={onClick}
      style={{
        cursor: "pointer",
        transition: ".2s",
      }}
    />
  );
}