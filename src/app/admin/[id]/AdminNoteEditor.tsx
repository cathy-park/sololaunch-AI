"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Save, Loader2, Check, Plus, MessageSquare, Calendar } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

interface MemoEntry {
  id: string;
  content: string;
  createdAt: string;
}

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

  // 기존 메모 데이터를 파싱하는 함수
  const parseInitialMemos = (notes: string): MemoEntry[] => {
    try {
      if (!notes) return [];
      // JSON 형태인 경우
      const parsed = JSON.parse(notes);
      if (Array.isArray(parsed)) return parsed;
      // JSON 객체이지만 배열이 아닌 경우 (예외처리)
      return [{ id: 'old-1', content: notes, createdAt: new Date().toISOString() }];
    } catch (e) {
      // JSON이 아닌 일반 문자열인 경우 (기존 데이터)
      return [{ id: 'legacy-' + Date.now(), content: notes, createdAt: new Date().toISOString() }];
    }
  };

  const [memos, setMemos] = useState<MemoEntry[]>(parseInitialMemos(initialNotes));
  const [newMemo, setNewMemo] = useState('');
  const [status, setStatus] = useState(getNormalizedStatus(initialStatus));
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleAddMemo = async () => {
    if (!newMemo.trim()) return;

    const entry: MemoEntry = {
      id: Date.now().toString(),
      content: newMemo.trim(),
      createdAt: new Date().toISOString()
    };

    const updatedMemos = [...memos, entry];
    
    setLoading(true);
    const { error } = await supabase
      .from('interviews')
      .update({ 
        admin_notes: JSON.stringify(updatedMemos),
        status: status
      })
      .eq('id', interviewId);

    if (!error) {
      setMemos(updatedMemos);
      setNewMemo('');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } else {
      alert('저장 중 오류가 발생했습니다: ' + error.message);
    }
    setLoading(false);
  };

  const handleStatusChangeOnly = async (newStatus: string) => {
    setStatus(newStatus);
    setLoading(true);
    const { error } = await supabase
      .from('interviews')
      .update({ status: newStatus })
      .eq('id', interviewId);
    
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-8">
      {/* 1. Status Section */}
      <div className="space-y-3">
        <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-2">
          <Check className="w-3 h-3" />
          상담 진행 상태
        </label>
        <div className="relative group/status">
          <select 
            value={status}
            onChange={(e) => handleStatusChangeOnly(e.target.value)}
            className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-[13px] font-black focus:border-black outline-none appearance-none cursor-pointer group-hover/status:bg-white group-hover/status:shadow-sm transition-all"
          >
            <option value="접수됨">접수됨</option>
            <option value="검토중">검토중</option>
            <option value="상담완료">상담완료</option>
            <option value="계약진행">계약진행</option>
            <option value="제작완료">제작완료</option>
            <option value="보류">보류</option>
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-300">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 rotate-45" />}
          </div>
        </div>
      </div>

      {/* 2. Memo History Section */}
      <div className="space-y-4">
        <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-2">
          <MessageSquare className="w-3 h-3" />
          내부 메모 히스토리
        </label>
        
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {memos.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
              <p className="text-[11px] font-bold text-gray-300 uppercase tracking-widest">No memos recorded yet.</p>
            </div>
          ) : (
            memos.map((memo) => (
              <div key={memo.id} className="bg-gray-50/50 border border-gray-100 p-5 rounded-2xl space-y-2 group/memo hover:bg-white hover:shadow-md transition-all">
                <div className="flex justify-between items-center border-b border-gray-100 pb-2 mb-2">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" />
                    {new Date(memo.createdAt).toLocaleString('ko-KR')}
                  </span>
                  <div className="opacity-0 group-hover/memo:opacity-100 transition-opacity">
                    <button 
                      onClick={() => {
                        if (confirm('이 메모를 삭제하시겠습니까?')) {
                           const filtered = memos.filter(m => m.id !== memo.id);
                           setMemos(filtered);
                           supabase.from('interviews').update({ admin_notes: JSON.stringify(filtered) }).eq('id', interviewId);
                        }
                      }}
                      className="text-[10px] font-black text-red-300 hover:text-red-500"
                    >
                      DELETE
                    </button>
                  </div>
                </div>
                <div className="prose prose-sm prose-gray max-w-none prose-p:leading-relaxed prose-p:font-medium prose-p:text-gray-700">
                   <ReactMarkdown>{memo.content}</ReactMarkdown>
                </div>
              </div>
            ))
          ).reverse() /* 최신순 */}
        </div>
      </div>

      {/* 3. New Memo Input Section */}
      <div className="space-y-3 pt-4 border-t border-gray-100">
        <div className="relative">
          <textarea
            value={newMemo}
            onChange={(e) => setNewMemo(e.target.value)}
            placeholder="상세 내용을 입력하세요 (마크다운 지원)"
            className="w-full bg-gray-50 border border-gray-100 p-5 rounded-3xl text-[14px] leading-relaxed focus:border-black outline-none min-h-[120px] resize-none transition-all placeholder:text-gray-300"
          />
          {newMemo && (
            <div className="absolute bottom-4 right-4 animate-in fade-in zoom-in duration-300">
              <button
                onClick={handleAddMemo}
                disabled={loading}
                className="bg-black text-white px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-[0.1em] shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                ADD MEMO
              </button>
            </div>
          )}
        </div>
      </div>

      {saved && (
        <div className="flex justify-center">
          <div className="bg-black text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 animate-bounce">
            <Check className="w-3 h-3" />
            SUCCESSFULLY UPDATED
          </div>
        </div>
      )}
    </div>
  );
}
