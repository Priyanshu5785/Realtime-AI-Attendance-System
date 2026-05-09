import React, { useState, useEffect } from 'react';
import { Shield, Sparkles, BookOpen, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, where, limit } from 'firebase/firestore';
import Auth from './components/Auth';
import CameraView from './components/CameraView';
import StudentManager from './components/StudentManager';
import AttendanceList, { AttendanceRecord } from './components/AttendanceList';
import { StudentReference } from './services/aiService';

import { handleFirestoreError, OperationType } from './lib/firestoreErrorHandler';

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<StudentReference[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [lastMarkedName, setLastMarkedName] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) {
      setStudents([]);
      setRecords([]);
      return;
    }

    // Subscribe to students
    const qStudents = query(collection(db, 'students'), orderBy('createdAt', 'desc'));
    const unsubStudents = onSnapshot(qStudents, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        photoBase64: doc.data().photo
      })) as StudentReference[];
      setStudents(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'students');
    });

    // Subscribe to attendance (today's records)
    const today = new Date().toISOString().split('T')[0];
    const qAttendance = query(
      collection(db, 'attendance'),
      where('date', '==', today),
      orderBy('timestamp', 'desc'),
      limit(50)
    );
    const unsubAttendance = onSnapshot(qAttendance, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AttendanceRecord[];
      setRecords(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'attendance');
    });

    return () => {
      unsubStudents();
      unsubAttendance();
    };
  }, [user]);

  const handleAttendanceMarked = (name: string) => {
    setLastMarkedName(name);
    setTimeout(() => setLastMarkedName(null), 5000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-emerald-500/30 flex flex-col">
      {/* Header */}
      <header className="h-20 bg-slate-900 text-white flex items-center justify-between px-8 border-b-4 border-emerald-500 sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-500 flex items-center justify-center rounded-sm rotate-45 shadow-[0_0_15px_rgba(16,185,129,0.4)]">
            <div className="-rotate-45 font-black text-xl text-slate-900">A</div>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">FACELINK AI</h1>
            <p className="text-[10px] text-slate-400 tracking-widest uppercase font-bold">Smart Attendance System v2.4</p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <div className="text-right">
            <p className="text-lg font-mono font-bold leading-none">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </div>
          <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded border border-slate-700">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">System Online</span>
          </div>
          <Auth user={user} />
        </div>
        
        <div className="md:hidden">
          <Auth user={user} />
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 overflow-hidden">
        {!user ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <motion.div
              initial={{ rotate: 45, scale: 0.5, opacity: 0 }}
              animate={{ rotate: 45, scale: 1, opacity: 1 }}
              className="w-24 h-24 bg-emerald-500 flex items-center justify-center rounded-sm mb-12 shadow-2xl shadow-emerald-500/20"
            >
              <Shield className="text-slate-900 -rotate-45" size={48} />
            </motion.div>
            <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Precision Attendance Identification</h2>
            <p className="text-slate-500 max-w-lg mb-10 text-lg font-medium leading-relaxed">
              Experience the next generation of biometric verification. Seamless, geometric, and powered by advanced neural matching.
            </p>
            <Auth user={null} />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch h-full">
            {/* Left Section: Camera and Scanner */}
            <div className="lg:col-span-12 xl:col-span-7 flex flex-col gap-6">
              <CameraView 
                students={students} 
                onAttendanceMarked={handleAttendanceMarked}
              />
              
              <AnimatePresence>
                {lastMarkedName && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center gap-3 p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded text-emerald-800 shadow-sm"
                  >
                    <BookOpen size={20} className="text-emerald-500" />
                    <span className="font-bold text-sm tracking-wide uppercase">IDENTIFIED: {lastMarkedName} • SUCCESSFUL LOG</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right Section: Sidebar stuff */}
            <div className="lg:col-span-12 xl:col-span-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-6">
              <div className="h-[400px] xl:h-auto overflow-hidden">
                <StudentManager students={students} />
              </div>
              <div className="h-[400px] xl:h-auto overflow-hidden">
                <AttendanceList records={records} />
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="h-12 bg-white border-t border-slate-200 px-8 flex items-center justify-between text-slate-400 shrink-0">
        <div className="hidden md:flex gap-6">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span className="text-[10px] font-bold uppercase tracking-wider">Engine: Gemini-3</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-[10px] font-bold uppercase tracking-wider">Auth: Encrypted</span>
          </div>
        </div>
        <div className="w-full md:w-auto text-center md:text-right text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300">
          NeuralShield Secured &copy; {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}
