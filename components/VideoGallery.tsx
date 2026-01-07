
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { ChatSession, Message } from '../types';

interface VideoGalleryProps {
  sessions: ChatSession[];
  onEdit: (message: Message, editPrompt: string, aspectRatio: '16:9' | '9:16') => void;
}

interface VideoItemProps {
  video: Message;
  idx: number;
  handleDownload: (url: string, content: string, idx: number) => void;
  onEditClick: (video: Message) => void;
}

const VideoItem: React.FC<VideoItemProps> = ({ video, idx, handleDownload, onEditClick }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(video.duration || 0);
  const [generatedThumbnail, setGeneratedThumbnail] = useState<string | null>(video.imageUrl || null);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem('bharat_ai_video_volume');
    return saved !== null ? parseFloat(saved) : 1;
  });
  const [isMuted, setIsMuted] = useState(() => {
    return localStorage.getItem('bharat_ai_video_muted') === 'true';
  });

  useEffect(() => {
    if (!video.imageUrl && video.videoUrl && !generatedThumbnail) {
      const tempVideo = document.createElement('video');
      tempVideo.src = video.videoUrl;
      tempVideo.crossOrigin = 'anonymous';
      tempVideo.muted = true;
      tempVideo.currentTime = 0.5;

      const captureFrame = () => {
        const canvas = document.createElement('canvas');
        canvas.width = tempVideo.videoWidth;
        canvas.height = tempVideo.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx && canvas.width > 0) {
          ctx.drawImage(tempVideo, 0, 0, canvas.width, canvas.height);
          setGeneratedThumbnail(canvas.toDataURL('image/jpeg'));
        }
      };

      tempVideo.addEventListener('loadeddata', () => { tempVideo.currentTime = 0.5; });
      tempVideo.addEventListener('seeked', captureFrame);
      return () => {
        tempVideo.removeEventListener('loadeddata', captureFrame);
        tempVideo.removeEventListener('seeked', captureFrame);
      };
    }
  }, [video.videoUrl, video.imageUrl, generatedThumbnail]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    videoRef.current.paused ? videoRef.current.play() : videoRef.current.pause();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (newVol > 0) setIsMuted(false);
    localStorage.setItem('bharat_ai_video_volume', newVol.toString());
  };

  const toggleMute = () => {
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);
    localStorage.setItem('bharat_ai_video_muted', newMuteState.toString());
  };

  const handleShare = async (platform?: 'whatsapp' | 'twitter' | 'copy' | 'general') => {
    const title = 'Indian AI - Bharat Studio';
    const text = `Check out this 3D cinematic vision from Indian AI: "${video.content.split('\n')[0]}"`;
    const appUrl = window.location.href;
    setIsSharing(true);
    try {
      if ((platform === 'general' || !platform) && navigator.canShare && video.videoUrl) {
        const response = await fetch(video.videoUrl);
        const blob = await response.blob();
        const file = new File([blob], "bharat-vision.mp4", { type: "video/mp4" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title, text });
          setShowShareMenu(false);
          return;
        }
      }
      const shareTextWithUrl = `${text}\n\nView app: ${appUrl}`;
      switch (platform) {
        case 'whatsapp': window.open(`https://wa.me/?text=${encodeURIComponent(shareTextWithUrl)}`, '_blank'); break;
        case 'twitter': window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(appUrl)}`, '_blank'); break;
        case 'copy': await navigator.clipboard.writeText(appUrl); alert('Link copied!'); break;
        default: navigator.share ? await navigator.share({ title, text, url: appUrl }) : alert('Sharing not supported'); break;
      }
    } catch (err) { console.error(err); } finally { setIsSharing(false); setShowShareMenu(false); }
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-2xl border border-orange-100 flex flex-col group transition-all hover:shadow-orange-200/50 hover:-translate-y-2 relative">
      <div className="aspect-video bg-slate-950 relative group/video overflow-hidden">
        <video
          ref={videoRef}
          src={video.videoUrl}
          className="w-full h-full object-cover"
          poster={generatedThumbnail || undefined}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={() => {
            if (videoRef.current) {
              setCurrentTime(videoRef.current.currentTime);
              setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
            }
          }}
          onLoadedMetadata={() => videoRef.current && setDuration(videoRef.current.duration)}
          onClick={togglePlay}
          preload="metadata"
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover/video:opacity-100 transition-all duration-500 flex flex-col justify-end p-5 gap-3">
          <div className="flex flex-col gap-1 w-full">
            <input
              type="range"
              min="0" max="100" step="0.1"
              value={progress || 0}
              onChange={(e) => {
                if (videoRef.current) {
                  const seekTo = (parseFloat(e.target.value) / 100) * videoRef.current.duration;
                  videoRef.current.currentTime = seekTo;
                }
              }}
              className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
            <div className="flex justify-between text-[9px] font-black text-white/70 tracking-widest tabular-nums uppercase">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button onClick={togglePlay} className="w-10 h-10 flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white rounded-2xl shadow-lg transition-all active:scale-90">
              {isPlaying ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
              ) : (
                <svg className="w-5 h-5 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              )}
            </button>

            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-2 rounded-2xl border border-white/20 group/vol">
              <button onClick={toggleMute} className="text-white hover:text-orange-400 transition-colors">
                {isMuted || volume === 0 ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                )}
              </button>
              <input
                type="range" min="0" max="1" step="0.01"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-0 group-hover/vol:w-20 transition-all duration-500 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 flex flex-col flex-1">
        <div className="flex justify-between items-center mb-4">
          <span className="text-[10px] font-black text-orange-600 bg-orange-50 px-3 py-1 rounded-full uppercase tracking-tighter">Bharat Cinema</span>
          <span className="text-[10px] font-bold text-slate-400">{new Date(video.timestamp).toLocaleDateString()}</span>
        </div>
        <p className="text-base font-bold text-slate-800 line-clamp-2 mb-6 leading-tight flex-1">
          {video.content.split('\n\n')[0] || "Cinematic Vision"}
        </p>

        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <button 
              onClick={() => handleDownload(video.videoUrl!, video.content, idx)}
              className="flex-1 py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl text-[11px] font-black transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M7 10l5 5 5-5M12 4v11" /></svg>
              Save
            </button>
            <button 
              onClick={() => onEditClick(video)}
              className="flex-1 py-3 px-4 bg-white border-2 border-orange-100 text-orange-600 hover:bg-orange-50 rounded-2xl text-[11px] font-black transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              Edit
            </button>
          </div>
          <button 
            onClick={() => setShowShareMenu(true)}
            className="w-full py-3 bg-slate-900 hover:bg-black text-white rounded-2xl text-[11px] font-black transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            {isSharing ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>}
            Share Vision
          </button>
        </div>
      </div>

      {showShareMenu && (
        <div className="absolute inset-0 bg-white/95 backdrop-blur-xl z-20 flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-300">
          <button onClick={() => setShowShareMenu(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-orange-500 rounded-full transition-colors"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg></button>
          <h4 className="text-xl font-black text-slate-900 mb-8">Spread the Vision</h4>
          <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
            <button onClick={() => handleShare('whatsapp')} className="flex flex-col items-center gap-3 p-5 rounded-[2rem] bg-green-50 hover:bg-green-100 transition-all group">
              <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center text-white shadow-lg group-active:scale-90 transition-transform"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.634.059-1.054-.045-.246-.062-.572-.155-1.025-.337-1.942-.782-3.21-2.735-3.307-2.863-.097-.128-.783-1.04-.783-1.986 0-.946.488-1.411.662-1.613.174-.203.374-.253.499-.253.125 0 .25.002.359.006.111.003.259-.042.404.308.145.349.498 1.214.542 1.303.044.089.073.193.014.308-.059.115-.088.191-.174.292-.087.101-.174.21-.249.27-.087.073-.178.152-.077.323.101.172.449.742.964 1.201.662.589 1.222.772 1.396.857.174.084.276.07.378-.048.101-.118.434-.505.55-.679.116-.174.232-.145.391-.087.159.058 1.013.478 1.187.565.174.087.29.13.333.203.043.073.043.42-.101.825z"/></svg></div>
              <span className="text-xs font-black text-slate-700">WhatsApp</span>
            </button>
            <button onClick={() => handleShare('twitter')} className="flex flex-col items-center gap-3 p-5 rounded-[2rem] bg-slate-50 hover:bg-slate-100 transition-all group">
              <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center text-white shadow-lg group-active:scale-90 transition-transform"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></div>
              <span className="text-xs font-black text-slate-700">Twitter</span>
            </button>
            <button onClick={() => handleShare('copy')} className="flex flex-col items-center gap-3 p-5 rounded-[2rem] bg-orange-50 hover:bg-orange-100 transition-all group col-span-2">
              <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg group-active:scale-90 transition-transform"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg></div>
              <span className="text-xs font-black text-slate-700">Copy Link</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const VideoEditorModal: React.FC<{
  video: Message;
  onClose: () => void;
  onApply: (prompt: string, aspectRatio: '16:9' | '9:16') => void;
}> = ({ video, onClose, onApply }) => {
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [overlayText, setOverlayText] = useState('');
  const [musicMood, setMusicMood] = useState('Cinematic');
  const [instructions, setInstructions] = useState('');

  const handleApply = () => {
    let editPrompt = `Refine this cinematic vision. `;
    if (aspectRatio === '9:16') editPrompt += `Framed for portrait mobile viewing. `;
    if (musicMood !== 'Cinematic') editPrompt += `Enhance with ${musicMood} style background audio. `;
    if (overlayText) editPrompt += `Add artistic overlay text: "${overlayText}". `;
    editPrompt += instructions;
    onApply(editPrompt, aspectRatio);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-2xl">
      <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col md:flex-row h-full max-h-[85vh] border border-orange-100">
        <div className="flex-1 bg-black flex items-center justify-center relative min-h-[300px] border-r border-slate-100">
          <video src={video.videoUrl} controls className={`max-h-full max-w-full shadow-2xl ${aspectRatio === '9:16' ? 'aspect-[9/16]' : 'aspect-video'}`} />
          <button onClick={onClose} className="absolute top-8 left-8 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all backdrop-blur-md border border-white/20"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <div className="w-full md:w-96 p-8 md:p-10 flex flex-col bg-slate-50/50 overflow-y-auto custom-scrollbar">
          <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3"><span className="p-2 bg-orange-100 rounded-2xl text-xl shadow-sm">🎬</span> Bharat Studio</h3>
          <div className="space-y-8 flex-1">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cinematic Format</label>
              <div className="flex gap-2 p-1 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <button onClick={() => setAspectRatio('16:9')} className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${aspectRatio === '16:9' ? 'bg-orange-500 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'}`}>Landscape</button>
                <button onClick={() => setAspectRatio('9:16')} className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${aspectRatio === '9:16' ? 'bg-orange-500 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'}`}>Portrait</button>
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Background Vibe</label>
              <select value={musicMood} onChange={e => setMusicMood(e.target.value)} className="w-full p-4 bg-white rounded-2xl border border-slate-200 text-sm font-bold shadow-sm focus:ring-2 focus:ring-orange-500/20 outline-none transition-all">
                {['Cinematic', 'Indian Classical (Sitar)', 'Bollywood Modern', 'Epic Tabla', 'Soothing Flute', 'Bharat Lo-Fi'].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Title Overlay</label>
              <input type="text" placeholder="Visionary title..." value={overlayText} onChange={e => setOverlayText(e.target.value)} className="w-full p-4 bg-white rounded-2xl border border-slate-200 text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-orange-500/20" />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Creative Direction</label>
              <textarea placeholder="e.g. More morning sun, vibrant colors..." value={instructions} onChange={e => setInstructions(e.target.value)} className="w-full p-4 bg-white rounded-2xl border border-slate-200 text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-orange-500/20 resize-none" rows={4} />
            </div>
          </div>
          <button onClick={handleApply} className="w-full py-5 mt-10 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-[1.5rem] font-black text-sm shadow-xl shadow-orange-500/30 active:scale-95 transition-all transform hover:scale-[1.02]">Apply Studio Edits</button>
        </div>
      </div>
    </div>
  );
};

export const VideoGallery: React.FC<VideoGalleryProps> = ({ sessions, onEdit }) => {
  const [sortType, setSortType] = useState<'newest' | 'oldest' | 'duration'>('newest');
  const [editingVideo, setEditingVideo] = useState<Message | null>(null);
  
  // Global Gallery Ambient Music State
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [musicVolume, setMusicVolume] = useState(() => {
    const saved = localStorage.getItem('bharat_gallery_music_vol');
    return saved !== null ? parseFloat(saved) : 0.3;
  });

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = musicVolume;
      if (isMusicPlaying) audioRef.current.play().catch(() => setIsMusicPlaying(false));
      else audioRef.current.pause();
    }
  }, [isMusicPlaying, musicVolume]);

  const allVideos = useMemo(() => {
    const videos = sessions.flatMap(s => s.messages.filter(m => m.videoUrl));
    return [...videos].sort((a, b) => {
      if (sortType === 'newest') return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      if (sortType === 'oldest') return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      return (b.duration || 15) - (a.duration || 15);
    });
  }, [sessions, sortType]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#fffaf5] overflow-y-auto p-6 md:p-12 bharat-bg custom-scrollbar relative">
      <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col">
          <h2 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
            <span className="p-3 bg-white rounded-[1.5rem] shadow-lg border border-orange-50">🎥</span> Bharat Gallery
          </h2>
          <p className="text-slate-500 mt-3 font-semibold text-sm max-w-md">Your 3D cinematic masterpieces, enhanced by Bharat Vision Engine.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          {/* Gallery Ambient Music Control */}
          <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-[1.5rem] shadow-xl border border-orange-100 group/music">
            <button 
              onClick={() => setIsMusicPlaying(!isMusicPlaying)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isMusicPlaying ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'bg-slate-100 text-slate-500'}`}
              title="Toggle Ambient Gallery Music"
            >
              {isMusicPlaying ? (
                <div className="flex items-end gap-0.5 h-3">
                  <div className="w-0.5 bg-white animate-bounce h-full"></div>
                  <div className="w-0.5 bg-white animate-bounce h-2 [animation-delay:0.2s]"></div>
                  <div className="w-0.5 bg-white animate-bounce h-full [animation-delay:0.4s]"></div>
                </div>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
              )}
            </button>
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{isMusicPlaying ? 'Ambient Beats' : 'Music Off'}</span>
              <input 
                type="range" min="0" max="1" step="0.01" 
                value={musicVolume} 
                onChange={e => {
                  const v = parseFloat(e.target.value);
                  setMusicVolume(v);
                  localStorage.setItem('bharat_gallery_music_vol', v.toString());
                }}
                className="w-20 h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-orange-500" 
              />
            </div>
            <audio ref={audioRef} loop src="https://assets.mixkit.co/music/preview/mixkit-ethereal-meditation-146.mp3" />
          </div>

          <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-[1.5rem] shadow-xl border border-orange-100">
            {['newest', 'oldest', 'duration'].map((type) => (
              <button 
                key={type}
                onClick={() => setSortType(type as any)} 
                className={`px-4 py-2.5 rounded-xl text-[10px] font-black transition-all uppercase tracking-tighter ${sortType === type ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-slate-400 hover:bg-orange-50 hover:text-orange-600'}`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </header>

      {allVideos.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-24 px-8 border-4 border-dashed border-orange-100 rounded-[3rem] bg-white/30 backdrop-blur-sm">
          <div className="text-8xl mb-6 float-animation opacity-40">🎬</div>
          <h3 className="text-2xl font-black text-slate-800">Your Visionary Canvas is Empty</h3>
          <p className="text-slate-500 mt-3 font-semibold text-sm max-w-sm">Start a Bharat Chat and say "Make a cinematic video of..." to begin your journey.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
          {allVideos.map((video, idx) => (
            <VideoItem key={video.id} video={video} idx={idx} handleDownload={(url, c, i) => {
              const link = document.createElement('a');
              link.href = url;
              link.download = `bharat-vision-${i}.mp4`;
              link.click();
            }} onEditClick={v => setEditingVideo(v)} />
          ))}
        </div>
      )}

      {editingVideo && (
        <VideoEditorModal video={editingVideo} onClose={() => setEditingVideo(null)} onApply={(prompt, ar) => { onEdit(editingVideo, prompt, ar); setEditingVideo(null); }} />
      )}
      
      <footer className="mt-auto py-12 border-t border-orange-100 text-center opacity-40">
        <p className="text-[10px] font-black tracking-[0.3em] uppercase text-orange-900">Bharat Studio Engine v2.5 • AI Cinematic Rendering System</p>
      </footer>
    </div>
  );
};
