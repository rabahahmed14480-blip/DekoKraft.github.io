export type Lang = "ar" | "de" | "en" | "fr";

export type Direction = "rtl" | "ltr";

export type LanguageOption = {
  value: Lang;
  code: "AR" | "EN" | "DE" | "FR";
  label: string;
};

export type TranslationPrimitive = string | number | boolean;
export type TranslationParams = Record<string, TranslationPrimitive>;
export type LocalizedValue<T = string> = T | Partial<Record<Lang, T>>;

export type BoxModelText = {
  name: string;
  description: string;
};

export type StudioProcessingMessages = {
  title: string;
  imageProcessing: string;
  editTools: string;
  exportTools: string;
  back: string;
  upload: string;
  uploadHint: string;
  brightness: string;
  contrast: string;
  saturation: string;
  sharpness: string;
  sharpnessPlaceholder: string;
  blur: string;
  grayscale: string;
  sepia: string;
  hueRotate: string;
  reset: string;
  compare: string;
  download: string;
  exportPending: string;
  exporting: string;
  exportReady: string;
  exportError: string;
  exportPng: string;
  exportWebp: string;
  exportGif: string;
  gifPending: string;
  copyImage: string;
  copied: string;
  downloadedPng: string;
  downloadedWebp: string;
  copyUnsupported: string;
  exportFailed: string;
  filters: string;
  filtersTitle: string;
  filtersDescription: string;
  closeFilters: string;
  groupLighting: string;
  groupColors: string;
  groupDetails: string;
  groupActions: string;
  actions: string;
  actionsTitle: string;
  actionsDescription: string;
  closeActions: string;
  maximize: string;
  restore: string;
  closeStudio: string;
};

export type VideoWorkspaceMessages = {
  title: string;
  tools: string;
  uploadVideo: string;
  uploadHint: string;
  invalidFile: string;
  play: string;
  pause: string;
  backFive: string;
  forwardFive: string;
  mute: string;
  unmute: string;
  fullscreen: string;
  timeline: string;
  currentTime: string;
  trimStart: string;
  trimEnd: string;
  segmentDuration: string;
  trimSelected: string;
  deleteSelected: string;
  resetSelection: string;
  previewSelection: string;
  exportVideo: string;
  exportEnginePreparing: string;
  selectionPrepared: string;
  deletePending: string;
  duration: string;
  result: string;
  fileName: string;
  fileSize: string;
  fileType: string;
  noVideo: string;
  commands: string;
};

export type ThreeDWorkspaceMessages = {
  title: string;
  importModel: string;
  dropTitle: string;
  orChoose: string;
  supportedFormats: string;
  invalidFormat: string;
  viewerUnavailable: string;
  modelTools: string;
  repairModel: string;
  removeHoles: string;
  smoothSurface: string;
  reducePolygons: string;
  createFlatBase: string;
  measureDimensions: string;
  calculateVolume: string;
  modelInformation: string;
  fileName: string;
  fileType: string;
  fileSize: string;
  vertices: string;
  polygons: string;
  volume: string;
  dimensions: string;
  unknown: string;
  saveStl: string;
  exportObj: string;
  export3mf: string;
  enginePending: string;
  imported: string;
};

export type ImageFloatingToolsMessages = {
  dragPanel: string;
  minimizePanel: string;
  expandPanel: string;
  resetPanelPosition: string;
  experimental: string;
  placeholderMessage: string;
  shadowRemoval: string;
  shadowRemovalStrength: string;
  shadowDetectionSensitivity: string;
  shadowEdgeSoftness: string;
  shadowDetailProtection: string;
  presetLight: string;
  presetMedium: string;
  presetStrong: string;
  removeShadow: string;
  reduceShadows: string;
  removeBackground: string;
  transparentBackground: string;
  whiteBackground: string;
  blurBackground: string;
  smoothEdges: string;
  protectProductDetails: string;
  reduceReflection: string;
  removeNoise: string;
  increaseSharpness: string;
  correctLighting: string;
  correctWhiteBalance: string;
};

