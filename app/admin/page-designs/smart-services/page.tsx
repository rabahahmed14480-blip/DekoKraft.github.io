import AdminShell from "../../components/AdminShell";
import SmartServicesDashboard from "./SmartServicesDashboard";

export default function Page(){
 return <AdminShell variant="clean" cleanContent={<SmartServicesDashboard/>}/>;
}
