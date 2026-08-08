"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { AlertTriangle, Boxes, Camera, CheckCircle2, PackageOpen, RotateCcw, XCircle } from "lucide-react";
import { DkButton, DkGlassPanel } from "../../components/ui";
import { routes } from "../../config/routes";
import { loadStoredSellerProducts, updateSellerProduct } from "../../seller/lib/sellerProductStorage";
import { sellerOwnsProduct } from "../../seller/lib/sellerAccess";
import { analyzeProductImage } from "../../admin/lib/dekobrain/productAnalyzer";
import { loadProductMemoryByProductId } from "../../studio/components/ProductMemoryStore";
import {
  INVENTORY_CHANGE_EVENT,
  PRODUCT_MATCH_SUGGESTION_THRESHOLD,
  chooseInspectionProduct,
  confirmProductInspection,
  getParticipantInventory,
  matchConfirmedProductDNA,
  rejectProductInspection,
  saveProductInspection,
} from "../../../lib/inventory/inventoryStore";
import type { ConfirmedProductCandidate, ParticipantInventorySnapshot, ProductInspection } from "../../../lib/inventory/types";

type Tab = "finished" | "materials" | "movements" | "inspection" | "alerts";

const tabs: Array<{ id: Tab; label: string }> = [
  { id: "finished", label: "المنتجات الجاهزة" },
  { id: "materials", label: "المواد الخام" },
  { id: "movements", label: "حركات المخزون" },
  { id: "inspection", label: "فحص منتج بالكاميرا" },
  { id: "alerts", label: "التنبيهات" },
];

