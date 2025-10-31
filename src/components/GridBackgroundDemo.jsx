import { cn } from "@/lib/utils";
import React from "react";

export function GridBackgroundDemo() {
  return (
    <div
      className="relative flex h-[50rem] w-full items-center justify-center bg-gray-50"
    >
      {/*
        The radial gradient is now slightly more intense (opacity 0.05)
        and has a softer, wider fade-out (transparent at 65%).
      */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-gray-50 to-gray-50 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.05)_0%,transparent_65%)]" />

      {/*
        The grid lines now use gray-300 (#d1d5db) for perfect, subtle contrast
        against the gray-50 background.
      */}
      <div
        className={cn(
          "absolute inset-0",
          "[background-size:58px_58px]",
          "[background-image:linear-gradient(to_right,#d1d5db_1px,transparent_1px),linear-gradient(to_bottom,#d1d5db_1px,transparent_1px)]"
        )}
      />

      {/* Fades out the edges of the grid */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center bg-gray-50 [mask-image:radial-gradient(ellipse_at_center,transparent_-78%,white)]"
      />

    
    </div>
  );
}