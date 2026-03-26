import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { apiUrl } from "../config/api";

interface UserData {
  _id: string;
  ID: string;
  Aadhaar: string;
  FirstName: string;
  LastName: string;
  MotherName: string;
  FatherName: string;
  Sex: string;
  Birthday: string;
  Age: number;
  DistrictId: number;
  Phone: string;
  VoterId: string;
  DefPassword: string;
  State: string;
  LinkedCredentials?: Array<{
    credentialType: string;
    credentialValue: string;
    details?: string;
    linkedAt?: string;
    actor?: string;
  }>;
  [key: string]:
    | string
    | number
    | Array<{
        credentialType: string;
        credentialValue: string;
        details?: string;
        linkedAt?: string;
        actor?: string;
      }>
    | undefined;
}

// Hex to RGB
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
};

const setFill = (doc: jsPDF, hex: string) => {
  const { r, g, b } = hexToRgb(hex);
  doc.setFillColor(r, g, b);
};

const setDraw = (doc: jsPDF, hex: string) => {
  const { r, g, b } = hexToRgb(hex);
  doc.setDrawColor(r, g, b);
};

const setTextColor = (doc: jsPDF, hex: string) => {
  const { r, g, b } = hexToRgb(hex);
  doc.setTextColor(r, g, b);
};

