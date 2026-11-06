import { lazy, Suspense } from "react"
import { BrowserRouter, Route, Routes } from "react-router-dom"

import { SiteFooter } from "@/components/layout/SiteFooter"
import { SiteHeader } from "@/components/layout/SiteHeader"
import { HomePage } from "@/pages/HomePage"
import { ViabilidadPage } from "@/pages/ViabilidadPage"
import { WikiArticlePage } from "@/pages/WikiArticlePage"
import { WikiPage } from "@/pages/WikiPage"

const VisorPage = lazy(async () => {
  const mod = await import("@/pages/VisorPage")
  return { default: mod.VisorPage }
})

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">
          <Suspense
            fallback={
              <div className="mx-auto max-w-6xl px-4 py-16 text-muted-foreground sm:px-6">
                Cargando…
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/viabilidad" element={<ViabilidadPage />} />
              <Route path="/visor" element={<VisorPage />} />
              <Route path="/wiki" element={<WikiPage />} />
              <Route path="/wiki/:slug" element={<WikiArticlePage />} />
            </Routes>
          </Suspense>
        </main>
        <SiteFooter />
      </div>
    </BrowserRouter>
  )
}
