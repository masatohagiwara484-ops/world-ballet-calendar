'use client'

import { useEffect, useRef, useState } from 'react'
import * as Cesium from 'cesium'
import type { Company } from '@/lib/supabase'

interface CesiumViewerRef extends Cesium.Viewer {
  isDestroyed(): boolean
}

export default function CesiumGlobe() {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<CesiumViewerRef | null>(null)
  const [hoveredCompany, setHoveredCompany] = useState<Company | null>(null)

  // Initialize Cesium viewer
  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return

    // Cesium Ion token (free tier)
    const CesiumModule = Cesium as { Ion: { defaultAccessToken: string } }
    CesiumModule.Ion.defaultAccessToken =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI4OTE5NDc2Yi00MzAxLTQ0NTQtYTk3OS1kZDczN2U3MzYyZjMiLCJpZCI6MTk0NTUxLCJpYXQiOjE3MDI0MTI4Nzh9.3ZKBFx0cXzrEKLSqMvlmPiUU8jLfE7pPDvS5LU8MpVk'

    const viewer = new Cesium.Viewer(containerRef.current, {
      baseLayerPicker: false,
      fullscreenButton: false,
      homeButton: false,
      sceneModePicker: false,
    }) as CesiumViewerRef

    viewer.scene.globe.depthTestAgainstTerrain = true
    viewer.clock.multiplier = 1.0

    viewerRef.current = viewer

    return () => {
      if (viewerRef.current && viewerRef.current.isDestroyed && !viewerRef.current.isDestroyed()) {
        viewerRef.current.destroy()
        viewerRef.current = null
      }
    }
  }, [])

  // Fetch companies and add markers
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await fetch('/api/companies')
        const data = await res.json()

        // Add markers to Cesium viewer
        if (viewerRef.current) {
          (data.companies || []).forEach((company: Company) => {
            const position = Cesium.Cartesian3.fromDegrees(company.lng, company.lat)

            const entity = viewerRef.current!.entities.add({
              position,
              point: {
                pixelSize: 8,
                color: Cesium.Color.fromCssColorString('#D4AF37'),
                outlineColor: Cesium.Color.WHITE,
                outlineWidth: 2,
              },
              label: {
                text: company.name,
                font: '12px sans-serif',
                fillColor: Cesium.Color.WHITE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 1,
                pixelOffset: new Cesium.Cartesian2(0, -20),
                show: false,
              },
            })

            // Add custom properties
            if (!entity.properties) entity.properties = {}
            entity.properties.companyId = company.id
            entity.properties.companyName = company.name
            entity.properties.country = company.country
            entity.properties.city = company.city
            entity.properties.type = company.type

            // Add hover effect
            const handler = new Cesium.ScreenSpaceEventHandler(viewerRef.current!.canvas)
            handler.setInputAction((move: ScreenSpaceEventHandler.MotionEvent) => {
              const pickedObject = viewerRef.current!.scene.pick(move.endPosition)

              if (Cesium.defined(pickedObject) && pickedObject.id === entity) {
                setHoveredCompany(company)
                if (entity.point) entity.point.pixelSize = new Cesium.CallbackProperty(() => 12, false)
                if (entity.label) entity.label.show = true
              } else if (hoveredCompany?.id === company.id) {
                setHoveredCompany(null)
                if (entity.point) entity.point.pixelSize = new Cesium.CallbackProperty(() => 8, false)
                if (entity.label) entity.label.show = false
              }
            }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)
          })
        }
      } catch (error) {
        console.error('Failed to fetch companies:', error)
      }
    }

    fetchCompanies()
  }, [hoveredCompany?.id])

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />

      {/* Tooltip */}
      {hoveredCompany && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-[#2a2a3e]/90 border border-[#D4AF37]/30 backdrop-blur-sm pointer-events-none rounded">
          <p className="text-[#D4AF37] text-[9px] tracking-widest uppercase mb-1">
            {hoveredCompany.type} · {hoveredCompany.city}
          </p>
          <p className="text-white text-sm font-light">
            {hoveredCompany.name}
          </p>
        </div>
      )}
    </div>
  )
}