export const generateIdCardPDF = async (
  userData: UserData,
  baseUrl: string
): Promise<void> => {
  // Use A4 landscape so the second emergency QR + disclaimer fits cleanly.
  // A4 portrait: 210 x 297mm, landscape => 297 x 210mm
  const W = 297; // mm
  const H = 210; // mm
  const margin = 10;

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [W, H],
  });

  // ── BACKGROUND ──────────────────────────────────────────────────────────────
  setFill(doc, "#FFFFFF");
  doc.rect(0, 0, W, H, "F");

  // Light blue tint on right half
  setFill(doc, "#f0f4ff");
  doc.rect(W / 2, 0, W / 2, H, "F");

  // ── TRICOLOR TOP STRIPE ───────────────────────────────────────────────────
  const stripeH = 4;
  const stripeW = W / 3;
  setFill(doc, "#FF9933");
  doc.rect(0, 0, stripeW, stripeH, "F");
  setFill(doc, "#FFFFFF");
  doc.rect(stripeW, 0, stripeW, stripeH, "F");
  setFill(doc, "#138808");
  doc.rect(stripeW * 2, 0, stripeW, stripeH, "F");

  // ── NAVY LEFT HEADER BAND ─────────────────────────────────────────────────
  setFill(doc, "#000080");
  doc.rect(0, stripeH, W / 2, 36, "F");

  // ── GOVT LABEL ──────────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  setTextColor(doc, "#a8b4e0");
  doc.text("GOVERNMENT OF INDIA", margin, stripeH + 10);

  doc.setFontSize(10);
  setTextColor(doc, "#FFFFFF");
  doc.text("CredChain · Digital Identity", margin, stripeH + 18);

  doc.setFontSize(8);
  setTextColor(doc, "rgba(255,255,255,0.7)");
  // handle rgba manually:
  doc.setTextColor(180, 190, 220);
  doc.text("National Citizen Record Portal", margin, stripeH + 24);

  // ── AVATAR CIRCLE ─────────────────────────────────────────────────────────
  const avatarX = W / 2 - 26;
  const avatarY = stripeH + 8;
  const avatarR = 16;
  setFill(doc, "#1a1a8f");
  doc.circle(avatarX, avatarY + avatarR, avatarR, "F");
  // Initials
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  setTextColor(doc, "#FFFFFF");
  const initials =
    (userData.FirstName?.[0] ?? "") + (userData.LastName?.[0] ?? "");
  doc.text(
    initials,
    avatarX - doc.getTextWidth(initials) / 2,
    avatarY + avatarR + 5
  );

  // ── FULL NAME ────────────────────────────────────────────────────────────
  const nameY = stripeH + 46;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  setTextColor(doc, "#111827");
  const fullName = `${userData.FirstName} ${userData.LastName}`;
  doc.text(fullName, margin, nameY);

  // UVID badge
  doc.setFontSize(7);
  setFill(doc, "#dbeafe");
  setDraw(doc, "#dbeafe");
  const uvidbadgeW = 56;
  doc.roundedRect(margin, nameY + 3, uvidbadgeW, 6, 1.5, 1.5, "F");
  setTextColor(doc, "#000080");
  doc.setFont("helvetica", "bold");
  doc.text(`UVID: ${userData.ID}`, margin + 2, nameY + 7.5);

  // ── DIVIDER ──────────────────────────────────────────────────────────────
  setDraw(doc, "#e5e7eb");
  doc.setLineWidth(0.3);
  doc.line(margin, nameY + 12, W / 2 - margin, nameY + 12);

  // ── DATA FIELDS (LEFT COLUMN) ─────────────────────────────────────────────
  const drawField = (
    label: string,
    value: string,
    x: number,
    y: number,
    colW = 42
  ) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    setTextColor(doc, "#6b7280");
    doc.text(label.toUpperCase(), x, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    setTextColor(doc, "#111827");
    // Truncate if too long
    const maxChars = Math.floor(colW / 2.2);
    const displayVal =
      value.length > maxChars ? value.substring(0, maxChars) + "…" : value;
    doc.text(displayVal, x, y + 4.5);
    void colW; // satisfy type checker
  };

  const col1X = margin;
  const col2X = margin + 50;
  let fieldY = nameY + 17;
  const rowGap = 13;

  const genderLabel = (s: string) =>
    s === "M" ? "Male" : s === "F" ? "Female" : s;

  drawField("Father's Name", userData.FatherName || "—", col1X, fieldY);
  drawField("Mother's Name", userData.MotherName || "—", col2X, fieldY);
  fieldY += rowGap;
  drawField("Date of Birth", userData.Birthday || "—", col1X, fieldY);
  drawField("Gender", genderLabel(userData.Sex) || "—", col2X, fieldY);
  fieldY += rowGap;
  drawField("State / UT", userData.State || "—", col1X, fieldY);
  drawField("District Code", String(userData.DistrictId ?? "—"), col2X, fieldY);
  fieldY += rowGap;
  drawField("Phone", userData.Phone || "—", col1X, fieldY, 90);
  fieldY += rowGap;
  drawField("Aadhaar", userData.Aadhaar || "—", col1X, fieldY);
  drawField("Voter ID (EPIC)", userData.VoterId || "—", col2X, fieldY);

  // ── RIGHT PANEL ──────────────────────────────────────────────────────────
  const rightX = W / 2 + margin;
  const rightW = W / 2 - margin * 2;

  const wrapAndDrawText = (
    doc: jsPDF,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number
  ) => {
    const lines = doc.splitTextToSize(text, maxWidth);
    lines.forEach((line: string, idx: number) => {
      doc.text(line, x, y + idx * lineHeight);
    });
    // Return y-position (baseline) after the last rendered line.
    // This prevents over-estimating vertical spacing and overlapping subsequent content.
    return y + (lines.length - 1) * lineHeight;
  };

  // QR CODE
  const qrUrl = `${baseUrl}/citizen-card/${encodeURIComponent(userData.ID)}`;
  const qrDataUrl = await QRCode.toDataURL(qrUrl, {
    width: 200,
    margin: 1,
    color: { dark: "#000080", light: "#f0f4ff" },
    errorCorrectionLevel: "M",
  });

  // Emergency QR token generation (used only for the QR target URL)
  const emergencyRes = await fetch(
    apiUrl(`/emergency/generate/${encodeURIComponent(userData.ID)}`),
    { method: "POST" }
  );
  if (!emergencyRes.ok) {
    throw new Error("Failed to generate emergency access QR token");
  }
  const emergencyJson = (await emergencyRes.json()) as {
    token: string;
    emergencyUrl: string;
  };
  const emergencyQrFullUrl = `${baseUrl}${emergencyJson.emergencyUrl}`;
  const emergencyQrDataUrl = await QRCode.toDataURL(emergencyQrFullUrl, {
    width: 200,
    margin: 1,
    color: { dark: "#000080", light: "#f0f4ff" },
    errorCorrectionLevel: "M",
  });

  const qrSize = 40;
  const qrX = rightX + (rightW - qrSize) / 2;
  const qrY = stripeH + 6;

  // White bg for QR
  setFill(doc, "#FFFFFF");
  setDraw(doc, "#dbeafe");
  doc.setLineWidth(0.5);
  doc.roundedRect(qrX - 3, qrY - 3, qrSize + 6, qrSize + 6, 3, 3, "FD");
  doc.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);

  // QR label
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  setTextColor(doc, "#6b7280");
  const scanLabel = "Scan to view full record";
  const scanLabelY = qrY + qrSize + 4;
  doc.text(
    scanLabel,
    rightX + (rightW - doc.getTextWidth(scanLabel)) / 2,
    scanLabelY
  );

  // Emergency QR (below the existing QR)
  const qr2Y = scanLabelY + 7;
  doc.roundedRect(qrX - 3, qr2Y - 3, qrSize + 6, qrSize + 6, 3, 3, "FD");
  doc.addImage(
    emergencyQrDataUrl,
    "PNG",
    qrX,
    qr2Y,
    qrSize,
    qrSize
  );

  // Emergency QR label
  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.2);
  setTextColor(doc, "#111827");
  const emergencyLabel =
    "EMERGENCY ACCESS QR — Scan in medical or disaster emergency";
  // Slightly larger gap between QR square and label text.
  const emergencyLabelY = qr2Y + qrSize + 6;
  const emergencyLabelEndY = wrapAndDrawText(
    doc,
    emergencyLabel,
    rightX,
    emergencyLabelY,
    rightW,
    2.5
  );

  // Red warning disclaimer
  doc.setFont("helvetica", "normal");
  doc.setFontSize(4.0);
  setTextColor(doc, "#dc2626");
  const redDisclaimer =
    "This QR gives limited identity access. Every scan is logged and the citizen is notified.";
  const redTextStartY = emergencyLabelEndY + 1.0;
  const redDisclaimerEndY = wrapAndDrawText(
    doc,
    redDisclaimer,
    rightX,
    redTextStartY,
    rightW,
    2.0
  );

  // Expiry
  doc.setFont("helvetica", "normal");
  doc.setFontSize(4.0);
  setTextColor(doc, "#6b7280");
  const expiryY = redDisclaimerEndY + 1.2;
  doc.text(
    "Valid for 72 hours from generation",
    rightX + (rightW - doc.getTextWidth("Valid for 72 hours from generation")) / 2,
    expiryY
  );

  // Divider
  setDraw(doc, "#e5e7eb");
  doc.setLineWidth(0.3);
  const dividerY = expiryY + 2.0;
  doc.line(rightX, dividerY, rightX + rightW, dividerY);

  // Linked Credentials on right
  const credsLabelY = dividerY + 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  setTextColor(doc, "#000080");
  doc.text("LINKED CREDENTIALS", rightX, credsLabelY);

  if (!userData.LinkedCredentials || userData.LinkedCredentials.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    setTextColor(doc, "#9ca3af");
    doc.text("No credentials linked.", rightX, credsLabelY + 6);
  } else {
    let credY = credsLabelY + 5;
    // A4 has enough vertical space; show more linked credentials.
    userData.LinkedCredentials.slice(0, 4).forEach((cred) => {
      setFill(doc, "#eff6ff");
      setDraw(doc, "#dbeafe");
      doc.setLineWidth(0.3);
      doc.roundedRect(rightX, credY, rightW, 7, 1.5, 1.5, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(6);
      setTextColor(doc, "#000080");
      doc.text(cred.credentialType, rightX + 2, credY + 4.5);

      doc.setFont("helvetica", "normal");
      setTextColor(doc, "#374151");
      doc.setFontSize(6);
      const valX = rightX + 22;
      const val =
        cred.credentialValue.length > 22
          ? cred.credentialValue.substring(0, 22) + "…"
          : cred.credentialValue;
      doc.text(val, valX, credY + 4.5);

      credY += 9;
    });
  }

  // ── BOTTOM FOOTER ────────────────────────────────────────────────────────
  const footerY = H - 8;
  setFill(doc, "#f9fafb");
  setDraw(doc, "#e5e7eb");
  doc.setLineWidth(0.3);
  doc.rect(0, footerY - 4, W, 12, "F");
  doc.line(0, footerY - 4, W, footerY - 4);

  doc.setFont("helvetica", "italic");
  doc.setFontSize(6);
  setTextColor(doc, "#9ca3af");
  doc.text(
    "This is an official CredChain India digital identity card. Government of India · NIC/GOI · Verify at credchain.gov.in",
    margin,
    footerY + 2
  );
  doc.setFont("helvetica", "normal");
  doc.text(
    `Generated: ${new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })}`,
    W - margin - 50,
    footerY + 2
  );

  // ── TRICOLOR BOTTOM STRIPE ────────────────────────────────────────────────
  setFill(doc, "#FF9933");
  doc.rect(0, H - stripeH, stripeW, stripeH, "F");
  setFill(doc, "#FFFFFF");
  doc.rect(stripeW, H - stripeH, stripeW, stripeH, "F");
  setFill(doc, "#138808");
  doc.rect(stripeW * 2, H - stripeH, stripeW, stripeH, "F");

  // SAVE
  const fileName = `CredChain_ID_${userData.ID}_${userData.LastName}.pdf`;
  doc.save(fileName);
};
