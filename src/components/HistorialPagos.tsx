interface Props {
  paciente: any;
}

const HistorialPagos: React.FC<Props> = ({ paciente }) => {
  return (
    <div className="text-white">
      Historial de pagos de {paciente.nombres}
    </div>
  );
};

export default HistorialPagos;