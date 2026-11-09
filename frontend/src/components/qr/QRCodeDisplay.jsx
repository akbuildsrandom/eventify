import React from 'react';
import { Copy, Check, Printer, Download } from 'lucide-react';
import { Button } from '../common/Button';
import { toast } from '../../store/toastStore';

export const QRCodeDisplay = ({ ticketCode, qrCodeUrl, onPrint }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(ticketCode);
    setCopied(true);
    toast.success('Copied!', `Ticket code ${ticketCode} copied to clipboard`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center p-6 bg-white rounded-2xl border border-slate-200/90 shadow-subtle text-center">
      {/* QR Image */}
      <div className="p-3 bg-white rounded-2xl border-2 border-slate-100 shadow-sm mb-4">
        <img
          src={qrCodeUrl}
          alt={`QR Code for ${ticketCode}`}
          className="w-48 h-48 object-contain rounded-lg"
        />
      </div>

      {/* Ticket Reference Code */}
      <div className="flex items-center gap-2 bg-slate-100 px-3.5 py-1.5 rounded-xl border border-slate-200 mb-4">
        <code className="text-xs font-mono font-bold text-slate-800 tracking-wider">
          {ticketCode}
        </code>
        <button
          onClick={handleCopy}
          className="text-slate-400 hover:text-brand-600 transition-colors p-1"
          title="Copy Code"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>

      <p className="text-[11px] text-slate-400 max-w-xs mb-5">
        Present this barcode at the venue entrance. Each pass can only be scanned once.
      </p>

      {/* Actions */}
      <div className="flex gap-2.5 w-full">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          icon={Printer}
          onClick={onPrint || (() => window.print())}
        >
          Print Pass
        </Button>
      </div>
    </div>
  );
};
