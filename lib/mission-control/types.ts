export type MissionTaskPriority="low"|"medium"|"high"|"critical";
export type MissionTaskStatus="open"|"in_progress"|"blocked"|"awaiting_approval"|"completed"|"cancelled";
export type MissionTask={id:string;title:string;description?:string;priority:MissionTaskPriority;owner:string;status:MissionTaskStatus;relatedDesignId?:string;relatedParticipantId?:string;dueDate?:string;createdAt:string;updatedAt:string;createdBy:string};
export type CriticalCommandRequest={id:string;commandType:string;scope:string;impact:string;snapshotId:string;approvalId:string;confirmed:boolean;status:"awaiting_approval"|"approved"|"rejected"|"cancelled";createdAt:string;createdBy:string;executed:false};
export type MissionControlStore={version:1;tasks:MissionTask[];commands:CriticalCommandRequest[]};
