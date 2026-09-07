import { useMemo, useState } from "react";

interface Tratamiento {
  id: number;
  nombre: string;
  categoria: string;
  descripcion: string;
  queEs: string;
  paraQueSirve: string[];
  zona: string;
  duracion: string;
  sesiones: string;
  precio: number;
  pasos: string[];
  tipoDiente: "diente" | "molar" | "encía" | "sonrisa" | "brackets";
}

const categorias = [
  "Todos",
  "Preventivos",
  "Restauradores",
  "Endodoncia",
  "Periodoncia",
  "Cirugía",
  "Estética",
  "Ortodoncia",
];

const tratamientos: Tratamiento[] = [
  {
    id: 1,
    nombre: "Limpieza dental",
    categoria: "Preventivos",
    descripcion:
      "Elimina placa bacteriana, sarro y manchas superficiales para mantener una adecuada salud oral.",
    queEs:
      "Es un procedimiento preventivo destinado a eliminar acumulaciones de placa bacteriana y cálculo dental que no pueden retirarse completamente con el cepillado habitual.",
    paraQueSirve: [
      "Eliminar placa bacteriana y sarro.",
      "Prevenir enfermedades de las encías.",
      "Reducir manchas superficiales.",
      "Mantener una adecuada higiene oral.",
    ],
    zona: "Superficie dental y línea gingival",
    duracion: "45 min",
    sesiones: "1 sesión",
    precio: 100,
    pasos: [
      "Evaluación inicial.",
      "Remoción de placa y cálculo.",
      "Limpieza de las superficies dentales.",
      "Pulido dental.",
      "Recomendaciones de higiene oral.",
    ],
    tipoDiente: "diente",
  },

  {
    id: 2,
    nombre: "Sellantes dentales",
    categoria: "Preventivos",
    descripcion:
      "Protege las superficies profundas de los molares para ayudar a prevenir la aparición de caries.",
    queEs:
      "Es una capa protectora que se coloca sobre las fosas y fisuras de las piezas dentales, especialmente en molares y premolares.",
    paraQueSirve: [
      "Prevenir la aparición de caries.",
      "Proteger zonas difíciles de limpiar.",
      "Reducir la acumulación de placa.",
      "Proteger molares y premolares.",
    ],
    zona: "Superficie oclusal de molares y premolares",
    duracion: "30 min",
    sesiones: "1 sesión",
    precio: 80,
    pasos: [
      "Evaluación de la pieza dental.",
      "Limpieza de la superficie.",
      "Preparación del esmalte.",
      "Aplicación del sellante.",
      "Fotopolimerización y control.",
    ],
    tipoDiente: "molar",
  },

  {
    id: 3,
    nombre: "Restauración dental",
    categoria: "Restauradores",
    descripcion:
      "Repara piezas dentales afectadas por caries, fracturas o desgaste mediante materiales restauradores.",
    queEs:
      "Es un procedimiento destinado a recuperar la forma y función de una pieza dental que ha perdido estructura por caries, fracturas o desgaste.",
    paraQueSirve: [
      "Eliminar tejido dental afectado.",
      "Recuperar la anatomía del diente.",
      "Restablecer la función masticatoria.",
      "Mejorar la apariencia de la pieza.",
    ],
    zona: "Corona dental",
    duracion: "60 min",
    sesiones: "1 sesión",
    precio: 180,
    pasos: [
      "Evaluación de la pieza.",
      "Eliminación del tejido afectado.",
      "Preparación de la superficie.",
      "Colocación del material restaurador.",
      "Ajuste y pulido final.",
    ],
    tipoDiente: "diente",
  },

  {
    id: 4,
    nombre: "Tratamiento de conductos",
    categoria: "Endodoncia",
    descripcion:
      "Elimina la infección del tejido pulpar y permite conservar la pieza dental afectada.",
    queEs:
      "Es un procedimiento endodóntico que permite eliminar el tejido pulpar afectado, limpiar los conductos radiculares y sellarlos para conservar el diente.",
    paraQueSirve: [
      "Eliminar la infección del tejido pulpar.",
      "Controlar el dolor dental.",
      "Conservar el diente natural.",
      "Evitar la extracción de la pieza.",
      "Restablecer la función del diente.",
    ],
    zona: "Pulpa y conductos radiculares",
    duracion: "90 min",
    sesiones: "1 - 2 sesiones",
    precio: 350,
    pasos: [
      "Anestesia local.",
      "Apertura de la corona dental.",
      "Limpieza y conformación de los conductos.",
      "Desinfección del sistema radicular.",
      "Sellado de los conductos.",
      "Restauración final del diente.",
    ],
    tipoDiente: "molar",
  },

  {
    id: 5,
    nombre: "Raspado y alisado radicular",
    categoria: "Periodoncia",
    descripcion:
      "Elimina el sarro acumulado debajo de la encía y ayuda a controlar la enfermedad periodontal.",
    queEs:
      "Es un procedimiento periodontal profundo que permite eliminar cálculo y depósitos bacterianos adheridos a las superficies radiculares.",
    paraQueSirve: [
      "Reducir la inflamación gingival.",
      "Eliminar cálculo subgingival.",
      "Controlar la enfermedad periodontal.",
      "Mejorar la salud de las encías.",
    ],
    zona: "Encía y superficies radiculares",
    duracion: "90 min",
    sesiones: "Según evaluación",
    precio: 200,
    pasos: [
      "Evaluación periodontal.",
      "Identificación de zonas afectadas.",
      "Remoción del cálculo subgingival.",
      "Alisado de las superficies radiculares.",
      "Control periodontal.",
    ],
    tipoDiente: "encía",
  },

  {
    id: 6,
    nombre: "Extracción dental",
    categoria: "Cirugía",
    descripcion:
      "Retira una pieza dental cuando esta no puede conservarse mediante otros tratamientos.",
    queEs:
      "Es un procedimiento quirúrgico mediante el cual se retira una pieza dental de su alveolo cuando existe una indicación clínica para ello.",
    paraQueSirve: [
      "Retirar piezas dentales no conservables.",
      "Controlar infecciones determinadas.",
      "Resolver algunas complicaciones dentales.",
      "Facilitar tratamientos posteriores.",
    ],
    zona: "Pieza dental y tejido circundante",
    duracion: "45 min",
    sesiones: "1 sesión",
    precio: 250,
    pasos: [
      "Evaluación clínica y radiográfica.",
      "Anestesia local.",
      "Preparación de la zona.",
      "Extracción de la pieza.",
      "Control de la zona intervenida.",
      "Indicaciones postoperatorias.",
    ],
    tipoDiente: "molar",
  },

  {
    id: 7,
    nombre: "Blanqueamiento dental",
    categoria: "Estética",
    descripcion:
      "Ayuda a mejorar el tono de los dientes y conseguir una sonrisa visualmente más luminosa.",
    queEs:
      "Es un procedimiento estético destinado a aclarar el color de los dientes mediante agentes blanqueadores aplicados bajo supervisión odontológica.",
    paraQueSirve: [
      "Mejorar el tono dental.",
      "Reducir determinadas manchas.",
      "Mejorar la apariencia de la sonrisa.",
      "Realzar la estética dental.",
    ],
    zona: "Superficie externa de los dientes",
    duracion: "90 min",
    sesiones: "1 - 2 sesiones",
    precio: 500,
    pasos: [
      "Evaluación del estado dental.",
      "Registro del tono inicial.",
      "Protección de tejidos blandos.",
      "Aplicación del agente blanqueador.",
      "Control del resultado.",
      "Indicaciones posteriores.",
    ],
    tipoDiente: "sonrisa",
  },

  {
    id: 8,
    nombre: "Carillas dentales",
    categoria: "Estética",
    descripcion:
      "Mejora la forma, color y apariencia de determinadas piezas mediante finas láminas estéticas.",
    queEs:
      "Son restauraciones delgadas que se colocan sobre la superficie visible de determinados dientes para mejorar características estéticas.",
    paraQueSirve: [
      "Mejorar la forma de los dientes.",
      "Modificar determinadas alteraciones de color.",
      "Mejorar proporciones estéticas.",
      "Armonizar la sonrisa.",
    ],
    zona: "Superficie vestibular de dientes anteriores",
    duracion: "90 min",
    sesiones: "2 - 3 sesiones",
    precio: 600,
    pasos: [
      "Evaluación estética.",
      "Planificación del caso.",
      "Preparación de la pieza cuando corresponda.",
      "Toma de registros.",
      "Prueba de las restauraciones.",
      "Cementación y ajuste final.",
    ],
    tipoDiente: "sonrisa",
  },

  {
    id: 9,
    nombre: "Brackets dentales",
    categoria: "Ortodoncia",
    descripcion:
      "Permiten corregir progresivamente la posición de los dientes y mejorar la mordida.",
    queEs:
      "Es un tratamiento ortodóntico que utiliza brackets y elementos auxiliares para aplicar fuerzas controladas sobre las piezas dentales.",
    paraQueSirve: [
      "Corregir la posición de los dientes.",
      "Mejorar determinadas alteraciones de mordida.",
      "Alinear progresivamente la dentición.",
      "Mejorar la función y estética dental.",
    ],
    zona: "Superficie de las piezas dentales",
    duracion: "45 min",
    sesiones: "Controles periódicos",
    precio: 450,
    pasos: [
      "Evaluación ortodóntica.",
      "Planificación del tratamiento.",
      "Colocación de brackets.",
      "Instalación del arco.",
      "Controles y ajustes periódicos.",
      "Seguimiento de la evolución.",
    ],
    tipoDiente: "brackets",
  },
];

