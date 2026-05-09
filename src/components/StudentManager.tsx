import React, { useState, useRef } from 'react';
import { UserPlus, Camera, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/firebase';
import { collection, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { StudentReference } from '../services/aiService';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';

interface StudentManagerProps {
  students: StudentReference[];
}

export default function StudentManager({ students }: StudentManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    setIsCapturing(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
    } catch (err) {
      console.error("Camera Error:", err);
      setIsCapturing(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        setPhoto(canvas.toDataURL('image/jpeg', 0.8));
        stopCamera();
        setIsCapturing(false);
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const handleSave = async () => {
    if (!name || !photo) return;
    try {
      await addDoc(collection(db, 'students'), {
        name,
        photo,
        createdAt: serverTimestamp()
      });
      setName('');
      setPhoto(null);
      setIsAdding(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'students');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to remove this student?")) {
      try {
        await deleteDoc(doc(db, 'students', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `students/${id}`);
      }
    }
  };

  return (
    <div id="student-manager" className="bg-white rounded border border-slate-200 shadow-sm h-full overflow-hidden flex flex-col">
      <div className="flex justify-between items-center p-4 bg-slate-50 border-b border-slate-100">
        <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
          <UserPlus size={14} className="text-emerald-500" />
          Student Directory ({students.length})
        </h2>
        <button
          id="btn-add-student"
          onClick={() => setIsAdding(true)}
          className="bg-slate-900 text-white px-3 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-colors shadow-sm"
        >
          Enroll New
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide p-4">
        {students.length === 0 && !isAdding && (
          <div className="flex flex-col items-center justify-center h-40 text-slate-300">
            <UserPlus size={40} className="mb-2 opacity-10" />
            <p className="text-[10px] font-bold uppercase tracking-widest">No Active Records</p>
          </div>
        )}
        
        <div className="grid grid-cols-1 gap-2">
          {students.map((student) => (
            <motion.div 
              key={student.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-3 p-2 bg-slate-50 border border-slate-100 rounded-sm group hover:border-emerald-200 transition-colors"
            >
              <img src={student.photoBase64} alt={student.name} className="w-10 h-10 rounded-sm object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all border border-slate-200" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate uppercase tracking-tighter">{student.name}</p>
                <p className="text-[9px] font-mono text-slate-400">UID: #{student.id.slice(-6).toUpperCase()}</p>
              </div>
              <button 
                onClick={() => handleDelete(student.id)}
                className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 size={14} />
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg p-8 max-w-md w-full shadow-2xl relative border-t-8 border-emerald-500"
            >
              <button 
                onClick={() => { setIsAdding(false); stopCamera(); setIsCapturing(false); }}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>

              <h3 className="text-xl font-black text-slate-900 mb-6 uppercase tracking-tight">Biometric Enrollment</h3>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Primary Identity</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ENTER FULL NAME"
                    className="w-full px-4 py-3 rounded-sm border border-slate-200 font-bold text-sm focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-300 uppercase tracking-tight"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Biometric Sample</label>
                  <div className="aspect-square bg-slate-100 rounded-sm overflow-hidden relative border-2 border-slate-200 flex items-center justify-center">
                    {photo ? (
                      <img src={photo} alt="Preview" className="w-full h-full object-cover grayscale-[0.3]" />
                    ) : isCapturing ? (
                      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover grayscale-[0.3]" />
                    ) : (
                      <button 
                        onClick={startCamera}
                        className="flex flex-col items-center gap-2 text-slate-400 hover:text-emerald-500 transition-colors"
                      >
                        <Camera size={32} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Activate Camera</span>
                      </button>
                    )}
                    <canvas ref={canvasRef} className="hidden" />
                  </div>
                  {isCapturing && (
                    <button 
                      onClick={capturePhoto}
                      className="w-full mt-4 bg-emerald-500 text-slate-900 py-3 rounded-sm font-black text-xs uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-md"
                    >
                      Capture Sample
                    </button>
                  )}
                  {photo && (
                    <button 
                      onClick={() => setPhoto(null)}
                      className="w-full mt-4 text-emerald-600 font-bold text-[10px] uppercase tracking-widest hover:underline"
                    >
                      Recalibrate Capture
                    </button>
                  )}
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    disabled={!name || !photo}
                    onClick={handleSave}
                    className="flex-1 bg-slate-900 text-white py-4 rounded-sm font-black text-xs uppercase tracking-[0.3em] hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-300 disabled:cursor-not-allowed transition-all shadow-xl"
                  >
                    Register Identity
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
