import AdminShell from "../../components/AdminShell";
import DesignWorkspace from "./DesignWorkspace";

export default async function Page({ params }: { params: Promise<{ designId: string }> }) {
  const { designId } = await params;
  return <AdminShell variant="clean" cleanContent={<DesignWorkspace designId={designId} />} />;
}
