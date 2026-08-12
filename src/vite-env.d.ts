/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY?: string;
  readonly VITE_SUPPORT_KOFI?: string;
  readonly VITE_SUPPORT_GITHUB_SPONSORS?: string;
  readonly VITE_SUPPORT_PATREON?: string;
  readonly VITE_PRO_PRODUCT_URL?: string;
  readonly VITE_GUMROAD_PRODUCT_ID?: string;
  readonly VITE_ADSENSE_CLIENT?: string;
  readonly VITE_ADSENSE_SLOT?: string;
  readonly VITE_AFFILIATE_ENABLED?: string;
  readonly VITE_GIT_SHA?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
