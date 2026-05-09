// components/ui/Button.jsx

import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = {
  children?: ReactNode;
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const Button = ({ children, className = "" , ...props } : Props) => {
  return (
    <button
      {...props}
      className={`w-full bg-brand-orange hover:bg-brand-orange-dark text-white font-bold py-4 rounded-full transition-all shadow-md shadow-brand-orange/20 active:scale-[0.98] cursor-pointer ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;