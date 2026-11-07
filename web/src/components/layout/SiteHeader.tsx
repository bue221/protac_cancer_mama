import { Link, NavLink } from "react-router-dom"
import { Menu } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

const links = [
  { to: "/", label: "Inicio" },
  { to: "/viabilidad", label: "Viabilidad" },
  { to: "/visor", label: "Visor 3D" },
  { to: "/wiki", label: "Wiki" },
]

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.to === "/"}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "text-sm tracking-wide transition-colors",
              isActive
                ? "text-primary font-semibold"
                : "text-muted-foreground hover:text-foreground",
            )
          }
        >
          {link.label}
        </NavLink>
      ))}
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
