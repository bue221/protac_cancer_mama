type PosterFigureProps = {
  src: string
  alt: string
  caption: string
  credit?: string
  className?: string
}

export function PosterFigure({
  src,
  alt,
  caption,
  credit = "Figura del póster RedColsi Nacional · Martínez-Burbano DV & Martínez-González LG",
  className,
}: PosterFigureProps) {
  return (
    <figure className={className}>
      <div className="overflow-hidden border border-border/80 bg-card/40">
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="h-auto w-full object-cover"
        />
      </div>
      <figcaption className="mt-3 space-y-1 text-sm leading-relaxed text-muted-foreground">
        <p>{caption}</p>
        <p className="font-mono text-[0.7rem] tracking-wide uppercase opacity-80">{credit}</p>
      </figcaption>
    </figure>
  )
}
