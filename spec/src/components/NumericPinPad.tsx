import React from 'react';
import { Delete, Check } from 'lucide-react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  maxLength?: number;
  disabled?: boolean;
}

export const NumericPinPad: React.FC<Props> = ({
  value,
  onChange,
  onSubmit,
  maxLength = 4,
  disabled = false,
}) => {
  const handleDigit = (digit: string) => {
    if (value.length < maxLength && !disabled) {
      onChange(value + digit);
    }
  };

  const handleBackspace = () => {
    if (value.length > 0 && !disabled) {
      onChange(value.slice(0, -1));
    }
  };

  const handleClear = () => {
    if (!disabled) {
      onChange('');
    }
  };

  const buttons = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <div className="w-full max-w-xs mx-auto flex flex-col items-center">
      {/* Indicador Visual dos Dígitos */}
      <div className="flex items-center justify-center gap-3 my-4">
        {Array.from({ length: maxLength }).map((_, i) => {
          const filled = i < value.length;
          return (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-all ${
                filled
                  ? 'bg-blue-600 border-blue-600 scale-110 shadow-xs'
                  : 'bg-gray-100 border-gray-300'
              }`}
            />
          );
        })}
      </div>

      {/* Grade Numérica 3x4 Estilo POS Tablet */}
      <div className="grid grid-cols-3 gap-2.5 w-full">
        {buttons.map((num) => (
          <button
            key={num}
            type="button"
            disabled={disabled}
            onClick={() => handleDigit(num)}
            className="h-14 rounded-xl bg-white border border-gray-200 text-gray-800 text-xl font-bold hover:bg-gray-50 active:bg-blue-50 active:border-blue-300 active:scale-95 transition flex items-center justify-center shadow-xs cursor-pointer disabled:opacity-50"
          >
            {num}
          </button>
        ))}

        {/* Linha Inferior: Limpar, Zero, Apagar */}
        <button
          type="button"
          disabled={disabled || value.length === 0}
          onClick={handleClear}
          className="h-14 rounded-xl bg-gray-100 border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-200 active:scale-95 transition flex items-center justify-center cursor-pointer disabled:opacity-30"
        >
          Limpar
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => handleDigit('0')}
          className="h-14 rounded-xl bg-white border border-gray-200 text-gray-800 text-xl font-bold hover:bg-gray-50 active:bg-blue-50 active:border-blue-300 active:scale-95 transition flex items-center justify-center shadow-xs cursor-pointer disabled:opacity-50"
        >
          0
        </button>

        <button
          type="button"
          disabled={disabled || value.length === 0}
          onClick={handleBackspace}
          className="h-14 rounded-xl bg-gray-100 border border-gray-200 text-gray-700 hover:bg-gray-200 active:scale-95 transition flex items-center justify-center cursor-pointer disabled:opacity-30"
          title="Apagar dígito"
        >
          <Delete className="w-5 h-5" />
        </button>
      </div>

      {/* Botão de Confirmação */}
      <button
        type="button"
        disabled={disabled || value.length < maxLength}
        onClick={onSubmit}
        className="mt-4 w-full h-12 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 active:scale-95 transition flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Check className="w-4 h-4" />
        <span>Confirmar PIN</span>
      </button>
    </div>
  );
};
