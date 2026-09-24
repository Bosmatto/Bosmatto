import React from 'react';
import { Printer, CheckCircle, ShieldCheck, Download } from 'lucide-react';
import { EmpresaConfig, RegistroPonto } from '../types';
import { getLabelEvento } from '../services/rules';

interface Props {
  registro: RegistroPonto;
  empresa: EmpresaConfig;
  onPrint?: () => void;
  onClose?: () => void;
}

export const ThermalTicket: React.FC<Props> = ({ registro, empresa, onPrint, onClose }) => {
  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Contêiner do Comprovante Físico Térmico */}
      <div
        id="thermal-receipt"
        className="w-full max-w-[340px] bg-white p-5 rounded-lg border-2 border-dashed border-gray-300 shadow-md font-mono text-[11px] text-gray-900 leading-tight print:border-none print:shadow-none print:m-0 print:p-2 print:w-[80mm]"
      >
        {/* Cabeçalho da Empresa */}
        <div className="text-center pb-3 border-b border-gray-400 border-dashed">
          <p className="font-extrabold text-xs uppercase tracking-tight">{empresa.razaoSocial}</p>
          <p className="text-[10px] mt-0.5">CNPJ: {empresa.cnpj}</p>
          <p className="text-[10px] text-gray-600">{empresa.endereco}</p>
          <p className="text-[10px] text-gray-600">{empresa.cidade} - {empresa.uf}</p>
          <div className="mt-2 py-0.5 px-2 bg-gray-100 rounded inline-block text-[9px] font-bold text-gray-800">
            COMPROVANTE DE REGISTRO DE PONTO DO TRABALHADOR
          </div>
          <p className="text-[9px] text-gray-500 mt-1">Conforme Portaria MTE nº 671/2021</p>
        </div>

        {/* Identificação do Terminal e NSR */}
        <div className="py-2 border-b border-gray-400 border-dashed space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-600">NSR (Reg. Sequencial):</span>
            <span className="font-bold text-xs">#{registro.nsr.toString().padStart(6, '0')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">REP-P Identificador:</span>
            <span>{empresa.localREP}</span>
          </div>
        </div>

        {/* Dados do Colaborador (RF-02) */}
        <div className="py-2 border-b border-gray-400 border-dashed space-y-1">
          <div>
            <span className="text-gray-600 block text-[10px]">Nome do Trabalhador:</span>
            <span className="font-bold text-xs uppercase">{registro.colaboradorNome}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">PIS:</span>
            <span className="font-semibold">{registro.colaboradorPis}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Cargo:</span>
            <span className="font-medium">{registro.colaboradorCargo}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Turno Contratual:</span>
            <span>{registro.turnoNome}</span>
          </div>
        </div>

        {/* Dados da Marcação (RF-02) */}
        <div className="py-3 border-b border-gray-400 border-dashed bg-gray-50/80 rounded my-1 px-2 space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-gray-700 font-bold uppercase">Evento:</span>
            <span className="font-extrabold text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-900 uppercase">
              {getLabelEvento(registro.tipoEvento)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-700 font-bold">Horário Registrado:</span>
            <span className="font-extrabold text-sm text-gray-900">{registro.horaIso}</span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-gray-600">Data Local:</span>
            <span className="font-medium">{registro.horarioLocal}</span>
          </div>
          <div className="flex justify-between text-[9px] text-gray-500">
            <span>Carimbo UTC (Audit):</span>
            <span className="truncate max-w-[170px]">{registro.timestampUtc}</span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-gray-600">Autenticação:</span>
            <span className="capitalize">{registro.metodoAutenticacao.replace('_', ' ')}</span>
          </div>
        </div>

        {/* Justificativa caso exista */}
        {registro.justificativa && (
          <div className="py-2 border-b border-gray-400 border-dashed text-[10px]">
            <span className="text-gray-600 font-bold block">Justificativa Registrada:</span>
            <p className="italic text-gray-700 mt-0.5">{registro.justificativa}</p>
          </div>
        )}

        {/* Carimbo de Auditoria e Hash de Integridade (RN-03) */}
        <div className="pt-2 text-center text-[8px] text-gray-500 space-y-1">
          <div className="flex items-center justify-center gap-1 font-semibold text-gray-700">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>DOCUMENTO ASSINADO DIGITALMENTE (SHA-256)</span>
          </div>
          <p className="font-mono break-all text-[8px] text-gray-600 bg-gray-50 p-1 rounded border border-gray-200">
            {registro.hashIntegridade}
          </p>
          <p className="text-[9px] pt-1">GUARDE ESTE COMPROVANTE</p>
          <div className="h-6 flex items-center justify-center tracking-widest text-xs font-bold text-gray-400 select-none">
            ||| | ||||| | || |||| | | |||
          </div>
        </div>
      </div>

      {/* Ações de Impressão (Ocultas no papel de impressão) */}
      <div className="mt-4 flex items-center gap-3 print:hidden">
        <button
          type="button"
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition active:scale-95 shadow-sm cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Imprimir Comprovante Físico (RF-02)</span>
        </button>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-gray-300 bg-white text-gray-700 text-xs font-semibold hover:bg-gray-50 transition cursor-pointer"
          >
            Fechar
          </button>
        )}
      </div>
    </div>
  );
};
