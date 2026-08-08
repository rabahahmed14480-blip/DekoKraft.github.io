import AdminShell from "../../../components/AdminShell";
import DesignPreview from "./DesignPreview";

export default async function Page({
  params,
}: {
  params: Promise<{ designId: string }>;
}) {
  const { designId } = await params;
  return (
    <AdminShell
      variant="clean"
      cleanContent={<DesignPreview designId={designId} />}
    />
  );
}
