import Odontograma from "../components/Odontograma";

export default function PacienteDetalle() {

  const paciente = {
    nombre: "Paciente Demo",
    dni: "00000000"
  };

  return (
    <div className="p-6 space-y-6">

      {/* DATOS DEL PACIENTE */}
      <div className="bg-white p-4 rounded shadow">
        <h1 className="text-2xl font-bold">
          {paciente.nombre}
        </h1>
        <p className="text-gray-500">
          DNI: {paciente.dni}
        </p>
      </div>

      {/* ODONTOGRAMA */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-xl font-bold mb-4">
          Odontograma
        </h2>

        <Odontograma />
      </div>

    </div>
  );
}