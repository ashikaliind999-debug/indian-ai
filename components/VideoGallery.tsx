
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { ChatSession, Message } from '../types';

interface VideoItemExtended extends Message {
  sessionId: string;
}

interface VideoGalleryProps {
  sessions: ChatSession[];
  onEdit: (message: Message, editPrompt: string, aspectRatio: '16:9' | '9:16') => void;
  onDeleteVideo: (sessionId: string, messageId: string) => void;
}

interface VideoItemProps {
  video: VideoItemExtended;
  idx: number;
  handleDownload: (url: string, content: string, idx: number) => void;
  onEditClick: (video: Message) => void;
  onDeleteClick: (sessionId: string, messageId: string) => void;
}

type SortOption = 'newest' | 'oldest' | 'longest' | 'shortest';

const VideoItem: React.FC<VideoItemProps> = ({ video, idx, handleDownload, onEditClick, onDeleteClick }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const onTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const dur = videoRef.current.duration;
      setCurrentTime(current);
      setProgress((current / dur) * 100);
    }
  };

  const onLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current) {
      const seekTime = (parseFloat(e.target.value) / 100) * duration;
      videoRef.current.currentTime = seekTime;
      setProgress(parseFloat(e.target.value));
    }
  };

  const handleCaptureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      setIsCapturing(true);
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        try {
          const dataUrl = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.href = dataUrl;
          link.download = `bharat-frame-${Math.floor(currentTime)}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } catch (err) {
          console.error("Frame capture failed:", err);
        }
      }
      
      setTimeout(() => setIsCapturing(false), 500);
    }
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this vision? This action cannot be undone.")) {
      onDeleteClick(video.sessionId, video.id);
    }
  };

  return (
    <div className="group relative bg-white rounded-3xl overflow-hidden border border-orange-100 shadow-sm hover:shadow-xl transition-all duration-500 animate-in zoom-in-95">
      <div className="aspect-video bg-black relative overflow-hidden">
        <video
          ref={videoRef}
          src={video.videoUrl}
          className="w-full h-full object-cover"
          onTimeUpdate={onTimeUpdate}
          onLoadedMetadata={onLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
          playsInline
          crossOrigin="anonymous"
        />
        
        <canvas ref={canvasRef} className="hidden" />

        {!isPlaying && (
          <button 
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors z-10"
          >
            <div className="w-16 h-16 flex items-center justify-center bg-orange-500 text-white rounded-full shadow-2xl transform transition-transform group-hover:scale-110">
              <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </button>
        )}

        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
          <button 
            onClick={() => handleDownload(video.videoUrl!, video.content, idx)}
            className="p-2 bg-white/90 hover:bg-white text-orange-600 rounded-xl shadow-lg transition-colors"
            title="Download Video"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M7 10l5 5 5-5M12 4v11" />
            </svg>
          </button>
          
          <button 
            onClick={handleCaptureFrame}
            disabled={isCapturing}
            className={`p-2 bg-white/90 hover:bg-white rounded-xl shadow-lg transition-all ${isCapturing ? 'text-green-500 scale-125' : 'text-emerald-600'}`}
            title="Capture Current Frame"
          >
            {isCapturing ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </button>

          <button 
            onClick={() => onEditClick(video)}
            className="p-2 bg-white/90 hover:bg-white text-indigo-600 rounded-xl shadow-lg transition-colors"
            title="Edit in Studio"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button 
            onClick={handleDelete}
            className="p-2 bg-red-500/90 hover:bg-red-600 text-white rounded-xl shadow-lg transition-colors"
            title="Delete Video"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent z-20">
          <div className="flex items-center gap-3">
            <button onClick={togglePlay} className="text-white hover:text-orange-400 transition-colors">
              {isPlaying ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              )}
            </button>
            <input 
              type="range" 
              value={progress} 
              onChange={handleSeek}
              className="flex-1 h-1.5 bg-white/30 rounded-full appearance-none cursor-pointer accent-orange-500"
            />
            <span className="text-[10px] font-bold text-white tabular-nums">
              {Math.floor(currentTime)}s / {Math.floor(duration)}s
            </span>
          </div>
        </div>
      </div>
      
      <div className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-black rounded uppercase tracking-wider">Bharat Studio 3D</span>
          <span className="text-[10px] text-slate-400 font-medium">{new Date(video.timestamp).toLocaleDateString('en-IN')}</span>
        </div>
        <h3 className="text-sm font-bold text-slate-800 line-clamp-2 leading-tight mb-3">
          {video.content.replace(/🎬 Rendering.*/, '').trim() || 'Untitled Cinematic Vision'}
        </h3>
        <div className="flex items-center justify-between pt-3 border-t border-slate-50">
           <div className="flex items-center gap-4">
             <button 
              onClick={() => onEditClick(video)}
              className="text-[11px] font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-1 uppercase tracking-wider"
             >
               Refine 
               <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
             </button>
             <button 
              onClick={handleDelete}
              className="text-[11px] font-black text-red-500 hover:text-red-700 flex items-center gap-1 uppercase tracking-wider"
             >
               Delete
               <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
             </button>
           </div>
           <div className="text-[10px] font-black text-slate-400 uppercase">Studio Vision</div>
        </div>
      </div>
    </div>
  );
};

export const VideoGallery: React.FC<VideoGalleryProps> = ({ sessions, onEdit, onDeleteVideo }) => {
  const [editTarget, setEditTarget] = useState<Message | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [showSortMenu, setShowSortMenu] = useState(false);

  const allVideos = useMemo(() => {
    const videos: VideoItemExtended[] = [];
    sessions.forEach(session => {
      session.messages.forEach(msg => {
        if (msg.videoUrl) {
          videos.push({ ...msg, sessionId: session.id });
        }
      });
    });

    return videos.sort((a, b) => {
      switch (sortOption) {
        case 'newest':
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        case 'oldest':
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        case 'longest':
          return (b.duration || 0) - (a.duration || 0);
        case 'shortest':
          return (a.duration || 0) - (b.duration || 0);
        default:
          return 0;
      }
    });
  }, [sessions, sortOption]);

  const handleDownload = (url: string, content: string, idx: number) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `bharat-studio-vision-${idx}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleStartEdit = (video: Message) => {
    setEditTarget(video);
    setEditPrompt('');
  };

  const sortLabel = {
    newest: 'Newest First',
    oldest: 'Oldest First',
    longest: 'Longest First',
    shortest: 'Shortest First'
  }[sortOption];

  if (allVideos.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bharat-bg">
        <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center text-4xl mb-6 border border-orange-100 float-animation">🎬</div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">No Cinematic Visions Yet</h2>
        <p className="text-slate-500 text-sm max-w-sm">Start a chat and ask me to make a video! Your 15-second 3D renders will appear here.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50/50 overflow-hidden">
      <header className="px-8 py-6 flex items-center justify-between glass-card border-b border-orange-100 sticky top-0 z-30">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            Bharat Studio Gallery
            <span className="px-3 py-1 bg-orange-500 text-white text-[10px] font-black rounded-full shadow-lg shadow-orange-500/20">{allVideos.length} Visions</span>
          </h1>
          <p className="text-slate-500 text-xs font-medium">Your collection of AI-rendered 3D cinematic shorts</p>
        </div>

        {/* Sorting Controls */}
        <div className="relative">
          <button 
            onClick={() => setShowSortMenu(!showSortMenu)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[11px] font-black text-slate-700 hover:border-orange-400 hover:text-orange-600 transition-all shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4h13M3 8h9M3 12h5m0 0v1.5a2.5 2.5 0 005 0V12m-5 0h5" /></svg>
            SORT: {sortLabel.toUpperCase()}
            <svg className={`w-3 h-3 transition-transform ${showSortMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
          </button>

          {showSortMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowSortMenu(false)}></div>
              <div className="absolute right-0 mt-2 w-48 bg-white border border-orange-50 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {(['newest', 'oldest', 'longest', 'shortest'] as SortOption[]).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      setSortOption(opt);
                      setShowSortMenu(false);
                    }}
                    className={`w-full px-5 py-3 text-left text-[11px] font-black uppercase tracking-wider transition-colors border-b border-slate-50 last:border-0 ${sortOption === opt ? 'bg-orange-50 text-orange-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                  >
                    {opt === 'newest' && 'Date: Newest First'}
                    {opt === 'oldest' && 'Date: Oldest First'}
                    {opt === 'longest' && 'Duration: Longest'}
                    {opt === 'shortest' && 'Duration: Shortest'}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 bharat-bg">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 max-w-[1600px] mx-auto">
          {allVideos.map((video, idx) => (
            <VideoItem 
              key={video.id} 
              video={video} 
              idx={idx} 
              handleDownload={handleDownload} 
              onEditClick={handleStartEdit}
              onDeleteClick={onDeleteVideo}
            />
          ))}
        </div>
      </div>

      {/* Edit Modal */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8">
            <div className="p-6 border-b border-orange-50 flex items-center justify-between bg-orange-50/30">
              <h3 className="text-xl font-black text-slate-800">Refine Vision</h3>
              <button onClick={() => setEditTarget(null)} className="p-2 hover:bg-orange-100 rounded-full transition-colors">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-inner">
                <video src={editTarget.videoUrl} controls className="w-full h-full object-cover" />
              </div>
              <div className="space-y-4">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">Modification Prompt</label>
                <textarea 
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  placeholder="E.g., Change the lighting to sunset or add more details to the character..."
                  className="w-full p-4 bg-slate-50 border border-orange-100 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none min-h-[100px]"
                />
                
                <div className="flex items-center gap-4">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Format:</label>
                  <button 
                    onClick={() => setAspectRatio('16:9')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${aspectRatio === '16:9' ? 'bg-orange-500 border-orange-500 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-600 hover:border-orange-200'}`}
                  >
                    Landscape (16:9)
                  </button>
                  <button 
                    onClick={() => setAspectRatio('9:16')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${aspectRatio === '9:16' ? 'bg-orange-500 border-orange-500 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-600 hover:border-orange-200'}`}
                  >
                    Portrait (9:16)
                  </button>
                </div>
              </div>
              <button 
                disabled={!editPrompt.trim()}
                onClick={() => {
                  onEdit(editTarget, editPrompt, aspectRatio);
                  setEditTarget(null);
                }}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-orange-500/20 hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
              >
                RERENDER CINEMATIC VISION
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
