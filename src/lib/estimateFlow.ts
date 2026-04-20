export type WebsiteType = 'COMPANY' | 'SERVICE' | 'PORTFOLIO' | 'MALL' | 'UNKNOWN';

export const TYPE_LABELS: Record<string, string> = {
  '회사 소개형': 'COMPANY',
  '서비스 소개형': 'SERVICE',
  '포트폴리오형': 'PORTFOLIO',
  '쇼핑몰형': 'MALL',
  '잘 모르겠어요': 'UNKNOWN',
};

// 유형별 추천 페이지 매핑
export const TYPE_PAGES_MAPPING: Record<WebsiteType, string[]> = {
  COMPANY: ['메인', '회사소개', '문의하기', '공지사항', '오시는 길'],
  SERVICE: ['메인', '서비스소개', '가격 안내', 'FAQ', '문의하기'],
  PORTFOLIO: ['메인', '포트폴리오', '작업 사례', '소개', '문의하기'],
  MALL: ['메인', '상품 목록', '상품 상세', '장바구니', '결제', '배송 안내', '후기'],
  UNKNOWN: ['메인', '회사소개', '서비스소개', '포트폴리오', '문의하기', '공지사항', '블로그'],
};

// 페이지별 기본 섹션 수 매핑
export const DEFAULT_PAGE_SECTIONS: Record<string, number> = {
  '메인': 5,
  '회사소개': 3,
  '서비스소개': 4,
  '포트폴리오': 4,
  '문의하기': 2,
  '공지사항': 3,
  '블로그': 3,
  '오시는 길': 2,
  '가격 안내': 3,
  'FAQ': 3,
  '작업 사례': 4,
  '소개': 3,
  '상품 목록': 4,
  '상품 상세': 5,
  '장바구니': 2,
  '결제': 2,
  '배송 안내': 2,
  '후기': 3,
  '기타': 3,
};

export const DEFAULT_DONT_KNOW_PAGES = ['메인', '회사소개', '서비스소개', '문의하기', '공지사항'];

export const PRICING = {
  BASE_SECTION_PRICE: 150000,
  MULTILINGUAL_ADDON: 20000, 
  BOARD_PRICE: 50000,
  BASE_HOSTING_MONTHLY: 39900,
  ADDITIONAL_LANG_HOSTING: 10000,
};

// 난이도 가중치 (디자인 수준)
export const DESIGN_LEVEL_WEIGHTS: Record<string, number> = {
  '템플릿 기반 간단 제작': 1.0,
  '맞춤형 디자인': 1.2,
  '브랜드 맞춤 고급 디자인': 1.5,
};

// 난이도 가중치 (자료 준비 상태)
export const DATA_READINESS_WEIGHTS: Record<string, number> = {
  '텍스트/이미지 준비됨': 1.0,
  '내용 기획/정리 필요': 1.5,
  '디자인 소스 포함 전체 기획 필요': 2.5,
};

export interface PageSection {
  name: string;
  count: number;
}

export interface EstimateResult {
  totalSections: number;
  totalBoards: number;
  isMultilingual: boolean;
  pureSectionPrice: number; // 섹션 기본 제작비
  featureTotalPrice: number; // 추가 기능비 합계
  boardTotalPrice: number; // 게시판 비용 합계
  designAddonPrice: number; // 다국어 디자인 가산비 총액
  basePrice: number;
  minPrice: number;
  maxPrice: number;
  monthlyHosting: number;
  additionalLangHosting: number;
  difficultyWeight: number; // 전체 가중치
}

/**
 * 정교한 견적을 계산합니다.
 */
export function calculateEstimate(
  selectedPages: PageSection[],
  selectedBoards: string[],
  selectedFeatures: string[],
  designLevel: string = 'Basic (표준형)',
  dataReadiness: string = '텍스트/이미지 준비됨'
): EstimateResult {
  const isMultilingual = selectedFeatures.includes('다국어 기능');
  
  // 섹션 합산: 매핑에 있으면 해당 값, 없으면(기타 직접 입력) 3섹션 적용
  const totalSections = selectedPages.reduce((acc, curr) => {
    return acc + curr.count;
  }, 0);

  const boardCount = selectedBoards.filter(b => b !== '없음' && b !== '해당 없음' && b !== '').length;

  // 가중치 계산
  const designWeight = DESIGN_LEVEL_WEIGHTS[designLevel] || 1.0;
  const readinessWeight = DATA_READINESS_WEIGHTS[dataReadiness] || 1.0;

  // 1. 기본 제작비 (섹션 수 기반)
  const pureSectionPrice = totalSections * PRICING.BASE_SECTION_PRICE;
  const designAddonPrice = isMultilingual ? totalSections * PRICING.MULTILINGUAL_ADDON : 0;
  
  // 2. 자료 준비 가중치 적용: (기본 제작비 + 다국어 가산비) × 자료 준비 가중치
  const step1Price = (pureSectionPrice + designAddonPrice) * readinessWeight;
  
  // 3. 디자인 수준 가중치 적용: 위 결과 × 디자인 가중치
  const step2Price = step1Price * designWeight;
  
  // 4. 추가 기능 비용 합산 (다국어 제외한 나머지 기능은 개당 10만원)
  const otherFeatures = selectedFeatures.filter(f => f !== '다국어 기능' && f !== '없음' && f !== '해당 없음' && f !== '');
  const featureTotalPrice = otherFeatures.length * 100000;

  // 5. 게시판 비용 합산
  const boardTotalPrice = boardCount * PRICING.BOARD_PRICE;
  const finalProductionPrice = step2Price + boardTotalPrice + featureTotalPrice;

  // 범위 계산 (최종 결과의 90% ~ 125%)
  const minPrice = Math.floor((finalProductionPrice * 0.9) / 1000) * 1000;
  const maxPrice = Math.floor((finalProductionPrice * 1.25) / 1000) * 1000;

  // 호스팅비 계산
  const monthlyHosting = PRICING.BASE_HOSTING_MONTHLY;
  const additionalLangHosting = isMultilingual ? PRICING.ADDITIONAL_LANG_HOSTING : 0;

  return {
    totalSections,
    totalBoards: boardCount,
    isMultilingual,
    pureSectionPrice,
    featureTotalPrice,
    boardTotalPrice,
    designAddonPrice,
    basePrice: finalProductionPrice, 
    minPrice,
    maxPrice,
    monthlyHosting,
    additionalLangHosting,
    difficultyWeight: designWeight * readinessWeight
  };
}
