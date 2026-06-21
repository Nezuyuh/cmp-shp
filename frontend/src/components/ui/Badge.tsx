type BadgeVariant = 'in-stock' | 'out-of-stock' | 'category' | 'warning' | 'error' | 'success';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  'in-stock': 'bg-green-500/20 text-green-400 border border-green-500/30',
  'out-of-stock': 'bg-red-500/20 text-red-400 border border-red-500/30',
  category: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  warning: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  error: 'bg-red-500/20 text-red-400 border border-red-500/30',
  success: 'bg-green-500/20 text-green-400 border border-green-500/30',
};

export default function Badge({ variant = 'category', children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
