import { useEffect } from "react"

import { REPO_WIKI_URL } from "@/lib/links"

/** Redirige a la wiki del repo; las páginas internas eran demasiado escuetas. */
export function WikiRedirectPage() {
  useEffect(() => {
    window.location.replace(REPO_WIKI_URL)
  }, [])

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-muted-foreground sm:px-6">
      <p>Abriendo la wiki del repositorio…</p>
      <p className="mt-3 text-sm">
        Si no redirige,{" "}
        <a href={REPO_WIKI_URL} className="text-primary hover:underline">
          ábrela aquí
        </a>
        .
      </p>
    </div>
  )
}
