import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, UserCheck, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { matchStudent, StudentReference } from '../services/aiService';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';

interface CameraViewProps {
  students: StudentReference[];
  onAttendanceMarked: (name: string) => void;
}

export default function CameraView({ students, onAttendanceMarked }: CameraViewProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [status, setStatus] = useState<'idle' | 'scanning' | 'matched' | 'failed'>('idle');
  const [matchedName, setMatchedName] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 1280, height: 720 },
        audio: false 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
    } catch (err) {
      console.error("Camera Error:", err);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const handleScan = async () => {
    if (!videoRef.current || !canvasRef.current || isScanning) return;

    setIsScanning(true);
    setStatus('scanning');
    setMatchedName(null);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = canvas.toDataURL('image/jpeg', 0.8);

      const result = await matchStudent(imageData, students);

      if (result.studentId) {
        const student = students.find(s => s.id === result.studentId);
        if (student) {
          await markAttendance(student);
          setMatchedName(student.name);
          setStatus('matched');
          onAttendanceMarked(student.name);
        } else {
          setStatus('failed');
        }
      } else {
        setStatus('failed');
      }
    }

    setIsScanning(false);
    
    // Reset status after a delay
    setTimeout(() => {
      setStatus(prev => prev === 'scanning' ? prev : 'idle');
    }, 3000);
  };

  const markAttendance = async (student: StudentReference) => {
    try {
      const now = new Date();
      await addDoc(collection(db, 'attendance'), {
        studentId: student.id,
        studentName: student.name,
        timestamp: serverTimestamp(),
        date: now.toISOString().split('T')[0]
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'attendance');
    }
  };

  return (
    <div id="camera-view" className="flex flex-col items-center gap-6 p-1 bg-white rounded border-2 border-slate-300 shadow-sm overflow-hidden min-h-[480px]">
      <div className="relative w-full flex-1 bg-slate-900 overflow-hidden group">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="w-full h-full object-cover grayscale-[0.2]"
        />
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Geometric Overlays */}
        <div className="absolute inset-0 border-[30px] border-black/20 pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 pointer-events-none">
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-emerald-500"></div>
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-emerald-500"></div>
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-emerald-500"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-emerald-500"></div>
        </div>

        {/* Scanning Overlay */}
        <AnimatePresence>
          {status === 'scanning' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-emerald-500/5 pointer-events-none"
            >
              <div className="w-[64%] h-[1px] bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.8)] absolute top-0 animate-scan z-20" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status indicator */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-30">
          <AnimatePresence mode="wait">
            {status === 'scanning' && (
              <motion.div 
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                className="bg-slate-900/80 backdrop-blur-md text-emerald-400 border border-emerald-500/50 px-4 py-1.5 rounded-sm flex items-center gap-2"
              >
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase">Processing Biometrics...</span>
              </motion.div>
            )}
            {status === 'matched' && (
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-emerald-500 text-slate-900 px-6 py-2 rounded-sm flex items-center gap-3 shadow-2xl"
              >
                <UserCheck size={18} />
                <span className="font-black text-xs uppercase tracking-widest whitespace-nowrap">Match Verified • {matchedName}</span>
              </motion.div>
            )}
            {status === 'failed' && (
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-red-500 text-white px-6 py-2 rounded-sm flex items-center gap-3 shadow-2xl"
              >
                <XCircle size={18} />
                <span className="font-black text-xs uppercase tracking-widest whitespace-nowrap">Access Denied • No Match Found</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Technical Data Overlay */}
        <div className="absolute bottom-4 left-4 font-mono text-[9px] text-white/50 bg-black/40 px-3 py-1.5 backdrop-blur-sm border border-white/10 rounded-sm uppercase tracking-tighter">
          REC ● 1080P | 60FPS | AI_MATCH_v2 | CHANNEL_01
        </div>
      </div>

      <div className="w-full flex items-center justify-between px-6 pb-6 pt-2">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Biometric Status</span>
          <span className={`text-xs font-bold uppercase ${status === 'matched' ? 'text-emerald-500' : 'text-slate-600'}`}>
            {status === 'idle' ? 'Ready for scan' : status === 'scanning' ? 'Analyzing...' : status === 'matched' ? 'Identity confirmed' : 'Analysis failed'}
          </span>
        </div>

        <button
          id="btn-scan"
          onClick={handleScan}
          disabled={isScanning || students.length === 0}
          className={`flex items-center gap-3 px-10 py-3 rounded-sm font-black text-xs uppercase tracking-[0.2em] transition-all transform active:scale-95 shadow-sm ${
            isScanning || students.length === 0
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-emerald-500 hover:bg-emerald-400 text-slate-900 border-b-4 border-emerald-700'
          }`}
        >
          {isScanning ? (
            <RefreshCw className="animate-spin" size={18} />
          ) : (
            <Camera size={18} />
          )}
          {isScanning ? 'Syncing...' : 'Initiate Verification'}
        </button>
      </div>

      {students.length === 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-max px-4 py-1 bg-amber-500 text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-sm">
          Warning: Database Empty • Register students to proceed
        </div>
      )}

      <style>{`
        @keyframes scan {
          0% { top: 15%; opacity: 0.2; }
          50% { opacity: 1; }
          100% { top: 85%; opacity: 0.2; }
        }
        .animate-scan {
          animation: scan 2.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
