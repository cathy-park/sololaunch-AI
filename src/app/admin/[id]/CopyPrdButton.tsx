"use client";

import { useState } from 'react';
import { FileText, CheckCircle2 } from 'lucide-react';

export default function CopyPrdButton({ data, isMultilingual }: { data: any, isMultilingual: boolean }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const prdText = `
[똑디 고객 인터뷰 상세 브리프 - PRD 생성용 데이터]

1. 기본 정보
- 고객명: ${data.client_name}
- 연락처: ${data.client_phone}
- 이메일: ${data.client_email}
- 업종/분야: ${data.industry}
- 타겟 고객: ${data.target_audience}
- 제작 목적: ${data.purpose}

2. 제작 범위
- 서비스 유형: ${data.type}
- 선택 페이지: ${data.pages}
- 구성 요소: ${data.components}
- 게시판: ${data.boards}
- 추가 기능: ${data.features}
- 총 섹션 수: ${data.sections}
- 희망 일정: ${data.target_schedule}

3. 디자인 및 자료
- 디자인 수준: ${data.design_level}
- 디자인 무드: ${data.design_mood}
- 컬러 톤: ${data.color_tone}
- 로고 상태: ${data.logo_status}
- 자료 준비 상태: ${data.data_readiness}

4. 추가 요청사항
${data.additional_request || '없음'}

5. 견적 정보
- 예상 견적: ₩ ${data.price_range}
- 월 호스팅비: ₩ ${isMultilingual ? '49,900' : '39,900'} (VAT 별도)
    `.trim();

    navigator.clipboard.writeText(prdText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button 
      onClick={handleCopy}
      className="inline-flex items-center gap-2 bg-white text-black px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
    >
      {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <FileText className="w-4 h-4" />}
      {copied ? "COPIED" : "Copy for GPT (PRD)"}
    </button>
  );
}
