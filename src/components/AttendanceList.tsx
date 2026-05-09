import React from 'react';
import { Calendar, Clock, User } from 'lucide-react';
import { motion } from 'motion/react';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  timestamp: any;
  date: string;
}

interface AttendanceListProps {
  records: AttendanceRecord[];
}

export default function AttendanceList({ records }: AttendanceListProps) {
  return (
    <div id="attendance-list" className="bg-white rounded border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
        <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
          <Calendar size={14} className="text-emerald-500" />
          Attendance Log
        </h2>
        <div className="text-[10px] bg-slate-200 px-2 py-1 rounded font-black tracking-tighter text-slate-600">
          DAILY_LOG_{new Date().toISOString().split('T')[0].replace(/-/g, '_')}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {records.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-300">
            <Clock size={40} className="mb-2 opacity-10" />
            <p className="text-[10px] font-bold uppercase tracking-widest">Awaiting Verification</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-[9px] text-slate-400 uppercase font-black border-b border-slate-100 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-4 py-3 tracking-widest">Identity</th>
                <th className="px-4 py-3 tracking-widest">Time</th>
                <th className="px-4 py-3 tracking-widest">Auth</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map((record) => {
                const time = record.timestamp?.toDate ? record.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '...';
                
                return (
                  <motion.tr
                    key={record.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-emerald-50/30 transition-colors group"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-sm bg-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500 uppercase group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                          {record.studentName.charAt(0)}
                        </div>
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-tighter truncate max-w-[120px]">
                          {record.studentName}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-[10px] text-slate-500 font-bold whitespace-nowrap">
                      {time}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-black rounded-sm uppercase tracking-tighter border border-emerald-200">
                        Verified
                      </span>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      
      <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-widest">
        <span>Session Data: {records.length} Logs</span>
        <span>Relay: Active</span>
      </div>
    </div>
  );
}
