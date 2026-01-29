
const LoadingSpinner = ({
  size = 'md',
  mode = 'inline',
  message = 'Loading...'
}) => {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const spinner = (
    <div className={`${sizeMap[size]} border-2 border-muted-foreground border-t-primary rounded-full animate-spin`} />
  );

  if (mode === 'fullscreen') {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background/50">
        {spinner}
        {message && <p className="mt-4 text-muted-foreground">{message}</p>}
      </div>
    );
  }

  if (mode === 'block') {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        {spinner}
        {message && <p className="mt-4 text-muted-foreground">{message}</p>}
      </div>
    );
  }

  return <div className="flex items-center gap-2">{spinner}</div>;
};

export default LoadingSpinner;
