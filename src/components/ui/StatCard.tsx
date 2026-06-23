type StatCardProps = {
  titulo: string;
  valor: string | number;
  icono?: string;
};

export default function StatCard({
  titulo,
  valor,
 icono,
}: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-5 border border-gray-100 hover:shadow-lg transition-all duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm font-medium">
            {titulo}
          </p>

          <h2 className="text-3xl font-bold text-gray-800 mt-2">
            {valor}
          </h2>
        </div>

        <div className="text-4xl">
          {icono}
        </div>
      </div>
    </div>
  );
}