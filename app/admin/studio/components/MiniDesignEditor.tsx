"use client";

/* Konva uses mutable refs for its transformer and undo stack by design. */
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Group,
  Image as KImage,
  Layer,
  Rect,
  Stage,
  Text,
  Transformer,
} from "react-konva";
import type Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import type { SmartProductSpecifications } from "../../../../lib/echo/echoProductDNA";
import type { SmartEditOptions } from "../../../../lib/echo/echoGuide";
import { generateEchoStudioImage } from "../../../participant/studio/echlogo/generateEchoStudioImage";
import BrandPropertiesPanel, {
  type BrandLogoGenerationDraft,
  type BrandProfile,
} from "./BrandPropertiesPanel";

type CanvasSize = "square" | "portrait" | "story" | "wide" | "original";
type BackgroundMode = "transparent" | "color" | "generated";
type BackgroundStyle = "بسيط" | "فاخر" | "طبيعي" | "هندسي" | "ثلاثي الأبعاد";
type ElementType = "image" | "text" | "price" | "logo";
type Element = {
  id: string;
  type: ElementType;
  role?: "product-image";
  src?: string;
  name?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  text: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: "normal" | "bold";
  color: string;
  backgroundColor: string;
  zIndex: number;
  align: "left" | "center" | "right";
  currency?: "EUR" | "USD" | "DZD";
  cardShape?: "rounded" | "square" | "pill";
};
type State = {
  imageUrl: string;
  canvasSize: CanvasSize;
  backgroundColor: string;
  backgroundMode?: BackgroundMode;
  generatedBackgroundSrc?: string;
  backgroundDescription?: string;
  backgroundStyle?: BackgroundStyle;
  elements: Element[];
  updatedAt: string;
};

export type BrandIdentityEditorResult = {
  renderedImageUrl: string;
  brandName: string;
  tagline?: string;
  primaryColor?: string;
  secondaryColor?: string;
  textColor?: string;
  fontFamily?: string;
};
export type BrandIdentityEditorMetadata = {
  brandName: string;
  tagline?: string;
  primaryColor?: string;
  secondaryColor?: string;
  textColor?: string;
  fontFamily?: string;
};
export type MiniDesignEditorProps = {
  imageSource?: string | null;
  imageName?: string | null;
  imageWidth?: number;
  imageHeight?: number;
  isOpen?: boolean;
  mode?: "default" | "brand-identity";
  participantId?: string;
  brandIdentityMetadata?: BrandIdentityEditorMetadata;
  onCancel: () => void;
  onMessage: (message: string) => void;
  onReloadImage?: () => void;
  onSave?: (result: BrandIdentityEditorResult) => void | Promise<void>;
};

const KEY = "dekokraft_mini_design_editor_v1";
const sizes = {
  square: { width: 1080, height: 1080 },
  portrait: { width: 1080, height: 1350 },
  story: { width: 1080, height: 1920 },
  wide: { width: 1920, height: 1080 },
};
const labels: Record<CanvasSize, string> = {
  square: "مربع 1:1 — 1080×1080",
  portrait: "عمودي 4:5 — 1080×1350",
  story: "قصة 9:16 — 1080×1920",
  wide: "أفقي 16:9 — 1920×1080",
  original: "المقاس الأصلي",
};

function uid() {
  return (
    crypto.randomUUID?.() ?? `element-${Date.now()}-${Math.random()}`
  );
}

function useImage(src: string) {
  const [image, setImage] = useState<HTMLImageElement>();
  useEffect(() => {
    if (!src) {
      setImage(undefined);
      return;
    }
    const next = new window.Image();
    next.crossOrigin = "anonymous";
    next.onload = () => setImage(next);
    next.onerror = () => setImage(undefined);
    next.src = src;
  }, [src]);
  return image;
}

function copy(items: Element[]) {
  return items.map((item) => ({ ...item }));
}

function clampColorChannel(value: number, maximum = 255) {
  return Math.min(maximum, Math.max(0, Number.isFinite(value) ? value : 0));
}

