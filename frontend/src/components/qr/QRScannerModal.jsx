import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import {
  Camera,
  Keyboard,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ScanLine,
  RefreshCw,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { ticketService } from '../../services/ticketService';
import { toast } from '../../store/toastStore';

export const QRScannerModal = ({ isOpen, onClose, eventId, eventTitle, onSuccessfulScan }) => {
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' | 'manual'
  const [manualCode, setManualCode] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const scannerRef = useRef(null);

  useEffect(() => {
    let scanner = null;

    if (isOpen && activeTab === 'camera') {
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true,
      };

      try {
        scanner = new Html5QrcodeScanner('qr-reader-container', config, false);
        scanner.render(onScanSuccess, onScanError);
        scannerRef.current = scanner;
      } catch (err) {
        console.warn('Scanner init warning:', err);
      }
    }

    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
        } catch {
          // cleanup
        }
      }
    };
  }, [isOpen, activeTab]);

  const onScanSuccess = async (decodedText) => {
    // Prevent duplicate rapid-fire scans
    if (isVerifying) return;

    let ticketCode = decodedText;
    try {
      // Check if QR code is JSON encoded
      const parsed = JSON.parse(decodedText);
      if (parsed.ticketCode) {
        ticketCode = parsed.ticketCode;
      }
    } catch {
      // String format
    }

    await executeCheckIn(ticketCode);
  };

  const onScanError = (errorMessage) => {
    // Normal noise while searching for QR codes
  };

  const executeCheckIn = async (code) => {
    if (!code || isVerifying) return;

    try {
      setIsVerifying(true);
      const res = await ticketService.checkInTicket({
        ticketCode: code.trim(),
        eventId,
      });

      setScanResult({
        success: true,
        data: res.data,
      });
      toast.success('Check-in Approved!', `Welcome ${res.data?.attendee?.name || ''}`);
      if (onSuccessfulScan) onSuccessfulScan();
    } catch (err) {
      setScanResult({
        success: false,
        message: err.message || 'Verification failed',
        data: err.data?.data,
      });
      toast.error('Check-in Rejected', err.message || 'Ticket could not be verified');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualCode.trim()) {
      executeCheckIn(manualCode.trim());
    }
  };

  const resetResult = () => {
    setScanResult(null);
    setManualCode('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        resetResult();
        onClose();
      }}
      title={`Live Check-in Scanner`}
      maxWidth="max-w-lg"
    >
      <div className="space-y-4">
        <p className="text-xs text-slate-500 -mt-2">
          Target Event: <strong className="text-slate-800">{eventTitle}</strong>
        </p>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => {
              setActiveTab('camera');
              resetResult();
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'camera'
                ? 'bg-white text-brand-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Camera Scanner</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('manual');
              resetResult();
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'manual'
                ? 'bg-white text-brand-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Keyboard className="w-4 h-4" />
            <span>Manual Code Entry</span>
          </button>
        </div>

        {/* Scan Result Overlay Box */}
        {scanResult ? (
          <div
            className={`p-5 rounded-2xl border text-center transition-all ${
              scanResult.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            {scanResult.success ? (
              <>
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
                <h4 className="text-lg font-black">VALID TICKET – CHECKED IN</h4>
                <div className="mt-3 text-xs space-y-1 bg-white/80 p-3 rounded-xl border border-emerald-100">
                  <p><strong>Attendee:</strong> {scanResult.data?.attendee?.name}</p>
                  <p><strong>Tier:</strong> {scanResult.data?.attendee?.ticketType}</p>
                  <p><strong>Code:</strong> <code>{scanResult.data?.attendee?.ticketCode}</code></p>
                </div>
              </>
            ) : (
              <>
                <XCircle className="w-12 h-12 text-rose-600 mx-auto mb-2" />
                <h4 className="text-lg font-black">ENTRY REJECTED</h4>
                <p className="text-xs font-semibold mt-1">{scanResult.message}</p>
              </>
            )}

            <Button
              variant={scanResult.success ? 'primary' : 'outline'}
              size="sm"
              className="mt-4"
              icon={RefreshCw}
              onClick={resetResult}
            >
              Scan Next Ticket
            </Button>
          </div>
        ) : (
          <>
            {activeTab === 'camera' && (
              <div className="flex flex-col items-center">
                <div
                  id="qr-reader-container"
                  className="w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-900"
                />
                <p className="text-[11px] text-slate-400 mt-2 text-center">
                  Point camera at customer's printed or digital phone QR code.
                </p>
              </div>
            )}

            {activeTab === 'manual' && (
              <form onSubmit={handleManualSubmit} className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Enter Ticket Reference Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. EVT-ABCD-1234"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm uppercase font-mono tracking-wider border border-slate-300 rounded-xl focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
                    autoFocus
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    The 12-character alphanumeric code printed below the QR barcode.
                  </p>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  isLoading={isVerifying}
                  disabled={!manualCode.trim()}
                >
                  Verify Ticket Code
                </Button>
              </form>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};
