import { Upload } from 'lucide-react'
import { useCallback, useState } from 'react'

export default function ImageUpload({ onImageSelect, isAnalyzing }) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file && file.type.startsWith('image/')) onImageSelect(file)
    },
    [onImageSelect],
  )

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleChange = useCallback(
    (e) => {
      const file = e.target.files[0]
      if (file) onImageSelect(file)
    },
    [onImageSelect],
  )

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`
        rounded-2xl border-2 border-dashed transition-all duration-300
        bg-card shadow-[--shadow-card]
        ${isDragging
          ? 'border-accent-pearl bg-pearl-warm shadow-[--shadow-card-hover] scale-[1.01] animate-pulse-glow'
          : 'border-border-warm hover:border-accent-pearl hover:shadow-[--shadow-card-hover]'
        }
      `}
    >
      <label className="flex flex-col items-center justify-center py-20 cursor-pointer">
        <input
          type="file"
          accept="image/*"
          onChange={handleChange}
          disabled={isAnalyzing}
          className="hidden"
        />

        {isAnalyzing ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-48 h-1 rounded-full bg-pearl-deep overflow-hidden">
              <div
                className="h-full w-1/3 rounded-full bg-accent-blue"
                style={{ animation: 'progress-indeterminate 1.2s ease-in-out infinite' }}
              />
            </div>
            <p className="text-text-muted font-medium">Analyzing blood smear...</p>
          </div>
        ) : (
          <>
            <div className="p-4 rounded-2xl bg-pearl-warm mb-5">
              <Upload className="h-10 w-10 text-accent-pearl animate-breathe" />
            </div>
            <p className="text-text-primary font-semibold mb-1">
              Drop a blood smear image here
            </p>
            <p className="text-text-muted text-sm">
              or click to select (PNG, JPG)
            </p>
          </>
        )}
      </label>
    </div>
  )
}
