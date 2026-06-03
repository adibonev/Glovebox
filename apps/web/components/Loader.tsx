"use client";

import { motion } from "framer-motion";

import { Wheel } from "./Wheel";

/**
 * The Glovebox loading state: the wordmark with its steering-wheel "o" spinning,
 * over a copper sweep. Shown by route-level loading.tsx during navigation / first load.
 */
export function Loader() {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink">
      <div className="flex flex-col items-center gap-6">
        <motion.div
          className="flex items-baseline font-display text-[40px] font-semibold leading-none tracking-tight"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="text-ivory">Glove</span>
          <span className="flex items-baseline text-copper">
            b
            <Wheel
              className="animate-[spin_1.4s_linear_infinite]"
              style={{ width: "0.82em", height: "0.82em", transform: "translateY(0.08em)", margin: "0 0.01em" }}
            />
            x
          </span>
        </motion.div>

        <div className="h-[3px] w-44 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full w-1/3 rounded-full bg-copper"
            animate={{ x: ["-110%", "360%"] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </div>
    </div>
  );
}
