import React, { useRef, useState, useEffect } from 'react';
import { Camera, Scan, CheckCircle2, RefreshCw, Upload, Image as ImageIcon, Sparkles, VideoOff, Check, AlertTriangle, Users, ShieldCheck, X, RotateCcw } from 'lucide-react';
import { detectionService } from '../services/detectionService';
import { violationService } from '../services/violationService';
import { studentService } from '../services/studentService';
import { DetectionResult, FaceMatch } from '../types/detection';
import { Badge } from '../components/ui/Badge';
import { PageTransition } from '../components/ui/PageTransition';

export const DetectPage: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'camera' | 'upload'>('camera');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);

  // Track violation logging status per student roll_no
  const [loggedRollNos, setLoggedRollNos] = useState<Record<string, boolean>>({});
  const [loggingRollNo, setLoggingRollNo] = useState<string | null>(null);

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
      alert('Unable to access webcam.');
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
      alert('Recognition request failed: ' + (err.response?.data?.detail || err.message));
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
      alert(`Failed to log violation for ${matchStudent.name}`);
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
      alert('Please upload a valid image file (PNG, JPG, JPEG, WEBP, HEIF).');
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
            <div className="relative rounded-[28px] overflow-hidden bg-slate-950 border border-white/20 dark:border-white/10 shadow-2xl aspect-video flex items-center justify-center">
              <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${!isCameraActive ? 'hidden' : ''}`} />
              <canvas ref={canvasRef} className="hidden" />

              {!isCameraActive && (
                <div className="flex flex-col items-center space-y-3 text-slate-400 p-6 text-center">
                  <VideoOff className="w-12 h-12 stroke-1 text-slate-500" />
                  <p className="text-xs font-semibold">Webcam is currently OFF</p>
                  <button onClick={startCamera} className="apple-btn-primary px-5 py-2.5 text-xs font-bold shadow-md flex items-center gap-2">
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
                <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/20">
                  <span className="w-2 h-2 rounded-full bg-[#FF453A] animate-pulse" />
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">Live Feed</span>
                </div>
              )}

              {/* Action Buttons: Run Recognition, Clear Match & Turn Off Camera Aligned Side-by-Side */}
              {isCameraActive && (
                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3">
                  <div className={isProcessing ? '' : 'pulse-ring-wrap'}>
                    <button
                      onClick={captureFrame}
                      disabled={isProcessing}
                      className="apple-btn-primary flex items-center gap-2.5 px-5 py-2.5 text-xs font-bold shadow-xl disabled:opacity-40"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" strokeWidth={2} /> Matching Vectors...
                        </>
                      ) : (
                        <>
                          <Scan className="w-4 h-4" strokeWidth={2} /> Run Face Recognition
                        </>
                      )}
                    </button>
                  </div>

                  {result && (
                    <button
                      onClick={handleCancelMatch}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-black/60 hover:bg-rose-600/90 text-white text-xs font-bold backdrop-blur-md shadow-lg transition-all border border-white/20 cursor-pointer"
                      title="Clear current match result and prepare for next scan"
                    >
                      <RotateCcw className="w-3.5 h-3.5" strokeWidth={2.5} /> Clear Match
                    </button>
                  )}

                  <button
                    onClick={stopCamera}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#FF453A] hover:bg-[#E0382F] text-white text-xs font-bold shadow-lg shadow-[#FF453A]/20 transition-all border border-white/20 cursor-pointer"
                  >
                    <VideoOff className="w-4 h-4" strokeWidth={2} /> Turn Off Camera
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Drag and Drop Image Recognition Zone */
            <div className="glass-panel p-6 rounded-[28px] shadow-xl space-y-4 border border-white/60 dark:border-white/10">
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-[22px] p-8 text-center cursor-pointer transition-all ${
                  dragActive
                    ? 'border-[#007AFF] bg-[#007AFF]/10'
                    : 'border-slate-300 dark:border-white/20 hover:border-[#007AFF]/60 bg-white/40 dark:bg-white/5'
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
                  <div className="space-y-2 py-4">
                    <Check className="w-9 h-9 mx-auto text-[#30D158]" strokeWidth={2.5} />
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                      Selected: {uploadedFile.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      ({(uploadedFile.size / 1024 < 1024 ? `${Math.round(uploadedFile.size / 1024)} KB` : `${(uploadedFile.size / 1048576).toFixed(1)} MB`)})
                    </p>
                    <span className="text-[11px] text-[#007AFF] font-semibold underline block pt-1">
                      Click or drop another file to replace
                    </span>
                  </div>
                ) : (
                  <div className="space-y-2 py-6">
                    <Upload className="w-10 h-10 mx-auto text-[#007AFF] animate-bounce" strokeWidth={2} />
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                      Drag & Drop Photo for Multi-Face Recognition
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Supports PNG, JPG, JPEG, WEBP, HEIF (Detects multiple faces in single image)
                    </p>
                    <button type="button" className="apple-btn-secondary px-4 py-2 text-xs font-semibold mt-2">
                      Browse File
                    </button>
                  </div>
                )}
              </div>

              {/* Upload Recognition Button & Handy Clear Button */}
              {uploadedFile && (
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    onClick={runUploadRecognition}
                    disabled={isProcessing}
                    className="apple-btn-primary flex items-center gap-2.5 px-6 py-3 text-xs font-bold shadow-lg disabled:opacity-50 cursor-pointer"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" strokeWidth={2} /> Matching All Vectors in DB...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-white" strokeWidth={2} /> Match All Faces in Database
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleCancelMatch}
                    className="px-4 py-3 rounded-2xl bg-slate-200 dark:bg-white/10 hover:bg-rose-500/20 text-slate-700 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-bold transition-all border border-slate-300/80 dark:border-white/10 flex items-center gap-1.5 cursor-pointer shadow-xs"
                    title="Clear uploaded image and reset"
                  >
                    <RotateCcw className="w-4 h-4" strokeWidth={2} /> Clear / Reset
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Multi-Student Verification Panel (Supports 1 or Multiple People in Pic) */}
          {result && matchedList.length > 0 && (
            <div className="glass-panel p-6 rounded-[28px] shadow-xl border border-[#30D158]/30 bg-[#30D158]/5 space-y-6">
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
                      <ShieldCheck className="w-4 h-4 text-white" /> Confirm All ({matchedList.length}) Violations
                    </button>
                  )}
                  <button
                    onClick={handleCancelMatch}
                    className="px-3.5 py-2 rounded-2xl bg-slate-200 dark:bg-white/10 hover:bg-rose-500/15 hover:text-rose-500 text-slate-600 dark:text-slate-300 text-xs font-bold transition-all border border-slate-300 dark:border-white/10 flex items-center gap-1.5 cursor-pointer"
                    title="Cancel / Reset Match Result"
                  >
                    <X className="w-4 h-4" /> Cancel / Reset
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

                    <div className="grid grid-cols-2 gap-4">
                      {/* Captured / Uploaded Input Image */}
                      <div className="flex flex-col items-center space-y-2 p-3 rounded-2xl bg-white/70 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Uploaded Input Photo
                        </span>
                        <div className="w-32 h-32 rounded-2xl overflow-hidden bg-slate-900 border-2 border-white/80 dark:border-white/20 shadow-md">
                          {inputImagePreview ? (
                            <img src={inputImagePreview} alt="Captured Input" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">Input Image</div>
                          )}
                        </div>
                        <span className="text-[10px] font-semibold text-slate-400">Incident Snapshot</span>
                      </div>

                      {/* Database Enrolled Image for this specific student */}
                      <div className="flex flex-col items-center space-y-2 p-3 rounded-2xl bg-white/70 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          DB Enrolled Photo
                        </span>
                        <div className="w-32 h-32 rounded-full overflow-hidden bg-slate-900 border-4 border-[#30D158]/60 shadow-md ring-4 ring-[#30D158]/20">
                          <img
                            src={studentService.getStudentImage(st.roll_no)}
                            alt={st.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(st.name)}&background=30D158&color=fff`;
                            }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-[#30D158]">Training Profile</span>
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
            </div>
          )}
        </div>

        {/* Sidebar Parameters & Multi-Match Recognition Result */}
        <div className="space-y-4">
          <div className="glass-panel p-6 rounded-[24px] shadow-lg space-y-3.5 text-xs">
            <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm">Scan Parameters</h3>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">Dept</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 rounded-2xl bg-black/5 dark:bg-white/10 border border-white/20 dark:border-white/10 text-slate-700 dark:text-slate-200 font-semibold"
                >
                  <option value="ALL">All Depts</option>
                  <option value="CSE">CSE</option>
                  <option value="ECE">ECE</option>
                  <option value="EEE">EEE</option>
                  <option value="MECH">MECH</option>
                  <option value="CIVIL">CIVIL</option>
                  <option value="IT">IT</option>
                  <option value="CIC">CIC</option>
                  <option value="CSO">CSO</option>
                  <option value="CSM">CSM</option>
                  <option value="AIDS">AIDS</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">Section</label>
                <select
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="w-full px-3 py-2 rounded-2xl bg-black/5 dark:bg-white/10 border border-white/20 dark:border-white/10 text-slate-700 dark:text-slate-200 font-semibold"
                >
                  <option value="ALL">All Sections</option>
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                  <option value="D">Section D</option>
                </select>
              </div>
            </div>
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

              {result.total_ms && (
                <div className="text-[10px] font-mono text-slate-400 pt-1">
                  Detected {result.faces_detected} face(s) • {result.detection_ms}ms detect • {result.recognition_ms}ms match
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
};
