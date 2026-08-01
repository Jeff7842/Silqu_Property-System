import { type ReactNode } from "react";

/** Off-canvas variant of Modal's Preline overlay pattern. Same data-hs-overlay trigger, PrelineClient's autoInit() wires it up. */
export function Drawer({
  id,
  title,
  children,
  footer,
}: {
  id: string;
  title?: string;
  children?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div
      id={id}
      className="hs-overlay hidden fixed top-0 end-0 z-80 h-full w-full max-w-md transform transition-all duration-300 ease-out translate-x-full hs-overlay-open:translate-x-0"
    >
      <div className="flex h-full flex-col border-s border-line bg-surface shadow-[--shadow-float]">
        {title && (
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h3 className="text-lg font-semibold text-ink">{title}</h3>
            <button
              type="button"
              data-hs-overlay={`#${id}`}
              className="text-ink-muted hover:text-ink"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="border-t border-line px-5 py-4">{footer}</div>}
      </div>
    </div>
  );
}

export { ModalTrigger as DrawerTrigger } from "./modal";

/** Programmatically close a drawer/modal by id, e.g. after a form action succeeds. */
export async function closeOverlay(id: string) {
  const { HSOverlay } = await import("preline/non-auto");
  HSOverlay.close(`#${id}`);
}
