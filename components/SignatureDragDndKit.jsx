import React from "react";
import {
  DndContext,
  useDraggable,
  useSensor,
  useSensors,
  PointerSensor,
} from "@dnd-kit/core";

/*****************************
 * 1.  Presentation layer
 *****************************/
export function SignatureItem({ sig, containerRef}) {
  // Make the element draggable
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: sig.id });

  // During drag, dnd‑kit gives us a `transform` with live delta values.
  // We add those deltas to the stored x/y so the element follows the cursor.
  const rect =
    containerRef?.current?.getBoundingClientRect() ?? { width: 1, height: 1 };

   const container   = document.querySelector("[data-overlay-container]");
  
  const scrollTop   = container ? container.scrollTop : 0;

  const left = sig.xPct * rect.width + (transform?.x ?? 0);
  const top  = sig.yPct * rect.height + (transform?.y ?? 0);


  return (
     <img
      ref={setNodeRef}
      src={sig.dataURL}
      style={{
        position: "absolute",
        left,
        top,
        width: sig.width,
        height: sig.height,
        userSelect: "none",
        pointerEvents: "auto",
        cursor: "move"
      }}
      {...attributes}
      {...listeners}
    />
  );
}

/*****************************
 * 2.  Drag‑&‑drop context layer
 *****************************/
export function SignaturesLayer({ signatures, selectedId, onSigSelect, onSigUpdate, children, containerRef }) {
  // Pointer sensor is enough for mouse / touch; you can add Keyboard & etc. if needed
  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event) => {
    const { active, delta } = event;
    if (!active) return;
    
    const id = active.id
    const sig = signatures.find((s) => s.id === id);
     if (!sig || !containerRef?.current) return;

     const rect = containerRef.current.getBoundingClientRect();

    // New absolute coords = old + delta (relative movement this drag session)
      const newX = sig.xPct * rect.width + delta.x;
    const newY = sig.yPct * rect.height + delta.y;

    // Bubble up so the parent can persist to React state / backend
    onSigUpdate(sig.id, {
      xPct: newX / rect.width,
      yPct: newY / rect.height,
    });
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      {signatures.map((sig) => (
        <SignatureItem key={sig.id} sig={sig} containerRef={containerRef}
        onClick={() => onSigSelect(sig.id)}                 // ✅ select on click
    className={`
      cursor-move
      ${selectedId === sig.id ? "ring-2 ring-blue-500" : ""}
    `} 
        />
      ))}

      {/* If you render the PDF page in the same component tree, put it below so signature sits on top */}
      {children}
    </DndContext>
  );
}