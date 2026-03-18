import React from 'react';
import { X, ZoomIn, ZoomOut, Download } from 'lucide-react';

interface FullScreenImageProps {
  src: string;
  alt?: string;
  onClose: () => void;
}

const FullScreenImage: React.FC<FullScreenImageProps> = ({ src, alt = "Full Screen", onClose }) => {
  return (
    <div 
      className="fixed inset-0 z-[100] bg-zinc-950/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div className="absolute top-6 right-6 flex items-center gap-4">
        <a 
          href={src} 
          download 
          target="_blank" 
          rel="noopener noreferrer"
          className="p-3 bg-zinc-900/50 hover:bg-zinc-800 text-white rounded-2xl border border-zinc-800 transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          <Download size={24} />
        </a>
        <button 
          onClick={onClose}
          className="p-3 bg-zinc-900/50 hover:bg-zinc-800 text-white rounded-2xl border border-zinc-800 transition-all"
        >
          <X size={24} />
        </button>
      </div>

      <div 
        className="relative max-w-full max-h-full flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img 
          src={src} 
          alt={alt} 
          className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl animate-in zoom-in-95 duration-300"
          referrerPolicy="no-referrer"
        />
      </div>
    </div>
  );
};

export default FullScreenImage;
