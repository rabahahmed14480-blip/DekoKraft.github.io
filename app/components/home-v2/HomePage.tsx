import HomeSections from "./HomeSections";
import HomeV2Shell from "./HomeV2Shell";
import LatestProducts from "./LatestProducts";
import MarketplaceShowcase from "./MarketplaceShowcase";

export default function HomePage() {
  return (
    <HomeV2Shell>
      <HomeSections />
      <MarketplaceShowcase />
      <LatestProducts />
    </HomeV2Shell>
  );
}
