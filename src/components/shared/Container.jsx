/**
 * Responsive container with consistent padding and max-width
 * Fixes bug #30: Consistent card spacing and layout
 *
 * Usage:
 *   <Container size="lg" padding="p-6">
 *     Content here
 *   </Container>
 */
const Container = ({
  children,
  size = "lg", // 'sm', 'md', 'lg', 'xl', 'full'
  padding = "p-4", // Tailwind padding class
  className = "",
}) => {
  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-3xl",
    xl: "max-w-5xl",
    full: "w-full",
  };

  return <div className={`${sizeClasses[size]} ${padding} mx-auto ${className}`}>{children}</div>;
};

export default Container;
