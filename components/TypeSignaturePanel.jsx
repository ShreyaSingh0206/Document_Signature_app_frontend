// import react, { useState } from "react";

// const previewFonts = [
//   "Lucida Handwriting",
//   "Pacifico",
//   "Dancing Script",
//   "Satisfy",
//   "Great Vibes",
// ];

// export default function TypeSignaturePanel({ onSelect, onClose }) {
//   const [text, setText] = useState("John Doe");
//   const [chosenFont, setChosenFont] = useState(previewFonts[0]);

//   return (
//     <div className="space-y-3">
//       <input
//         value={text}
//         onChange={(e) => setText(e.target.value)}
//         placeholder="Type your name"
//         className="w-full rounded border px-3 py-2"
//       />

//       <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
//         {previewFonts.map((font) => (
//           <button
//             key={font}
//             style={{ fontFamily: font }}
//             onClick={() => setChosenFont(font)}
//             className={`border px-2 py-1 rounded text-lg ${
//               chosenFont === font ? "border-cyan-600" : "border-transparent"
//             }`}
//           >
//             {text || "John Doe"}
//           </button>
//         ))}
//       </div>

//       <button
//         onClick={() => {
//           onSelect({ text: text || "John Doe", fontFamily: chosenFont });
//           onClose(); // collapse panel
//         }}
//         className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-2 rounded"
//       >
//         Place on PDF
//       </button>
//     </div>
//   );
// }
import React, { useState, useRef, useEffect } from "react";

const PREVIEW_FONTS = [
  "Lucida Handwriting",
  "Pacifico",
  "Dancing Script",
  "Satisfy",
  "Great Vibes",
];

const DEFAULT_FONT_SIZE = 28;

/**
 * Renders the given text into a canvas with the chosen font and returns:
 *  { dataURL, width, height, fontSize }
 */
function renderSignatureToImage(text, fontFamily, fontSize = DEFAULT_FONT_SIZE) {
  // First pass: measure text to size the canvas
  const measureCanvas = document.createElement("canvas");
  const measureCtx = measureCanvas.getContext("2d");
  measureCtx.font = `${fontSize}px "${fontFamily}"`;
  const width = Math.ceil(measureCtx.measureText(text).width);
  const height = Math.ceil(fontSize * 1.4); // add a bit of vertical padding

  // Second pass: draw text on correctly sized canvas
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.font = `${fontSize}px "${fontFamily}"`;
  ctx.fillStyle = "#000";
  ctx.textBaseline = "top";
  ctx.fillText(text, 0, 0);

  return {
    dataURL: canvas.toDataURL("image/png"),
    width,
    height,
    fontSize,
  };
}

export default function TypeSignaturePanel({ onSelect, onClose }) {
  const [text, setText] = useState("John Doe");
  const [chosenFont, setChosenFont] = useState(PREVIEW_FONTS[0]);

  // Live preview canvas (optional but nice UX)
  const previewRef = useRef(null);
  useEffect(() => {
    const canvas = previewRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const { width, height } = renderSignatureToImage(
      text || "John Doe",
      chosenFont,
      DEFAULT_FONT_SIZE
    );

    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);
    ctx.font = `${DEFAULT_FONT_SIZE}px "${chosenFont}"`;
    ctx.fillStyle = "#000";
    ctx.textBaseline = "top";
    ctx.fillText(text || "John Doe", 0, 0);
  }, [text, chosenFont]);

  return (
    <div className="space-y-4">
      {/* Typed name input */}
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type your name"
        className="w-full rounded border px-3 py-2"
      />

      {/* Font chooser grid */}
      <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
        {PREVIEW_FONTS.map((font) => (
          <button
            key={font}
            style={{ fontFamily: font }}
            onClick={() => setChosenFont(font)}
            className={`border px-2 py-1 rounded text-lg ${
              chosenFont === font ? "border-cyan-600" : "border-transparent"
            }`}
          >
            {text || "John Doe"}
          </button>
        ))}
      </div>

      {/* Live preview (optional) */}
      <div className="border rounded p-2 flex justify-center bg-gray-50">
        <canvas ref={previewRef} />
      </div>

      {/* Action button */}
      <button
        onClick={() => {
          const img = renderSignatureToImage(
            text || "John Doe",
            chosenFont,
            DEFAULT_FONT_SIZE
          );
          onSelect({
            ...img,
            // You can keep text/fontFamily if you still need them elsewhere
            text: text || "John Doe",
            fontFamily: chosenFont,
          });
          onClose();
        }}
        className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-2 rounded"
      >
        Place on PDF
      </button>
    </div>
  );
}
