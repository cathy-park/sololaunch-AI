-- =====================================================
-- Supabase SQL Editor에 전체를 복사하여 실행하세요.
-- =====================================================

-- 1. 기존 테이블 제거 (이미 있다면 삭제 후 재생성)
DROP TABLE IF EXISTS public.interviews;

-- 2. interviews 테이블 생성
CREATE TABLE public.interviews (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at      TIMESTAMPTZ DEFAULT NOW(),

    -- 고객 연락처
    client_name     TEXT        NOT NULL,
    client_email    TEXT,
    client_phone    TEXT,

    -- 1차 간편 견적 데이터
    type            TEXT,           -- 서비스 유형 (기업형, 랜딩페이지 등)
    pages           TEXT,           -- 선택 페이지 목록
    components      TEXT,           -- 구성 요소
    boards          TEXT,           -- 게시판 목록
    features        TEXT,           -- 추가 기능 목록
    sections        INT4,           -- 총 섹션 수
    total_price     BIGINT,         -- 기본 견적 금액
    price_range     TEXT,           -- 표시용 견적 범위
    data_readiness  TEXT,           -- 자료 준비 상태
    design_level    TEXT,           -- 디자인 수준

    -- 2차 상세 브리프 데이터
    industry        TEXT,           -- 업종/분야
    target_audience TEXT,           -- 타겟 고객층
    purpose         TEXT,           -- 제작 목적
    ref_sites       TEXT,           -- 참고 사이트 (쉼표 구분)
    design_mood     TEXT,           -- 선호 디자인 무드
    color_tone      TEXT,           -- 선호 컬러 톤 ← 新규 추가
    logo_status     TEXT,           -- 로고 보유 상태
    target_schedule TEXT,           -- 희망 오픈 일정
    additional_request TEXT,        -- 추가 요청사항
    file_url        TEXT,           -- 첨부파일 URL

    -- 어드민 관리용
    admin_notes     TEXT DEFAULT '',
    status          TEXT DEFAULT '접수'
);

-- 3. Row Level Security (RLS) 활성화
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;

-- 4. 정책: 누구나 INSERT 가능 (챗봇 제출용)
CREATE POLICY "Anyone can insert"
    ON public.interviews
    FOR INSERT
    WITH CHECK (true);

-- 5. 정책: 누구나 SELECT 가능 (어드민 페이지용 — 추후 인증 추가 시 수정)
CREATE POLICY "Anyone can select"
    ON public.interviews
    FOR SELECT
    USING (true);

-- 6. 정책: 누구나 UPDATE 가능 (어드민 노트 수정용)
CREATE POLICY "Anyone can update"
    ON public.interviews
    FOR UPDATE
    USING (true);

-- 7. 정책: 누구나 DELETE 가능 (어드민 내역 삭제용)
CREATE POLICY "Anyone can delete"
    ON public.interviews
    FOR DELETE
    USING (true);

-- =====================================================
-- 완료! SQL Editor에서 Run을 누르세요.
-- =====================================================
