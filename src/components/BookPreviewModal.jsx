export default function BookPreviewModal({ open, onClose }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="relative w-full max-w-5xl overflow-hidden rounded-2xl bg-white p-0 shadow-2xl" onClick={(e)=>e.stopPropagation()}>
        <button onClick={onClose} aria-label="Close" className="absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/80 text-white hover:bg-black">×</button>
        <div className="aspect-[16/9] w-full bg-white">
          <model-viewer src="/assets/models/book.glb" alt="3D book preview" camera-controls auto-rotate shadow-intensity="0.6" environment-image="neutral" poster="/assets/models/book-poster.svg" reveal="auto" loading="eager" style={{ width:'100%', height:'100%', background:'transparent' }}></model-viewer>
        </div>
      </div>
    </div>
  )
}

