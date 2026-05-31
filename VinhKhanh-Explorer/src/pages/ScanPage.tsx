import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import QrScanner from 'qr-scanner';
import { Camera, CameraOff, AlertCircle } from 'lucide-react';

import { api } from '../services/api';
import { useSettingsStore } from '../stores/settingsStore';
import { useGamificationStore } from '../stores/gamificationStore';
import type { POI } from '../types/poi';

export default function ScanPage() {
  const navigate = useNavigate();
  const language = useSettingsStore((state) => state.language);
  const checkInPoi = useGamificationStore((state) => state.checkInPoi);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(true);

  const handleScanSuccess = useCallback(async (result: string) => {
    // Stop scanning immediately to prevent duplicate requests
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
    }
    setIsScanning(false);

    // Extract code VKE-POI-XXX from result URL or plain text
    // Examples: https://vkexplorer.com/qr/VKE-POI-001 or VKE-POI-001
    const match = result.match(/VKE-POI-\d{3}/i);
    if (!match) {
      setErrorMsg(
        language === 'vi' 
          ? 'Mã QR không hợp lệ. Vui lòng quét mã VinhKhanh Explorer.' 
          : 'Invalid QR Code. Please scan a valid VinhKhanh Explorer sign.'
      );
      // Restart scanner after 3 seconds
      setTimeout(() => {
        setErrorMsg(null);
        if (qrScannerRef.current) {
          qrScannerRef.current.start();
        }
        setIsScanning(true);
      }, 3000);
      return;
    }

    const code = match[0].toUpperCase();

    try {
      // 1. Resolve QR Code to POI Dto
      const poi = await api.get<POI>(`/qr/${code}?lang=${language}`);
      
      // 2. Perform Gamification Check-in
      checkInPoi(poi.id, poi.category);
      
      // 3. Log Visit to Analytics with triggerType = "qr"
      await api.post('/analytics/visit', {
        poiId: poi.id,
        sessionId: 'anonymous-visitor',
        triggerType: 'qr',
        languageCode: language
      });

      // 4. Navigate to detailed page
      navigate(`/poi/${poi.id}`);
    } catch (err) {
      console.error('Failed to resolve QR Code:', err);
      setErrorMsg(
        language === 'vi' 
          ? 'Lỗi kết nối cơ sở dữ liệu hoặc mã QR không tồn tại.' 
          : 'Database connection failed or QR Code does not exist.'
      );
      
      setTimeout(() => {
        setErrorMsg(null);
        if (qrScannerRef.current) {
          qrScannerRef.current.start();
        }
        setIsScanning(true);
      }, 3000);
    }
  }, [language, navigate, checkInPoi]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Check camera permission
    QrScanner.hasCamera().then((hasCamera) => {
      setHasCameraPermission(hasCamera);
      if (!hasCamera) {
        setErrorMsg(
          language === 'vi'
            ? 'Không tìm thấy camera trên thiết bị.'
            : 'No camera found on this device.'
        );
        return;
      }

      // Initialize scanner
      const scanner = new QrScanner(
        video,
        (result: { data: string }) => handleScanSuccess(result.data),
        {
          onDecodeError: () => {
            // Silence decoding errors in console logs
          },
          highlightScanRegion: true,
          maxScansPerSecond: 5
        }
      );

      qrScannerRef.current = scanner;
      
      scanner.start().catch((err) => {
        console.error('Failed to start camera scanner:', err);
        setHasCameraPermission(false);
        setErrorMsg(
          language === 'vi'
            ? 'Không được cấp quyền truy cập Camera. Vui lòng kiểm tra quyền cài đặt.'
            : 'Camera permission denied. Please allow camera access in settings.'
        );
      });
    });

    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.destroy();
        qrScannerRef.current = null;
      }
    };
  }, [language, handleScanSuccess]);

  return (
    <div className="p-6 max-w-lg mx-auto text-white flex flex-col gap-6 items-center min-h-[calc(100vh-64px)] pb-24">
      {/* Header */}
      <div className="w-full text-left flex flex-col gap-1 border-b border-zinc-900 pb-3">
        <h1 className="text-3xl font-bold tracking-tight">
          {language === 'vi' ? 'Quét mã QR' : 'Scan QR Code'}
        </h1>
        <p className="text-xs text-zinc-400">
          {language === 'vi'
            ? 'Quét các bảng hiệu QR tại phố Vĩnh Khánh để thuyết minh tức thì.'
            : 'Scan QR codes on physical Vinh Khanh signs to trigger narratives instantly.'}
        </p>
      </div>

      {/* Camera Viewfinder */}
      <div className="relative w-full aspect-square max-w-[320px] rounded-3xl overflow-hidden border border-zinc-900 shadow-xl bg-zinc-900 flex flex-col items-center justify-center">
        {hasCameraPermission === false ? (
          <div className="flex flex-col items-center justify-center p-6 text-center text-zinc-500 gap-2.5">
            <CameraOff className="w-12 h-12 text-zinc-600" />
            <span className="text-xs font-semibold">
              {language === 'vi' ? 'Lỗi máy ảnh' : 'Camera Error'}
            </span>
          </div>
        ) : (
          <video
            ref={videoRef}
            className="w-full h-full object-cover bg-black"
          />
        )}

        {/* Viewfinder laser scanner line */}
        {isScanning && hasCameraPermission !== false && (
          <div className="absolute left-6 right-6 top-1/2 h-0.5 bg-emerald-500 shadow-[0_0_15px_#10b981] animate-bounce"></div>
        )}
      </div>

      {/* Floating Status / Error Display */}
      {errorMsg && (
        <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-red-950/20 border border-red-900/30 text-red-400 text-xs w-full max-w-[320px] animate-pulse">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="leading-normal">{errorMsg}</span>
        </div>
      )}

      {/* User Instructions */}
      {!errorMsg && (
        <div className="text-center max-w-sm mt-2 flex flex-col gap-2">
          <div className="flex items-center justify-center gap-2 text-emerald-400">
            <Camera className="w-4 h-4" />
            <span className="text-xs font-bold tracking-wide uppercase">
              {isScanning ? (language === 'vi' ? 'ĐANG QUÉT MÃ...' : 'READY TO SCAN...') : (language === 'vi' ? 'ĐANG XỬ LÝ...' : 'PROCESSING...')}
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 leading-relaxed">
            {language === 'vi'
              ? 'Đặt mã QR nằm chính giữa khung ngắm của máy ảnh. Hệ thống sẽ tự động quét và phân tích điểm tham quan.'
              : 'Position the QR code inside the viewfinder frame. The scanner will automatically detect and resolve the spot.'}
          </p>
        </div>
      )}
    </div>
  );
}
