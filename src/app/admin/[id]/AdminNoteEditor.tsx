"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Save, Loader2, Check } from 'lucide-react';

export default function AdminNoteEditor({ 
  interviewId, 
  initialNotes,
  initialStatus 
}: { 
  interviewId: string; 
  initialNotes: string;
  initialStatus: string;
}) {
  const getNormalizedStatus = (s: string) => {
    if (s === '완료') return '제작완료';
    if (s === '접수') return '접수됨';
    return s || '접수됨';
  };

  const [notes, setNotes] = useState(initialNotes);
  const [status, setStatus] = useState(getNormalizedStatus(initialStatus));
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    setSaved(false);
    
    const { error } = await supabase
      .from('interviews')
      .update({ 
        admin_notes: notes,
        status: status
      })
      .eq('id', interviewId);

    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } else {
      alert('저장 중 오류가 발생했습니다: ' + error.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">진행 상태</label>
        <select 
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full bg-gray-50 border border-gray-100 p-3 rounded-lg text-sm font-bold focus:border-black outline-none appearance-none cursor-pointer"
        >
          <option value="접수됨">접수됨</option>
          <option value="검토중">검토중</option>
          <option value="상담완료">상담완료</option>
          <option value="계약진행">계약진행</option>
          <option value="제작완료">제작완료</option>
          <option value="보류">보류</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">내부 메모</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="관리자만 볼 수 있는 메모를 입력하세요."
          className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl text-sm leading-relaxed focus:border-black outline-none min-h-[150px] resize-none"
        />
      </div>

      <button
        onClick={handleSave}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-black text-white py-3 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-black/90 transition-all disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : saved ? (
          <>
            <Check className="w-4 h-4" />
            SAVED
          </>
        ) : (
          <>
            <Save className="w-4 h-4" />
            SAVE CHANGES
          </>
        )}
      </button>
    </div>
  );
}
