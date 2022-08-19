import { LOCALE } from "../app.constants";

export function i18nextConfigurationOptions(
  path: string
): Record<string, unknown> {
  return {
    debug: false,
    fallbackLng: LOCALE.EN,
    lng: LOCALE.EN,
    preload: [LOCALE.EN],
    supportedLngs: [LOCALE.EN, LOCALE.CY],
    backend: {
      loadPath: path,
      allowMultiLoading: true,
    },
    detection: {
      lookupCookie: "lang",
      lookupQuerystring: "lang",
      order: ["querystring", "cookie"],
      caches: ["cookie"],
      ignoreCase: true,
      cookieSecure: true,
    },
  };
}
