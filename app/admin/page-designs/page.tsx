import AdminShell from "../components/AdminShell";
import PageDesignsModule from "./PageDesignsModule";

export default function PageDesignsPage() {
  return (
    <AdminShell
      variant="clean"
      cleanContent={<PageDesignsModule />}
    />
  );
}
