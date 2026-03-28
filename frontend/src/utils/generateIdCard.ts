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
  emergencyContacts?: Array<{
    name: string;
    relationship: string;
    phone1: string;
    phone2: string;
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
    | Array<{
        name: string;
        relationship: string;
        phone1: string;
        phone2: string;
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
  baseUrl: string,
  emergencyQrUrl?: string // Added optional pre-generated URL
): Promise<void> => {
  const W = 297; // A4 Landscape width
  const H = 210; // A4 Landscape height
  const margin = 15;

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [W, H],
  });

  // --- COLORS ---
  const Navy = "#002366";
  const Saffron = "#FF9933";
  const White = "#FFFFFF";
  const Green = "#138808";
  const LightBlue = "#F0F7FF";
  const SlateGray = "#64748b";
  const RichBlack = "#0f172a";
  const MutedBlue = "#E2E8F0";

  // --- BACKGROUND ---
  setFill(doc, "#F8FAFC");
  doc.rect(0, 0, W, H, "F");

  // --- TOP HEADER BAND ---
  setFill(doc, Navy);
  doc.rect(0, 0, W, 45, "F");

  // --- TRICOLOR ACCENT (Thin top line) ---
  const stripeW = W / 3;
  setFill(doc, Saffron); doc.rect(0, 0, stripeW, 1.5, "F");
  setFill(doc, White); doc.rect(stripeW, 0, stripeW, 1.5, "F");
  setFill(doc, Green); doc.rect(stripeW * 2, 0, stripeW, 1.5, "F");

  // --- LOGO & GOVT TITLE ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  setTextColor(doc, "#94A3B8");
  doc.text("GOVERNMENT OF INDIA", margin, 12);

  doc.setFontSize(22);
  setTextColor(doc, White);
  doc.text("CredChain India", margin, 22);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  setTextColor(doc, "#CBD5E1");
  doc.text("Unified Digital Citizen Identity · Zero-Trust Infrastructure", margin, 28);

  // --- AVATAR & NAME SECTION ---
  const profileCardY = 32;
  const profileCardH = 40;
  const profileCardW = W - (margin * 2);
  
  setFill(doc, White);
  setDraw(doc, MutedBlue);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, profileCardY, profileCardW, profileCardH, 4, 4, "FD");

  // Avatar Circle
  const avatarR = 14;
  const avatarX = margin + 15;
  const avatarY = profileCardY + (profileCardH / 2);
  
  setFill(doc, "#E0E7FF");
  setDraw(doc, "#6366F1");
  doc.setLineWidth(1);
  doc.circle(avatarX, avatarY, avatarR, "FD");
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  setTextColor(doc, "#4338CA");
  const initials = (userData.FirstName?.[0] ?? "") + (userData.LastName?.[0] ?? "");
  doc.text(initials, avatarX - (doc.getTextWidth(initials) / 2), avatarY + 5);

  // Name & UVID
  doc.setFontSize(18);
  setTextColor(doc, RichBlack);
  const fullName = `${userData.FirstName} ${userData.LastName}`.toUpperCase();
  doc.text(fullName, avatarX + avatarR + 10, avatarY - 2);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  setTextColor(doc, SlateGray);
  doc.text("System UID (UVID):", avatarX + avatarR + 10, avatarY + 6);
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  setTextColor(doc, Navy);
  doc.text(userData.ID, avatarX + avatarR + 10, avatarY + 11);

  // Status Badge (Top Right of card)
  const badgeW = 30;
  const badgeH = 7;
  const badgeX = margin + profileCardW - badgeW - 10;
  const badgeY = profileCardY + (profileCardH / 2) - (badgeH / 2);
  setFill(doc, "#F0FDF4");
  setDraw(doc, "#86EFAC");
  doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 1.5, 1.5, "FD");
  doc.setFontSize(6);
  setTextColor(doc, "#166534");
  doc.text("VERIFIED CITIZEN", badgeX + (badgeW / 2) - (doc.getTextWidth("VERIFIED CITIZEN") / 2), badgeY + 4.5);

  // --- MAIN LAYOUT GRID ---
  const gridY = profileCardY + profileCardH + 10;
  const colW = (W - (margin * 3)) / 2;
  const colH = 95;

  // Function to draw a section card
  const drawSection = (title: string, x: number, y: number, w: number, h: number) => {
    setFill(doc, White);
    setDraw(doc, MutedBlue);
    doc.roundedRect(x, y, w, h, 3, 3, "FD");
    
    // Header Line
    setFill(doc, "#F8FAFC");
    doc.roundedRect(x + 0.5, y + 0.5, w - 1, 10, 2.5, 2.5, "F");
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    setTextColor(doc, Navy);
    doc.text(title.toUpperCase(), x + 5, y + 7);
  };

  // Section 1: Personal Information
  drawSection("Personal Details", margin, gridY, colW, colH);
  
  const drawDataRow = (label: string, value: string, x: number, y: number) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    setTextColor(doc, SlateGray);
    doc.text(label.toUpperCase(), x + 5, y);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    setTextColor(doc, RichBlack);
    doc.text(String(value || "—"), x + 5, y + 5);
  };

  let rowY = gridY + 18;
  const rowStep = 14;

  drawDataRow("Father's Name", userData.FatherName, margin, rowY);
  drawDataRow("Mother's Name", userData.MotherName, margin + (colW / 2), rowY);
  rowY += rowStep;

  drawDataRow("Date of Birth", userData.Birthday, margin, rowY);
  drawDataRow("Gender", userData.Sex === "M" ? "Male" : "Female", margin + (colW / 2), rowY);
  rowY += rowStep;

  drawDataRow("Phone Number", userData.Phone, margin, rowY);
  drawDataRow("State of Residence", userData.State, margin + (colW / 2), rowY);
  rowY += rowStep;

  // Sub-section divider
  doc.setLineWidth(0.1);
  setDraw(doc, "#E2E8F0");
  doc.line(margin + 5, rowY - 5, margin + colW - 5, rowY - 5);

  drawDataRow("Aadhaar Number", userData.Aadhaar, margin, rowY);
  drawDataRow("Voter ID (EPIC)", userData.VoterId, margin + (colW / 2), rowY);
  rowY += rowStep;

  drawDataRow("District ID", String(userData.DistrictId), margin, rowY);
  rowY += rowStep;

  // Section 2: Security & Emergency
  drawSection("Security & Verification", margin + colW + margin, gridY, colW, colH);
  
  const rightColX = margin + colW + margin;

  // QR Codes
  const qrSize = 34;
  const qrTopY = gridY + 15;

  // Primary Verification QR
  const qrUrl = `${baseUrl}/citizen-card/${encodeURIComponent(userData.ID)}`;
  const qrDataUrl = await QRCode.toDataURL(qrUrl, {
    width: 200, margin: 1, color: { dark: Navy, light: White }
  });
  doc.addImage(qrDataUrl, "PNG", rightColX + 10, qrTopY, qrSize, qrSize);
  
  doc.setFontSize(6);
  setTextColor(doc, SlateGray);
  doc.text("PRIMARY VERIFICATION", rightColX + 10, qrTopY + qrSize + 4);
  doc.text("Full Citizen Record Link", rightColX + 10, qrTopY + qrSize + 7);

  // Emergency QR
  let finalEmergencyQrUrl = emergencyQrUrl;
  if (!finalEmergencyQrUrl) {
    try {
      const emergencyRes = await fetch(apiUrl(`/emergency/generate/${encodeURIComponent(userData.ID)}`), { method: "POST" });
      const emergencyJson = await emergencyRes.json();
      finalEmergencyQrUrl = `${baseUrl}${emergencyJson.emergencyUrl}`;
    } catch (err) {
      console.error("Failed to generate emergency QR during PDF creation:", err);
      // fallback if needed
      finalEmergencyQrUrl = `${baseUrl}/emergency/error`;
    }
  }

  const emergencyQrDataUrl = await QRCode.toDataURL(finalEmergencyQrUrl, {
    width: 200, margin: 1, color: { dark: "#991B1B", light: White }
  });
  
  const emQrX = rightColX + colW - qrSize - 10;
  doc.addImage(emergencyQrDataUrl, "PNG", emQrX, qrTopY, qrSize, qrSize);
  
  setTextColor(doc, "#991B1B");
  doc.setFont("helvetica", "bold");
  doc.text("EMERGENCY QR", emQrX, qrTopY + qrSize + 4);
  doc.setFont("helvetica", "normal");
  doc.text("Medical & SOS Access", emQrX, qrTopY + qrSize + 7);

  // Disclaimer rounded box
  const discY = qrTopY + qrSize + 12;
  setFill(doc, "#FFF7ED");
  setDraw(doc, "#FDE68A");
  doc.roundedRect(rightColX + 5, discY, colW - 10, 14, 2, 2, "FD");
  
  doc.setFontSize(5);
  setTextColor(doc, "#92400E");
  const disclaimer = "This document is an immutable blockchain-backed national identity record. Every emergency access scan is logged and requires officer authorization or immediate notification to the account owner.";
  doc.splitTextToSize(disclaimer, colW - 20).forEach((line: string, i: number) => {
    doc.text(line, rightColX + 10, discY + 5 + (i * 3));
  });

  // Linked Credentials (Small list)
  const credsY = discY + 20;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  setTextColor(doc, Navy);
  doc.text("REGISTERED DOCUMENTS", rightColX + 5, credsY);

  if (userData.LinkedCredentials && userData.LinkedCredentials.length > 0) {
    userData.LinkedCredentials.slice(0, 3).forEach((cred, i) => {
      const itemY = credsY + 5 + (i * 8);
      setFill(doc, LightBlue);
      doc.roundedRect(rightColX + 5, itemY, colW - 10, 6, 1, 1, "F");
      
      doc.setFontSize(6);
      setTextColor(doc, Navy);
      const credText = `${cred.credentialType}: ${cred.credentialValue}`;
      doc.text(credText, rightColX + 8, itemY + 4.2);
    });
  } else {
    setTextColor(doc, SlateGray);
    doc.setFontSize(6);
    doc.text("No secondary credentials linked.", rightColX + 5, credsY + 6);
  }

  // --- FOOTER ---
  const footerY = H - 15;
  
  // Seal placeholder (Circle)
  setFill(doc, "#E2E8F0");
  doc.circle(W - margin - 20, footerY, 12, "F");
  doc.setFontSize(4);
  setTextColor(doc, SlateGray);
  doc.text("OFFICIAL SEAL", W - margin - 26, footerY + 1);

  doc.setFont("helvetica", "italic");
  doc.setFontSize(7);
  setTextColor(doc, SlateGray);
  doc.text("This is an electronically generated record. Physical verification is possible via the secure QR link above.", margin, footerY + 2);
  
  doc.setFont("helvetica", "normal");
  doc.text(`Record Generated: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })} IST`, margin, footerY + 6);

  // --- BOTTOM TRICOLOR BAND ---
  const bStripeH = 2.5;
  setFill(doc, Saffron); doc.rect(0, H - bStripeH, stripeW, bStripeH, "F");
  setFill(doc, White); doc.rect(stripeW, H - bStripeH, stripeW, bStripeH, "F");
  setFill(doc, Green); doc.rect(stripeW * 2, H - bStripeH, stripeW, bStripeH, "F");

  // Save PDF
  const filename = `CredChain_Identity_${userData.ID}.pdf`;
  doc.save(filename);
};

