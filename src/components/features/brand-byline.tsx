import { brandByline } from '@/lib/brand-name'

/** NEW-269: "by <brand>" under a gym's name; nothing when there is no typed brand. */
export function BrandByline({ brand, gymName, className }: { brand?: string | null; gymName?: string | null; className?: string }) {
  const text = brandByline(brand, gymName)
  if (!text) return null
  return <p className={className ?? 'text-sm font-medium text-white/90 mt-0.5'}>{text}</p>
}
