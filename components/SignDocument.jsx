import React, { useEffect, useState, useRef } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import TypeSignaturePanel from "./TypeSignaturePanel";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import PacificoTtf from "../src/fonts/Pacifico-Regular.ttf?arraybuffer";
import DancingScriptTtf from "../src/fonts/DancingScript-VariableFont_wght.ttf?arraybuffer"
import SatisfyTtf from "../src/fonts/Satisfy-Regular.ttf?arraybuffer"; 
import GreatVibesTtf from "../src/fonts/GreatVibes-Regular.ttf?arraybuffer";
import { SignaturesLayer } from "./SignatureDragDndKit";



const SignDocument = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(location.state ?? null);

  const [showTypePanel, setShowTypePanel] = useState(false);
  const [signatures, setSignatures] = useState([]);       // [{x,y,text,fontFamily,page}]
  const [pendingSig, setPendingSig] = useState(null);
  const containerRef = useRef(null);  

   useEffect(() => {
    if (doc) return;

    (async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/docs/${id}`,
          { credentials: "include" }
        );
        const data = await res.json(); // { cloudinaryUrl, originalName, ... }
        setDoc(data);
      } catch (err) {
        console.error("Failed to fetch document", err);
      }
    })();
  }, [doc, id]);

  function renderSignatureToImage(text, fontFamily, fontSize = 28) {
  const measure = document.createElement("canvas").getContext("2d");
  measure.font = `${fontSize}px "${fontFamily}"`;
  const w = Math.ceil(measure.measureText(text).width);
  const h = Math.ceil(fontSize * 1.4);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.font = `${fontSize}px "${fontFamily}"`;
  ctx.fillStyle = "#000";
  ctx.textBaseline = "top";
  ctx.fillText(text, 0, 0);

  return { dataURL: canvas.toDataURL("image/png"), width: w, height: h, fontSize };
}
 
const pxToPt = (px) => px * 0.75;               // 1 CSS px  ≈ 0.75 pt

// caches fonts so we embed each one only once
// caches fonts so we embed each one only once
const embedFont = async (pdfDoc, family, cache) => {
  if (cache[family]) return cache[family];

  // Map font family → imported asset (Vite's ?url gives a URL string)
  let src;
  switch (family) {
    case "Pacifico":
      src = PacificoTtf;
      break;
    case "Dancing Script":
      src= DancingScriptTtf;
      break;
    case "Satisfy":
      src = SatisfyTtf;
      break;
    case "Great Vibes":
      src = GreatVibesTtf;
      break;
    default:
      src= null;
  }

  
    try {
      const bytes = typeof src === "string"
      ? await fetch(src).then(r => r.arrayBuffer())   // ?url build
      : src;   
      const font  = await pdfDoc.embedFont(bytes, { subset: true });
      cache[family] = font;
      return font;
    } catch (e) {
      console.warn(`Font ${family} failed (${e.message}) — fallback Helvetica`);
      return (cache[family] = await pdfDoc.embedFont(StandardFonts.Helvetica));
    }
  };





 const handleFinalizePDF = async () => {
    try {
      if (!containerRef.current) throw new Error("container missing");
      const rect = containerRef.current.getBoundingClientRect();
      const containerW = rect.width;
      const containerH = rect.height;

      // 1. fetch source PDF
      const existingPdfBytes = await fetch(doc.cloudinaryUrl).then((r) => r.arrayBuffer());
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      pdfDoc.registerFontkit(fontkit);
      const fontCache = {};

      // 2. iterate signatures
      for (const sig of signatures) {
        // const page = pdfDoc.getPages()[sig.page - 1];
        // const scale = page.getWidth() / containerW;
        // // convert on‑screen pixel coords → PDF point coords via ratio
        // const pdfX = sig.x * scale;
        // const pdfY = page.getHeight() - (sig.y + sig.fontSize * 0.8) * scale;
        // page.drawText(sig.text, {
        //   x: pdfX,
        //   y: pdfY,
        //   size: pxToPt(sig.fontSize),
        //   font: await embedFont(pdfDoc, sig.fontFamily, fontCache),
        //   color: rgb(0, 0, 0),
        // });
        const page = pdfDoc.getPages()[sig.page - 1];

  const pngBytes = await fetch(sig.dataURL).then((r) => r.arrayBuffer());
  const pngImage = await pdfDoc.embedPng(pngBytes);

  const pageWidth = page.getWidth();
  const pageHeight = page.getHeight();

  const scale = 72 / 96; // Convert px to pt (PDF uses 72dpi, browser ≈ 96dpi)
  const imageWidthPt = sig.width * scale;
  const imageHeightPt = sig.height * scale;

  const x = sig.xPct * pageWidth;
  const y = pageHeight - sig.yPct * pageHeight - imageHeightPt;

  page.drawImage(pngImage, {
    x,
    y,
    width: imageWidthPt,
    height: imageHeightPt,
  });
      }

      // 3. save & download
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${doc.originalName.replace(/\.pdf$/i, "")}-signed.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to finalize PDF:", err);
      alert("Error finalizing PDF — check console.");
    }
  };

  
  if (!doc) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading document…</p>
      </div>
    );
  }

  console.log(JSON.stringify(signatures, null, 2))

  return (
     <div className="flex h-screen overflow-hidden">
      {/* ======= PDF + overlay ======= */}
      <div
        ref={containerRef}
        data-overlay-container
        className={`flex-1 relative bg-gray-100 ${
          pendingSig ? "cursor-crosshair" : ""
        }`}
        onClick={(e) => {
    if (!pendingSig) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const { dataURL, width, height } = renderSignatureToImage(
    pendingSig.text,
    pendingSig.fontFamily,
    pendingSig.fontSize
  );

    setSignatures((prev) => [
      ...prev,
      {
       id: crypto.randomUUID(),
      page: 1,
      xPct: x / rect.width,
      yPct: y / rect.height,
      dataURL,
      width,
      height
      },
    ]);
    setPendingSig(null);
  }}
      >
               
        <iframe
          src={`${doc.cloudinaryUrl}#toolbar=0`}
          title={doc.originalName}
          className="w-full h-full absolute top-0 left-0 z-0"
          style={{ pointerEvents: pendingSig ? "none" : "auto" }}
        />
       {/* Overlay for draggable signatures */}
     
         <SignaturesLayer
          signatures={signatures}
          onSigUpdate={(id, pos) =>
            setSignatures((prev) => prev.map((s) => (s.id === id ? { ...s, ...pos } : s)))
          }
        />
  
   
      </div>

      {/* ======= Sidebar ======= */}
      <aside className="w-80 shrink-0 border-l bg-white flex flex-col">
        {/* header */}
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 text-sm text-cyan-700 hover:text-cyan-900"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <h1 className="text-sm font-semibold truncate">{doc.originalName}</h1>
        </div>

        {/* tools */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
              Signature tools
            </h2>

            {/* button list */}
            <div className="space-y-2">
              <button
                onClick={() => setShowTypePanel((p) => !p)}
                className="w-full rounded-lg border px-3 py-2 text-left text-sm hover:bg-gray-50"
              >
                Type Signature
              </button>

              <button className="w-full rounded-lg border px-3 py-2 text-left text-sm hover:bg-gray-50">
                Draw Signature
              </button>
              <button className="w-full rounded-lg border px-3 py-2 text-left text-sm hover:bg-gray-50">
                Upload Signature
              </button>
            </div>

            {/* collapsible panel */}
            {showTypePanel && (
              <div className="mt-4 border-t pt-4">
                  <TypeSignaturePanel
  onSelect={(sig) =>
    setPendingSig({
      ...sig,
      fontSize: 28,
      page: 1,
    })
  }
  onClose={() => setShowTypePanel(false)}
/>

              </div>
              
            )}

            <button
  onClick={handleFinalizePDF}
  className="w-full rounded-lg border px-3 py-2 text-left text-sm hover:bg-gray-50"
>
  Finalize PDF (with Signatures)
</button>
          </section>

          
          
        </div>
      </aside>
    </div>
  )
}

export default SignDocument
