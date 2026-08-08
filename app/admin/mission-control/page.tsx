import AdminShell from "../components/AdminShell";
import MissionControlDashboard from "./MissionControlDashboard";
export default function Page(){return <AdminShell variant="clean" cleanContent={<MissionControlDashboard/>}/>;}
