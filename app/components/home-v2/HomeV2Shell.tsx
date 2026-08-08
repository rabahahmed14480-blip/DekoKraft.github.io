import type { ReactNode } from "react";
import EchoMediaEngine from "../../echo/components/media/EchoMediaEngine";
import CreativityBar from "../../echo/components/welcome/CreativityBar";
import WelcomeCard from "../../echo/components/welcome/WelcomeCard";
import PublicPageShell from "../PublicPageShell";
import { HomepageLayout, HomepageMain } from "./HomepageArchitecture";

export default function HomeV2Shell({ children }: { children: ReactNode }) {
  return (
    <PublicPageShell className="echoMediaPageShell">
      <EchoMediaEngine slot="page-background" />
      <HomepageLayout>
        <HomepageMain>
          <WelcomeCard />
          <CreativityBar />
          {children}
        </HomepageMain>
      </HomepageLayout>
    </PublicPageShell>
  );
}
