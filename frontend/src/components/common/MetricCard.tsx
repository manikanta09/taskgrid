import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import type { ReactNode } from 'react';

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  color: string;
  bg: string;
  subtitle?: string;
  loading?: boolean;
  trend?: { value: number; label?: string };
  onClick?: () => void;
}

export default function MetricCard({ title, value, icon, color, bg, subtitle, loading, trend, onClick }: MetricCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      className={cn(
        'relative bg-card border border-border rounded-xl overflow-hidden shadow-card',
        onClick && 'cursor-pointer'
      )}
      onClick={onClick}
    >
      {/* accent top bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl" style={{ background: color }} />

      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <span className="text-[0.6875rem] font-bold uppercase tracking-widest text-muted-foreground">
            {title}
          </span>
          <div
            className="size-9 rounded-lg flex items-center justify-center text-sm flex-shrink-0 [&_svg]:size-4.5"
            style={{ background: bg, color }}
          >
            {icon}
          </div>
        </div>

        {loading ? (
          <>
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-24" />
          </>
        ) : (
          <>
            <div className="text-[2rem] font-extrabold tracking-tight leading-none text-foreground tabular-nums">
              {value}
            </div>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {subtitle && (
                <span className="text-xs text-muted-foreground font-medium">{subtitle}</span>
              )}
              {trend && (
                <span className={cn(
                  'inline-flex items-center gap-0.5 text-[0.6875rem] font-bold px-1.5 py-0.5 rounded-full',
                  trend.value >= 0
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'
                )}>
                  {trend.value >= 0
                    ? <TrendingUp className="size-2.5" />
                    : <TrendingDown className="size-2.5" />}
                  {trend.value >= 0 ? '+' : ''}{trend.value}%
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
