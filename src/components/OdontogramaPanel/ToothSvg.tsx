interface Props {
  tipo: "incisivo" | "canino" | "premolar" | "molar";
  children?: React.ReactNode;
}
export default function ToothSvg({
  tipo,
  children,
}: Props) {
  switch (tipo) {

    case "incisivo":
      return (
        <svg viewBox="0 0 100 140" width="40" height="56">
          <path
            d="
            M35 10
            Q50 2 65 10
            Q78 18 74 42
            Q70 68 60 86
            L55 126
            Q50 134 45 126
            L40 86
            Q30 68 26 42
            Q22 18 35 10 Z
            "
            fill="currentColor"
            stroke="#555"
            strokeWidth="2"
          />
          {children}
        </svg>
      );

    case "canino":
      return (
        <svg viewBox="0 0 100 150" width="44" height="60">
          <path
            d="
            M35 10
            Q50 0 65 10
            Q80 22 74 46
            Q68 74 55 92
            L50 140
            L45 92
            Q32 74 26 46
            Q20 22 35 10 Z
            "
            fill="currentColor"
            stroke="#555"
            strokeWidth="2"
          />
          {children}
        </svg>
      );

    case "premolar":
      return (
        <svg viewBox="0 0 100 150" width="48" height="62">
          <path
            d="
            M28 12
            Q50 0 72 12
            Q84 28 78 54
            Q72 82 58 102
            L54 138
            Q50 144 46 138
            L42 102
            Q28 82 22 54
            Q16 28 28 12 Z
            "
            fill="currentColor"
            stroke="#555"
            strokeWidth="2"
          />
          {children}
        </svg>
      );

    default:
  return (
    <svg viewBox="0 0 100 140" width="56" height="70">
      <path
        d="
        M20 18
        C20 8 32 4 42 12
        C48 4 52 4 58 12
        C68 4 80 8 80 18

        C82 34 78 48 72 60

        C68 70 64 82 62 94

        L60 130

        L54 96

        L50 112

        L46 96

        L40 130

        L38 94

        C36 82 32 70 28 60

        C22 48 18 34 20 18
        Z
        "
        fill="currentColor"
        stroke="#555"
        strokeWidth="2"
      />
      {children}
    </svg>
  );
  }
}