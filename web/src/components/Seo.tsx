import { useEffect } from "react"

import { applyPageSeo, type PageSeo } from "@/lib/seo"

export function Seo(props: PageSeo) {
  useEffect(() => {
    applyPageSeo(props)
  }, [props.title, props.description, props.path, props.image, props.type, props.noIndex])

  return null
}
