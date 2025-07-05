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

import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";
// Option A
GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();


const SignDocument = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(location.state ?? null);

  const [showTypePanel, setShowTypePanel] = useState(false);
  const [signatures, setSignatures] = useState([]);       // [{x,y,text,fontFamily,page}]
  const [pendingSig, setPendingSig] = useState(null);
  const containerRef = useRef(null);  
  const [pageMeta, setPageMeta] = useState([]); 
  const [pdfHeight, setPdfHeight] = useState(null);

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

   useEffect(() => {
  if (!doc?.cloudinaryUrl) return;

  (async () => {
    try {
      const pdf = await getDocument(doc.cloudinaryUrl).promise;
      const meta = [];
      let total = 0;

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const vp   = page.getViewport({ scale: 1 });   // 1 pt → 1 px
      meta.push({ heightPx: vp.height, heightPt: page.getHeight() });
      total += vp.height;
      }

      setPageMeta(meta);
      setPdfHeight(total);              // px at scale 1
    } catch (e) {
      console.error("height calc failed", e);
      setPdfHeight(1800);               // graceful fallback
    }
  })();
}, [doc]);

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
        const page = pdfDoc.getPages()[sig.page - 1];

  const pngBytes = await fetch(sig.dataURL).then((r) => r.arrayBuffer());
  const pngImage = await pdfDoc.embedPng(pngBytes);

  const pageWpt = page.getWidth();
  const pageHpt = page.getHeight();

  const ptPerPx = 72 / 96; // Convert px to pt (PDF uses 72dpi, browser ≈ 96dpi)
  const imgWpt = sig.width * ptPerPx;
  const imgHpt = sig.height * ptPerPx;

  const x = sig.xPct * pageWpt;
  const y = pageHpt - sig.yPct * containerRef.current.scrollHeight * (pageHpt/ containerRef.current.scrollHeight) - imgHpt;

  page.drawImage(pngImage, {
    x,
    y,
    width: imgWpt,
    height: imgHpt,
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

  const handleDeleteLastSignature = () => {
  setSignatures(prev => prev.slice(0, -1));   // drop the last one
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
        className={`flex-1 overflow-auto relative bg-gray-100 ${
          pendingSig ? "cursor-crosshair" : ""
        }`}
     onClick={(e) => {
  if (!pendingSig) return;

  const container = containerRef.current;
  const rect = container.getBoundingClientRect();

  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top + container.scrollTop;

  const { dataURL, width, height } = renderSignatureToImage(
    pendingSig.text,
    pendingSig.fontFamily,
    pendingSig.fontSize
  );

  const containerHeight = container.scrollHeight; // total height of iframe+overlay
  const xPct = x / rect.width;
  const yPct = y / containerHeight;

  setSignatures((prev) => [
    ...prev,
    {
      id: crypto.randomUUID(),
      page: 1, // still hardcoded if using iframe (we'll use yPct in final output)
      xPct,
      yPct,
      dataURL,
      width,
      height,
    },
    ]);
    setPendingSig(null);
  }}
      >
               
        <iframe
          src={`${doc.cloudinaryUrl}#toolbar=0`}
          title={doc.originalName}
          className="w-full block "
          style={{ 
            height: pdfHeight ?? 1800,
            pointerEvents: pendingSig ? "none" : "auto", }}
        />
       {/* Overlay for draggable signatures */}
     
         <SignaturesLayer
          signatures={signatures}
          containerRef={containerRef}
          onSigUpdate={(id, pos) =>
            setSignatures((prev) => prev.map((s) => (s.id === id ? { ...s, ...pos } : s)))
          }
        />
  
   
      </div>

      {/* ======= Sidebar ======= */}
      <aside className="w-80 shrink-0 border-l bg-purple-50 flex flex-col">
        {/* header */}
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 text-sm text-purple-700 hover:text-purple-900"
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
                className="w-full rounded-lg border px-3 py-2 mb-3 text-center font-bold text-sm hover:bg-gray-50"
              >
                Type Signature
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
  className="w-full rounded-lg border-white  bg-green-200 px-3 py-2 text-center text-green-800  font-bold text-sm hover:bg-green-100"
>
  Download (with Signature)
</button>

          <button
  onClick={handleDeleteLastSignature}
  disabled={!signatures.length}
  className="w-full rounded-lg border px-3 py-2 mt-3.5 text-center font-bold text-sm
             text-red-700 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed">
  Delete Last Signature
</button>
          </section>

          
          
        </div>
      </aside>
    </div>
  )
}

export default SignDocument