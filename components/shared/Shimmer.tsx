'use client'

import { cn } from '@/lib/utils'
import type { MotionProps } from 'motion/react'
import { motion } from 'motion/react'
import type { CSSProperties, ElementType, JSX } from 'react'
import { memo, useMemo } from 'react'

type MotionHTMLProps = MotionProps & Record<string, unknown>

const motionComponentCache = new Map<keyof JSX.IntrinsicElements, React.ComponentType<MotionHTMLProps>>()

const getMotionComponent = (element: keyof JSX.IntrinsicElements) => {
  let component = motionComponentCache.get(element)
  if (!component) {
    component = motion.create(element)
    motionComponentCache.set(element, component)
  }
  return component
}

export interface ShimmerProps {
  children: string
  as?: ElementType
  className?: string
  duration?: number
  spread?: number
}

const ShimmerComponent = ({
  children,
  as: Component = 'p',
  className,
  duration = 2,
  spread = 2,
}: ShimmerProps) => {
  const MotionComponent = getMotionComponent(Component as keyof JSX.IntrinsicElements)

  const dynamicSpread = useMemo(
    () => (children?.length ?? 0) * spread,
    [children, spread]
  )

  return (
    <MotionComponent
      animate={{ backgroundPosition: '0% center' }}
      className={cn(
        'relative inline-block bg-[length:250%_100%,auto] bg-clip-text text-transparent',
        className
      )}
      initial={{ backgroundPosition: '100% center' }}
      style={{
        backgroundImage: `linear-gradient(90deg, transparent calc(50% - ${dynamicSpread}px), #ffffff calc(50%), transparent calc(50% + ${dynamicSpread}px)), linear-gradient(#8C8C8C, #8C8C8C)`,
        backgroundRepeat: 'no-repeat, padding-box',
      } as CSSProperties}
      transition={{
        duration,
        ease: 'linear',
        repeat: Number.POSITIVE_INFINITY,
      }}
    >
      {children}
    </MotionComponent>
  )
}

export const Shimmer = memo(ShimmerComponent)
