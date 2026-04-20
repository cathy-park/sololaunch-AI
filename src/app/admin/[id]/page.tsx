import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import { ArrowLeft, ExternalLink, Download, FileText, CheckCircle2, Clock, Layers, Layout, PlusCircle, Globe, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import AdminNoteEditor from './AdminNoteEditor';
import CopyPrdButton from './CopyPrdButton';
import DeleteButton from './DeleteButton';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function AdminDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: interview, error } = await supabase
    .from('interviews')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !interview) {
    notFound();
  }

  const isMultilingual = interview.features?.includes('다국어 기능');

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        <Link 
          href="/admin" 
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-black transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          목록으로 돌아가기
        </Link>

        <section className="bg-white border-2 border-black rounded-[40px] overflow-hidden mb-10 shadow-2xl">
          <div className="bg-black p-10 text-white flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="bg-white text-black text-[9px] font-black px-2 py-0.5 rounded-sm uppercase tracking-widest">
                  {interview.status || 'NEW'}
                </span>
                <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">ID: {interview.id.substring(0, 8)}</span>
              </div>
              <h1 className="text-5xl font-black tracking-tighter leading-none">{interview.client_name}</h1>
              <div className="flex items-center gap-4 text-gray-400 font-bold text-sm">
                 <span>{interview.client_phone}</span>
                 <span className="w-1 h-1 rounded-full bg-gray-700" />
                 <span>{interview.client_email}</span>
              </div>
            </div>
            <div className="lg:text-right space-y-2 border-t lg:border-t-0 border-white/10 pt-6 lg:pt-0 w-full lg:w-auto">
              <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] mb-1">Total Quote Range</p>
              <p className="text-4xl font-black tracking-tight">₩ {interview.price_range || interview.total_price?.toLocaleString()}</p>
              <div className="flex lg:justify-end gap-3 mt-4">
                 <span className="bg-white/10 text-white/50 text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest border border-white/5">
                    {interview.design_level || 'Basic'} Mode
                 </span>
                 <span className="bg-white/10 text-white/50 text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest border border-white/5">
                    VAT 별도
                 </span>
              </div>
              <div className="mt-8">
                 <CopyPrdButton data={interview} isMultilingual={isMultilingual} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 border-t-2 border-black">
            {[
              { label: '총 예상 섹션', value: `${interview.sections}개`, icon: Layers, detail: interview.data_readiness || '기본 준비됨' },
              { label: '활성 게시판', value: `${interview.boards || 0}`, icon: Layout, detail: 'Configured' },
              { label: '매월 호스팅비', value: `₩ ${isMultilingual ? '49,900' : '39,900'}`, icon: Clock, detail: 'VAT 별도' },
              { label: '상담 접수일', value: new Date(interview.created_at).toLocaleDateString(), icon: ShieldCheck, detail: 'Consultation Start' },
            ].map((item, i) => (
              <div key={i} className="p-8 border-r border-gray-100 last:border-r-0 hover:bg-gray-50 transition-colors group">
                <div className="flex items-center gap-2 mb-2 text-gray-300 group-hover:text-black transition-colors">
                    <item.icon className="w-4 h-4" />
                    <p className="text-[10px] font-black uppercase tracking-widest">{item.label}</p>
                </div>
                <p className="text-xl font-black text-black tracking-tight">{item.value}</p>
                <p className="text-[9px] text-gray-400 font-bold uppercase mt-1 tracking-tighter">{item.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-10">
            {/* STAGE 1: Production Scope */}
            <div className="bg-white border-2 border-black rounded-[40px] p-10 shadow-sm relative overflow-hidden group">
              <h2 className="text-xl font-black text-black mb-10 flex items-center gap-3">
                <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center font-black">1</div>
                STAGE 1. 제작 범위 상세
              </h2>
              <div className="space-y-10">
                <div className="space-y-4">
                   <label className="text-[11px] font-black text-gray-300 uppercase tracking-[0.2em] block">선택 페이지 및 구성 (섹션 수)</label>
                   <div className="flex flex-wrap gap-2.5">
                      {interview.pages?.split(',').map((p: string) => {
                        const isMain = p.includes('메인');
                        return (
                          <span 
                            key={p} 
                            className={cn(
                                "px-5 py-3 text-[13px] font-black rounded-2xl shadow-sm transition-transform hover:scale-105",
                                isMain ? "bg-black text-white" : "bg-white text-black border-2 border-black/5"
                            )}
                          >
                            {p.trim()}
                          </span>
                        );
                      })}
                   </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-gray-100">
                    <div className="space-y-4">
                        <label className="text-[11px] font-black text-gray-300 uppercase tracking-[0.2em] block">선택된 구성 요소</label>
                        <div className="flex flex-wrap gap-2">
                        {interview.components?.split(',').map((c: string) => (
                            <span key={c} className="px-4 py-2 bg-gray-50 text-black text-[12px] font-extrabold rounded-xl border border-gray-100">{c.trim()}</span>
                        ))}
                        </div>
                    </div>
                    <div className="space-y-4">
                        <label className="text-[11px] font-black text-gray-300 uppercase tracking-[0.2em] block">추가 기능 및 솔루션</label>
                        <div className="flex flex-wrap gap-2">
                            {interview.features?.split(',').map((f: string) => (
                                <span key={f} className="px-4 py-2 bg-orange-50 text-orange-600 text-[11px] font-black rounded-xl border border-orange-100 uppercase tracking-widest">{f.trim()}</span>
                            ))}
                        </div>
                    </div>
                </div>
              </div>
            </div>

            {/* STAGE 2: Business Brief */}
            <div className="bg-white border-2 border-black rounded-[40px] p-10 shadow-sm">
                <h2 className="text-xl font-black text-black mb-10 flex items-center gap-3">
                    <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center font-black">2</div>
                    STAGE 2. 비즈니스 브리프 상세
                </h2>
                <div className="space-y-12">
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
                       {[
                         { label: '업종/분야', value: interview.industry },
                         { label: '타켓 고객층', value: interview.target_audience },
                         { label: '사용 목적', value: interview.purpose },
                         { label: '디자인 분위기', value: interview.design_mood },
                         { label: '선호 컬러 톤', value: interview.color_tone },
                         { label: '로고 보유 상태', value: interview.logo_status },
                         { label: '희망 오픈 일정', value: interview.target_schedule },
                       ].map((item, i) => (
                         <div key={i} className="space-y-2 group">
                             <p className="text-[10px] text-gray-300 font-black uppercase tracking-[0.2em]">{item.label}</p>
                             <div className="text-[15px] font-black text-black leading-tight">
                                 {item.label === '선호 컬러 톤' ? (
                                     <ColorToneList value={item.value} />
                                 ) : (
                                     <span className="border-b-2 border-transparent group-hover:border-black transition-all pb-1 inline-block">
                                         {item.value || '-'}
                                     </span>
                                 )}
                             </div>
                         </div>
                       ))}
                    </div>

                   <div className="pt-8 border-t border-gray-100 space-y-4">
                      <label className="text-[11px] font-black text-gray-300 uppercase tracking-[0.2em] block">참고 사이트 리스트</label>
                      <div className="space-y-2">
                          {interview.ref_sites?.split(',').map((site: string, i: number) => {
                             const url = site.trim();
                             const isLink = url && url !== '없음' && url.includes('.');
                             const href = url.startsWith('http') ? url : `https://${url}`;
                             return isLink ? (
                               <a key={i} href={href} target="_blank" rel="noopener noreferrer"
                                 className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-black hover:bg-white transition-all group/site"
                               >
                                 <Globe className="w-4 h-4 text-gray-400 group-hover/site:text-black transition-colors" />
                                 <span className="text-[13px] font-bold text-gray-600 truncate flex-1 group-hover/site:text-black transition-colors">{url}</span>
                                 <ExternalLink className="w-4 h-4 text-gray-300 group-hover/site:text-black transition-colors" />
                               </a>
                             ) : (
                               <div key={i} className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                 <Globe className="w-4 h-4 text-gray-400" />
                                 <span className="text-[13px] font-bold text-gray-600 truncate">{url}</span>
                               </div>
                             );
                           })}
                           {!interview.ref_sites && <p className="text-sm text-gray-300 font-bold italic px-2">제공된 참고 사이트가 없습니다.</p>}
                      </div>
                   </div>

                   <div className="space-y-4">
                      <label className="text-[11px] font-black text-gray-300 uppercase tracking-[0.2em] block">상세 요청사항 (Additional Note)</label>
                      <div className="p-8 bg-gray-50 rounded-3xl text-[15px] font-medium leading-relaxed italic text-gray-700 border border-gray-100">
                        {interview.additional_request || '입력된 상세 요청사항이 없습니다.'}
                      </div>
                   </div>

                  {interview.file_url && (
                    <div className="pt-8 border-t border-gray-100 space-y-4">
                        <label className="text-[11px] font-black text-gray-300 uppercase tracking-[0.2em] block">첨부 자료</label>
                        <div className="flex items-center justify-between p-6 border-2 border-black rounded-3xl shadow-xl hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-black text-white rounded-2xl flex items-center justify-center">
                                    <FileText className="w-7 h-7" />
                                </div>
                                <div>
                                    <p className="text-[15px] font-black">업로드 파일</p>
                                    <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest leading-none">Document Attached</p>
                                </div>
                            </div>
                            <a 
                                href={`/api/download?url=${encodeURIComponent(interview.file_url)}&filename=${encodeURIComponent(`${interview.client_name}_첨부파일`)}`}
                                className="w-14 h-14 bg-black text-white rounded-2xl flex items-center justify-center hover:scale-105 transition-all shadow-2xl"
                            >
                                <Download className="w-6 h-6" />
                            </a>
                        </div>
                    </div>
                  )}
                </div>
            </div>
          </div>

          <div className="space-y-10">
             <div className="bg-white border-2 border-black rounded-[40px] p-10 shadow-2xl">
                <h2 className="text-xl font-black text-black mb-10 flex items-center gap-3">
                  <Clock className="w-6 h-6" />
                  STATUS & MEMO
                </h2>
                <AdminNoteEditor 
                  interviewId={interview.id} 
                  initialNotes={interview.admin_notes || ''}
                  initialStatus={interview.status || '접수'}
                />
             </div>
             <div className="text-center pt-10 flex flex-col items-center gap-6">
                 <p className="text-[11px] font-black text-gray-300 uppercase tracking-[0.5em] mb-4 leading-relaxed">
                     SYSTEM RECORDED AT<br/>
                     {new Date(interview.created_at).toLocaleString('ko-KR')}
                 </p>
                 <DeleteButton interviewId={interview.id} />
             </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function ColorToneList({ value }: { value: string }) {
    if (!value || value === '-' || value === '잘 모르겠어요 / 없음') return <span className="text-gray-300 italic">{value || '-'}</span>;

    // "용도:HEX(설명), 용도:HEX(설명)" 형식 파싱
    const colors = value.split(',').map(item => {
        const [typePart, rest] = item.split(':').map(s => s.trim());
        if (!rest) return { type: typePart, hex: '', note: '' };

        const hexMatch = rest.match(/#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})/);
        const hex = hexMatch ? hexMatch[0] : '';
        const noteMatch = rest.match(/\(([^)]+)\)/);
        const note = noteMatch ? noteMatch[1] : '';

        return { type: typePart, hex, note };
    });

    return (
        <div className="flex flex-wrap gap-2 mt-1">
            {colors.map((c, i) => (
                <div key={i} className="flex flex-col gap-1 p-3 bg-gray-50 rounded-2xl border border-gray-100 min-w-[140px]">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full border border-white" style={{ backgroundColor: c.hex }} />
                        <span className="text-[11px] font-black text-black">{c.type}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-[14px] font-black leading-none">{c.hex.toUpperCase()}</span>
                        {c.note && <span className="text-[10px] text-gray-400 font-medium leading-tight">{c.note}</span>}
                    </div>
                </div>
            ))}
        </div>
    );
}
