"use client";

import { toast } from "sonner";

import { InteractiveHoverButton } from "@/components/block/interactive-hover-button";

export function ExportButton() {
  const handlePrint = () => {
    // Plan 5.2: confirm the action with a toast. window.print() blocks the
    // main thread for the whole dialog, so the PRINT call is deferred one
    // frame — the toast paints first and reads as "dialog is open" while the
    // modal is up — then is dismissed the instant print() returns, so nothing
    // stale lingers after the dialog closes. The toaster itself is hidden
    // from the printout via the @media print rule in globals.css.
    const id = toast.info("Opening print dialog…", {
      id: "export",
      duration: 8000,
    });
    setTimeout(() => {
      try {
        window.print();
      } finally {
        toast.dismiss(id);
      }
    }, 150);
  };

  return (
    <InteractiveHoverButton
      type="button"
      onClick={handlePrint}
      className="px-5 py-2.5 font-semibold print-hide"
    >
      Export / Print Advisory
    </InteractiveHoverButton>
  );
}
