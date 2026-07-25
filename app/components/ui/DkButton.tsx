import Link from "next/link";
import type { MouseEvent, MouseEventHandler, ReactNode } from "react";
import { classNames } from "./classNames";

export type DkButtonSize = "sm" | "md" | "lg";
export type DkButtonVariant = "glass" | "primary" | "subtle" | "transparent";
export type DkButtonIconPosition = "start" | "end";

export type DkButtonProps = {
  children?: ReactNode;
  icon?: ReactNode;
  iconOnly?: boolean;
  iconPosition?: DkButtonIconPosition;
  href?: string;
  onClick?: MouseEventHandler<HTMLElement>;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  active?: boolean;
  size?: DkButtonSize;
  variant?: DkButtonVariant;
  className?: string;
  "aria-label"?: string;
  "aria-controls"?: string;
  "aria-expanded"?: boolean;
  "aria-haspopup"?: "menu" | "listbox" | "tree" | "grid" | "dialog" | true | false;
  title?: string;
  dir?: "rtl" | "ltr" | "auto";
};

export default function DkButton({
  children,
  icon,
  iconOnly = false,
  iconPosition = "start",
  href,
  onClick,
  type = "button",
  disabled = false,
  active = false,
  size = "md",
  variant = "glass",
  className,
  "aria-label": ariaLabel,
  "aria-controls": ariaControls,
  "aria-expanded": ariaExpanded,
  "aria-haspopup": ariaHasPopup,
  title,
  dir,
}: DkButtonProps) {
  const classes = classNames(
    "dk-button",
    `dk-button--${size}`,
    `dk-button--${variant}`,
    active && "dk-button--active",
    disabled && "dk-button--disabled",
    className,
  );
  const content = iconOnly ? (
    <>{icon}</>
  ) : (
    <>
      {icon && iconPosition === "start" && (
        <span className="dk-button__icon" aria-hidden="true">{icon}</span>
      )}
      <span className="dk-button__label">{children}</span>
      {icon && iconPosition === "end" && (
        <span className="dk-button__icon" aria-hidden="true">{icon}</span>
      )}
    </>
  );

  if (href) {
    const handleLinkClick = (event: MouseEvent<HTMLAnchorElement>) => {
      if (disabled) {
        event.preventDefault();
        return;
      }
      onClick?.(event);
    };

    return (
      <Link
        href={href}
        className={classes}
        aria-label={ariaLabel}
        aria-controls={ariaControls}
        aria-expanded={ariaExpanded}
        aria-haspopup={ariaHasPopup}
        aria-current={active ? "page" : undefined}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : undefined}
        title={title}
        dir={dir}
        onClick={handleLinkClick}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      aria-label={ariaLabel}
      aria-controls={ariaControls}
      aria-expanded={ariaExpanded}
      aria-haspopup={ariaHasPopup}
      aria-pressed={active || undefined}
      disabled={disabled}
      title={title}
      dir={dir}
      onClick={onClick as MouseEventHandler<HTMLButtonElement> | undefined}
    >
      {content}
    </button>
  );
}
