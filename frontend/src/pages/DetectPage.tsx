import React, { useRef, useState, useEffect } from 'react';
import { Camera, Scan, CheckCircle2, RefreshCw, Upload, Image as ImageIcon, Sparkles, VideoOff, Check, AlertTriangle, Users, ShieldCheck, X, RotateCcw, ZoomIn } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { detectionService } from '../services/detectionService';
import { violationService } from '../services/violationService';
import { studentService } from '../services/studentService';
import { DetectionResult, FaceMatch } from '../types/detection';
import { Badge } from '../components/ui/Badge';
import { PageTransition } from '../components/ui/PageTransition';
import { SMOOTH_SPRING, EXPO_OUT, blurFadeInUp, scrollSlideLeft, scrollSlideRight, staggerDirectional } from '../utils/motion-variants';

export const DetectPage: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'camera' | 'upload'>('camera');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  // Track violation logging status per student roll_no
  const [loggedRollNos, setLoggedRollNos] = useState<Record<string, boolean>>({});
  const [loggingRollNo, setLoggingRollNo] = useState<string | null>(null);

  // Big Image Lightbox Modal State
  const [previewModal, setPreviewModal] = useState<{ url: string; title: string } | null>(null);

  // Parameters (Default to ALL for max detection flexibility)
  const [department, setDepartment] = useState('ALL');
  const [section, setSection] = useState('ALL');
  const [location, setLocation] = useState('Central Block');
  const [violationType, setViolationType] = useState('Late Arrival');
  const [remarks, setRemarks] = useState('Late Arrival at Main Gate');

  const handleCancelMatch = () => {
    setResult(null);
    setUploadedFile(null);
    setInputImagePreview(null);
    setLoggedRollNos({});
  };

  // Input & DB comparison images
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [inputImagePreview, setInputImagePreview] = useState<string | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setErrorToast('Unable to access webcam. Please check browser permissions.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
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
    return () => stopCamera();
  }, [activeTab]);

  const captureFrame = async () => {
    if (!videoRef.current || !canvasRef.current || !isCameraActive || isProcessing) return;
    setIsProcessing(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg');
    setInputImagePreview(dataUrl);

    canvas.toBlob(async (blob) => {
      if (!blob) {
        setIsProcessing(false);
        return;
      }
      await processRecognition(blob, 'frame.jpg');
    }, 'image/jpeg');
  };

  const processRecognition = async (imageBlob: Blob | File, filename: string) => {
    setIsProcessing(true);
    setResult(null);
    setLoggedRollNos({});

    const formData = new FormData();
    formData.append('image', imageBlob, filename);
    if (department !== 'ALL') formData.append('department', department);
    if (section !== 'ALL') formData.append('section', section);
    formData.append('location', location);

    try {
      const data = await detectionService.matchFace(formData);
      setResult(data);
    } catch (err: any) {
      console.error('Detection error:', err);
      setErrorToast('Recognition request failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmViolation = async (matchStudent: FaceMatch) => {
    if (loggingRollNo) return;
    setLoggingRollNo(matchStudent.roll_no);
    const remarkText = remarks.trim()
      ? `${remarks.trim()} (${matchStudent.confidence}% match)`
      : `Detected via ArcFace Vision (${matchStudent.confidence}% match)`;
    try {
      await violationService.createViolation({
        roll_no: matchStudent.roll_no,
        type: violationType,
        location,
        department: matchStudent.department || department,
        section: matchStudent.section || section,
        remarks: remarkText,
        confidence: matchStudent.confidence,
      });
      setLoggedRollNos((prev) => ({ ...prev, [matchStudent.roll_no]: true }));
    } catch (err) {
      console.error('Failed to log violation:', err);
      setErrorToast(`Failed to log violation for ${matchStudent.name}`);
    } finally {
      setLoggingRollNo(null);
    }
  };

  const handleConfirmAllViolations = async () => {
    if (!result?.matches || result.matches.length === 0) return;
    for (const match of result.matches) {
      if (!loggedRollNos[match.roll_no]) {
        await handleConfirmViolation(match);
      }
    }
  };

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorToast('Please upload a valid image file (PNG, JPG, JPEG, WEBP, HEIF).');
      return;
    }
    setUploadedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setInputImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
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
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const runUploadRecognition = () => {
    if (!uploadedFile) return;
    processRecognition(uploadedFile, uploadedFile.name);
  };

  const matchedList = result?.matches && result.matches.length > 0 ? result.matches : (result?.student ? [result.student] : []);

  return (
    <PageTransition className="space-y-6">
      {/* Error Toast */}
      {errorToast && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-[#FF453A]/15 border border-[#FF453A]/30 text-[#FF453A] text-xs font-semibold shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorToast}</span>
          </div>
          <button onClick={() => setErrorToast(null)} className="text-[10px] font-bold underline cursor-pointer hover:text-[#FF453A]/80">Dismiss</button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200">Face Recognition Engine</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            RetinaFace Multi-Face Detection → ArcFace 512D Cosine Vector Matching
          </p>
        </div>

        {/* Aligned Mode Buttons */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-black/5 dark:bg-white/10 border border-white/40 dark:border-white/10 shadow-xs">
            <button
              onClick={() => setActiveTab('camera')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'camera'
                  ? 'apple-active-pill font-bold shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Camera className="w-4 h-4" strokeWidth={2} /> Live Camera
            </button>
            <button
              onClick={() => {
                setActiveTab('upload');
                stopCamera();
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'upload'
                  ? 'apple-active-pill font-bold shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Upload className="w-4 h-4" strokeWidth={2} /> Upload Image
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Recognition Input Container */}
        <div className="lg:col-span-2 space-y-4">
          {activeTab === 'camera' ? (
            /* Live Camera Feed */
            <div className="relative rounded-[24px] overflow-hidden bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xl h-64 sm:h-80 flex items-center justify-center">
              <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${!isCameraActive ? 'hidden' : ''}`} />
              <canvas ref={canvasRef} className="hidden" />

              {!isCameraActive && (
                <div className="flex flex-col items-center space-y-2 text-slate-400 p-4 text-center">
                  <VideoOff className="w-10 h-10 stroke-1 text-slate-500" />
                  <p className="text-xs font-semibold">Webcam is currently OFF</p>
                  <button onClick={startCamera} className="apple-btn-primary px-4 py-2 text-xs font-bold shadow-md flex items-center gap-2">
                    <Camera className="w-4 h-4" /> Turn On Camera
                  </button>
                </div>
              )}

              {/* HUD Overlay */}
              {isCameraActive && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="hud-corner hud-corner-tl" />
                  <div className="hud-corner hud-corner-tr" />
                  <div className="hud-corner hud-corner-bl" />
                  <div className="hud-corner hud-corner-br" />
                  <div className="hud-scanner-line" />
                </div>
              )}

              {/* Live Indicator */}
              {isCameraActive && (
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/20">
                  <span className="w-2 h-2 rounded-full bg-[#FF453A] animate-pulse" />
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">Live Feed</span>
                </div>
              )}

              {/* Action Buttons */}
              {isCameraActive && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex flex-wrap items-center justify-center gap-2 w-full px-3">
                  <div className={isProcessing ? '' : 'pulse-ring-wrap'}>
                    <button
                      onClick={captureFrame}
                      disabled={isProcessing}
                      className="apple-btn-primary flex items-center gap-2 px-4 py-2 text-xs font-bold shadow-xl disabled:opacity-40"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" strokeWidth={2} /> Matching...
                        </>
                      ) : (
                        <>
                          <Scan className="w-3.5 h-3.5" strokeWidth={2} /> Run Recognition
                        </>
                      )}
                    </button>
                  </div>

                  {result && (
                    <button
                      onClick={handleCancelMatch}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/60 hover:bg-rose-600/90 text-white text-xs font-bold backdrop-blur-md shadow-lg transition-all border border-white/20 cursor-pointer"
                      title="Clear current match result"
                    >
                      <RotateCcw className="w-3.5 h-3.5" strokeWidth={2.5} /> Clear
                    </button>
                  )}

                  <button
                    onClick={stopCamera}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FF453A] hover:bg-[#E0382F] text-white text-xs font-bold shadow-lg shadow-[#FF453A]/20 transition-all border border-white/20 cursor-pointer"
                  >
                    <VideoOff className="w-3.5 h-3.5" strokeWidth={2} /> Stop
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Drag and Drop Image Recognition Zone - Clean Glass Panel Layout */
            <div className="glass-panel bg-white/70 dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 shadow-xl rounded-[24px] p-5 flex flex-col items-center justify-between min-h-[300px] text-center">
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-[20px] p-6 text-center cursor-pointer transition-all ${
                  dragActive
                    ? 'border-[#007AFF] bg-[#007AFF]/10'
                    : 'border-slate-300 dark:border-white/20 hover:border-[#007AFF]/60 bg-white/50 dark:bg-white/5'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp, image/heic, image/heif"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  className="hidden"
                />

                {uploadedFile ? (
                  <div className="space-y-2 relative">
                    <div className="w-12 h-12 mx-auto rounded-full bg-[#30D158]/15 flex items-center justify-center border border-[#30D158]/30 animate-pulse">
                      <Check className="w-6 h-6 text-[#30D158]" strokeWidth={2.5} />
                    </div>
                    <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate max-w-xs mx-auto">
                      {uploadedFile.name}
                    </h3>
                    <p className="text-[11px] font-mono text-slate-400">
                      {(uploadedFile.size / 1024 < 1024 ? `${Math.round(uploadedFile.size / 1024)} KB` : `${(uploadedFile.size / 1048576).toFixed(1)} MB`)}
                    </p>
                    <span className="text-[10px] text-[#007AFF] font-semibold block pt-0.5">
                      Click or drop another photo to change
                    </span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-12 h-12 mx-auto rounded-full bg-[#007AFF]/10 flex items-center justify-center border border-[#007AFF]/20">
                      <Upload className="w-6 h-6 text-[#007AFF] animate-bounce" strokeWidth={2} />
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200">
                      Drag & Drop Photo for Multi-Face Recognition
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                      Supports PNG, JPG, JPEG, WEBP, HEIF
                    </p>
                  </div>
                )}
              </div>

              {/* Primary Action Button */}
              {uploadedFile && (
                <div className="pt-4 w-full flex justify-center">
                  <button
                    onClick={runUploadRecognition}
                    disabled={isProcessing}
                    className="apple-btn-primary flex items-center gap-2 px-6 py-2.5 text-xs font-bold shadow-lg disabled:opacity-50 cursor-pointer"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" strokeWidth={2} /> Analyzing Multi-Face Vectors...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-white" strokeWidth={2} /> Run Multi-Face Recognition
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Detection Stats: Faces Detected vs Recognized ── */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4, ease: EXPO_OUT }}
                className="flex items-center gap-2 flex-wrap"
              >
                <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-[#007AFF]/10 border border-[#007AFF]/25 text-xs font-bold text-[#007AFF]">
                  <Scan className="w-3.5 h-3.5" />
                  <span className="text-sm font-black">{result.faces_detected}</span>
                  <span>Detected</span>
                </div>
                <div className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl border text-xs font-bold ${
                  matchedList.length > 0
                    ? 'bg-[#30D158]/10 border-[#30D158]/25 text-[#30D158]'
                    : 'bg-amber-500/10 border-amber-500/25 text-amber-500'
                }`}>
                  <Users className="w-3.5 h-3.5" />
                  <span className="text-sm font-black">{matchedList.length}</span>
                  <span>Recognized</span>
                </div>
                {result.faces_detected > matchedList.length && (
                  <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-slate-200/60 dark:bg-white/10 border border-slate-300/50 dark:border-white/10 text-xs font-bold text-slate-500 dark:text-slate-400">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span className="text-sm font-black">{result.faces_detected - matchedList.length}</span>
                    <span>Unmatched</span>
                  </div>
                )}
                {result.total_ms && (
                  <span className="text-[10px] font-mono text-slate-400 ml-auto">
                    {result.detection_ms}ms detect • {result.recognition_ms}ms match
                  </span>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Multi-Student Verification Panel */}
          <AnimatePresence>
          {result && matchedList.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -60, filter: 'blur(8px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.55, ease: EXPO_OUT, delay: 0.1 }}
              className="glass-panel p-6 rounded-[28px] shadow-xl border border-[#30D158]/30 bg-[#30D158]/5 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#30D158]/20 pb-4">
                <div>
                  <h3 className="font-bold text-slate-700 dark:text-slate-200 text-base flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#30D158]" />
                    Face Verification Analysis ({matchedList.length} Match{matchedList.length > 1 ? 'es' : ''} Found)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    {result.faces_detected} face(s) detected in photo • Select student to confirm violation
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {matchedList.length > 1 && (
                    <button
                      onClick={handleConfirmAllViolations}
                      className="apple-btn-primary px-4 py-2 text-xs font-bold flex items-center gap-1.5 shadow-md"
                    >
                      <ShieldCheck className="w-4 h-4 text-white" /> Confirm All ({matchedList.length})
                    </button>
                  )}
                  <button
                    onClick={handleCancelMatch}
                    className="px-3.5 py-2 rounded-2xl bg-slate-200/80 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all border border-slate-300 dark:border-white/10 flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Reset Scan
                  </button>
                </div>
              </div>

              {/* Render comparison for each matched student in the picture */}
              <div className="space-y-6 divide-y divide-[#30D158]/20">
                {matchedList.map((st, idx) => (
                  <div key={st.roll_no} className={idx > 0 ? 'pt-6 space-y-4' : 'space-y-4'}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-[#30D158]/20 text-[#30D158] flex items-center justify-center text-[11px]">
                          {idx + 1}
                        </span>
                        Student #{idx + 1} Match in Image
                      </span>
                      <Badge variant="success" dot glow>
                        {st.confidence}% MATCH
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Captured / Uploaded Input Image */}
                      <div className="flex flex-col items-center space-y-2 p-3.5 rounded-2xl bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-center">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                          Incident Photo
                        </span>
                        <div
                          onClick={() => inputImagePreview && setPreviewModal({ url: inputImagePreview, title: `Incident Photo - Student #${idx + 1}` })}
                          className="relative group w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-slate-900 border-2 border-white/80 dark:border-white/20 shadow-md cursor-pointer"
                        >
                          {inputImagePreview ? (
                            <>
                              <img src={inputImagePreview} alt="Incident Photo" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[11px] font-bold gap-1">
                                <ZoomIn className="w-4 h-4" /> Expand
                              </div>
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">Incident Photo</div>
                          )}
                        </div>
                      </div>

                      {/* Database Enrolled Image for this specific student */}
                      <div className="flex flex-col items-center space-y-2 p-3.5 rounded-2xl bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-center">
                        <span className="text-xs font-bold text-[#30D158]">
                          Enrolled DB Photo
                        </span>
                        <div
                          onClick={() => setPreviewModal({ url: studentService.getStudentImage(st.roll_no), title: `${st.name} (${st.roll_no}) - DB Profile` })}
                          className="relative group w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-slate-900 border-4 border-[#30D158]/60 shadow-md ring-4 ring-[#30D158]/20 cursor-pointer"
                        >
                          <img
                            src={studentService.getStudentImage(st.roll_no)}
                            alt={st.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(st.name)}&background=30D158&color=fff`;
                            }}
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[11px] font-bold gap-1">
                            <ZoomIn className="w-4 h-4" /> Expand
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Matched Details Bar & Individual Confirm Button */}
                    <div className="p-4 rounded-2xl bg-white/80 dark:bg-white/10 border border-[#30D158]/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-white text-base">{st.name}</h4>
                        <p className="text-slate-500 dark:text-slate-300 font-mono text-xs mt-0.5">
                          Roll No: <span className="font-bold text-[#007AFF]">{st.roll_no}</span> • {st.department}-{st.section}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Confidence: <span className="font-bold text-[#30D158]">{st.confidence}%</span> (Cosine: {st.similarity})
                        </p>
                      </div>

                      {/* Confirm & Log Violation Action Button per matched student */}
                      <div className="shrink-0">
                        {loggedRollNos[st.roll_no] ? (
                          <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#30D158]/15 border border-[#30D158]/30 text-[#30D158] font-bold text-xs">
                            <CheckCircle2 className="w-4 h-4" strokeWidth={2.5} /> Violation Logged
                          </div>
                        ) : (
                          <button
                            onClick={() => handleConfirmViolation(st)}
                            disabled={loggingRollNo === st.roll_no}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#FF453A] to-[#FF2D55] text-white font-bold text-xs shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                          >
                            {loggingRollNo === st.roll_no ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin" strokeWidth={2} /> Logging...
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="w-4 h-4 text-white" strokeWidth={2} /> Confirm & Log Violation
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
          </AnimatePresence>
        </div>

        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, x: 60, filter: 'blur(8px)' }}
          animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.55, ease: EXPO_OUT, delay: 0.15 }}
        >
          <div className="glass-panel p-6 rounded-[24px] shadow-lg space-y-3.5 text-xs">
            <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm">Scan Parameters</h3>
            <div>
              <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">Location</label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 rounded-2xl bg-black/5 dark:bg-white/10 border border-white/20 dark:border-white/10 text-slate-700 dark:text-slate-200 font-semibold"
              >
                <option value="Main Gate">Main Gate</option>
                <option value="Playground">Playground</option>
                <option value="OAT">OAT (Open Air Theatre)</option>
                <option value="Central Block">Central Block</option>
                <option value="A Block">A Block</option>
                <option value="B Block">B Block</option>
                <option value="C Block">C Block</option>
                <option value="D Block">D Block</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">Log Violation As</label>
              <select
                value={violationType}
                onChange={(e) => setViolationType(e.target.value)}
                className="w-full px-3 py-2 rounded-2xl bg-black/5 dark:bg-white/10 border border-white/20 dark:border-white/10 text-slate-700 dark:text-slate-200 font-semibold"
              >
                <option value="Late Arrival">Late Arrival</option>
                <option value="Dress Code">Dress Code</option>
                <option value="Bunk">Bunking Class</option>
                <option value="No ID Card">No ID Card</option>
                <option value="Unauthorized Access">Unauthorized Access</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">Incident Remarks / Note</label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder={`Custom remark for ${location}...`}
                className="w-full px-3 py-2 rounded-2xl bg-black/5 dark:bg-white/10 border border-white/20 dark:border-white/10 text-slate-700 dark:text-slate-200 text-xs font-medium focus:outline-none focus:border-[#007AFF]"
              />
              {/* Location & Violation Type Dynamic Presets */}
              <div className="flex flex-wrap gap-1 mt-2">
                {((loc: string, vType: string) => {
                  const locName = loc === 'OAT' ? 'OAT (Open Air Theatre)' : loc;
                  if (vType === 'Late Arrival') {
                    return [
                      `Late Arrival at ${locName}`,
                      `Late Arrival at ${locName} after 9:00 AM`,
                      `Delayed entry scan at ${locName}`,
                    ];
                  }
                  if (vType === 'Dress Code') {
                    return [
                      `Dress Code Violation at ${locName}`,
                      `Improper uniform at ${locName}`,
                      `Missing blazer/shirt at ${locName}`,
                    ];
                  }
                  if (vType === 'Bunk' || vType === 'Bunking Class') {
                    return [
                      `Bunking Class at ${locName}`,
                      `Loitering near ${locName} during class`,
                      `Unapproved presence at ${locName}`,
                    ];
                  }
                  if (vType === 'No ID Card') {
                    return [
                      `No ID Card at ${locName}`,
                      `Failed ID scan at ${locName}`,
                      `Temporary pass issued at ${locName}`,
                    ];
                  }
                  return [
                    `Unauthorized movement near ${locName}`,
                    `Unapproved exit attempt at ${locName}`,
                    `Restricted zone flag at ${locName}`,
                  ];
                })(location, violationType).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setRemarks(preset)}
                    className={`text-[10px] px-2.5 py-1 rounded-xl font-semibold border transition-all cursor-pointer ${
                      remarks === preset
                        ? 'bg-[#007AFF]/20 text-[#007AFF] border-[#007AFF]/40 font-bold'
                        : 'bg-black/5 dark:bg-white/5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 border-black/5 dark:border-white/10'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {result && (
            <div className="glass-panel p-6 rounded-[24px] shadow-lg space-y-3.5">
              <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm flex items-center justify-between">
                <span>Recognition Output</span>
                <div className="flex items-center gap-2">
                  {matchedList.length > 0 ? (
                    <Badge variant="success" dot glow>
                      {matchedList.length} MATCH{matchedList.length > 1 ? 'ES' : ''}
                    </Badge>
                  ) : (
                    <Badge variant="warning" dot>
                      NO MATCH
                    </Badge>
                  )}
                  <button
                    onClick={handleCancelMatch}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Cancel / Reset Match Result"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </h3>

              {matchedList.length > 0 ? (
                <div className="space-y-2 text-xs">
                  {matchedList.map((st) => (
                    <div key={st.roll_no} className="p-3.5 rounded-2xl bg-[#30D158]/15 border border-[#30D158]/30 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#30D158] text-sm">{st.name}</span>
                        <span className="font-mono font-bold text-slate-600 dark:text-slate-300">{st.roll_no}</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-200 font-medium text-[11px]">
                        Confidence: <span className="font-bold text-[#30D158]">{st.confidence}%</span> ({st.department}-{st.section})
                      </p>
                      <div className="pt-1 border-t border-[#30D158]/20">
                        {loggedRollNos[st.roll_no] ? (
                          <div className="text-[10px] text-[#30D158] font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.5} /> Logged to GuardDB
                          </div>
                        ) : (
                          <span className="text-[10px] text-amber-500 font-semibold italic">
                            Pending Admin Confirmation
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-slate-600 dark:text-slate-300 space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-100">{result.reason || 'No match above threshold.'}</p>
                      <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        Similarity score was below threshold ({result.threshold}).
                      </p>
                    </div>
                  </div>
                  {(department !== 'ALL' || section !== 'ALL') && (
                    <div className="pt-2 border-t border-amber-500/20">
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Active filter: <span className="font-bold text-slate-700 dark:text-slate-200">{department} - {section}</span>. The student might be in a different department/section.
                      </p>
                      <button
                        onClick={() => {
                          setDepartment('ALL');
                          setSection('ALL');
                        }}
                        className="mt-2 text-[11px] font-bold text-[#007AFF] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" /> Reset filters to All Depts & Sections
                      </button>
                    </div>
                  )}
                </div>
              )}


            </div>
          )}
        </motion.div>
      </div>

      {/* ── High-Resolution Image Preview Lightbox Modal ── */}
      <AnimatePresence>
        {previewModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewModal(null)}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-2xl w-full bg-slate-900/90 border border-white/20 rounded-[28px] p-5 shadow-2xl overflow-hidden cursor-default space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-[#007AFF]" />
                  <h3 className="text-sm font-bold text-white truncate max-w-md">{previewModal.title}</h3>
                </div>
                <button
                  onClick={() => setPreviewModal(null)}
                  className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="relative rounded-2xl overflow-hidden bg-black flex items-center justify-center max-h-[70vh] border border-white/10">
                <img
                  src={previewModal.url}
                  alt={previewModal.title}
                  className="w-full h-full object-contain max-h-[70vh]"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 font-medium pt-1">
                <span>Click outside or Press ESC to close</span>
                <span className="text-[#30D158] font-bold flex items-center gap-1">
                  <ZoomIn className="w-3.5 h-3.5" /> High Precision Biometric View
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
};
