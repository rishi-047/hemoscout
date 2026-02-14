import { useEffect, useRef, useState } from 'react'

export default function ImageViewer({ imageFile, detections }) {
  const canvasRef = useRef(null)
  const [dims, setDims] = useState(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setLoaded(false)

    if (!imageFile || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const img = new Image()
    const url = URL.createObjectURL(imageFile)

    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      setDims({ w: img.width, h: img.height })

      ctx.drawImage(img, 0, 0)

      if (detections?.length) {
        detections.forEach(({ box, label, color }) => {
          const [x1, y1, x2, y2] = box
          const w = x2 - x1
          const h = y2 - y1

          ctx.strokeStyle = color
          ctx.lineWidth = 2
          ctx.strokeRect(x1, y1, w, h)

          ctx.font = 'bold 11px Inter, sans-serif'
          const tw = ctx.measureText(label).width
          ctx.fillStyle = color
          ctx.fillRect(x1, y1 - 16, tw + 8, 16)
          ctx.fillStyle = '#fff'
          ctx.fillText(label, x1 + 4, y1 - 4)
        })
      }

      requestAnimationFrame(() => setLoaded(true))
    }

    img.src = url
    return () => URL.revokeObjectURL(url)
  }, [imageFile, detections])

  if (!imageFile) {
    return (
      <div className="rounded-2xl bg-card border border-border-subtle shadow-[--shadow-card] flex items-center justify-center h-80">
        <p className="text-text-muted">No image loaded</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-card border border-border-subtle shadow-[--shadow-card] p-5 animate-fade-in-up">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-text-primary tracking-tight">
          Blood Smear Analysis
        </h3>
        {dims && (
          <span className="text-xs text-text-muted tabular-nums">
            {dims.w} &times; {dims.h}px
          </span>
        )}
      </div>

      <div className="overflow-auto max-h-[520px] rounded-xl bg-pearl-warm shadow-inner">
        <canvas
          ref={canvasRef}
          className="max-w-full h-auto transition-opacity duration-500"
          style={{ opacity: loaded ? 1 : 0 }}
        />
      </div>

      {detections && (
        <div className="mt-4 flex gap-5 text-sm">
          {[
            { label: 'RBC', color: '#ef4444' },
            { label: 'WBC', color: '#3b82f6' },
            { label: 'Platelets', color: '#eab308' },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-text-secondary text-xs font-medium">
                {label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
