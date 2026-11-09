import QRCode from 'qrcode';

/**
 * Generate a high-contrast QR code data URI
 * @param {object|string} payload
 * @returns {Promise<string>} Base64 Data URL
 */
export const generateQRCodeDataURL = async (payload) => {
  const content = typeof payload === 'object' ? JSON.stringify(payload) : String(payload);
  return await QRCode.toDataURL(content, {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    quality: 0.95,
    margin: 2,
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
    width: 320,
  });
};
