/**
 * LogoutConfirmModal
 *
 * A reusable confirmation dialog shown before logging out.
 * Renders a centered modal with Cancel / Logout buttons.
 */

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";

interface LogoutConfirmModalProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function LogoutConfirmModal({ open, onConfirm, onCancel }: LogoutConfirmModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-sm bg-slate-800 dark:bg-slate-900 rounded-2xl border border-slate-700 dark:border-slate-700 p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="text-white font-bold text-lg mb-2">Logout?</h3>
            <p className="text-slate-400 text-sm mb-6">
              Are you sure you want to log out? Any unsaved progress will be lost.
            </p>
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-600 dark:border-slate-600 text-slate-300 font-semibold text-sm hover:bg-slate-700 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-colors shadow-lg shadow-red-600/20"
              >
                Logout
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
