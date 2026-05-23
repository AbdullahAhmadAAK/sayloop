type Props = {
  src: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  ring?: boolean;
};

const sizes = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
  xl: 'h-24 w-24',
};

export default function Avatar({ src, alt, size = 'md', ring }: Props) {
  return (
    <img
      src={src}
      alt={alt}
      className={`${sizes[size]} rounded-full bg-white object-cover ${ring ? 'ring-4 ring-brand/30' : ''}`}
    />
  );
}
