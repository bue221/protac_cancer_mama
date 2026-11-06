declare module "3dmol" {
  export interface AtomSpec {
    x: number
    y: number
    z: number
  }

  export interface Viewer {
    addModel: (data: string, format: string, options?: { keepH?: boolean }) => unknown
    setStyle: (sel: object, style: object) => void
    addStyle: (sel: object, style: object) => void
    addSurface: (
      type: unknown,
      style: object,
      sel: object,
      sel2?: object,
    ) => Promise<unknown> | unknown
    removeAllSurfaces: () => void
    removeAllLabels: () => void
    removeAllShapes: () => void
    addLabel: (text: string, options: object, sel: object) => void
    addCylinder: (spec: object) => void
    selectedAtoms: (sel: object) => AtomSpec[]
    zoomTo: (sel?: object, duration?: number) => void
    zoom: (factor: number, animationDuration?: number) => void
    render: () => void
    clear: () => void
  }

  export interface ViewerConfig {
    backgroundColor?: string
    antialias?: boolean
  }

  export function createViewer(
    element: HTMLElement,
    config?: ViewerConfig,
  ): Viewer

  export const SurfaceType: {
    VDW: unknown
    MS: unknown
    SAS: unknown
    SES: unknown
  }
}
