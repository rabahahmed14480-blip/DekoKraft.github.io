import { defineSmartService } from "./factory.ts";
import type { SmartServiceContract } from "./types.ts";

const view = "smart_services.view" as const;
const ai = "smart_services.use_ai" as const;
export const smartServiceModules: SmartServiceContract[] = [
  defineSmartService({id:"notifications",ar:"الإشعارات الذكية",en:"Smart Notifications",descriptionAr:"مركز موحد للتحديثات والتوصيات والموافقات والنشر.",descriptionEn:"Unified updates, recommendations, approvals, snapshots, and publishing events.",actions:[{id:"read",label:"Read notifications",kind:"read",permission:view,autoPublishes:false}]}),
  defineSmartService({id:"updates",ar:"التحديثات",en:"Updates",descriptionAr:"تحديثات المنصة والتصاميم.",descriptionEn:"Platform and design updates."}),
  defineSmartService({id:"ai-status",ar:"حالة الذكاء الاصطناعي",en:"AI Service Status",descriptionAr:"صحة الخدمة والمزامنة والمهام.",descriptionEn:"Service health, synchronization, and tasks.",ai:true}),
  defineSmartService({id:"smart-product-form",ar:"نموذج المنتج الذكي",en:"Smart Product Form",descriptionAr:"اكتمال الحقول وتحسين SEO والصور والأسعار.",descriptionEn:"Field completeness, SEO, image, and pricing guidance.",actions:[{id:"analyze-product",label:"Analyze product draft",kind:"suggest",permission:view,autoPublishes:false}]}),
  defineSmartService({id:"page-interfaces",ar:"واجهات الصفحة",en:"Page Interfaces",descriptionAr:"واجهات مرتبطة بالتصاميم مع معاينة وموافقة.",descriptionEn:"Design-linked interfaces with preview and approval.",actions:[{id:"preview",label:"Preview",kind:"read",permission:view,autoPublishes:false},{id:"request-activation",label:"Request activation",kind:"request",permission:"smart_services.manage_interfaces",autoPublishes:false}]}),
  defineSmartService({id:"ai-companion",ar:"الرفيق الذكي",en:"AI Companion",descriptionAr:"شرح المنصة واقتراح التحسينات.",descriptionEn:"Platform explanations and improvement recommendations.",ai:true,actions:[{id:"ask",label:"Ask",kind:"suggest",permission:ai,autoPublishes:false}]}),
  defineSmartService({id:"marketing-assistant",ar:"مساعد التسويق",en:"Marketing Assistant",descriptionAr:"حملات وعرض منتجات وتوقيت ترويجي.",descriptionEn:"Campaign, presentation, photography, and timing advice.",ai:true}),
  defineSmartService({id:"content-assistant",ar:"مساعد المحتوى",en:"Content Assistant",descriptionAr:"مسودات قابلة للتحرير للعناوين والوصف والأسئلة.",descriptionEn:"Editable title, description, FAQ, and CTA drafts.",ai:true}),
  defineSmartService({id:"design-assistant",ar:"مساعد التصميم",en:"Design Assistant",descriptionAr:"إرشاد للتخطيط والخطوط والاستجابة والوصول.",descriptionEn:"Advisory layout, typography, responsive, RTL/LTR, and accessibility guidance.",ai:true}),
  defineSmartService({id:"analytics-assistant",ar:"مساعد التحليلات",en:"Analytics Assistant",descriptionAr:"شرح المؤشرات والفرص دون كشف البيانات الخاصة.",descriptionEn:"Metric explanations and opportunities without private data exposure.",ai:true,analytics:true}),
];
