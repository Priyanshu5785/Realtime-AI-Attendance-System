import React from 'react';
import { LogIn, LogOut, User } from 'lucide-react';
import { signInWithGoogle, logout } from '../lib/firebase';
import { User as FirebaseUser } from 'firebase/auth';

interface AuthProps {
  user: FirebaseUser | null;
}

export default function Auth({ user }: AuthProps) {
  if (user) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 bg-slate-800 px-4 py-1.5 rounded border border-slate-700 shadow-inner">
          {user.photoURL ? (
            <img src={user.photoURL} alt={user.displayName || ''} className="w-6 h-6 rounded bg-slate-700 border border-slate-600" />
          ) : (
            <User size={16} className="text-slate-400" />
          )}
          <div className="hidden sm:block text-left">
            <p className="text-[10px] font-bold text-slate-400 leading-none uppercase tracking-tighter">Authorized User</p>
            <p className="text-sm font-bold text-emerald-400 leading-tight truncate max-w-[120px]">{user.displayName}</p>
          </div>
        </div>
        <button 
          onClick={logout}
          className="p-2 text-slate-500 hover:text-red-500 transition-colors"
          title="Logout"
        >
          <LogOut size={18} />
        </button>
      </div>
    );
  }

  return (
    <button 
      onClick={signInWithGoogle}
      className="flex items-center gap-2 bg-emerald-500 text-slate-900 px-6 py-2 rounded font-bold text-xs uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-lg active:scale-95"
    >
      <LogIn size={16} />
      Access Database
    </button>
  );
}
