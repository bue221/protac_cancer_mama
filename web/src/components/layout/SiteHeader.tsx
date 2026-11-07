import { Link, NavLink } from "react-router-dom"
import { ExternalLink, Menu } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { REPO_WIKI_URL } from "@/lib/links"
import { cn } from "@/lib/utils"

const links: Array<
  | { kind: "route"; to: string; label: string; end?: boolean }
  | { kind: "external"; href: string; label: string }
> = [
  { kind: "route", to: "/", label: "Inicio", end: true },
  { kind: "route", to: "/resultados", label: "Resultados" },
  { kind: "route", to: "/viabilidad", label: "Viabilidad" },
  { kind: "route", to: "/visor", label: "Visor 3D" },
  { kind: "route", to: "/alphafold", label: "AlphaFold" },
  { kind: "route", to: "/limitaciones", label: "Limitaciones" },
  { kind: "external", href: REPO_WIKI_URL, label: "Wiki" },
]

const navClass = (active: boolean) =>
  cn(
    "inline-flex items-center gap-1 text-sm tracking-wide transition-colors",
    active ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground",
  )

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      {links.map((link) =>
        link.kind === "external" ? (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noreferrer"
            onClick={onNavigate}
            className={navClass(false)}
          >
            {link.label}
            <ExternalLink className="size-3 opacity-60" aria-hidden />
          </a>
        ) : (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            onClick={onNavigate}
            className={({ isActive }) => navClass(isActive)}
          >
            {link.label}
          </NavLink>
        ),
      )}
    </>
  )
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="font-heading text-base font-semibold tracking-tight text-ink">
          PROTAC <span className="text-primary">cáncer de mama</span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          <NavItems />
        </nav>

        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon-sm" aria-label="Abrir menú">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle className="font-heading">Navegación</SheetTitle>
              </SheetHeader>
              <div className="mt-6 flex flex-col gap-4 px-4">
                <NavItems />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