function normalizeHex(value: string) {
  const cleaned = value.trim().replace(/^#/, "");
  if (/^[\da-f]{6}$/i.test(cleaned)) return `#${cleaned.toLowerCase()}`;
  if (/^[\da-f]{3}$/i.test(cleaned)) {
    return `#${cleaned
      .split("")
      .map((character) => character + character)
      .join("")
      .toLowerCase()}`;
  }
  return null;
}

function hexToRgb(hex: string) {
  const normalized = normalizeHex(hex) ?? "#000000";
  return {
    r: Number.parseInt(normalized.slice(1, 3), 16),
    g: Number.parseInt(normalized.slice(3, 5), 16),
    b: Number.parseInt(normalized.slice(5, 7), 16),
  };
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b]
    .map((channel) =>
      Math.round(clampColorChannel(channel)).toString(16).padStart(2, "0"),
    )
    .join("")}`;
}

function rgbToHsl(r: number, g: number, b: number) {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const maximum = Math.max(red, green, blue);
  const minimum = Math.min(red, green, blue);
  const lightness = (maximum + minimum) / 2;
  const delta = maximum - minimum;
  if (delta === 0) return { h: 0, s: 0, l: Math.round(lightness * 100) };
  const saturation =
    delta / (1 - Math.abs(2 * lightness - 1));
  const hue =
    maximum === red
      ? 60 * (((green - blue) / delta) % 6)
      : maximum === green
        ? 60 * ((blue - red) / delta + 2)
        : 60 * ((red - green) / delta + 4);
  return {
    h: Math.round(hue < 0 ? hue + 360 : hue),
    s: Math.round(saturation * 100),
    l: Math.round(lightness * 100),
  };
}

function hslToHex(h: number, s: number, l: number) {
  const hue = ((clampColorChannel(h, 360) % 360) + 360) % 360;
  const saturation = clampColorChannel(s, 100) / 100;
  const lightness = clampColorChannel(l, 100) / 100;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const section = hue / 60;
  const intermediate = chroma * (1 - Math.abs((section % 2) - 1));
  const [red, green, blue] =
    section < 1
      ? [chroma, intermediate, 0]
      : section < 2
        ? [intermediate, chroma, 0]
        : section < 3
          ? [0, chroma, intermediate]
          : section < 4
            ? [0, intermediate, chroma]
            : section < 5
              ? [intermediate, 0, chroma]
              : [chroma, 0, intermediate];
  const match = lightness - chroma / 2;
  return rgbToHex(
    (red + match) * 255,
    (green + match) * 255,
    (blue + match) * 255,
  );
}

function mixHexColors(first: string, second: string, ratio: number) {
  const firstRgb = hexToRgb(first);
  const secondRgb = hexToRgb(second);
  const secondWeight = clampColorChannel(ratio, 100) / 100;
  const firstWeight = 1 - secondWeight;
  return rgbToHex(
    firstRgb.r * firstWeight + secondRgb.r * secondWeight,
    firstRgb.g * firstWeight + secondRgb.g * secondWeight,
    firstRgb.b * firstWeight + secondRgb.b * secondWeight,
  );
}

export default function MiniDesignEditor({
  imageSource,
  imageName,
  imageWidth = 1080,
  imageHeight = 1080,
  isOpen = true,
  mode = "default",
  participantId,
  brandIdentityMetadata,
  onCancel,
  onMessage,
  onReloadImage,
  onSave,
}: MiniDesignEditorProps) {
  const [canvasSize, setCanvasSize] = useState<CanvasSize>("square");
  const [backgroundColor, setBackgroundColor] = useState(
    brandIdentityMetadata?.primaryColor ?? "#fff",
  );
  const [backgroundMode, setBackgroundMode] =
    useState<BackgroundMode>("color");
  const [generatedBackgroundSrc, setGeneratedBackgroundSrc] = useState("");
  const [backgroundDescription, setBackgroundDescription] = useState("");
  const [backgroundStyle, setBackgroundStyle] =
    useState<BackgroundStyle>("بسيط");
  const [firstMixColor, setFirstMixColor] = useState(
    brandIdentityMetadata?.primaryColor ?? "#315fea",
  );
  const [secondMixColor, setSecondMixColor] = useState(
    brandIdentityMetadata?.secondaryColor ?? "#f0bc50",
  );
  const [mixRatio, setMixRatio] = useState(50);
  const [isGeneratingBackground, setIsGeneratingBackground] = useState(false);
  const [backgroundError, setBackgroundError] = useState("");
  const [elements, setElements] = useState<Element[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [showBrandProperties, setShowBrandProperties] = useState(true);
  const [preview, setPreview] = useState(false);
  const [viewWidth, setViewWidth] = useState(560);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [revision, setRevision] = useState(0);
  const [pendingGeneratedLogo, setPendingGeneratedLogo] = useState<
    { src: string; name: string } | undefined
  >();
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const past = useRef<Element[][]>([]);
  const future = useRef<Element[][]>([]);
  const storageKey =
    mode === "brand-identity" && participantId
      ? `${KEY}:${participantId}`
      : KEY;
  const dims =
    canvasSize === "original"
      ? { width: imageWidth, height: imageHeight }
      : sizes[canvasSize];
  const displayWidth = Math.min(560, viewWidth);
  const displayHeight = (displayWidth * dims.height) / dims.width;
  const zoom = displayWidth / dims.width;
  const selected = elements.find((item) => item.id === selectedId);
  const generatedBackgroundImage = useImage(
    backgroundMode === "generated" ? generatedBackgroundSrc : "",
  );
  const backgroundRgb = hexToRgb(backgroundColor);
  const backgroundHsl = rgbToHsl(
    backgroundRgb.r,
    backgroundRgb.g,
    backgroundRgb.b,
  );
  const sorted = useMemo(
    () => [...elements].sort((a, b) => a.zIndex - b.zIndex),
    [elements],
  );

  const commit = (next: Element[]) => {
    past.current.push(copy(elements));
    future.current = [];
    setElements(next);
    setRevision((value) => value + 1);
  };

  useEffect(() => {
    const measure = () =>
      setViewWidth(
        Math.max(260, Math.min(560, viewportRef.current?.clientWidth ?? 560)),
      );
    measure();
    const observer = new ResizeObserver(measure);
    if (viewportRef.current) observer.observe(viewportRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    console.log("Mini editor image transfer:", {
      imageSource,
      imageName,
      isOpen,
      canvasReady: Boolean(stageRef.current),
    });
    if (!isOpen || !imageSource) return;
    setImageLoadError(false);
    const image = new window.Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      const scale = Math.min(
        (dims.width * 0.8) / image.naturalWidth,
        (dims.height * 0.8) / image.naturalHeight,
      );
      const width = image.naturalWidth * scale;
      const height = image.naturalHeight * scale;
      const product: Element = {
        id: `product-image-${Date.now()}`,
        type: "image",
        role: "product-image",
        src: imageSource,
        name: imageName || "product-image",
        x: (dims.width - width) / 2,
        y: (dims.height - height) / 2,
        width,
        height,
        rotation: 0,
        opacity: 1,
        text: "",
        fontSize: 48,
        fontFamily: "Arial",
        fontWeight: "normal",
        color: "#fff",
        backgroundColor: "transparent",
        zIndex: 0,
        align: "center",
      };
      setElements((previous) => [
        product,
        ...previous.filter((item) => item.role !== "product-image"),
      ]);
      setRevision((value) => value + 1);
    };
    image.onerror = () => {
      console.error("Mini editor failed to load approved image:", imageSource);
      setImageLoadError(true);
    };
    image.src = imageSource;
  }, [isOpen, imageSource, imageName, dims.width, dims.height]);

  useEffect(() => {
    const transformer = transformerRef.current;
    const stage = stageRef.current;
    if (!transformer || !stage) return;
    const node = selectedId ? stage.findOne(`#${selectedId}`) : undefined;
    transformer.nodes(node ? [node] : []);
    stage.batchDraw();
  }, [selectedId, elements, revision]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const saved = JSON.parse(raw) as Partial<State>;
      if (
        (mode === "brand-identity" || saved.imageUrl === imageSource) &&
        Array.isArray(saved.elements)
      ) {
        setElements(saved.elements);
        setCanvasSize(saved.canvasSize ?? "square");
        setBackgroundColor(saved.backgroundColor ?? "#fff");
        setBackgroundMode(saved.backgroundMode ?? "color");
        setGeneratedBackgroundSrc(saved.generatedBackgroundSrc ?? "");
        setBackgroundDescription(saved.backgroundDescription ?? "");
        setBackgroundStyle(saved.backgroundStyle ?? "بسيط");
      }
    } catch {}
  }, [imageSource, mode, storageKey]);

  const add = (type: ElementType, src?: string) => {
    const z = Math.max(0, ...elements.map((item) => item.zIndex)) + 1;
    const item: Element = {
      id: uid(),
      type,
      src,
      x: dims.width * 0.3,
      y: dims.height * 0.35,
      width: type === "logo" ? dims.width * 0.2 : dims.width * 0.4,
      height: type === "logo" ? dims.width * 0.14 : dims.height * 0.1,
      rotation: 0,
      opacity: 1,
      text: type === "price" ? "29.90" : type === "text" ? "اكتب النص هنا" : "",
      fontSize: Math.max(36, dims.width * 0.05),
      fontFamily: "Arial",
      fontWeight: "normal",
      color: "#fff",
      backgroundColor: type === "price" ? "#2457ff" : "transparent",
      zIndex: z,
      align: "center",
      currency: "EUR",
      cardShape: "rounded",
    };
    commit([...elements, item]);
    setSelectedId(item.id);
    setShowBrandProperties(false);
  };

  const update = (patch: Partial<Element>) => {
    if (!selected) return;
    commit(
      elements.map((item) =>
        item.id === selected.id ? { ...item, ...patch } : item,
      ),
    );
  };
  const remove = () => {
    if (!selected) return;
    commit(elements.filter((item) => item.id !== selected.id));
    setSelectedId("");
    setShowBrandProperties(true);
  };
  const duplicate = () => {
    if (!selected) return;
    const item = {
      ...selected,
      id: uid(),
      x: Math.min(dims.width - selected.width, selected.x + 30),
      y: Math.min(dims.height - selected.height, selected.y + 30),
      zIndex: Math.max(...elements.map((value) => value.zIndex)) + 1,
    };
    commit([...elements, item]);
    setSelectedId(item.id);
  };
  const reorder = (front: boolean) => {
    if (!selected) return;
    update({
      zIndex: front
        ? Math.max(...elements.map((item) => item.zIndex)) + 1
        : Math.min(...elements.map((item) => item.zIndex)) - 1,
    });
  };
  const undo = () => {
    const value = past.current.pop();
    if (!value) return;
    future.current.push(copy(elements));
    setElements(value);
    setSelectedId("");
    setShowBrandProperties(true);
  };
  const redo = () => {
    const value = future.current.pop();
    if (!value) return;
    past.current.push(copy(elements));
    setElements(value);
    setSelectedId("");
    setShowBrandProperties(true);
  };
  const reset = () => {
    commit([]);
    setSelectedId("");
    setShowBrandProperties(true);
    setCanvasSize("square");
    onMessage("تمت إعادة ضبط التصميم.");
  };

  const save = async () => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          imageUrl: imageSource ?? "",
          canvasSize,
          backgroundColor,
          backgroundMode,
          generatedBackgroundSrc,
          backgroundDescription,
          backgroundStyle,
          elements,
          updatedAt: new Date().toISOString(),
        } satisfies State),
      );
      if (mode === "brand-identity" && onSave) {
        setSelectedId("");
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => resolve()),
        );
        const stage = stageRef.current;
        if (!stage) throw new Error("canvas-not-ready");
        const renderedImageUrl = stage.toDataURL({
          pixelRatio: dims.width / displayWidth,
          mimeType: "image/png",
        });
        await onSave({
          renderedImageUrl,
          brandName:
            brandIdentityMetadata?.brandName.trim() ||
            imageName?.trim() ||
            "DekoKraft",
          tagline: brandIdentityMetadata?.tagline?.trim() || undefined,
          primaryColor:
            brandIdentityMetadata?.primaryColor ?? backgroundColor,
          secondaryColor: brandIdentityMetadata?.secondaryColor,
          textColor: brandIdentityMetadata?.textColor,
          fontFamily: brandIdentityMetadata?.fontFamily,
        });
        onMessage("تم حفظ هوية العلامة.");
      } else {
        onMessage("تم حفظ التصميم كمسودة.");
      }
    } catch {
      onMessage("تعذر حفظ التصميم.");
    }
  };

  const download = () => {
    setSelectedId("");
    setTimeout(() => {
      const stage = stageRef.current;
      if (!stage) return;
      const url = stage.toDataURL({
        pixelRatio: dims.width / displayWidth,
        mimeType: "image/png",
      });
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `dekokraft-design-${Date.now()}.png`;
      anchor.click();
    }, 0);
  };
  const send = () => {
    void save();
    localStorage.setItem(
      "dekokraft_canva_design_payload_v1",
      JSON.stringify({
        imageName,
        imageUrl: imageSource,
        canvasSize,
        backgroundColor,
        elements,
        createdAt: new Date().toISOString(),
      }),
    );
    window.open("https://www.canva.com/create/", "_blank", "noopener,noreferrer");
  };
  const uploadLogo = (file: File) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === "string" && add("logo", reader.result);
    reader.readAsDataURL(file);
  };

  const addGeneratedLogo = (
    generated: { src: string; name: string },
    replaceCurrentImage = false,
  ) => {
    const z = Math.max(0, ...elements.map((item) => item.zIndex)) + 1;
    const item: Element = {
      id: uid(),
      type: replaceCurrentImage ? "image" : "logo",
      role: replaceCurrentImage ? "product-image" : undefined,
      src: generated.src,
      name: generated.name,
      x: replaceCurrentImage ? 0 : dims.width * 0.25,
      y: replaceCurrentImage ? 0 : dims.height * 0.25,
      width: replaceCurrentImage ? dims.width : dims.width * 0.5,
      height: replaceCurrentImage ? dims.height : dims.height * 0.5,
      rotation: 0,
      opacity: 1,
      text: "",
      fontSize: 48,
      fontFamily: "Arial",
      fontWeight: "normal",
      color: "#fff",
      backgroundColor: "transparent",
      zIndex: replaceCurrentImage
        ? Math.min(0, ...elements.map((element) => element.zIndex)) - 1
        : z,
      align: "center",
    };
    const retained = replaceCurrentImage
      ? elements.filter((element) => element.role !== "product-image")
      : elements;
    commit([...retained, item]);
    setSelectedId(item.id);
    setShowBrandProperties(false);
    setPendingGeneratedLogo(undefined);
  };
  const transform = (
    event: KonvaEventObject<Event>,
    element: Element,
  ) => {
    const node = event.target;
    const width = Math.min(
      dims.width,
      Math.max(30, element.width * node.scaleX()),
    );
    const height = Math.min(
      dims.height,
      Math.max(30, element.height * node.scaleY()),
    );
    node.scale({ x: 1, y: 1 });
    commit(
      elements.map((item) =>
        item.id === element.id
          ? {
              ...item,
              width,
              height,
              x: Math.max(0, Math.min(dims.width - width, node.x())),
              y: Math.max(0, Math.min(dims.height - height, node.y())),
              rotation: node.rotation(),
            }
          : item,
      ),
    );
  };

  function handleAnalyzeBrand(profile: BrandProfile) {
    console.log("Brand analysis ready:", profile);
    onMessage("بيانات العلامة جاهزة للتحليل عند ربط المرافق الذكي.");
  }

  async function handleGenerateBrandLogo(
    draft: BrandLogoGenerationDraft,
  ) {
    const stage = stageRef.current;
    if (!stage) throw new Error("مساحة التصميم غير جاهزة.");
    if (!participantId) throw new Error("تعذر تحديد حساب المشارك.");

    const sourceDataUrl = stage.toDataURL({
      pixelRatio: dims.width / displayWidth,
      mimeType: "image/png",
    });
    const sourceResponse = await fetch(sourceDataUrl);
    const sourceImage = new File(
      [await sourceResponse.blob()],
      "echlogo-canvas-source.png",
      { type: "image/png" },
    );
    const userInstruction = [
      draft.prompt.positivePrompt,
      `Avoid: ${draft.prompt.negativePrompt}.`,
    ].join(" ");
    const currentImageId = `echlogo-canvas-${draft.updatedAt}`;

    const activity = draft.prompt.industry;
    const productDNA: SmartProductSpecifications = {
      id: `echlogo-${participantId}`,
      categoryId: "services",
      categoryName: "Brand identity",
      productType: "logo",
      dimensions: {
        length: dims.width,
        width: dims.height,
        height: null,
        unit: "mm",
        source: "product-data",
        confirmed: true,
      },
      confirmed: true,
      confirmedAt: draft.updatedAt,
      background: backgroundColor,
      shape: "scalable brand mark",
      material: "digital vector-style artwork",
      color: brandIdentityMetadata?.primaryColor ?? "",
      usage: `Commercial identity for ${activity}`,
      hasWick: false,
      scent: "",
      burnTime: "",
      waxType: "",
      notes: draft.profile.brandDescription,
      lidType: "",
      closureType: "",
      capacity: "",
      personalization: draft.profile.brandName,
      occasion: "",
      ageGroup: "",
      educationalGoal: "",
      safetyNotes: "",
      serviceType: activity,
      inputFileType: "png",
      outputFileType: "png",
      estimatedDuration: "",
    };
    const options: SmartEditOptions = {
      background: { mode: "original" },
      colors: { mode: "enhance" },
      preserveShape: true,
      preserveDetails: true,
      improveQuality: true,
      output: {
        purpose: "catalog",
        aspectRatio:
          canvasSize === "square"
            ? "1:1"
            : canvasSize === "portrait"
              ? "4:5"
              : canvasSize === "wide"
                ? "16:9"
                : "original",
      },
    };
    const generatedUrl = await generateEchoStudioImage({
      participantId,
      currentImageId,
      prompt: userInstruction,
      sourceImage,
      productDNA,
      options,
    });
    const generated = {
      src: generatedUrl,
      name: `${draft.profile.brandName}-logo`,
    };
    if (elements.length === 0) {
      addGeneratedLogo(generated);
    } else {
      setPendingGeneratedLogo(generated);
      onMessage("تم توليد الشعار. اختر طريقة إضافته إلى التصميم.");
    }
  }

  async function handleGenerateBackground() {
    if (isGeneratingBackground) return;
    if (!participantId) {
      setBackgroundError("تعذر تحديد حساب المشارك.");
      return;
    }
    setIsGeneratingBackground(true);
    setBackgroundError("");
    try {
      const savedProfile = JSON.parse(
        window.localStorage.getItem("dekokraft-brand-profile") ?? "{}",
      ) as Partial<BrandProfile>;
      const brandName =
        savedProfile.brandName?.trim() ||
        brandIdentityMetadata?.brandName.trim() ||
        imageName?.trim() ||
        "DekoKraft";
      const activity =
        savedProfile.businessActivity === "أخرى"
          ? savedProfile.customActivity?.trim() || "نشاط تجاري"
          : savedProfile.businessActivity?.trim() || "نشاط تجاري";
      const brandDescription = savedProfile.brandDescription?.trim() || "";
      const primaryColor =
        brandIdentityMetadata?.primaryColor?.trim() || "#315fea";
      const secondaryColor =
        brandIdentityMetadata?.secondaryColor?.trim() || "#f0bc50";
      const prompt = [
        `Create a ${backgroundStyle} professional background only for the brand "${brandName}" operating in "${activity}".`,
        brandDescription && `Brand description: "${brandDescription}".`,
        `Use the brand colors ${primaryColor} and ${secondaryColor} harmoniously.`,
        backgroundDescription.trim() &&
          `Requested background: "${backgroundDescription.trim()}".`,
        "Generate only the background artwork. Do not include a logo, brand name, letters, watermark, product mockup, frame, or unrelated objects. Keep the composition suitable for placing a logo above it.",
      ]
        .filter(Boolean)
        .join(" ");

      const sourceCanvas = document.createElement("canvas");
      sourceCanvas.width = dims.width;
      sourceCanvas.height = dims.height;
      const context = sourceCanvas.getContext("2d");
      if (!context) throw new Error("تعذر تجهيز مساحة توليد الخلفية.");
      context.fillStyle = backgroundColor || primaryColor;
      context.fillRect(0, 0, dims.width, dims.height);
      const sourceBlob = await new Promise<Blob>((resolve, reject) =>
        sourceCanvas.toBlob(
          (blob) =>
            blob
              ? resolve(blob)
              : reject(new Error("تعذر تجهيز صورة مصدر الخلفية.")),
          "image/png",
        ),
      );
      const sourceImage = new File(
        [sourceBlob],
        "echlogo-background-source.png",
        { type: "image/png" },
      );
      const productDNA: SmartProductSpecifications = {
        id: `echlogo-background-${participantId}`,
        categoryId: "services",
        categoryName: "Brand identity",
        productType: "brand background",
        dimensions: {
          length: dims.width,
          width: dims.height,
          height: null,
          unit: "mm",
          source: "product-data",
          confirmed: true,
        },
        confirmed: true,
        confirmedAt: new Date().toISOString(),
        background: backgroundDescription.trim(),
        shape: backgroundStyle,
        material: "digital background artwork",
        color: `${primaryColor}, ${secondaryColor}`,
        usage: `Logo background for ${activity}`,
        hasWick: false,
        scent: "",
        burnTime: "",
        waxType: "",
        notes: brandDescription,
        lidType: "",
        closureType: "",
        capacity: "",
        personalization: brandName,
        occasion: "",
        ageGroup: "",
        educationalGoal: "",
        safetyNotes: "",
        serviceType: activity,
        inputFileType: "png",
        outputFileType: "png",
        estimatedDuration: "",
      };
      const options: SmartEditOptions = {
        background: { mode: "original" },
        colors: { mode: "enhance" },
        preserveShape: true,
        preserveDetails: true,
        improveQuality: true,
        output: {
          purpose: "catalog",
          aspectRatio:
            canvasSize === "square"
              ? "1:1"
              : canvasSize === "portrait"
                ? "4:5"
                : canvasSize === "wide"
                  ? "16:9"
                  : "original",
        },
      };
      const generatedUrl = await generateEchoStudioImage({
        participantId,
        currentImageId: `echlogo-background-${Date.now()}`,
        prompt,
        sourceImage,
        productDNA,
        options,
      });
      setGeneratedBackgroundSrc(generatedUrl);
      setBackgroundMode("generated");
      onMessage("تم توليد الخلفية.");
    } catch (error) {
      setBackgroundError(
        error instanceof Error ? error.message : "تعذر توليد الخلفية.",
      );
    } finally {
      setIsGeneratingBackground(false);
    }
  }

  function selectElement(elementId: string) {
    setSelectedId(elementId);
    setShowBrandProperties(false);
  }

  return (
    <div className="miniEditor">
      <aside className="miniEditorTools brandStudioSidebar">
        <h3>الأدوات</h3>
        <button onClick={() => add("text")}>إضافة عنوان</button>
        <button onClick={() => add("text")}>إضافة نص</button>
        <button onClick={() => add("price")}>إضافة سعر</button>
        <button onClick={() => add("logo", "/logo-dekokraft-600.webp")}>
          إضافة شعار DekoKraft
        </button>
        <label>
          رفع شعار
          <input
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) uploadLogo(file);
              event.target.value = "";
            }}
          />
        </label>
        <label>
          لون النص
          <input
            type="color"
            value={selected?.color ?? "#fff"}
            onChange={(event) => update({ color: event.target.value })}
          />
        </label>
        <label>
          حجم الخط
          <input
            type="range"
            min="18"
            max="180"
            value={selected?.fontSize ?? 48}
            onChange={(event) => update({ fontSize: Number(event.target.value) })}
          />
        </label>
        <button
          onClick={() =>
            update({
              fontWeight: selected?.fontWeight === "bold" ? "normal" : "bold",
            })
          }
        >
          خط عريض
        </button>
        <button
          onClick={() =>
            update({
              align:
                selected?.align === "right"
                  ? "left"
                  : selected?.align === "left"
                    ? "center"
                    : "right",
            })
          }
        >
          محاذاة النص
        </button>
        <button onClick={remove}>حذف المحدد</button>
        <button onClick={duplicate}>تكرار العنصر</button>
        <button onClick={() => reorder(true)}>إحضار للأمام</button>
        <button onClick={() => reorder(false)}>إرسال للخلف</button>
        <button onClick={undo}>تراجع</button>
        <button onClick={redo}>إعادة</button>
        <button onClick={reset}>إعادة ضبط التصميم</button>
        <section className="brandStudioBackgroundTools">
          <h3>الخلفيات</h3>
          <div className="brandStudioBackgroundModes">
            <button
              type="button"
              className={backgroundMode === "transparent" ? "active" : ""}
              onClick={() => {
                setBackgroundMode("transparent");
                setBackgroundError("");
              }}
            >
              شفافة
            </button>
            <button
              type="button"
              className={backgroundMode === "color" ? "active" : ""}
              onClick={() => {
                setBackgroundMode("color");
                setBackgroundError("");
              }}
            >
              ألوان
            </button>
            <button
              type="button"
              className={backgroundMode === "generated" ? "active" : ""}
              onClick={() => {
                setBackgroundMode("generated");
                setBackgroundError("");
              }}
            >
              توليد
            </button>
          </div>

          {backgroundMode === "transparent" && (
            <p className="brandStudioBackgroundHint">
              ستظهر شبكة الشفافية ويُصدّر التصميم بصيغة PNG شفافة.
            </p>
          )}

          {backgroundMode === "color" && (
            <div className="brandStudioColorMixer">
              <label>
                منتقي اللون
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(event) => setBackgroundColor(event.target.value)}
                />
              </label>

              <label>
                HEX
                <input
                  key={backgroundColor}
                  dir="ltr"
                  defaultValue={backgroundColor.toUpperCase()}
                  onBlur={(event) => {
                    const normalized = normalizeHex(event.target.value);
                    if (normalized) {
                      setBackgroundColor(normalized);
                    } else {
                      event.target.value = backgroundColor.toUpperCase();
                    }
                  }}
                />
              </label>

              <fieldset>
                <legend>RGB</legend>
                {(["r", "g", "b"] as const).map((channel) => (
                  <label key={channel}>
                    {channel.toUpperCase()}
                    <input
                      type="number"
                      min="0"
                      max="255"
                      value={backgroundRgb[channel]}
                      onChange={(event) =>
                        setBackgroundColor(
                          rgbToHex(
                            channel === "r"
                              ? Number(event.target.value)
                              : backgroundRgb.r,
                            channel === "g"
                              ? Number(event.target.value)
                              : backgroundRgb.g,
                            channel === "b"
                              ? Number(event.target.value)
                              : backgroundRgb.b,
                          ),
                        )
                      }
                    />
                  </label>
                ))}
              </fieldset>

              <fieldset>
                <legend>HSL</legend>
                {(["h", "s", "l"] as const).map((channel) => (
                  <label key={channel}>
                    {channel.toUpperCase()}
                    <input
                      type="number"
                      min="0"
                      max={channel === "h" ? "360" : "100"}
                      value={backgroundHsl[channel]}
                      onChange={(event) =>
                        setBackgroundColor(
                          hslToHex(
                            channel === "h"
                              ? Number(event.target.value)
                              : backgroundHsl.h,
                            channel === "s"
                              ? Number(event.target.value)
                              : backgroundHsl.s,
                            channel === "l"
                              ? Number(event.target.value)
                              : backgroundHsl.l,
                          ),
                        )
                      }
                    />
                  </label>
                ))}
              </fieldset>

              <label>
                درجة اللون Hue
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={backgroundHsl.h}
                  onChange={(event) =>
                    setBackgroundColor(
                      hslToHex(
                        Number(event.target.value),
                        backgroundHsl.s,
                        backgroundHsl.l,
                      ),
                    )
                  }
                />
              </label>
              <label>
                التشبع Saturation
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={backgroundHsl.s}
                  onChange={(event) =>
                    setBackgroundColor(
                      hslToHex(
                        backgroundHsl.h,
                        Number(event.target.value),
                        backgroundHsl.l,
                      ),
                    )
                  }
                />
              </label>
              <label>
                الإضاءة Lightness
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={backgroundHsl.l}
                  onChange={(event) =>
                    setBackgroundColor(
                      hslToHex(
                        backgroundHsl.h,
                        backgroundHsl.s,
                        Number(event.target.value),
                      ),
                    )
                  }
                />
              </label>

              <div className="brandStudioMixColors">
                <label>
                  اللون الأول
                  <input
                    type="color"
                    value={firstMixColor}
                    onChange={(event) => {
                      const color = event.target.value;
                      setFirstMixColor(color);
                      setBackgroundColor(
                        mixHexColors(color, secondMixColor, mixRatio),
                      );
                    }}
                  />
                </label>
                <label>
                  اللون الثاني
                  <input
                    type="color"
                    value={secondMixColor}
                    onChange={(event) => {
                      const color = event.target.value;
                      setSecondMixColor(color);
                      setBackgroundColor(
                        mixHexColors(firstMixColor, color, mixRatio),
                      );
                    }}
                  />
                </label>
              </div>
              <label>
                نسبة المزج: {mixRatio}%
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={mixRatio}
                  onChange={(event) => {
                    const ratio = Number(event.target.value);
                    setMixRatio(ratio);
                    setBackgroundColor(
                      mixHexColors(firstMixColor, secondMixColor, ratio),
                    );
                  }}
                />
              </label>
              <div
                className="brandStudioColorPreview"
                style={{ backgroundColor }}
                aria-label={`معاينة اللون ${backgroundColor}`}
              />
              <button
                type="button"
                onClick={() => {
                  const color =
                    brandIdentityMetadata?.primaryColor ?? "#315fea";
                  setFirstMixColor(color);
                  setBackgroundColor(color);
                }}
              >
                استخدام اللون الرئيسي
              </button>
              <button
                type="button"
                onClick={() => {
                  const color =
                    brandIdentityMetadata?.secondaryColor ?? "#f0bc50";
                  setSecondMixColor(color);
                  setBackgroundColor(color);
                }}
              >
                استخدام اللون الثانوي
              </button>
              <button
                type="button"
                className="brandStudioApplyBackground"
                onClick={() => setBackgroundMode("color")}
              >
                تطبيق الخلفية
              </button>
            </div>
          )}

          {backgroundMode === "generated" && (
            <div className="brandStudioBackgroundFields">
              <label>
                وصف الخلفية
                <textarea
                  value={backgroundDescription}
                  onChange={(event) =>
                    setBackgroundDescription(event.target.value)
                  }
                />
              </label>
              <label>
                الأسلوب
                <select
                  value={backgroundStyle}
                  onChange={(event) =>
                    setBackgroundStyle(event.target.value as BackgroundStyle)
                  }
                >
                  <option>بسيط</option>
                  <option>فاخر</option>
                  <option>طبيعي</option>
                  <option>هندسي</option>
                  <option>ثلاثي الأبعاد</option>
                </select>
              </label>
              <button
                type="button"
                disabled={isGeneratingBackground}
                onClick={() => void handleGenerateBackground()}
              >
                {isGeneratingBackground
                  ? "جارٍ توليد الخلفية..."
                  : "توليد الخلفية"}
              </button>
              {backgroundError && (
                <p className="brandStudioBackgroundError" role="alert">
                  {backgroundError}
                </p>
              )}
            </div>
          )}
        </section>
      </aside>

      <main className="miniEditorMain brandStudioCanvasArea">
        <div className="miniEditorSizes">
          {(Object.keys(labels) as CanvasSize[]).map((size) => (
            <button
              key={size}
              className={size === canvasSize ? "active" : ""}
              onClick={() => setCanvasSize(size)}
            >
              {labels[size]}
            </button>
          ))}
        </div>
        <div
          ref={viewportRef}
          className={`miniEditorViewport${backgroundMode === "transparent" ? " isTransparent" : ""}`}
        >
          {!imageSource && (
            <div className="miniCanvasEmpty">
              <p>لم يتم تحميل صورة المنتج</p>
              <button onClick={onReloadImage}>إعادة تحميل الصورة المعتمدة</button>
            </div>
          )}
          <Stage
            ref={stageRef}
            width={displayWidth}
            height={displayHeight}
            scaleX={zoom}
            scaleY={zoom}
            onMouseDown={(event) => {
              if (event.target === event.target.getStage()) {
                setSelectedId("");
                setShowBrandProperties(true);
              }
            }}
          >
            <Layer>
              {backgroundMode === "color" && (
                <Rect
                  width={dims.width}
                  height={dims.height}
                  fill={backgroundColor}
                  listening={false}
                />
              )}
              {backgroundMode === "generated" &&
                generatedBackgroundImage && (
                  <KImage
                    image={generatedBackgroundImage}
                    width={dims.width}
                    height={dims.height}
                    listening={false}
                  />
                )}
              {sorted.map((element) => (
                <Node
                  key={element.id}
                  element={element}
                  selected={element.id === selectedId}
                  onSelect={() => selectElement(element.id)}
                  onDrag={(x, y) =>
                    commit(
                      elements.map((item) =>
                        item.id === element.id
                          ? {
                              ...item,
                              x: Math.max(
                                0,
                                Math.min(dims.width - element.width, x),
                              ),
                              y: Math.max(
                                0,
                                Math.min(dims.height - element.height, y),
                              ),
                            }
                          : item,
                      ),
                    )
                  }
                  onTransform={(event) => transform(event, element)}
                />
              ))}
              <Transformer
                ref={transformerRef}
                rotateEnabled={!preview}
                resizeEnabled={!preview}
              />
            </Layer>
          </Stage>
          {imageLoadError && (
            <div className="miniCanvasError">
              <p>لم يتم تحميل صورة المنتج</p>
              <button onClick={onReloadImage}>إعادة تحميل الصورة المعتمدة</button>
            </div>
          )}
        </div>
      </main>

      <aside className="miniEditorProperties brandStudioSidebar">
        {selected && !showBrandProperties ? (
          <>
            <h3>الخصائص</h3>
            <button
              type="button"
              onClick={() => setShowBrandProperties(true)}
            >
              خصائص العلامة
            </button>
            <label>
              {selected.type === "price" ? "قيمة السعر" : "المحتوى"}
              <textarea
                value={selected.text}
                disabled={
                  selected.type === "image" || selected.type === "logo"
                }
                onChange={(event) => update({ text: event.target.value })}
              />
            </label>
            {selected.type !== "image" && selected.type !== "logo" && (
              <>
                <label>
                  حجم الخط
                  <input
                    type="number"
                    value={selected.fontSize}
                    onChange={(event) =>
                      update({ fontSize: Number(event.target.value) })
                    }
                  />
                </label>
                <label>
                  لون الخط
                  <input
                    type="color"
                    value={selected.color}
                    onChange={(event) => update({ color: event.target.value })}
                  />
                </label>
                <label>
                  نوع الخط
                  <select
                    value={selected.fontFamily}
                    onChange={(event) =>
                      update({ fontFamily: event.target.value })
                    }
                  >
                    <option>Arial</option>
                    <option>Tahoma</option>
                    <option>Georgia</option>
                  </select>
                </label>
              </>
            )}
            <label>
              الشفافية
              <input
                type="range"
                min=".1"
                max="1"
                step=".05"
                value={selected.opacity}
                onChange={(event) =>
                  update({ opacity: Number(event.target.value) })
                }
              />
            </label>
            <label>
              التدوير
              <input
                type="range"
                min="-180"
                max="180"
                value={selected.rotation}
                onChange={(event) =>
                  update({ rotation: Number(event.target.value) })
                }
              />
            </label>
            <label>
              الحجم
              <input
                type="range"
                min="30"
                max={dims.width * 0.9}
                value={selected.width}
                onChange={(event) =>
                  update({ width: Number(event.target.value) })
                }
              />
            </label>
          </>
        ) : (
          <BrandPropertiesPanel
            initialBrandName={
              brandIdentityMetadata?.brandName ?? imageName ?? ""
            }
            onAnalyzeBrand={handleAnalyzeBrand}
            onGenerateBrandLogo={handleGenerateBrandLogo}
          />
        )}
        {pendingGeneratedLogo && (
          <div className="brandStudioGeneratedLogoActions" role="status">
            <strong>تم توليد الشعار</strong>
            <button
              type="button"
              onClick={() => addGeneratedLogo(pendingGeneratedLogo)}
            >
              إضافة إلى التصميم
            </button>
            <button
              type="button"
              onClick={() => addGeneratedLogo(pendingGeneratedLogo, true)}
            >
              استبدال الخلفية الحالية
            </button>
          </div>
        )}
      </aside>

      <footer className="miniEditorFooter">
        <button onClick={onCancel}>إلغاء</button>
        <button onClick={() => void save()}>
          {mode === "brand-identity" ? "حفظ الهوية" : "حفظ كمسودة"}
        </button>
        <button
          onClick={() => {
            setPreview((value) => !value);
            setSelectedId("");
            setShowBrandProperties(true);
          }}
        >
          معاينة
        </button>
        <button onClick={download}>تنزيل التصميم PNG</button>
        {mode !== "brand-identity" && (
          <button className="primary" onClick={send}>
            إرسال إلى Canva
          </button>
        )}
      </footer>
    </div>
  );
}

