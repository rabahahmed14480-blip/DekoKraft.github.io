import DkServicesCenter from "../../../components/platform/DkServicesCenter";
import AdminSellerStores from "../../../components/admin/AdminSellerStores";
import { DkBrainProgressCenter } from "../../../components/ui";
import AdminDashboardGrid from "../dashboard/AdminDashboardGrid";
import AICostCompactSummary from "../dashboard/AICostCompactSummary";
import { type Lang } from "../../config/translations";

type Props = {
  lang: Lang;
};

export default function DashboardPage({
  lang,
}: Props) {
  const dir = lang === "ar" ? "rtl" : "ltr";

  return (
    <>
      <AdminDashboardGrid />
      <AICostCompactSummary />
      <AdminSellerStores />
      <DkBrainProgressCenter compact />
      <DkServicesCenter locale={lang} direction={dir} variant="compact" />
    </>
  );
}
