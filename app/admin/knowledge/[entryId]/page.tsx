import AdminShell from "../../components/AdminShell";
import KnowledgeEntryView from "./KnowledgeEntryView";
export default async function Page({params}:{params:Promise<{entryId:string}>}){const{entryId}=await params;return <AdminShell variant="clean" cleanContent={<KnowledgeEntryView entryId={entryId}/>}/>;}
