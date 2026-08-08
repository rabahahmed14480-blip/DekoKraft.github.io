import type {
  HTMLAttributes,
  ReactNode,
} from "react";
import "../../home-v2.css";

function joinClasses(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function HomepageLayout({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={joinClasses("homeV2Shell", className)}
      data-master-layout="home-v2"
      {...props}
    >
      {children}
    </div>
  );
}

export function HomepageMain({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLElement>) {
  return (
    <main className={joinClasses("homeV2Main", className)} {...props}>
      {children}
    </main>
  );
}

export function HomepageHeaderFrame({
  children,
  className,
  scrolled = false,
  ...props
}: HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  scrolled?: boolean;
}) {
  return (
    <header
      className={joinClasses("publicHeader", scrolled ? "scrolled" : undefined, className)}
      {...props}
    >
      <div className="publicHeaderMain publicContentContainer">{children}</div>
    </header>
  );
}
