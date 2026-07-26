import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const GALLERY = [
  { src: '/RV Block.png', caption: 'RV Block — CSE & IT Academic Hub', tag: 'Academics' },
  { src: '/KS Block.jpg', caption: 'KS Block — ECE, EEE, ICE wing', tag: 'Academics' },
  { src: '/BD Block.jpg', caption: 'BD Block — AI/DS & Central Library', tag: 'Library' },
  { src: '/Study place in Library.png', caption: 'Central Library Study Lounges', tag: 'Library' },
  { src: '/Computer lab.png', caption: 'Main Computing Lab Center', tag: 'Labs' },
  { src: '/Smart Classroom.png', caption: 'Smart Classroom & Presentation Halls', tag: 'Academics' },
  { src: '/Mechanical and ME block.png', caption: 'Mechanical Engineering Block & Workshop', tag: 'Labs' },
  { src: '/Boys Hosel.png', caption: 'Boys Hostel Residence & Mess Complex', tag: 'Hostel' },
  { src: '/Cafetaria.png', caption: 'Campus Cafeteria & Food Court', tag: 'Amenities' },
  { src: '/Temple.png', caption: 'Ganesha Temple Shrine', tag: 'Religious' },
  { src: '/Cricket ground.png', caption: 'TDCA Turf Cricket Ground', tag: 'Sports' }
];

const CampusGallery = () => {
  const [lightboxIdx, setLightboxIdx] = useState(null);
  const [loadedSet, setLoadedSet] = useState({});

  const openLightbox = (i) => setLightboxIdx(i);
  const closeLightbox = () => setLightboxIdx(null);
  
  const prevImage = () => setLightboxIdx(i => (i > 0 ? i - 1 : GALLERY.length - 1));
  const nextImage = () => setLightboxIdx(i => (i < GALLERY.length - 1 ? i + 1 : 0));

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (lightboxIdx === null) return;
    
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') prevImage();
      else if (e.key === 'ArrowRight') nextImage();
      else if (e.key === 'Escape') closeLightbox();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIdx]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-primaryContainer flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-primary text-[18px]"
                style={{ fontVariationSettings: "'FILL' 1" }}>photo_library</span>
        </div>
        <div>
          <h2 className="text-[11px] font-black text-onSurfaceVariant uppercase tracking-widest">Campus Gallery</h2>
          <p className="text-[11px] text-onSurfaceVariant/60">Explore the campus visually</p>
        </div>
      </div>

      {/* Masonry-ish Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {GALLERY.map((img, i) => (
          <button
            key={i}
            onClick={() => openLightbox(i)}
            className="group relative overflow-hidden rounded-2xl cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary border border-outline/10 shadow-2xs hover:shadow-elevation1 transition-all"
            style={{
              gridRow: (i === 0 || i === 5) ? 'span 2' : 'span 1',
              aspectRatio: (i === 0 || i === 5) ? '3/4' : '4/3',
            }}
          >
            {/* Lazy-loaded Image */}
            <div className={`absolute inset-0 bg-surfaceVariant/30 transition-opacity duration-300 ${loadedSet[i] ? 'opacity-0' : 'opacity-100'}`}>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px] text-onSurfaceVariant/20 animate-pulse">image</span>
              </div>
            </div>
            <img
              src={img.src}
              alt={img.caption}
              loading="lazy"
              onLoad={() => setLoadedSet(s => ({ ...s, [i]: true }))}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 text-left">
              <span className="bg-white/20 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md w-fit mb-1">{img.tag}</span>
              <p className="text-white text-[11px] font-extrabold leading-tight">{img.caption}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && createPortal(
        <div
          className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center backdrop-blur-xs"
          onClick={closeLightbox}
        >
          <style>{`@keyframes lbIn{from{opacity:0;transform:scale(0.97)}to{opacity:1;transform:scale(1)}}`}</style>
          
          {/* Close */}
          <button onClick={closeLightbox}
                  className="absolute top-4 right-4 p-2.5 bg-white/10 hover:bg-white/20 rounded-full text-white z-10 cursor-pointer transition-colors">
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>

          {/* Prev */}
          <button
            onClick={e => { e.stopPropagation(); prevImage(); }}
            className="absolute left-3 sm:left-6 p-2.5 sm:p-3 bg-white/10 hover:bg-white/20 rounded-full text-white z-10 cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[24px]">chevron_left</span>
          </button>

          {/* Image */}
          <div
            key={lightboxIdx}
            className="max-w-3xl w-full mx-4 sm:mx-12 flex flex-col items-center"
            onClick={e => e.stopPropagation()}
            style={{ animation: 'lbIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
          >
            <img
              src={GALLERY[lightboxIdx].src}
              alt={GALLERY[lightboxIdx].caption}
              className="w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl border border-white/10"
            />
            <div className="mt-4 text-center">
              <span className="bg-white/10 backdrop-blur-md text-white/90 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-lg">
                {GALLERY[lightboxIdx].tag}
              </span>
              <p className="text-white text-sm font-extrabold mt-3">{GALLERY[lightboxIdx].caption}</p>
              <p className="text-white/45 text-[10px] font-bold mt-1.5">{lightboxIdx + 1} / {GALLERY.length}</p>
            </div>
          </div>

          {/* Next */}
          <button
            onClick={e => { e.stopPropagation(); nextImage(); }}
            className="absolute right-3 sm:right-6 p-2.5 sm:p-3 bg-white/10 hover:bg-white/20 rounded-full text-white z-10 cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[24px]">chevron_right</span>
          </button>
        </div>,
        document.body
      )}
    </div>
  );
};

export default CampusGallery;
