/**
 * EmptyState Component
 *
 * Consistent empty state display across all pages.
 */

import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-5">
        <div className="text-slate-500">{icon}</div>
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-slate-400 text-sm text-center max-w-sm mb-6">
        {description}
      </p>
      {action && (
        <Button
          onClick={action.onClick}
          className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2"
        >
          {action.icon}
          {action.label}
        </Button>
      )}
    </div>
  );
}