export type StudioMessages = {
  center: {
    title: string;
    description: string;
    welcomeCard: string;
    cards: {
      laser: { title: string; description: string };
      threeD: { title: string; description: string };
      embroidery: { title: string; description: string };
      echo: { title: string; description: string };
    };
  };
  echo: {
    gateway: {
      title: string;
      tagline: string;
      description: string;
      categories: string;
      open: string;
    };
    modal: {
      title: string;
      description: string;
      selected: string;
      openWorkshop: string;
      close: string;
      placeholderMessage: string;
    };
    workshops: Record<
      "image" | "threeD" | "laser" | "embroidery" | "cnc" | "vector" | "mold" | "aiDesign",
      { title: string; description: string }
    >;
    status: {
      experimental: string;
      development: string;
      soon: string;
    };
  };
  status: {
    active: string;
    development: string;
    comingSoon: string;
  };
  common: {
    open: string;
    back: string;
    waiting: string;
    comingSoonTitle: string;
    comingSoonMessage: string;
    selectedFile: string;
    noFile: string;
    featureUnavailable: string;
  };
  image: StudioProcessingMessages;
  imageTools: ImageFloatingToolsMessages;
  video: StudioProcessingMessages;
  videoWorkspace: VideoWorkspaceMessages;
  threeDWorkspace: ThreeDWorkspaceMessages;
  threeDImage: StudioProcessingMessages & {
    processing: string;
  };
  laserProcessing: StudioProcessingMessages & {
    processing: string;
  };
  embroideryProcessing: StudioProcessingMessages & {
    processing: string;
  };
  smartEditProcessing: StudioProcessingMessages & {
    processing: string;
  };
  smartEditChat: {
    title: string;
    drag: string;
    minimize: string;
    close: string;
    intro: string;
    productType: string;
    shape: string;
    color: string;
    material: string;
    background: string;
    dimensions: string;
    usage: string;
    notes: string;
    hasWick: string;
    yes: string;
    no: string;
    specsCorrect: string;
    correctSpecs: string;
    cancel: string;
    confirmCorrected: string;
    readyMessage: string;
    composerPlaceholder: string;
    send: string;
    echoRephrase: string;
    confirmRequest: string;
    editRequest: string;
    reject: string;
    confirmedMessage: string;
    enginePending: string;
    productDnaUpdated: string;
    learningUpdated: string;
    artisanUpdated: string;
    correctionsUpdated: string;
    defaultProductType: string;
    defaultShape: string;
    defaultColor: string;
    defaultMaterial: string;
    defaultBackground: string;
    defaultUsage: string;
    products: string;
    currentCategory: string;
    changeCategory: string;
    confirmSpecifications: string;
    dimensionError: string;
    categories: {
      packaging: string;
      candles: string;
      gifts: string;
      kids: string;
      services: string;
    };
    fields: {
      lidType: string;
      closureType: string;
      capacity: string;
      scent: string;
      burnTime: string;
      waxType: string;
      personalization: string;
      occasion: string;
      ageGroup: string;
      educationalGoal: string;
      safetyNotes: string;
      serviceType: string;
      inputFileType: string;
      outputFileType: string;
      estimatedDuration: string;
      dimensionLength: string;
      dimensionWidth: string;
      dimensionHeight: string;
      dimensionUnit: string;
    };
    originalSaved: string;
    editOriginalSpecifications: string;
    appearanceQuestion: string;
    backgroundOption: string;
    colorsOption: string;
    lightingOption: string;
    shadowsOption: string;
    preserveShapeOption: string;
    improveQualityOption: string;
    backgroundOptions: {
      transparent: string;
      transparentBlur: string;
      transparentGlass: string;
      white: string;
      black: string;
      original: string;
      custom: string;
    };
    colorOptions: {
      preserveOriginal: string;
      enhance: string;
      warm: string;
      cool: string;
      monochrome: string;
      custom: string;
      global: string;
    };
    requestSummary: string;
    confirmGeneration: string;
    modifyGeneration: string;
    cancelGeneration: string;
    noOriginalImage: string;
    generating: string;
    transparentGenerating: string;
    transparentSuccess: string;
    transparentInvalidResult: string;
    generationUnavailable: string;
    compareBeforeAfter: string;
    returnToOriginal: string;
    showOriginal: string;
    showResult: string;
    retryGeneration: string;
    rejectResult: string;
    downloadResult: string;
    acceptResult: string;
    resultAccepted: string;
    echoGuideTitle: string;
    echoGuideIntro: string;
    quickActions: {
      professionalBackground: string;
      improveLighting: string;
      reduceShadows: string;
      preserveShape: string;
      advertisement: string;
      reviewQuality: string;
    };
  };
  laser: {
    title: string;
    description: string;
    tabs: {
      drawing: string;
      vectors: string;
      settings: string;
      dna: string;
      echo: string;
    };
    sections: {
      drawingTitle: string;
      drawingDescription: string;
      vectorsTitle: string;
      vectorsDescription: string;
      settingsTitle: string;
      settingsDescription: string;
      dnaTitle: string;
      echoTitle: string;
      magicShapes: string;
    };
    tools: Record<
      | "select" | "line" | "rectangle" | "square" | "circle" | "ellipse"
      | "triangle" | "polygon" | "star" | "heart" | "curve" | "pen"
      | "eraser" | "text" | "fill" | "eyedropper",
      string
    >;
    vectors: Record<
      | "union" | "difference" | "intersect" | "weld" | "offset" | "editNodes"
      | "breakApart" | "group" | "ungroup" | "align" | "distribute" | "mirror" | "rotate",
      string
    >;
    settings: {
      operation: string;
      speed: string;
      power: string;
      passes: string;
      airAssist: string;
      kerf: string;
      material: string;
      thickness: string;
      workspace: string;
      cut: string;
      engrave: string;
      score: string;
      fill: string;
      on: string;
      off: string;
    };
    dna: {
      intro: string;
      fields: Record<
        "accuracy" | "pathSafety" | "cutability" | "weakParts" | "workTime" | "materialUse" | "burnRisk" | "echoScore",
        string
      >;
    };
    echo: {
      description: string;
      placeholder: string;
      generate: string;
      examplesTitle: string;
      example1: string;
      example2: string;
      example3: string;
      example4: string;
      example5: string;
    };
    magic: {
      title: string;
      description: string;
      selected: string;
      add: string;
      message: string;
      shapes: Record<
        | "square" | "rectangle" | "circle" | "hexagon" | "star" | "heart" | "flower"
        | "leaf" | "butterfly" | "puzzle" | "box" | "house" | "namePlate" | "frame"
        | "ringBox" | "candleBox" | "fingerJoint",
        string
      >;
    };
  };
  threeD: {
    title: string;
    description: string;
    development: string;
    tabs: Record<"upload" | "analysis" | "dna" | "repair" | "printability" | "compare" | "echo", string>;
    upload: {
      title: string;
      description: string;
      images: string;
      stl: string;
      obj: string;
      ply: string;
    };
    dna: {
      title: string;
      description: string;
      fields: Record<
        | "shapeType" | "dimensions" | "volume" | "surfaceArea" | "symmetry" | "curves"
        | "edges" | "cavities" | "wallThickness" | "missingParts" | "complexity"
        | "repairability" | "printability" | "echoScore",
        string
      >;
    };
  };
  embroidery: {
    title: string;
    description: string;
    development: string;
    tabs: Record<"upload" | "analysis" | "dna" | "stitches" | "fabric" | "quality" | "echo", string>;
    upload: {
      title: string;
      description: string;
      images: string;
      design: string;
    };
    dna: {
      title: string;
      description: string;
      fields: Record<
        | "colors" | "fabricType" | "threadType" | "satin" | "fill" | "singleRun"
        | "density" | "direction" | "underlay" | "startEnd" | "jumps" | "trim"
        | "stackRisk" | "tearRisk" | "duration" | "stitchCount" | "echoScore",
        string
      >;
    };
  };
};

