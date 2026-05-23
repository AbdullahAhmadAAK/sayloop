type LogoProps = {
  variant?: 'full' | 'icon';
  className?: string;
};

export default function Logo({ variant = 'full', className = '' }: LogoProps) {
  if (variant === 'icon') {
    return (
      <img
        src="/logo-icon.png"
        alt="SayLoop"
        className={`h-9 w-9 rounded-xl object-cover ${className}`}
      />
    );
  }

  return (
    <img
      src="/logo-wordmark.png"
      alt="SayLoop"
      className={`h-8 w-auto max-w-[140px] object-contain object-left ${className}`}
    />
  );
}
