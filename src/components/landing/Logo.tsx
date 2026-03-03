import { FileText } from "lucide-react";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const Logo = ({ className = "", size = "md" }: LogoProps) => {
  const sizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
  };
  const iconSizes = {
    sm: 18,
    md: 26,
    lg: 38,
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <FileText size={iconSizes[size]} className="text-primary" strokeWidth={1.5} />
      </div>
      <span className={`font-bold tracking-tight ${sizes[size]}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        <span className="text-foreground">pliego</span>
        <span className="text-accent">Smart</span>
      </span>
    </div>
  );
};

export default Logo;
