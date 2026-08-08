import type { CurrentUserSession } from "../auth/sessionTypes.ts";
import type { KnowledgeScope } from "../knowledge/types.ts";

export type ConversationSender="user"|"companion"|"system";
export type ConversationMessageType="text"|"voice"|"command"|"explanation"|"notification";
export type ConversationProcessingState="received"|"resolving_context"|"retrieving_knowledge"|"generating"|"completed"|"failed";
export type ConversationMessage={id:string;sender:ConversationSender;timestamp:string;messageType:ConversationMessageType;text:string;metadata:Record<string,unknown>;processingState:ConversationProcessingState};
export type ConversationState="active"|"reading"|"paused"|"awaiting_input"|"ended"|"failed";
export type ConversationInputMode="text"|"voice";
export type ConversationOutputMode="text"|"speech"|"avatar"|"human";
export type ConversationTemporaryMemory={previousQuestions:string[];currentTopic?:string;lastExplanation?:string;pendingCommand?:DetectedCommand};
export type ConversationSession={
 sessionId:string;participantId?:string;pageId:string;pageType:"admin"|"participant"|"public";
 designId?:string;serviceId?:string;componentId?:string;locale:"ar"|"de"|"en"|"fr";
 startedAt:string;lastActivity:string;activeInput:ConversationInputMode;activeOutput:ConversationOutputMode;
 state:ConversationState;temporaryMemory:ConversationTemporaryMemory;messages:ConversationMessage[];
};
export type ConversationPageContext={pageId:string;pageType:ConversationSession["pageType"];designId?:string;serviceId?:string;componentId?:string;participantId?:string;locale:ConversationSession["locale"];readableContent?:ReadablePageInput};
export type ResolvedConversationContext={
 page:ConversationPageContext;currentDesign?:{id:string;name:string;status:string};
 currentService?:{id:string;status:string};currentComponent?:string;participantId?:string;
 permissions:string[];language:ConversationSession["locale"];direction:"rtl"|"ltr";
 knowledgeScope:KnowledgeScope;actor:CurrentUserSession;availableServices:string[];
};
export type DetectedCommandType="explain_page"|"read_page"|"stop_reading"|"continue_reading"|"help"|"open_settings"|"none";
export type DetectedCommand={type:DetectedCommandType;confidence:number;rawText:string;action?:{type:"navigate"|"reading_control";target:string}};
export type ReadablePageBlock={id:string;type:"heading"|"paragraph"|"list"|"link"|"code";text:string;level?:number;items?:string[];href?:string;language?:string};
export type ReadablePageInput={title:string;description?:string;blocks:ReadablePageBlock[]};
export type StructuredPageReading={title:string;summary:string;blocks:ReadablePageBlock[];wordCount:number;direction:"rtl"|"ltr"};
export type TextOutput={adapter:"text";format:"markdown";text:string;direction:"rtl"|"ltr";suggestions:string[];links:{label:string;href:string}[];supports:{markdown:true;links:true;lists:true;codeBlocks:true}};
