import { Info } from 'lucide-react';

const EmptyState = ({
  icon: Icon = Info,
  title,
  description,
  action,
  variant = 'default'
}) => {
  const baseClasses = 'flex flex-col items-center justify-center py-12 px-4';
  const iconSize = variant === 'minimal' ? 40 : 64;
  const titleSize = variant === 'minimal' ? 'text-lg' : 'text-xl';

  return (
    <div className={baseClasses}>
      {Icon && <Icon size={iconSize} className="text-muted-foreground mb-4" />}
      {title && <h3 className={`${titleSize} font-semibold text-foreground mb-2`}>{title}</h3>}
      {description && (
        <p className="text-sm text-muted-foreground mb-6 max-w-sm text-center">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

export default EmptyState;