const getCategoriaStyle = (categoria: string) => {
  switch (categoria) {
    case "Endodoncia":
      return {
        badge:
          "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/20",
        accent: "text-violet-600 dark:text-violet-300",
      };

    case "Preventivos":
      return {
        badge:
          "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20",
        accent: "text-emerald-600 dark:text-emerald-300",
      };

    case "Restauradores":
      return {
        badge:
          "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20",
        accent: "text-blue-600 dark:text-blue-300",
      };

    case "Periodoncia":
      return {
        badge:
          "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-500/10 dark:text-teal-300 dark:border-teal-500/20",
        accent: "text-teal-600 dark:text-teal-300",
      };

    case "Cirugía":
      return {
        badge:
          "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20",
        accent: "text-rose-600 dark:text-rose-300",
      };

    case "Estética":
      return {
        badge:
          "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-500/10 dark:text-pink-300 dark:border-pink-500/20",
        accent: "text-pink-600 dark:text-pink-300",
      };

    case "Ortodoncia":
      return {
        badge:
          "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20",
        accent: "text-amber-600 dark:text-amber-300",
      };

    default:
      return {
        badge:
          "bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-300 dark:border-cyan-500/20",
        accent: "text-cyan-600 dark:text-cyan-300",
      };
  }
};

const ToothIllustration = ({
  tipo,
  large = false,
}: {
  tipo: Tratamiento["tipoDiente"];
  large?: boolean;
}) => {
  const size = large ? "w-40 h-40" : "w-28 h-28";

  if (tipo === "sonrisa") {
    return (
      <div
        className={`${size} flex items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800`}
      >
        <svg
          viewBox="0 0 180 120"
          className="w-[85%] h-[85%]"
          fill="none"
        >
          <path
            d="M20 42C48 92 132 92 160 42"
            stroke="currentColor"
            strokeWidth="7"
            strokeLinecap="round"
            className="text-slate-300 dark:text-slate-600"
          />
          <path
            d="M32 42C38 68 52 78 64 78V43H32Z"
            fill="white"
            stroke="currentColor"
            strokeWidth="3"
            className="text-slate-300 dark:text-slate-500"
          />
          <path
            d="M64 43V78C76 80 88 80 90 80V43H64Z"
            fill="white"
            stroke="currentColor"
            strokeWidth="3"
            className="text-slate-300 dark:text-slate-500"
          />
          <path
            d="M90 43V80C102 80 114 78 116 77V43H90Z"
            fill="white"
            stroke="currentColor"
            strokeWidth="3"
            className="text-slate-300 dark:text-slate-500"
          />
          <path
            d="M116 43V77C130 73 140 62 146 43H116Z"
            fill="white"
            stroke="currentColor"
            strokeWidth="3"
            className="text-slate-300 dark:text-slate-500"
          />
        </svg>
      </div>
    );
  }

  if (tipo === "brackets") {
    return (
      <div
        className={`${size} flex items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800`}
      >
        <svg
          viewBox="0 0 180 180"
          className="w-[80%] h-[80%]"
          fill="none"
        >
          <path
            d="M55 32C39 45 34 68 40 98C45 122 57 145 70 151C79 155 86 144 90 132C94 144 101 155 110 151C123 145 135 122 140 98C146 68 141 45 125 32C106 17 74 17 55 32Z"
            fill="white"
            stroke="currentColor"
            strokeWidth="5"
            className="text-slate-300 dark:text-slate-500"
          />
          <path
            d="M43 82H137"
            stroke="currentColor"
            strokeWidth="6"
            className="text-cyan-500"
          />
          {[52, 72, 92, 112].map((x) => (
            <rect
              key={x}
              x={x}
              y="72"
              width="16"
              height="20"
              rx="3"
              fill="currentColor"
              className="text-blue-500"
            />
          ))}
        </svg>
      </div>
    );
  }

  if (tipo === "encía") {
    return (
      <div
        className={`${size} flex items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800`}
      >
        <svg
          viewBox="0 0 180 180"
          className="w-[80%] h-[80%]"
          fill="none"
        >
          <path
            d="M20 88C48 58 132 58 160 88V118C128 143 52 143 20 118V88Z"
            fill="#f9a8b8"
            opacity="0.85"
          />
          <path
            d="M44 75C42 55 52 39 66 40C80 41 86 57 84 78"
            fill="white"
            stroke="currentColor"
            strokeWidth="4"
            className="text-slate-300 dark:text-slate-500"
          />
          <path
            d="M96 78C94 57 100 41 114 40C128 39 138 55 136 75"
            fill="white"
            stroke="currentColor"
            strokeWidth="4"
            className="text-slate-300 dark:text-slate-500"
          />
          <path
            d="M30 102C70 116 110 116 150 102"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            className="text-rose-500"
          />
        </svg>
      </div>
    );
  }

  return (
    <div
      className={`${size} flex items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800`}
    >
      <svg
        viewBox="0 0 180 180"
        className="w-[80%] h-[80%]"
        fill="none"
      >
        <path
          d="M55 32C39 45 34 68 40 98C45 122 57 145 70 151C79 155 86 144 90 132C94 144 101 155 110 151C123 145 135 122 140 98C146 68 141 45 125 32C106 17 74 17 55 32Z"
          fill="white"
          stroke="currentColor"
          strokeWidth="5"
          className="text-slate-300 dark:text-slate-500"
        />

        {tipo === "molar" && (
          <>
            <path
              d="M57 53C67 47 78 47 90 54"
              stroke="currentColor"
              strokeWidth="5"
              strokeLinecap="round"
              className="text-cyan-500"
            />
            <path
              d="M123 53C113 47 102 47 90 54"
              stroke="currentColor"
              strokeWidth="5"
              strokeLinecap="round"
              className="text-cyan-500"
            />
            <path
              d="M90 54V125"
              stroke="currentColor"
              strokeWidth="4"
              strokeDasharray="7 7"
              className="text-violet-500"
            />
          </>
        )}

        {tipo === "diente" && (
          <path
            d="M90 46V125"
            stroke="currentColor"
            strokeWidth="4"
            strokeDasharray="7 7"
            className="text-cyan-500"
          />
        )}
      </svg>
    </div>
  );
};

