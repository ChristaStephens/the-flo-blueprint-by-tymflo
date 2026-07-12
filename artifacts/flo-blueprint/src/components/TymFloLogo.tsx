import logoFull from "@assets/Tymflo-full-crlPng_-_Copy_1783461551039.png";
import logoHorizontal from "@assets/Tymflo-horizontal-crlPng_-_Copy_1783461553310.png";
import logoIcon from "@assets/Tymflo-icon-crlPng_-_Copy_1783461556592.png";

interface TymFloLogoProps {
  variant?: "full" | "horizontal" | "icon";
  className?: string;
  alt?: string;
}

export function TymFloLogo({ variant = "horizontal", className = "", alt = "TymFlo" }: TymFloLogoProps) {
  const src = variant === "full" ? logoFull : variant === "icon" ? logoIcon : logoHorizontal;
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      draggable={false}
      style={{ objectFit: "contain", alignSelf: "flex-start", flexShrink: 0 }}
    />
  );
}
