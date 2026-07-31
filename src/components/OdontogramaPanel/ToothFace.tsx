interface Props {
  points: string;
  color?: string;
  onClick?: () => void;
}

export default function ToothFace({
  points,
  color = "transparent",
  onClick,
}: Props) {
  return (
    <polygon
      points={points}
      fill={color}
      stroke="#555"
      strokeWidth="1.3"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      style={{
        cursor: "pointer",
      }}
    />
  );
}