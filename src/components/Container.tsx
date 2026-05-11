import { ReactNode } from "react";

type ContainerProps = {
  children: ReactNode;
  className?: string;
  size?: "narrow" | "default" | "wide";
};

export function Container({ children, className = "", size = "default" }: ContainerProps) {
  const sizes = {
    narrow: "max-w-3xl",
    default: "max-w-6xl",
    wide: "max-w-7xl",
  };
  return (
    <div className={`mx-auto w-full px-6 md:px-10 ${sizes[size]} ${className}`}>
      {children}
    </div>
  );
}
