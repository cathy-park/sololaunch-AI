'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

export default function DeleteButton({ interviewId }: { interviewId: string }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm('정말로 이 인터뷰 내역을 삭제하시겠습니까? 삭제 후에는 복구할 수 없습니다.')) return;
    
    setIsDeleting(true);
    const { error } = await supabase.from('interviews').delete().eq('id', interviewId);
    
    if (error) {
      alert('삭제 중 오류가 발생했습니다: ' + error.message);
      setIsDeleting(false);
    } else {
      window.location.href = '/admin';
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className={cn(
        "px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border-2",
        "text-red-400 border-red-50/50 hover:bg-red-50 hover:border-red-100 disabled:opacity-50"
      )}
    >
      {isDeleting ? 'DELETING...' : 'DELETE THIS RECORD'}
    </button>
  );
}
