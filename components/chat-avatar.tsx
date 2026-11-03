import { Avatar, Style } from "@dicebear/core"
import gaze from "@dicebear/styles/gaze.json"
import { cn } from "cn"
import Image from "next/image"

const style = new Style(gaze)

export function ChatAvatar({
  seed,
  animated = false,
  className,
}: {
  seed: string
  animated?: boolean
  className?: string
}) {
  const src = new Avatar(style, {
    seed,
    animationVariant: animated ? "medium" : "none",
  }).toDataUri()

  return (
    <Image
      src={src}
      alt=""
      width={32}
      height={32}
      // Inline SVG data URI: nothing to optimize, and the optimizer would
      // strip the SVG's built-in animation.
      unoptimized
      className={cn("shrink-0 rounded-full", className)}
    />
  )
}
