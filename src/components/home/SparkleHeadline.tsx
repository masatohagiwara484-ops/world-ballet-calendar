'use client'

import { motion, useReducedMotion } from 'framer-motion'
import type { CSSProperties, ReactNode } from 'react'

/**
 * Hero typography effects (framer-motion).
 *  - <SparkleHeadline>: gold text with a slow specular shimmer, a soft luminous
 *    aura, and a handful of twinkling sparkles. Used for the main headline.
 *  - <GlowText>: keeps its own color but breathes a gentle gold glow. Used for
 *    the tagline so the whole "The world's / great stages. / Worth the journey."
 *    block reads as one luminous unit.
 * Both honor prefers-reduced-motion (render as static text).
 */

const SPARKLES = [
  { top: '2%', left: '3%', size: 15, delay: 0.0, dur: 2.6 },
  { top: '-6%', left: '50%', size: 11, delay: 0.9, dur: 3.1 },
  { top: '12%', left: '94%', size: 17, delay: 0.4, dur: 2.9 },
  { top: '70%', left: '6%', size: 12, delay: 1.6, dur: 3.3 },
  { top: '86%', left: '74%', size: 14, delay: 0.6, dur: 2.7 },
  { top: '44%', left: '99%', size: 10, delay: 2.0, dur: 3.0 },
]

export function SparkleHeadline({
  children,
  className,
  style,
}: {
  children: ReactNode
  className?: string
  style?: CSSProperties
}) {
  const reduce = useReducedMotion()

  return (
    <span className="relative inline-block">
      {/* Soft luminous aura behind the text */}
      {!reduce && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 blur-2xl"
          style={{
            background:
              'radial-gradient(ellipse 62% 72% at 50% 50%, rgba(232,201,106,0.40) 0%, transparent 70%)',
          }}
          animate={{ opacity: [0.3, 0.65, 0.3], scale: [0.96, 1.05, 0.96] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* Shimmering gold text */}
      <motion.span
        className={className}
        style={{
          backgroundImage:
            'linear-gradient(110deg, #A8842A 0%, #C9A227 28%, #FBF3CF 48%, #E8C96A 60%, #B8912E 100%)',
          backgroundSize: '230% 100%',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          color: 'transparent',
          ...style,
        }}
        animate={reduce ? undefined : { backgroundPosition: ['180% 50%', '-60% 50%'] }}
        transition={
          reduce ? undefined : { duration: 7, repeat: Infinity, ease: 'linear' }
        }
      >
        {children}
      </motion.span>

      {/* Twinkling sparkles */}
      {!reduce &&
        SPARKLES.map((s, i) => (
          <motion.span
            key={i}
            aria-hidden
            className="pointer-events-none absolute select-none"
            style={{
              top: s.top,
              left: s.left,
              fontSize: s.size,
              lineHeight: 1,
              color: '#FBF3CF',
              textShadow:
                '0 0 8px rgba(232,201,106,0.95), 0 0 16px rgba(212,175,55,0.6)',
            }}
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: [0, 1, 0], scale: [0.3, 1, 0.3], rotate: [0, 90, 0] }}
            transition={{
              duration: s.dur,
              delay: s.delay,
              repeat: Infinity,
              repeatDelay: 1.4,
              ease: 'easeInOut',
            }}
          >
            ✦
          </motion.span>
        ))}
    </span>
  )
}

export function GlowText({
  children,
  className,
  style,
}: {
  children: ReactNode
  className?: string
  style?: CSSProperties
}) {
  const reduce = useReducedMotion()

  return (
    <motion.span
      className={className}
      style={style}
      animate={
        reduce
          ? undefined
          : {
              textShadow: [
                '0 0 0px rgba(212,175,55,0.0)',
                '0 0 20px rgba(212,175,55,0.45)',
                '0 0 0px rgba(212,175,55,0.0)',
              ],
            }
      }
      transition={
        reduce ? undefined : { duration: 3.6, repeat: Infinity, ease: 'easeInOut' }
      }
    >
      {children}
    </motion.span>
  )
}
