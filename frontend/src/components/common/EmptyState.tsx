import type { ReactNode } from 'react';
import { FileX } from 'lucide-react';

interface Props {
  message?: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}

export default function EmptyState({ message = 'Nothing here yet', description, action, icon }: Props) {
  return (
    <div className="py-16 px-4 flex flex-col items-center text-center animate-fade-in">
      <div className="relative mb-4">
        <div className="size-16 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
          {icon ?? <FileX className="size-7" />}
        </div>
        <div className="absolute inset-[-6px] rounded-[22px] border border-dashed border-border" />
      </div>
      <p className="font-semibold text-[0.9375rem] text-foreground">{message}</p>
      {description && (
        <p className="text-sm text-muted-foreground mt-1 max-w-xs leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
