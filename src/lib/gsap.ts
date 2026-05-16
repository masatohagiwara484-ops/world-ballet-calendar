import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

export { gsap, ScrollTrigger }

export const EASE = {
  smooth: 'power3.out',
  cinematic: 'expo.out',
  gentle: 'power1.out',
}

export const DURATION = {
  fast: 0.6,
  normal: 0.9,
  slow: 1.4,
  cinematic: 2.0,
}