const categoryId = (category: string) => category === "candle" || category === "flower" ? "candles" : category;
const formatDate = (value: string) => new Intl.DateTimeFormat("ar", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

export default function ParticipantInventory({ participantId }: { participantId: string }) {
  const [activeTab, setActiveTab] = useState<Tab>("finished");
  const [snapshot, setSnapshot] = useState<ParticipantInventorySnapshot>(() => getParticipantInventory(participantId));
  const [products, setProducts] = useState(() => loadStoredSellerProducts().filter((product) => sellerOwnsProduct(participantId, product)));
  const [preview, setPreview] = useState<string | null>(null);
  const [inspection, setInspection] = useState<ProductInspection | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const refresh = (id = participantId) => {
    setSnapshot(getParticipantInventory(id));
    setProducts(loadStoredSellerProducts().filter((product) => sellerOwnsProduct(id, product)));
  };

  useEffect(() => {
    refresh(participantId);
    const handleChange = () => refresh(participantId);
    window.addEventListener(INVENTORY_CHANGE_EVENT, handleChange);
    window.addEventListener("seller-products-change", handleChange);
    return () => {
      window.removeEventListener(INVENTORY_CHANGE_EVENT, handleChange);
      window.removeEventListener("seller-products-change", handleChange);
    };
  // The canonical participant identity comes from the authenticated server layout.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participantId]);

  const candidates = useMemo<ConfirmedProductCandidate[]>(() => products.flatMap((product) => {
    const memory = loadProductMemoryByProductId(product.id);
    if (!memory || memory.productDNA.confirmed !== true) return [];
    return [{ productId: product.id, participantId, title: product.title, currentStock: product.stock, productDNA: memory.productDNA }];
  }), [participantId, products]);

  const selectedCandidate = candidates.find((candidate) => candidate.productId === (inspection?.matchedProductId ?? selectedProductId)) ?? null;
  const selectedProduct = products.find((product) => product.id === selectedCandidate?.productId);
  const currentStock = snapshot.finishedProducts.find((stock) => stock.productId === selectedCandidate?.productId)?.quantityAvailable ?? selectedProduct?.stock ?? 0;

  async function inspectImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setMessage(""); setError(""); setInspection(null); setIsAnalyzing(true);
    try {
      const image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("تعذر قراءة الصورة."));
        reader.onerror = () => reject(new Error("تعذر قراءة الصورة."));
        reader.readAsDataURL(file);
      });
      setPreview(image);
      const profile = await analyzeProductImage({ image, fileName: file.name, mimeType: file.type });
      const detectedAttributes: Record<string, string | number | boolean> = {
        productType: profile.category,
        categoryId: categoryId(profile.category),
        hasWick: profile.protection.preserveFlame,
        analyzerConfidence: Math.round(profile.categoryConfidence * 100),
      };
      profile.features.filter((feature) => feature.detected).forEach((feature) => { detectedAttributes[feature.key] = true; });
      const match = matchConfirmedProductDNA(detectedAttributes, candidates);
      const saved = saveProductInspection({
        participantId,
        detectedProductId: profile.category === "unknown" ? undefined : profile.category,
        matchedProductId: match.candidate?.productId,
        imageReference: `${file.name}:${file.size}:${file.lastModified}`,
        confidence: match.confidence,
        detectedAttributes,
        productDNAComparison: match.comparison,
      });
      setInspection(saved);
      setSelectedProductId(saved.matchedProductId ?? "");
      refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر تحليل الصورة.");
    } finally { setIsAnalyzing(false); event.target.value = ""; }
  }

  function selectAnotherProduct(productId: string) {
    if (!inspection) return;
    const candidate = candidates.find((item) => item.productId === productId);
    if (!candidate) return;
    const updated = chooseInspectionProduct(inspection.id, participantId, candidate);
    if (updated) { setInspection(updated); setSelectedProductId(productId); setError(""); }
  }

  function confirmStock() {
    if (!inspection || !selectedCandidate) return;
    const result = confirmProductInspection({ inspectionId: inspection.id, participantId, productId: selectedCandidate.productId, quantity, currentStock });
    if (!result.ok) {
      setError(result.reason === "duplicate" ? "تم احتساب هذا الفحص مسبقًا." : "لا يمكن إضافة هذا الفحص إلى المخزون قبل مطابقته وتأكيده.");
      return;
    }
    updateSellerProduct(participantId, selectedCandidate.productId, { stock: result.stock.quantityAvailable });
    setInspection((current) => current ? { ...current, status: "confirmed", confirmedAt: result.movement.createdAt } : current);
    setMessage("تمت إضافة المنتج إلى المخزون بنجاح."); setError(""); refresh();
  }

  function rejectInspection() {
    if (!inspection || !rejectProductInspection(inspection.id, participantId)) return;
    setInspection({ ...inspection, status: "rejected" }); setMessage("تم رفض الفحص ولم يتغير المخزون."); setError(""); refresh();
  }

  const finishedRows = products.map((product) => snapshot.finishedProducts.find((stock) => stock.productId === product.id) ?? {
    productId: product.id, participantId, quantityAvailable: product.stock, quantityReserved: 0, quantityDamaged: 0, updatedAt: product.updatedAt,
  });
  const alerts = finishedRows.filter((stock) => stock.quantityAvailable <= (stock.reorderLevel ?? 2));

  return (
    <section className="participantInventory" dir="rtl" aria-labelledby="participant-inventory-title">
      <header className="participantInventory__header">
        <div><p>إدارة مشتركة مع DekoBrain</p><h2 id="participant-inventory-title">المخزون</h2></div>
        <span>المشارك: {participantId}</span>
      </header>

      <nav className="participantInventory__tabs" aria-label="أقسام المخزون">
        {tabs.map((tab) => <button key={tab.id} type="button" className={activeTab === tab.id ? "is-active" : ""} onClick={() => setActiveTab(tab.id)}>{tab.label}</button>)}
      </nav>

      {activeTab === "finished" && <DkGlassPanel as="section" className="participantInventory__panel">
        <h3><Boxes aria-hidden="true" /> المنتجات الجاهزة</h3>
        <div className="participantInventory__grid">{finishedRows.map((stock) => {
          const product = products.find((item) => item.id === stock.productId);
          return <article key={stock.productId}><strong>{product?.title ?? stock.productId}</strong><span>المتاح: {stock.quantityAvailable}</span><span>المحجوز: {stock.quantityReserved}</span><span>التالف: {stock.quantityDamaged}</span></article>;
        })}</div>
      </DkGlassPanel>}

      {activeTab === "materials" && <DkGlassPanel as="section" className="participantInventory__panel">
        <h3><PackageOpen aria-hidden="true" /> المواد الخام</h3>
        {snapshot.rawMaterials.length ? <div className="participantInventory__grid">{snapshot.rawMaterials.map((material) => <article key={material.materialId}><strong>{material.name}</strong><span>{material.quantityAvailable} {material.unit}</span><span>المحجوز: {material.quantityReserved}</span></article>)}</div> : <p className="participantInventory__empty">لا توجد مواد خام مسجلة بعد.</p>}
      </DkGlassPanel>}

      {activeTab === "movements" && <DkGlassPanel as="section" className="participantInventory__panel">
        <h3><RotateCcw aria-hidden="true" /> حركات المخزون</h3>
        {snapshot.movements.length ? <div className="participantInventory__movements">{[...snapshot.movements].reverse().map((movement) => <article key={movement.id}><strong>{movement.type}</strong><span>{movement.productId ?? movement.materialId}</span><span>+{movement.quantity}</span><time>{formatDate(movement.createdAt)}</time></article>)}</div> : <p className="participantInventory__empty">لا توجد حركات مخزون.</p>}
      </DkGlassPanel>}

      {activeTab === "inspection" && <DkGlassPanel as="section" className="participantInventory__panel participantInventory__inspection">
        <h3><Camera aria-hidden="true" /> فحص منتج بالكاميرا أو صورة مرفوعة</h3>
        <p>يحلل DekoBrain الصورة ويقارنها فقط مع Product DNA المؤكد. التحليل وحده لا يغيّر المخزون.</p>
        <label className="participantInventory__upload"><Camera aria-hidden="true" /><span>{isAnalyzing ? "جارٍ تحليل المنتج..." : "التقاط أو رفع صورة"}</span><input type="file" accept="image/*" capture="environment" disabled={isAnalyzing} onChange={inspectImage} /></label>
        {preview && <Image className="participantInventory__preview" src={preview} alt="صورة المنتج الجاري فحصه" width={420} height={300} unoptimized />}
        {inspection && <div className="participantInventory__result">
          <div className="participantInventory__resultHeader"><h4>نتيجة الفحص</h4><strong>{Math.round(inspection.confidence * 100)}%</strong></div>
          <dl>
            <div><dt>المنتج المكتشف</dt><dd>{String(inspection.detectedAttributes.productType ?? "غير محدد")}</dd></div>
            <div><dt>المطابقة المقترحة</dt><dd>{selectedCandidate?.title ?? "تحتاج اختيارًا أو منتجًا جديدًا"}</dd></div>
            <div><dt>المخزون الحالي</dt><dd>{currentStock}</dd></div>
            <div><dt>الخصائص المتطابقة</dt><dd>{inspection.productDNAComparison.matched.join("، ") || "لا توجد"}</dd></div>
            <div><dt>الخصائص المختلفة</dt><dd>{inspection.productDNAComparison.mismatched.join("، ") || "لا توجد"}</dd></div>
            <div><dt>الخصائص الناقصة</dt><dd>{inspection.productDNAComparison.missing.join("، ") || "لا توجد"}</dd></div>
          </dl>
          <label className="participantInventory__select">اختيار منتج مؤكد آخر<select value={selectedProductId} onChange={(event) => selectAnotherProduct(event.target.value)}><option value="">اختر منتجًا</option>{candidates.map((candidate) => <option key={candidate.productId} value={candidate.productId}>{candidate.title}</option>)}</select></label>
          <label className="participantInventory__quantity">الكمية المراد إضافتها<input type="number" min="1" step="1" value={quantity} onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))} /></label>
          {inspection.confidence < PRODUCT_MATCH_SUGGESTION_THRESHOLD && <p className="participantInventory__warning"><AlertTriangle aria-hidden="true" /> نسبة المطابقة لا تسمح بالتأكيد. اختر منتجًا مؤكدًا مناسبًا أو أنشئ منتجًا جديدًا.</p>}
          <div className="participantInventory__actions">
            <DkButton variant="primary" icon={<CheckCircle2 />} disabled={inspection.status !== "pending-confirmation" || !selectedCandidate} onClick={confirmStock}>تأكيد وإضافة للمخزون</DkButton>
            <DkButton variant="subtle" icon={<XCircle />} disabled={inspection.status === "confirmed" || inspection.status === "rejected"} onClick={rejectInspection}>رفض</DkButton>
          </div>
        </div>}
        {message && <p className="participantInventory__success" role="status">{message}</p>}
        {error && <p className="participantInventory__error" role="alert">{error}</p>}
        {!candidates.length && <p className="participantInventory__warning"><AlertTriangle aria-hidden="true" /> لا توجد Product DNA مؤكدة لمنتجات هذا المشارك. يمكن إجراء الفحص، لكن لن يتغير المخزون حتى تأكيد DNA واختيار المنتج.</p>}
      </DkGlassPanel>}

      {activeTab === "alerts" && <DkGlassPanel as="section" className="participantInventory__panel">
        <h3><AlertTriangle aria-hidden="true" /> التنبيهات</h3>
        {alerts.length ? <div className="participantInventory__grid">{alerts.map((stock) => <article key={stock.productId}><strong>{products.find((item) => item.id === stock.productId)?.title ?? stock.productId}</strong><span>المتاح {stock.quantityAvailable} — مستوى منخفض</span></article>)}</div> : <p className="participantInventory__empty">لا توجد تنبيهات مخزون حاليًا.</p>}
      </DkGlassPanel>}

      <p className="participantInventory__policy">DekoBrain يملك صلاحية قراءة المخزون وProduct DNA المؤكد للتحليل فقط، ولا يملك صلاحية تعديل الكميات.</p>
      <Link className="participantInventory__back" href={routes.participant.root}>العودة إلى استوديو المشارك</Link>
    </section>
  );
}