export const TratamientosPanel = () => {
  const [categoriaSeleccionada, setCategoriaSeleccionada] =
    useState("Todos");

  const [buscarTratamiento, setBuscarTratamiento] = useState("");

  const [tratamientoSeleccionado, setTratamientoSeleccionado] =
    useState<Tratamiento | null>(null);

  const tratamientosFiltrados = useMemo(() => {
    const texto = buscarTratamiento.trim().toLowerCase();

    return tratamientos.filter((tratamiento) => {
      const coincideCategoria =
        categoriaSeleccionada === "Todos" ||
        tratamiento.categoria === categoriaSeleccionada;

      const coincideBusqueda =
        !texto ||
        tratamiento.nombre.toLowerCase().includes(texto) ||
        tratamiento.categoria.toLowerCase().includes(texto) ||
        tratamiento.descripcion.toLowerCase().includes(texto);

      return coincideCategoria && coincideBusqueda;
    });
  }, [categoriaSeleccionada, buscarTratamiento]);

  const totalTratamientos = tratamientos.length;

  const categoriasActivas = new Set(
    tratamientos.map((tratamiento) => tratamiento.categoria)
  ).size;

  const precioPromedio =
    tratamientos.reduce(
      (total, tratamiento) => total + tratamiento.precio,
      0
    ) / tratamientos.length;

  return (
    <div className="space-y-6 pb-10">
      {/* =====================================================
          ENCABEZADO
      ====================================================== */}

      <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-5">
        <div className="flex items-start gap-4">
          <div
            className="
              w-14
              h-14
              shrink-0
              rounded-2xl
              bg-cyan-50
              dark:bg-cyan-500/10
              border
              border-cyan-200
              dark:border-cyan-500/20
              flex
              items-center
              justify-center
            "
          >
            <span className="text-2xl">🦷</span>
          </div>

          <div>
            <h1
              className="
                text-3xl
                font-extrabold
                tracking-tight
                text-slate-900
                dark:text-white
              "
            >
              Guía de Tratamientos Odontológicos
            </h1>

            <p
              className="
                text-sm
                sm:text-base
                text-slate-500
                dark:text-slate-400
                mt-1.5
              "
            >
              Conoce los procedimientos, sus beneficios e indicaciones
              clínicas.
            </p>
          </div>
        </div>

        {/* BUSCADOR */}

        <div className="relative w-full xl:w-[340px]">
          <span
            className="
              absolute
              left-4
              top-1/2
              -translate-y-1/2
              text-slate-400
              dark:text-slate-500
            "
          >
            🔎
          </span>

          <input
            type="text"
            value={buscarTratamiento}
            onChange={(e) =>
              setBuscarTratamiento(e.target.value)
            }
            placeholder="Buscar tratamiento..."
            className="
              w-full
              h-12
              pl-11
              pr-4
              rounded-xl
              bg-white
              dark:bg-slate-900
              border
              border-slate-200
              dark:border-slate-800
              text-slate-900
              dark:text-white
              placeholder:text-slate-400
              dark:placeholder:text-slate-600
              outline-none
              transition
              focus:border-cyan-500
              focus:ring-4
              focus:ring-cyan-500/10
            "
          />
        </div>
      </div>

      {/* =====================================================
          CATEGORÍAS
      ====================================================== */}

      <div
        className="
          flex
          gap-2
          overflow-x-auto
          pb-1
          scrollbar-hide
        "
      >
        {categorias.map((categoria) => {
          const activa =
            categoriaSeleccionada === categoria;

          return (
            <button
              key={categoria}
              type="button"
              onClick={() =>
                setCategoriaSeleccionada(categoria)
              }
              className={`
                shrink-0
                px-4
                py-2.5
                rounded-xl
                text-sm
                font-semibold
                border
                transition
                ${
                  activa
                    ? "bg-cyan-600 border-cyan-600 text-white shadow-sm"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-cyan-300 dark:hover:border-cyan-500/30"
                }
              `}
            >
              {categoria}
            </button>
          );
        })}
      </div>

      {/* =====================================================
          RESUMEN
      ====================================================== */}

      <div
        className="
          grid
          grid-cols-1
          sm:grid-cols-2
          xl:grid-cols-3
          gap-4
        "
      >
        <div
          className="
            rounded-2xl
            border
            border-slate-200
            dark:border-slate-800
            bg-white
            dark:bg-slate-900
            p-5
            shadow-sm
            dark:shadow-none
          "
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
                Total de tratamientos
              </p>

              <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
                {totalTratamientos}
              </p>
            </div>

            <div className="w-11 h-11 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 flex items-center justify-center text-xl">
              🦷
            </div>
          </div>
        </div>

        <div
          className="
            rounded-2xl
            border
            border-slate-200
            dark:border-slate-800
            bg-white
            dark:bg-slate-900
            p-5
            shadow-sm
            dark:shadow-none
          "
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
                Categorías clínicas
              </p>

              <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
                {categoriasActivas}
              </p>
            </div>

            <div className="w-11 h-11 rounded-xl bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center text-xl">
              ▦
            </div>
          </div>
        </div>

        <div
          className="
            rounded-2xl
            border
            border-slate-200
            dark:border-slate-800
            bg-white
            dark:bg-slate-900
            p-5
            shadow-sm
            dark:shadow-none
            sm:col-span-2
            xl:col-span-1
          "
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
                Precio referencial promedio
              </p>

              <p className="text-3xl font-extrabold text-cyan-600 dark:text-cyan-400 mt-2">
                S/ {precioPromedio.toFixed(2)}
              </p>
            </div>

            <div className="w-11 h-11 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 flex items-center justify-center text-xl">
              S/
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          CABECERA DEL CATÁLOGO
      ====================================================== */}

      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Catálogo clínico
          </h2>

          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Procedimientos odontológicos disponibles para consulta.
          </p>
        </div>

        <span
          className="
            hidden
            sm:inline-flex
            items-center
            px-3
            py-1.5
            rounded-full
            bg-cyan-50
            dark:bg-cyan-500/10
            border
            border-cyan-200
            dark:border-cyan-500/20
            text-cyan-700
            dark:text-cyan-300
            text-xs
            font-bold
          "
        >
          {tratamientosFiltrados.length} resultados
        </span>
      </div>

      {/* =====================================================
          TARJETAS
      ====================================================== */}

      {tratamientosFiltrados.length > 0 ? (
        <div
          className="
            grid
            grid-cols-1
            lg:grid-cols-2
            2xl:grid-cols-3
            gap-5
          "
        >
          {tratamientosFiltrados.map((tratamiento) => {
            const style = getCategoriaStyle(
              tratamiento.categoria
            );

            return (
              <article
                key={tratamiento.id}
                className="
                  group
                  relative
                  overflow-hidden
                  rounded-2xl
                  border
                  border-slate-200
                  dark:border-slate-800
                  bg-white
                  dark:bg-slate-900
                  shadow-sm
                  dark:shadow-none
                  hover:border-cyan-300
                  dark:hover:border-cyan-500/30
                  hover:shadow-md
                  transition
                "
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <span
                        className={`
                          inline-flex
                          items-center
                          px-2.5
                          py-1
                          rounded-full
                          border
                          text-[10px]
                          uppercase
                          tracking-wider
                          font-extrabold
                          ${style.badge}
                        `}
                      >
                        {tratamiento.categoria}
                      </span>

                      <h3
                        className="
                          text-lg
                          font-bold
                          text-slate-900
                          dark:text-white
                          mt-3
                        "
                      >
                        {tratamiento.nombre}
                      </h3>

                      <p
                        className="
                          text-sm
                          leading-relaxed
                          text-slate-500
                          dark:text-slate-400
                          mt-2
                          line-clamp-3
                        "
                      >
                        {tratamiento.descripcion}
                      </p>
                    </div>

                    <ToothIllustration
                      tipo={tratamiento.tipoDiente}
                    />
                  </div>

                  {/* DATOS */}

                  <div
                    className="
                      grid
                      grid-cols-2
                      gap-3
                      mt-5
                      pt-4
                      border-t
                      border-slate-100
                      dark:border-slate-800
                    "
                  >
                    <div>
                      <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500">
                        Duración
                      </p>

                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-1">
                        {tratamiento.duracion}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500">
                        Precio referencial
                      </p>

                      <p
                        className={`
                          text-sm
                          font-bold
                          mt-1
                          ${style.accent}
                        `}
                      >
                        S/ {tratamiento.precio.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* BOTÓN */}

                  <button
                    type="button"
                    onClick={() =>
                      setTratamientoSeleccionado(
                        tratamiento
                      )
                    }
                    className="
                      w-full
                      mt-5
                      py-2.5
                      rounded-xl
                      bg-slate-50
                      dark:bg-slate-800
                      border
                      border-slate-200
                      dark:border-slate-700
                      text-sm
                      font-semibold
                      text-slate-700
                      dark:text-slate-200
                      hover:bg-cyan-600
                      hover:border-cyan-600
                      hover:text-white
                      transition
                    "
                  >
                    Ver información
                    <span className="ml-2">→</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div
          className="
            rounded-2xl
            border
            border-dashed
            border-slate-300
            dark:border-slate-700
            bg-white
            dark:bg-slate-900
            p-12
            text-center
          "
        >
          <div className="text-4xl mb-4">🔎</div>

          <h3 className="font-bold text-slate-900 dark:text-white">
            No encontramos tratamientos
          </h3>

          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Intenta cambiar la búsqueda o seleccionar otra categoría.
          </p>
        </div>
      )}

      {/* =====================================================
          DETALLE DEL TRATAMIENTO
      ====================================================== */}

      {tratamientoSeleccionado && (
        <div
          className="
            fixed
            inset-0
            z-50
            flex
            items-center
            justify-center
            p-4
            bg-slate-950/60
            backdrop-blur-sm
          "
          onClick={() =>
            setTratamientoSeleccionado(null)
          }
        >
          <div
            className="
              w-full
              max-w-5xl
              max-h-[90vh]
              overflow-y-auto
              rounded-3xl
              bg-white
              dark:bg-slate-900
              border
              border-slate-200
              dark:border-slate-800
              shadow-2xl
            "
            onClick={(e) => e.stopPropagation()}
          >
            {/* CABECERA */}

            <div
              className="
                relative
                overflow-hidden
                p-6
                sm:p-8
                border-b
                border-slate-200
                dark:border-slate-800
              "
            >
              <button
                type="button"
                onClick={() =>
                  setTratamientoSeleccionado(null)
                }
                className="
                  absolute
                  top-5
                  right-5
                  w-9
                  h-9
                  rounded-full
                  bg-slate-100
                  dark:bg-slate-800
                  text-slate-500
                  dark:text-slate-300
                  hover:bg-slate-200
                  dark:hover:bg-slate-700
                  transition
                "
              >
                ×
              </button>

              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="flex-1 min-w-0">
                  <span
                    className={`
                      inline-flex
                      items-center
                      px-3
                      py-1.5
                      rounded-full
                      border
                      text-xs
                      uppercase
                      tracking-wider
                      font-extrabold
                      ${getCategoriaStyle(
                        tratamientoSeleccionado.categoria
                      ).badge}
                    `}
                  >
                    {tratamientoSeleccionado.categoria}
                  </span>

                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-4 pr-8">
                    {tratamientoSeleccionado.nombre}
                  </h2>

                  <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed mt-3 max-w-2xl">
                    {tratamientoSeleccionado.descripcion}
                  </p>
                </div>

                <div className="self-center sm:self-auto">
                  <ToothIllustration
                    tipo={tratamientoSeleccionado.tipoDiente}
                    large
                  />
                </div>
              </div>

              {/* DATOS RÁPIDOS */}

              <div
                className="
                  grid
                  grid-cols-2
                  lg:grid-cols-3
                  gap-3
                  mt-7
                "
              >
                <div className="rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 p-4">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500">
                    Duración
                  </p>

                  <p className="text-sm font-bold text-slate-800 dark:text-white mt-1">
                    {tratamientoSeleccionado.duracion}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 p-4">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500">
                    Sesiones
                  </p>

                  <p className="text-sm font-bold text-slate-800 dark:text-white mt-1">
                    {tratamientoSeleccionado.sesiones}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 p-4 col-span-2 lg:col-span-1">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500">
                    Precio referencial
                  </p>

                  <p className="text-sm font-bold text-cyan-600 dark:text-cyan-400 mt-1">
                    S/{" "}
                    {tratamientoSeleccionado.precio.toFixed(
                      2
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* CONTENIDO */}

            <div className="p-6 sm:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* ¿QUÉ ES? */}

                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                      ℹ
                    </div>

                    <h3 className="font-bold text-slate-900 dark:text-white">
                      ¿Qué es?
                    </h3>
                  </div>

                  <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                    {tratamientoSeleccionado.queEs}
                  </p>
                </section>

                {/* ¿PARA QUÉ SIRVE? */}

                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                      ✓
                    </div>

                    <h3 className="font-bold text-slate-900 dark:text-white">
                      ¿Para qué sirve?
                    </h3>
                  </div>

                  <ul className="space-y-3">
                    {tratamientoSeleccionado.paraQueSirve.map(
                      (item, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300"
                        >
                          <span className="mt-1 w-5 h-5 shrink-0 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold">
                            ✓
                          </span>

                          <span>{item}</span>
                        </li>
                      )
                    )}
                  </ul>
                </section>

                {/* ZONA */}

                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center">
                      🦷
                    </div>

                    <h3 className="font-bold text-slate-900 dark:text-white">
                      ¿En qué parte se realiza?
                    </h3>
                  </div>

                  <div className="rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 p-5">
                    <div className="flex flex-col sm:flex-row items-center gap-5">
                      <ToothIllustration
                        tipo={tratamientoSeleccionado.tipoDiente}
                      />

                      <div>
                        <p className="text-xs uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500">
                          Área de aplicación
                        </p>

                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-2 leading-relaxed">
                          {tratamientoSeleccionado.zona}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* PROCEDIMIENTO */}

                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                      ≡
                    </div>

                    <h3 className="font-bold text-slate-900 dark:text-white">
                      Procedimiento
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {tratamientoSeleccionado.pasos.map(
                      (paso, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3"
                        >
                          <span className="w-7 h-7 shrink-0 rounded-full bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center text-xs font-bold">
                            {String(index + 1).padStart(
                              2,
                              "0"
                            )}
                          </span>

                          <p className="text-sm text-slate-600 dark:text-slate-300 pt-1">
                            {paso}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </section>
              </div>

              {/* CERRAR */}

              <div className="flex justify-end mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() =>
                    setTratamientoSeleccionado(null)
                  }
                  className="
                    w-full
                    sm:w-auto
                    px-6
                    py-3
                    rounded-xl
                    bg-cyan-600
                    hover:bg-cyan-500
                    text-white
                    font-semibold
                    transition
                    shadow-sm
                  "
                >
                  Cerrar información
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};