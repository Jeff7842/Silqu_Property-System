import { type ReactNode, type ButtonHTMLAttributes } from "react";

/** Preline overlay pattern. PrelineClient's autoInit() wires up data-hs-overlay. */
export function Modal({
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
      className="hs-overlay hidden size-full fixed top-0 start-0 z-80 overflow-x-hidden overflow-y-auto pointer-events-none"
    >
      <div className="hs-overlay-open:mt-7 hs-overlay-open:opacity-100 hs-overlay-open:duration-500 mt-0 opacity-0 ease-out transition-all sm:max-w-lg sm:w-full m-3 sm:mx-auto">
        <div className="flex flex-col rounded-[--radius-card] border border-line bg-surface shadow-[--shadow-float] pointer-events-auto">
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
          <div className="px-5 py-4">{children}</div>
          {footer && <div className="border-t border-line px-5 py-4">{footer}</div>}
        </div>
      </div>
    </div>
  );
}

export function ModalTrigger({
  targetId,
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { targetId: string }) {
  return (
    <button type="button" data-hs-overlay={`#${targetId}`} className={className} {...props}>
      {children}
    </button>
  );
}