function Node({
  element,
  selected,
  onSelect,
  onDrag,
  onTransform,
}: {
  element: Element;
  selected: boolean;
  onSelect: () => void;
  onDrag: (x: number, y: number) => void;
  onTransform: (event: KonvaEventObject<Event>) => void;
}) {
  const image = useImage(element.src ?? "");
  const common = {
    id: element.id,
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
    rotation: element.rotation,
    opacity: element.opacity,
    draggable: true,
    onClick: onSelect,
    onTap: onSelect,
    onDragEnd: (event: KonvaEventObject<DragEvent>) =>
      onDrag(event.target.x(), event.target.y()),
    onTransformEnd: onTransform,
  };
  if (element.type === "image" || element.type === "logo") {
    return (
      <KImage
        {...common}
        image={image}
        stroke={selected ? "#2457ff" : undefined}
        strokeWidth={selected ? 4 : 0}
      />
    );
  }
  const suffix = element.type === "price" ? ` ${element.currency}` : "";
  return (
    <Group {...common}>
      <Rect
        width={element.width}
        height={element.height}
        fill={
          element.backgroundColor === "transparent"
            ? undefined
            : element.backgroundColor
        }
        cornerRadius={
          element.cardShape === "pill"
            ? element.height / 2
            : element.cardShape === "square"
              ? 0
              : 18
        }
      />
      <Text
        width={element.width}
        height={element.height}
        padding={12}
        text={`${element.text}${suffix}`}
        fontSize={element.fontSize}
        fontFamily={element.fontFamily}
        fontStyle={element.fontWeight}
        fill={element.color}
        align={element.align}
        verticalAlign="middle"
      />
    </Group>
  );
}
