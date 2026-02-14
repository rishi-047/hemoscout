import { useState } from 'react'
import { Microscope } from 'lucide-react'
import ImageUpload from './components/ImageUpload'
import ImageViewer from './components/ImageViewer'
import CellCounts from './components/CellCounts'
import Histogram from './components/Histogram'
import InsightPanel from './components/InsightPanel'

const API_BASE = import.meta.env.VITE_API_URL || ''

export default function App() {
  const [imageFile, setImageFile] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)

  const handleImageSelect = async (file) => {
    setImageFile(file)
    setIsAnalyzing(true)
    setError(null)
    setResults(null)

    const form = new FormData()
    form.append('file', file)

    try {
      const res = await fetch(`${API_BASE}/analyze`, { method: 'POST', body: form })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || `Server error (${res.status})`)
      }
      const data = await res.json()
      if (data.status === 'success') {
        setResults(data)
      } else {
        throw new Error('Unexpected response')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const reset = () => {
    setImageFile(null)
    setResults(null)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-pearl text-text-primary">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border-subtle shadow-[--shadow-header]">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-accent-blue/10">
            <Microscope className="h-6 w-6 text-accent-blue" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">HemoScout</h1>
            <p className="text-xs font-medium text-text-muted tracking-wide">
              AI-Powered Blood Smear Analysis
            </p>
          </div>
        </div>
        {/* Pearl accent line */}
        <div className="h-px bg-gradient-to-r from-transparent via-accent-pearl/40 to-transparent" />
      </header>

      {/* ── Main ── */}
      <main className="max-w-7xl mx-auto px-8 py-10">
        <div className="grid lg:grid-cols-2 gap-10">
          {/* Left — Image */}
          <div className="space-y-5">
            {!imageFile ? (
              <ImageUpload
                onImageSelect={handleImageSelect}
                isAnalyzing={isAnalyzing}
              />
            ) : (
              <>
                <ImageViewer
                  imageFile={imageFile}
                  detections={results?.data?.detections}
                />
                {!isAnalyzing && (
                  <button
                    onClick={reset}
                    className="w-full py-2.5 rounded-2xl bg-pearl-warm hover:bg-pearl-deep
                               text-sm font-medium text-text-secondary
                               shadow-[--shadow-card] hover:shadow-[--shadow-card-hover]
                               hover:scale-[1.01] active:scale-[0.99]
                               transition-all duration-200 cursor-pointer"
                  >
                    Upload New Image
                  </button>
                )}
              </>
            )}

            {isAnalyzing && imageFile && (
              <div className="flex flex-col items-center gap-3 py-6 animate-fade-in">
                <div className="w-48 h-1 rounded-full bg-pearl-deep overflow-hidden">
                  <div
                    className="h-full w-1/3 rounded-full bg-accent-blue"
                    style={{ animation: 'progress-indeterminate 1.2s ease-in-out infinite' }}
                  />
                </div>
                <span className="text-sm font-medium text-text-muted">
                  Running analysis...
                </span>
              </div>
            )}
          </div>

          {/* Right — Stats */}
          <div className="space-y-6">
            <CellCounts
              counts={results?.data?.counts}
              avgSize={results?.data?.avg_size_px}
            />
            <Histogram data={results?.data?.histogram} />
            <InsightPanel insight={results?.insight} error={error} />
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="mt-16 py-6 border-t border-border-subtle">
        <p className="text-center text-xs text-text-muted">
          HemoScout v1.0 &mdash; YOLOv8 + Gemini 2.5 Flash
        </p>
      </footer>
    </div>
  )
}
