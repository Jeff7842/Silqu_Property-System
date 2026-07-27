import { Icon as Iconify } from "@iconify/react";
import { ICONS, type IconName } from "@/lib/icons";

export function Icon({
  name,
  size = 20,
  className,
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  return <Iconify icon={ICONS[name]} width={size} height={size} className={className} />;
}
