import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import { 
  Flashlight, 
  FlashlightOff, 
  ArrowLeft, 
  ShieldCheck, 
  AlertCircle
} from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

const ScannerPage: React.FC = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [status, setStatus] = useState<"starting" | "active" | "error" | "scanned">("starting");
  const [errorMessage, setErrorMessage] = useState("");

  const SCAN_REGION_ID = "reader-viewport";

  useEffect(() => {
    const html5QrCode = new Html5Qrcode(SCAN_REGION_ID);
    scannerRef.current = html5QrCode;

    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    html5QrCode.start(
      { facingMode: "environment" },
      config,
      (decodedText) => {
        // Success Logic
        handleSuccess(decodedText);
      },
      (_errorMessage) => {
        // Ignored for continuous scanning
      }
    ).then(() => {
      setStatus("active");
    }).catch((err) => {
      setStatus("error");
      setErrorMessage("Could not access camera. Please check permissions.");
      console.error(err);
    });

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const handleSuccess = (decodedText: string) => {
    // Check if it's a CredChain link
    const isCredChainLink = 
      decodedText.includes("/citizen-card/") || 
      decodedText.includes("/emergency/") ||
      decodedText.includes(window.location.origin);

    if (isCredChainLink) {
      setStatus("scanned");
      // Open in new tab
      window.open(decodedText, "_blank");
      
      // Reset after a delay to allow further scanning
      setTimeout(() => setStatus("active"), 3000);
    } else {
      // Logic for non-CredChain QR if needed
      console.log("Non-CredChain QR detected:", decodedText);
    }
  };

  const toggleFlash = async () => {
    if (!scannerRef.current) return;
    try {
      const state = !isFlashOn;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: state } as any],
      });
      setIsFlashOn(state);
    } catch (err) {
      console.error("Flash not supported", err);
    }
  };

  return (
    <div className={`min-h-screen pt-24 pb-16 px-6 flex flex-col items-center justify-center transition-colors duration-700
      ${isDarkMode ? "bg-[#0a0a0c] text-white" : "bg-[#f8f9fa] text-slate-900"}`}>
      
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none opacity-20 overflow-hidden">
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[150px]
          ${isDarkMode ? "bg-orange-500/10" : "bg-blue-500/10"}`} />
      </div>

      <div className="container max-w-2xl mx-auto relative z-10 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Header Section */}
        <div className="text-center mb-10 w-full">
          <button 
            onClick={() => navigate("/")}
            className={`mb-8 inline-flex items-center gap-2 text-sm font-semibold transition-colors
              ${isDarkMode ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900"}`}
          >
            <ArrowLeft size={16} /> Back to Home
          </button>
          
          <h1 className={`text-4xl md:text-5xl font-black tracking-tighter mb-4 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
            Verify Credential
          </h1>
          <p className={`max-w-md mx-auto text-lg font-light leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
            Align the CredChain QR code within the frame to instantly verify identity authenticity.
          </p>
        </div>

        {/* Scanner Container */}
        <div className="relative group">
          {/* Viewport Frame */}
          <div className={`relative w-[320px] h-[320px] md:w-[400px] md:h-[400px] rounded-[2.5rem] border overflow-hidden p-2 backdrop-blur-xl transition-all duration-500
            ${isDarkMode ? "bg-white/5 border-white/10 shadow-[0_0_50px_rgba(249,115,22,0.1)]" : "bg-white/40 border-slate-200 shadow-2xl"}`}>
            
            <div id={SCAN_REGION_ID} className="w-full h-full rounded-3xl overflow-hidden scale-110" />

            {/* Scanning Overlay UI */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Corner Brackets */}
              <div className="absolute top-8 left-8 w-12 h-12 border-t-4 border-l-4 border-orange-500 rounded-tl-xl animate-pulse" />
              <div className="absolute top-8 right-8 w-12 h-12 border-t-4 border-r-4 border-orange-500 rounded-tr-xl animate-pulse" />
              <div className="absolute bottom-8 left-8 w-12 h-12 border-b-4 border-l-4 border-blue-500 rounded-bl-xl animate-pulse delay-75" />
              <div className="absolute bottom-8 right-8 w-12 h-12 border-b-4 border-r-4 border-blue-500 rounded-br-xl animate-pulse delay-75" />

              {/* Laser Animation */}
              {status === "active" && (
                <div className="absolute top-0 left-10 right-10 h-0.5 bg-gradient-to-r from-transparent via-orange-500 to-transparent shadow-[0_0_15px_rgba(249,115,22,0.8)] animate-[scan_3s_ease-in-out_infinite]" />
              )}
              
              {/* Success Flash */}
              {status === "scanned" && (
                <div className="absolute inset-0 bg-emerald-500/20 animate-ping duration-300" />
              )}
            </div>

            {/* Error Overlay */}
            {status === "error" && (
              <div className="absolute inset-0 bg-red-950/80 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center text-white">
                <AlertCircle size={48} className="mb-4 text-red-500" />
                <p className="font-bold mb-2">Verification Failed</p>
                <p className="text-sm opacity-80">{errorMessage}</p>
              </div>
            )}
          </div>

          {/* Controls Floating Bar */}
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl py-3 px-6 shadow-2xl transition-transform hover:scale-105">
            <div className="flex items-center gap-3">
              <div className={`relative flex h-3 w-3`}>
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${status === "active" ? "bg-orange-500" : "bg-slate-500"}`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${status === "active" ? "bg-orange-600" : "bg-slate-600"}`}></span>
              </div>
              <span className="text-[10px] uppercase font-black tracking-widest text-white">
                {status === "active" ? "Vision Engine Active" : "Initializing..."}
              </span>
            </div>
            
            <div className="w-px h-6 bg-white/20 mx-2" />
            
            <button 
              onClick={toggleFlash}
              className={`p-2 rounded-xl transition-all ${isFlashOn ? "bg-orange-500 text-white" : "text-white hover:bg-white/10"}`}
            >
              {isFlashOn ? <FlashlightOff size={20} /> : <Flashlight size={20} />}
            </button>
          </div>
        </div>

        {/* Info Footer */}
        <div className="mt-20 text-center">
          <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-full border mb-6 
            ${isDarkMode ? "bg-white/5 border-white/10" : "bg-slate-100 border-slate-200"}`}>
            <ShieldCheck size={16} className="text-emerald-500" />
            <span className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
              Zero-Trust Local Processing
            </span>
          </div>
          <p className={`text-xs max-w-xs leading-relaxed opacity-50 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
            All verification occurs in your browser's secure sandboxed environment. No camera data is transmitted to the server.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes scan {
          0%, 100% { top: 20%; opacity: 0.1; }
          50% { top: 80%; opacity: 1; }
        }
        #reader-viewport video {
          object-fit: cover !important;
          width: 100% !important;
          height: 100% !important;
        }
      `}</style>
    </div>
  );
};

export default ScannerPage;
