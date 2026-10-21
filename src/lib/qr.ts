import QRCode from "qrcode";

/* A crisp QR code as SVG markup (prints sharply at any size). */
export async function qrSvg(text: string): Promise<string> {
  return QRCode.toString(text, { type: "svg", errorCorrectionLevel: "M", margin: 1, color: { dark: "#063E44", light: "#FFFFFF" } });
}