export type LocaleMessages = {
  languageName: string;
  dir: Direction;
  header: {
    cmsDescription: string;
    brand: string;
    tagline: string;
  };
  announcement: [string, string, string, string];
  publicHeader: {
    menu: string;
    login: string;
    searchPlaceholder: string;
    search: string;
    language: string;
    account: string;
    market: string;
    favorites: string;
    cart: string;
    settings: string;
    actions: string;
  };
  toolbar: {
    menu: string;
    settings: string;
    language: string;
    market: string;
    login: string;
    account: string;
    favorites: string;
    cart: string;
    search: string;
    openMenu: string;
    openSettings: string;
    changeLanguage: string;
    openMarket: string;
    signIn: string;
    signOut: string;
  };
  common: {
    search: string;
    loading: string;
    yes: string;
    no: string;
    packaging: string;
    candles: string;
    gifts: string;
    educationalGames: string;
    models: string;
    variants: string;
    colors: string;
    back: string;
    buy: string;
    customBox: string;
    selectedModel: string;
    thumbnailAlt: string;
  };
  homepage: {
    eyebrow: string;
    title: string;
    sectionsEyebrow: string;
    sectionsTitle: string;
    marketEyebrow: string;
    marketTitle: string;
    latestEyebrow: string;
    latestTitle: string;
  };
  categories: {
    notFound: string;
  };
  products: {
    categoryLabel: string;
  };
  participant: {
    title: string;
    studio: string;
  };
  seller: {
    dashboard: string;
    login: string;
    logout: string;
    stores: string;
    profile: string;
    accountMenu: string;
    studioTitle: string;
    welcome: string;
    addProduct: string;
    openStudio: string;
    previewStore: string;
    statsLabel: string;
    productCount: string;
    published: string;
    drafts: string;
    underReview: string;
    lowStock: string;
    averageEcho: string;
    smartReview: string;
    attentionTitle: string;
    viewAllProducts: string;
    noAttention: string;
    products: string;
    orders: string;
    customers: string;
    analytics: string;
    media: string;
    earnings: string;
    settings: string;
    studio: string;
    aiCost: string;
    invoices: string;
    inventory: string;
    support: string;
    navigationLabel: string;
    preparing: string;
    storeSettings: string;
    developmentSwitch: string;
    backToSite: string;
    status: {
      active: string;
      invited: string;
      paused: string;
      suspended: string;
    };
  };
  market: {
    title: string;
    description: string;
    storeNotFound: string;
    backHome: string;
    logoAlt: string;
    languages: string;
    storeCategories: string;
    fromStore: string;
    publishedProducts: string;
    noPublishedProducts: string;
  };
  login: {
    title: string;
    submit: string;
    description: string;
    email: string;
    password: string;
    passwordRequired: string;
    failed: string;
    testAccountMissing: string;
    quickFailed: string;
    testAccounts: string;
    testAccountsDescription: string;
    quickLogin: string;
  };
  register: {
    title: string;
    submit: string;
    inviteLoading: string;
    inviteNotFound: string;
    inviteTitle: string;
    sellerName: string;
    storeName: string;
    email: string;
    acceptInvite: string;
  };
  dashboard: {
    title: string;
  };
  dekoBrain: {
    title: string;
    description: string;
  };
  notifications: {
    success: string;
    error: string;
  };
  buttons: {
    open: string;
    close: string;
    save: string;
    cancel: string;
    back: string;
    next: string;
  };
  errors: {
    generic: string;
    missingTranslation: string;
  };
  footer: {
    description: string;
    sellerLogin: string;
    sellerDashboard: string;
    admin: string;
    navigationLabel: string;
    rights: string;
    legalLinks: string;
    top: string;
  };
  welcome: {
    title: string;
    subtitle: string;
    introTitle: string;
    introTagline: string;
    skip: string;
    replay: string;
    comingSoon: string;
    navigationLabel: string;
    cards: {
      home: string;
      market: string;
      artisans: string;
      join: string;
      login: string;
      about: string;
      comments: string;
      suggestions: string;
      services: string;
      studio: string;
    };
  };
  home: {
    heroDescription: string;
    sections: {
      packaging: {
        title: string;
        description: string;
      };
      candles: {
        title: string;
        description: string;
      };
      gifts: {
        title: string;
        description: string;
      };
      kids: {
        title: string;
        description: string;
      };
    };
  };
  category: {
    notFound: string;
    sections: {
      boxes: {
        title: string;
        description: string;
      };
      gift: {
        title: string;
        description: string;
      };
      candles: {
        title: string;
        description: string;
      };
      kids: {
        title: string;
        description: string;
      };
    };
  };
  product: {
    boxTitle: string;
    boxDescription: string;
    dimensions: {
      length: string;
      width: string;
      height: string;
      minNotice: string;
      maxNotice: string;
      acceptedNotice: string;
    };
    boxModels: BoxModelText[];
  };
  servicesCenter: {
    title: string;
    description: string;
    navigationLabel: string;
    futureNotice: string;
    open: string;
    close: string;
    modalDescription: string;
    about: string;
    association: string;
    shipping: string;
    payment: string;
    dataProtection: string;
    privacy: string;
    faq: string;
    contact: string;
    legal: string;
    futureTool: string;
    terms: string;
    returns: string;
    suggestFeature: string;
    helper: string;
    support: string;
    unavailable: string;
  };
  studio: StudioMessages;
  dashboardCards: {
    products: string;
    orders: string;
    customers: string;
    analytics: string;
    media: string;
    earnings: string;
    settings: string;
    studio: string;
    registrations: string;
    participants: string;
    financial: string;
    aiCost: string;
    invoices: string;
    inventory: string;
    support: string;
    dekoclean: string;
  };
  dashboardCardDescriptions: {
    aiCost: string;
    dekoclean: string;
    maintenance: string;
  };
  participantStudio: {
    title: string;
    description: string;
    navigationLabel: string;
    closeMenu: string;
    cardLabels: {
      inventory: string;
      earnings: string;
      settings: string;
      maintenance: string;
    };
    placeholders: {
      products: string;
      orders: string;
      customers: string;
      analytics: string;
      media: string;
      earnings: string;
      settings: string;
      studio: string;
      aiCost: string;
      invoices: string;
      inventory: string;
      support: string;
    };
  };
  admin: {
    readySection: string;
    version: string;
    rights: string;
    addProduct: string;
    brainCenter: {
      eyebrow: string;
      title: string;
      description: string;
      navigationLabel: string;
      statsLabel: string;
      productIdentity: string;
      echoLearning: string;
      knowledgeTree: string;
      livingIdentity: string;
      progress: string;
      corrections: string;
      tests: string;
      reports: string;
      learnedProducts: string;
      savedCorrections: string;
      knowledgeRules: string;
      confidence: string;
      lastLearning: string;
      noLearningYet: string;
      placeholderDescription: string;
      productIdentityDescription: string;
      experiment: {
        start: string; title: string; description: string; close: string; disclaimer: string;
        analyze: string; confirmDNA: string; confirmed: string; none: string; empty: string;
        unknown: string; unnamedProduct: string; smartSuggestion: string; requestPlaceholder: string;
        createSuggestion: string; echoUnderstood: string; editHint: string; confirm: string;
        editRequest: string; reject: string; newExperiment: string; clearData: string;
        clearConfirm: string; echoSuggestion: string;
        fields: { productName: string; productType: string; description: string; image: string; material: string; color: string; dimensions: string; usage: string; style: string };
        shapes: { round: string; square: string; rectangle: string };
        dna: { identity: string; category: string; material: string; shape: string; color: string; style: string; usage: string; completeness: string; needsConfirmation: string };
        result: { title: string; understood: string; confirmed: string; ignored: string; stored: string; dnaChange: string; artisanChange: string; analysisUnderstood: string; unconfirmedIgnored: string; dnaConfirmed: string; localRecordStored: string; dnaUpdated: string; suggestionNotStored: string; learningStored: string; preferenceAddedToDNA: string; preferenceAddedToArtisan: string; nothingStored: string };
        details: { knowledgeDescription: string; artisanDescription: string; learningDescription: string; firstExperiment: string; lastExperiment: string; performanceDescription: string };
        test: { question: string; check: string; understood: string; missing: string };
      };
      backToDashboard: string;
    };
    sellerStores: {
      eyebrow: string;
      title: string;
      description: string;
      openStore: string;
      addStore: string;
      addStoreDescription: string;
      potsdamName: string;
      potsdamDescription: string;
      potsdamPageDescription: string;
      storeDescription: string;
      demoName: string;
      craftBoxesName: string;
      homeColorsName: string;
      woodStoryName: string;
      city: string;
      country: string;
      berlin: string;
      hamburg: string;
      potsdam: string;
      germany: string;
      newStorePageDescription: string;
      backToDashboard: string;
    };
    dashboard: {
      pageTitle: string;
      pageSubtitle: string;
      heroTitle: string;
      heroText: string;
      stats: {
        orders: string;
        customers: string;
        gallery: string;
        products: string;
      };
      quickTitle: string;
      quick: {
        products: string;
        gallery: string;
        backgrounds: string;
        colors: string;
        statistics: string;
      };
    };
    sidebar: {
      dashboard: string;
      products: string;
      dekobrain: string;
      gallery: string;
      videos: string;
      backgrounds: string;
      colors: string;
      languages: string;
      offers: string;
      customers: string;
      orders: string;
      statistics: string;
    };
  };
};
