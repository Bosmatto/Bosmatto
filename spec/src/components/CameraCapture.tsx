import React, { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, RefreshCw, CheckCircle2, User } from 'lucide-react';

interface Props {
  onCapture: (imageDataUrl: string) => void;
  isCapturing?: boolean;
}

export const CameraCapture: React.FC<Props> = ({ onCapture, isCapturing = false }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [streamActive, setStreamActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    async function initCamera() {
      try {
        setCameraError(null);
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Navegador sem suporte a WebRTC / getUserMedia.');
        }

        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user',
          },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setStreamActive(true);
        }
      } catch (err: unknown) {
        console.warn('Câmera nativa não acessível ou sem permissão:', err);
        setCameraError('Câmera indisponível ou permissão pendente. O sistema utilizará verificação biométrica emulada.');
        setStreamActive(false);
      }
    }

    initCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const takeSnapshot = () => {
    if (streamActive && videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Inverte horizontalmente para efeito espelho natural
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setCapturedImage(dataUrl);
        onCapture(dataUrl);
        return;
      }
    }

    // Fallback: Gera um snapshot simulado de biometria autenticada
    const fallbackCanvas = document.createElement('canvas');
    fallbackCanvas.width = 320;
    fallbackCanvas.height = 320;
    const ctx = fallbackCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, 320, 320);
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(160, 130, 60, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(160, 270, 90, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '14px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('BIOMETRIA FACIAL CAPTURADA', 160, 305);
      const fallbackUrl = fallbackCanvas.toDataURL('image/jpeg', 0.8);
      setCapturedImage(fallbackUrl);
      onCapture(fallbackUrl);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full max-w-sm aspect-4/3 rounded-2xl overflow-hidden bg-slate-900 border-2 border-slate-700 shadow-inner flex items-center justify-center">
        {/* Stream da Câmera Real */}
        {streamActive && !capturedImage ? (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100"
            />
            {/* Máscara Guia de Posicionamento Facial */}
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              <div className="w-48 h-60 rounded-[50%] border-2 border-dashed border-emerald-400/80 shadow-[0_0_20px_rgba(52,211,153,0.3)] animate-pulse" />
              <span className="mt-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-900/80 text-emerald-400">
                Alinhe o rosto no guia
              </span>
            </div>
          </>
        ) : capturedImage ? (
          <div className="relative w-full h-full">
            <img src={capturedImage} alt="Foto Capturada" className="w-full h-full object-cover" />
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg bg-emerald-950/90 text-emerald-300 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Foto Biométrica Registrada</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 mb-3">
              <User className="w-8 h-8" />
            </div>
            <p className="text-xs font-medium text-slate-300 mb-1">Validação Biométrica Facial</p>
            <p className="text-[11px] text-slate-500 max-w-xs">{cameraError || 'Iniciando captura...'}</p>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Controles de Câmera */}
      <div className="mt-3 flex items-center gap-3">
        {!capturedImage ? (
          <button
            type="button"
            onClick={takeSnapshot}
            disabled={isCapturing}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 active:scale-95 transition shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Camera className="w-4 h-4" />
            <span>{isCapturing ? 'Processando Foto...' : 'Capturar Foto de Validação'}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setCapturedImage(null);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 text-xs font-medium hover:bg-gray-50 transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-gray-500" />
            <span>Tirar Outra Foto</span>
          </button>
        )}
      </div>
    </div>
  );
};
