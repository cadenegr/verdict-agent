import type { ButtonHTMLAttributes } from "react";
import { buttonClasses, type ButtonVariant } from "./styles.ts";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

/** The one button of the app. Always at least the tap size; always has visible text. */
export function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return <button type={type} className={buttonClasses(variant, className)} {...props} />;
}
