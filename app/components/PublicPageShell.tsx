import type { ReactNode } from "react";
import DekoKraftPageShell from "./DekoKraftPageShell";
import HomeV2Footer from "./home-v2/HomeV2Footer";
import PublicSiteHeader from "./PublicSiteHeader";

export type PublicPageShellProps = {
  children: ReactNode;
  chrome?: ReactNode;
  showNotificationBar?: boolean;
  showHeader?: boolean;
  showFloatingToolbar?: boolean;
  showFooter?: boolean;
  className?: string;
};

export function DkPublicPageShell({
  children,
  chrome,
  showNotificationBar = true,
  showHeader = true,
  showFloatingToolbar = true,
  showFooter = false,
  className,
}: PublicPageShellProps) {
  return (
    <DekoKraftPageShell
      className={className}
      chrome={(
        chrome ?? (
          <PublicSiteHeader
            showNotificationBar={showNotificationBar}
            showHeader={showHeader}
            showFloatingToolbar={showFloatingToolbar}
          />
        )
      )}
      footer={showFooter ? <HomeV2Footer /> : undefined}
    >
      {children}
    </DekoKraftPageShell>
  );
}

export default DkPublicPageShell;
