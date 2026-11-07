export const SITE_URL =
  (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, "") ||
  "https://web-topaz-eight-18.vercel.app"

export const SITE_NAME = "PROTAC · cáncer de mama"

export const DEFAULT_DESCRIPTION =
  "Diseño computacional de un PROTAC HSP90–AUY922–PEG2–VH032–VHL: mecanismo, docking, viabilidad in silico, AlphaFold PPI y visor 3D del complejo ternario."

export type PageSeo = {
  title: string
  description: string
  path: string
  image?: string
  type?: "website" | "article"
  noIndex?: boolean
}

function upsertMeta(
  attr: "name" | "property",
  key: string,
  content: string,
) {
  const selector = `meta[${attr}="${key}"]`
  let el = document.head.querySelector(selector) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement("meta")
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.content = content
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null
  if (!el) {
    el = document.createElement("link")
    el.rel = rel
    document.head.appendChild(el)
  }
  el.href = href
}

export function applyPageSeo(seo: PageSeo) {
  const title = seo.title.includes(SITE_NAME)
    ? seo.title
    : `${seo.title} · ${SITE_NAME}`
  const url = `${SITE_URL}${seo.path}`
  const image = seo.image ?? `${SITE_URL}/poster/mecanismo-protac.png`

  document.title = title
  upsertMeta("name", "description", seo.description)
  upsertMeta("name", "robots", seo.noIndex ? "noindex,nofollow" : "index,follow")
  upsertLink("canonical", url)

  upsertMeta("property", "og:title", title)
  upsertMeta("property", "og:description", seo.description)
  upsertMeta("property", "og:url", url)
  upsertMeta("property", "og:image", image)
  upsertMeta("property", "og:type", seo.type ?? "website")
  upsertMeta("property", "og:site_name", SITE_NAME)
  upsertMeta("property", "og:locale", "es_ES")

  upsertMeta("name", "twitter:card", "summary_large_image")
  upsertMeta("name", "twitter:title", title)
  upsertMeta("name", "twitter:description", seo.description)
  upsertMeta("name", "twitter:image", image)
}
