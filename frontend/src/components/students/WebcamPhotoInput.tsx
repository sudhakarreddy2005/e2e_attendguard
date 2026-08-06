import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, VideoOff, RotateCcw, Check, AlertCircle, Image as ImageIcon, Sparkles } from 'lucide-react';

interface WebcamPhotoInputProps {
  onImageSelected: (file: File | null) => void;
  selectedFile: File | null;
  label?: string;
  required?: boolean;
}

export const WebcamPhotoInput: React.FC<WebcamPhotoInputProps> = ({
  onImageSelected,
  selectedFile,
  label = 'Face Registration Photo',
  required = false,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'webcam'>('upload');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state if selectedFile is cleared externally
  useEffect(() => {
    if (!selectedFile) {
      setCapturedPreview(null);
    }
  }, [selectedFile]);

  // Clean up camera stream on unmount or tab change
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    if (activeTab === 'upload') {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [activeTab]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'user' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (err: any) {
      console.error('Webcam access error:', err);
      setCameraError('Unable to access webcam. Please check camera permissions.');
      setIsCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

    setCapturedPreview(dataUrl);

    // Convert dataUrl to File object
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    const file = new File([u8arr], `webcam_snap_${Date.now()}.jpeg`, { type: mime });

    stopCamera();
    onImageSelected(file);
  };

  const handleFileChange = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setCapturedPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    onImageSelected(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleRetake = () => {
    setCapturedPreview(null);
    onImageSelected(null);
    startCamera();
  };

  const handleClear = () => {
    setCapturedPreview(null);
    onImageSelected(null);
    stopCamera();
  };

  return (
    <div className="space-y-2.5">
      {/* Header Label and Motion Tab Selector */}
      <div className="flex items-center justify-between">
        <label className="block text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center gap-1">
          {label} {required && <span className="text-[#FF453A]">*</span>}
        </label>

        {/* Sliding Motion Pill Selector */}
        <div className="relative flex items-center gap-1 p-1 rounded-2xl bg-black/5 dark:bg-white/10 border border-black/5 dark:border-white/10 backdrop-blur-md">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-colors cursor-pointer ${
              activeTab === 'upload'
                ? 'text-[#007AFF] dark:text-white'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Upload File
            {activeTab === 'upload' && (
              <motion.div
                layoutId="activePhotoTabPill"
                className="absolute inset-0 bg-white dark:bg-white/20 rounded-xl shadow-xs -z-10"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('webcam');
              if (!capturedPreview) startCamera();
            }}
            className={`relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-colors cursor-pointer ${
              activeTab === 'webcam'
                ? 'text-[#007AFF] dark:text-white'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            Take Photo
            {activeTab === 'webcam' && (
              <motion.div
                layoutId="activePhotoTabPill"
                className="absolute inset-0 bg-white dark:bg-white/20 rounded-xl shadow-xs -z-10"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
          </button>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/jpg, image/webp"
        onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
        className="hidden"
      />

      {/* Animated Content Switching */}
      <AnimatePresence mode="wait">
        {activeTab === 'upload' ? (
          <motion.div
            key="tab-upload"
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            {capturedPreview ? (
              /* Selected Image Card */
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-white/80 dark:bg-white/10 border border-[#007AFF]/30 shadow-md backdrop-blur-md"
              >
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden ring-2 ring-[#007AFF] shadow-sm">
                    <img src={capturedPreview} alt="Selected" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-white truncate max-w-[200px]">
                      {selectedFile?.name || 'Uploaded Photo'}
                    </h4>
                    <p className="text-[10px] text-[#30D158] font-bold flex items-center gap-1 mt-0.5">
                      <Check className="w-3 h-3" /> Ready for ArcFace Vision Embedding
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={handleClear}
                  className="px-3 py-1.5 rounded-xl bg-slate-200/70 dark:bg-white/15 hover:bg-rose-500/15 hover:text-rose-600 text-slate-600 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
                >
                  Change
                </motion.button>
              </motion.div>
            ) : (
              /* Custom Drag & Drop Card (No File Chosen raw browser input!) */
              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                  dragActive
                    ? 'border-[#007AFF] bg-[#007AFF]/10 shadow-lg'
                    : 'border-slate-300 dark:border-white/20 hover:border-[#007AFF]/70 bg-white/50 dark:bg-white/5'
                }`}
              >
                <div className="space-y-1.5 py-1">
                  <div className="w-10 h-10 mx-auto rounded-2xl bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center">
                    <Upload className="w-5 h-5" strokeWidth={2} />
                  </div>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    Click to browse or drag & drop photo
                  </h4>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Supports PNG, JPG, JPEG, WEBP (Clear face photo recommended)
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="tab-webcam"
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="rounded-2xl border border-black/10 dark:border-white/15 overflow-hidden bg-slate-950 p-2.5 text-center relative shadow-xl">
              <canvas ref={canvasRef} className="hidden" />

              {capturedPreview ? (
                /* Captured Photo Result Preview */
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="space-y-3 py-2"
                >
                  <div className="relative w-40 h-40 mx-auto rounded-2xl overflow-hidden border-2 border-[#30D158] shadow-xl">
                    <img src={capturedPreview} alt="Webcam Capture" className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-[#30D158] text-white text-[10px] font-extrabold flex items-center gap-1 shadow-md">
                      <Check className="w-3 h-3" strokeWidth={3} /> Captured
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      type="button"
                      onClick={handleRetake}
                      className="apple-btn-secondary px-4 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-[#007AFF]" /> Retake Snap
                    </motion.button>
                  </div>
                </motion.div>
              ) : isCameraActive ? (
                /* Live Camera Feed */
                <div className="relative rounded-xl overflow-hidden aspect-video flex items-center justify-center bg-black">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />

                  {/* Face Guide Oval */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <motion.div
                      animate={{ scale: [1, 1.03, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      className="w-36 h-44 border-2 border-dashed border-[#007AFF] rounded-[50%] shadow-[0_0_20px_rgba(0,122,255,0.5)]"
                    />
                  </div>

                  {/* Live HUD Badge */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20">
                    <span className="w-2 h-2 rounded-full bg-[#FF453A] animate-pulse" />
                    <span className="text-[9px] font-extrabold text-white tracking-wider uppercase">Live Feed</span>
                  </div>

                  {/* Action Controls */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2.5 z-10">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={capturePhoto}
                      className="apple-btn-primary px-5 py-2 text-xs font-extrabold flex items-center gap-2 shadow-xl cursor-pointer"
                    >
                      <Camera className="w-4 h-4" /> Take Snap
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={stopCamera}
                      className="p-2 rounded-xl bg-black/70 hover:bg-rose-600/90 text-white text-xs font-bold backdrop-blur-md border border-white/20 cursor-pointer"
                      title="Turn off webcam"
                    >
                      <VideoOff className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              ) : (
                /* Camera Standby View */
                <div className="py-6 px-4 space-y-3">
                  {cameraError ? (
                    <div className="text-rose-400 text-xs flex items-center justify-center gap-1.5 font-medium">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{cameraError}</span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-300">Webcam Standby</p>
                      <p className="text-[11px] text-slate-400">Click below to activate camera and take student photo.</p>
                    </div>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    type="button"
                    onClick={startCamera}
                    className="apple-btn-primary px-4 py-2 text-xs font-extrabold inline-flex items-center gap-2 cursor-pointer shadow-md"
                  >
                    <Camera className="w-4 h-4" /> Turn On Webcam
                  </motion.button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
