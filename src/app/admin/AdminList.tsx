"use client";

import { useState } from 'react';
import { Mail, Calendar, Calculator, ChevronRight, Search, Filter, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

const STATUS_LIST = [
  { label: '전체', value: 'all' },
  { label: '접수됨', value: '접수됨' },
  { label: '검토중', value: '검토중' },
  { label: '상담완료', value: '상담완료' },
  { label: '계약진행', value: '계약진행' },
  { label: '완료', value: '완료' },
  { label: '보류', value: '보류' },
];

export default function AdminList({ initialInterviews }: { initialInterviews: any[] }) {
  const [interviews, setInterviews] = useState(initialInterviews);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm('정말로 이 내역을 삭제하시겠습니까?')) return;

    const { error } = await supabase.from('interviews').delete().eq('id', id);
    if (error) {
      alert('삭제 중 오류가 발생했습니다: ' + error.message);
    } else {
      setInterviews(prev => prev.filter(item => item.id !== id));
    }
  };

  const filteredInterviews = interviews.filter((item) => {
    const matchesSearch = 
      item.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.client_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.client_phone.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter || (statusFilter === '접수됨' && item.status === '접수');
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8">
      {/* Search & Filter Bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="고객명, 이메일, 연락처로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-black transition-all font-medium text-sm"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          {STATUS_LIST.map((s) => (
            <button
              key={s.value}
              onClick={() => setStatusFilter(s.value)}
              className={cn(
                "px-5 py-2.5 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all border-2",
                statusFilter === s.value 
                  ? "bg-black text-white border-black" 
                  : "bg-white text-gray-400 border-gray-100 hover:border-gray-200"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="flex items-center justify-between px-2">
        <p className="text-sm font-bold text-gray-400">
          검색 결과 <span className="text-black">{filteredInterviews.length}</span>건
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredInterviews.map((item) => (
          <Link 
            key={item.id} 
            href={`/admin/${item.id}`}
            className="bg-white border border-border rounded-xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
          >
            <div className="flex justify-between items-start mb-4">
              <span className={cn(
                "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                (item.status === '접수됨' || item.status === '접수') ? "bg-black text-white border-black" : 
                item.status === '계약진행' ? "bg-blue-500 text-white border-blue-500" :
                item.status === '완료' ? "bg-green-500 text-white border-green-500" :
                "bg-white text-gray-400 border-gray-200"
              )}>
                {item.status || '접수됨'}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(item.created_at).toLocaleDateString('ko-KR')}
                </span>
                <button
                  onClick={(e) => handleDelete(e, item.id)}
                  className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  title="삭제"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <h3 className="text-xl font-bold text-black mb-1 group-hover:text-gray-700 transition-colors">{item.client_name}</h3>
            <p className="text-sm text-gray-400 flex items-center gap-1.5 mb-6">
              <Mail className="w-3.5 h-3.5" />
              {item.client_email}
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-100/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">Expected Quote</span>
                <Calculator className="w-4 h-4 text-gray-300" />
              </div>
              <div className="text-lg font-black text-black">
                ₩ {item.price_range || item.total_price?.toLocaleString()}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-4">
              <span className="text-[11px] font-black text-gray-300 uppercase tracking-widest">{item.industry || '기타'}</span>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-black group-hover:translate-x-1 transition-all" />
            </div>
          </Link>
        ))}
      </div>

      {filteredInterviews.length === 0 && (
        <div className="text-center py-20 bg-white border border-dashed border-gray-200 rounded-2xl text-gray-400 font-bold">
          검색 조건과 일치하는 내역이 없습니다.
        </div>
      )}
    </div>
  );
}
