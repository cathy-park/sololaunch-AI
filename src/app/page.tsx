"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Info, Plus, Minus, X, CheckCircle2, Upload, Layout, Layers, Globe, ChevronRight, RotateCcw, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { calculateEstimate, DEFAULT_PAGE_SECTIONS, TYPE_LABELS, TYPE_PAGES_MAPPING, PageSection, PRICING, DEFAULT_DONT_KNOW_PAGES, WebsiteType } from "@/lib/estimateFlow";

type Message = {
  id: string;
  role: "bot" | "user";
  content: string;
  step: number;
  type?: "text" | "selection" | "multi-selection" | "section-adjustment" | "quote" | "form" | "contact" | "color-multi";
  options?: string[];
  data?: any;
};

type InterviewState = {
  step: number;
  detailedStep: number;
  isDetailedFlow: boolean;
  confirmed: {
    type: string;
    pages: PageSection[];
    components: string[];
    boards: string[];
    features: string[];
    dataReadiness: string;
    designLevel: string;
  };
  customOptions: Record<number, string[]>;
  details: {
    name: string;
    email: string;
    phone: string;
    industry: string;
    targetAudience: string;
    purpose: string;
    refSites: string[];
    designMood: string;
    logoStatus: string;
    targetSchedule: string;
    additionalRequest: string;
    file?: File;
  };
};

const TOTAL_STEPS = 7;

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [tempSelection, setTempSelection] = useState<string[]>([]);
  const [tempPageSections, setTempPageSections] = useState<PageSection[]>([]);
  const [expandedSectionIdx, setExpandedSectionIdx] = useState<number | null>(null);
  const [showSectionHelp, setShowSectionHelp] = useState(false);
  const [etcInputValue, setEtcInputValue] = useState("");
  const [showEtcInput, setShowEtcInput] = useState(false);
  const [editingStep, setEditingStep] = useState<number | null>(null);
  const [chatInput, setChatInput] = useState("");


  const [state, setState] = useState<InterviewState>({
    step: 0,
    detailedStep: 0,
    isDetailedFlow: false,
    confirmed: {
      type: "",
      pages: [],
      components: [],
      boards: [],
      features: [],
      dataReadiness: "텍스트/이미지 준비됨",
      designLevel: "Basic (표준형)",
    },
    customOptions: {},
    details: {
      name: "",
      email: "",
      phone: "",
      industry: "",
      targetAudience: "",
      purpose: "",
      refSites: [],
      designMood: "",
      logoStatus: "",
      targetSchedule: "",
      additionalRequest: "",
    },
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startChat();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const addMessage = (msg: Omit<Message, "id" | "step">, targetStep?: number) => {
    setMessages((prev) => [
      ...prev,
      { ...msg, id: Math.random().toString(36).substring(7), step: targetStep !== undefined ? targetStep : state.step },
    ]);
  };

  const startChat = async () => {
    setIsTyping(true);
    await new Promise((r) => setTimeout(r, 800));
    addMessage({ role: "bot", content: "안녕하세요! 똑디 인터뷰봇입니다. 🤖" }, 0);
    await new Promise((r) => setTimeout(r, 600));
    addMessage({
      role: "bot",
      content: "제작하시려는 홈페이지의 유형을 선택해 주세요.\n(유형에 따라 최적화된 기획 시나리오가 제공됩니다.)",
      type: "selection",
      options: ["회사 소개형", "서비스 소개형", "포트폴리오형", "쇼핑몰형", "랜딩페이지형", "잘 모르겠어요"],
    }, 0);
    setIsTyping(false);
  };

  const addCustomOption = () => {
    if (!etcInputValue.trim()) return;
    const currentStep = state.step;
    const newVal = etcInputValue.trim();
    setState((prev) => ({
      ...prev,
      customOptions: {
        ...prev.customOptions,
        [currentStep]: [...(prev.customOptions[currentStep] || []), newVal],
      },
    }));
    setTempSelection((prev) => [...prev, newVal]);
    setEtcInputValue("");
    setShowEtcInput(false);
  };

  const handleSelection = async (option: string | string[] | PageSection[] | { email: string; phone: string }) => {
    if (isTyping) return;
    // 부분 수정 모드인 경우
    if (editingStep !== null) {
      const stepToEdit = editingStep;
      
      // 1. 상태 업데이트 (1차 견적용)
      if (stepToEdit < 100) {
        const updatedConfirmed = { ...state.confirmed };

        if (stepToEdit === 0) updatedConfirmed.type = option as string;
        else if (stepToEdit === 1) updatedConfirmed.pages = (option as string[]).map(p => ({ name: p, count: DEFAULT_PAGE_SECTIONS[p] || 3 }));
        else if (stepToEdit === 2) updatedConfirmed.pages = option as PageSection[];
        else if (stepToEdit === 3) updatedConfirmed.boards = option as string[];
        else if (stepToEdit === 4) updatedConfirmed.features = option as string[];
        else if (stepToEdit === 5) updatedConfirmed.dataReadiness = option as string;
        else if (stepToEdit === 6) updatedConfirmed.designLevel = option as string;

        setState(prev => ({ ...prev, confirmed: updatedConfirmed }));

        // 실시간 견적 재계산 및 메시지 업데이트
        const newRes = calculateEstimate(
          updatedConfirmed.pages,
          updatedConfirmed.boards,
          updatedConfirmed.features,
          updatedConfirmed.designLevel,
          updatedConfirmed.dataReadiness
        );

        setMessages(prev => prev.map(m => {
          if (m.type === "quote") return { ...m, data: newRes };
          if (m.step === stepToEdit && m.role === "user") {
            let content = "";
            if (Array.isArray(option)) {
              if (typeof option[0] === 'object') content = "섹션 구성 완료";
              else content = (option as string[]).join(", ");
            } else {
              content = option as string;
            }
            return { ...m, content };
          }
          return m;
        }));
      } 
      // 2. 상태 업데이트 (2차 상세 인터뷰용)
      else {
        const dStep = stepToEdit - 100;
        
        if (dStep === 2) { // 연락처 통합 수정
          const { email, phone } = option as { email: string; phone: string };
          setState(prev => ({ ...prev, details: { ...prev.details, email, phone } }));
        } else {
          const fieldMap: Record<number, string> = {
            1: 'name', 3: 'industry', 4: 'targetAudience', 5: 'purpose', 
            6: 'refSites', 7: 'designMood', 8: 'logoStatus', 9: 'targetSchedule', 11: 'additionalRequest'
          };
          const field = fieldMap[dStep];
          if (field) {
            setState(prev => ({ 
              ...prev, 
              details: { ...prev.details, [field]: dStep === 6 ? [option as string] : option as string } 
            }));
          }
        }

        // 채팅 히스토리의 유저 답변 업데이트
        setMessages(prev => prev.map(m => {
          if (m.step === stepToEdit && m.role === "user") {
            let content = "";
            if (typeof option === "object" && option !== null && "email" in option) {
              const { email, phone } = option as { email: string; phone: string };
              content = `${email} | ${phone}`;
            } else if (Array.isArray(option)) {
              content = option.join(", ");
            } else {
              content = option as string;
            }
            return { ...m, content };
          }
          return m;
        }));
      }

      setEditingStep(null);
      return;
    }

    const isMulti = Array.isArray(option);
    let displayContent = "";

    if (typeof option === "string") {
      displayContent = option;
    } else if (isMulti && typeof option[0] === "string") {
      displayContent = (option as string[]).join(", ");
    } else if (isMulti && typeof option[0] === "object") {
      displayContent = "섹션 구성 완료";
    } else if (typeof option === "object" && option !== null && "email" in option) {
      const { email, phone } = option as { email: string; phone: string };
      displayContent = `${email} | ${phone}`;
    }

    addMessage(
      { role: "user", content: displayContent },
      state.isDetailedFlow ? state.detailedStep + 100 : state.step
    );
    setIsTyping(true);
    
    try {
      await new Promise((r) => setTimeout(r, 600));

    if (!state.isDetailedFlow) {
      const currentStep = state.step;

      if (currentStep === 0) {
        const selectedTypeLabel = option as string;
        const typeKey = TYPE_LABELS[selectedTypeLabel] || "UNKNOWN";
        const pageOptions = TYPE_PAGES_MAPPING[typeKey as WebsiteType] || TYPE_PAGES_MAPPING["UNKNOWN"];
        const nextStep = 1;
        setState((prev) => ({ ...prev, step: nextStep, confirmed: { ...prev.confirmed, type: selectedTypeLabel } }));
        setTempSelection(["메인"]);
        addMessage({
          role: "bot",
          content: "'메인' 페이지는 기본 포함입니다. 메인 페이지만 제작하는 랜딩페이지도 가능합니다.\n추가 제작을 원하는 페이지가 있다면 선택해주세요.",
          type: "multi-selection",
          options: pageOptions.filter((p: string) => p !== "메인"),
        }, nextStep);
      } else if (currentStep === 1) {
        let selectedPages = option as string[];
        if (!selectedPages.includes("메인")) selectedPages = ["메인", ...selectedPages];
        if (selectedPages.includes("잘 모르겠어요")) selectedPages = DEFAULT_DONT_KNOW_PAGES;
        
        const initialSections = selectedPages.map((p) => ({ name: p, count: DEFAULT_PAGE_SECTIONS[p] || 3 }));
        const nextStep = 2;
        setTempPageSections(initialSections);
        setState((prev) => ({ ...prev, step: nextStep, confirmed: { ...prev.confirmed, pages: initialSections } }));
        addMessage({
          role: "bot",
          content: "선택하신 페이지별로 상세 섹션 수를 조정해주세요.\n섹션이 많아질수록 기획과 디자인의 양이 늘어납니다.",
          type: "section-adjustment",
        }, nextStep);
      } else if (currentStep === 2) {
        // 원래 3단계(구성요소) 생략하고 바로 4단계(게시판)로 이동
        const nextStep = 3;
        setState((prev) => ({ ...prev, step: nextStep, confirmed: { ...prev.confirmed, pages: option as PageSection[] } }));
        addMessage({
          role: "bot",
          content: "운영에 필요한 게시판 종류를 선택해 주세요.",
          type: "multi-selection",
          options: ["공지사항", "블로그", "포트폴리오(갤러리)", "자료실", "후기"],
        }, nextStep);
      } else if (currentStep === 3) {
        const nextStep = 4;
        setState((prev) => ({ ...prev, step: nextStep, confirmed: { ...prev.confirmed, boards: option as string[] } }));
        addMessage({
          role: "bot",
          content: "추가로 고려 중인 기능이 있으신가요?\n('다국어 기능' 선택 시 섹션 단가가 조정됩니다.)",
          type: "multi-selection",
          options: ["예약 기능", "회원가입 기능", "다국어 기능", "내용 직접 수정 기능", "결제 기능"],
        }, nextStep);
      } else if (currentStep === 4) {
        const nextStep = 5;
        setState((prev) => ({ ...prev, step: nextStep, confirmed: { ...prev.confirmed, features: option as string[] } }));
        addMessage({
          role: "bot",
          content: "현재 어느 단계까지 준비되셨나요?",
          type: "selection",
          options: ["텍스트/이미지 준비됨", "내용 기획/정리 필요", "디자인 소스 포함 전체 기획 필요"],
        }, nextStep);
      } else if (currentStep === 5) {
        const nextStep = 6;
        setState((prev) => ({ ...prev, step: nextStep, confirmed: { ...prev.confirmed, dataReadiness: option as string } }));
        addMessage({
          role: "bot",
          content: "원하시는 디자인의 수준을 선택해주세요.",
          type: "selection",
          options: ["템플릿 기반 간단 제작", "맞춤형 디자인", "브랜드 맞춤 고급 디자인"],
        }, nextStep);
      } else if (currentStep === 6) {
        const designLevel = option as string;
        const res = calculateEstimate(
          state.confirmed.pages,
          state.confirmed.boards,
          state.confirmed.features,
          designLevel,
          state.confirmed.dataReadiness
        );
        const nextStep = 7;
        setState((prev) => ({ ...prev, step: nextStep, confirmed: { ...prev.confirmed, designLevel } }));
        addMessage({ role: "bot", content: "모든 분석이 완료되었습니다. 제작 전문가가 분석한 예상 견적서입니다." }, nextStep);
        await new Promise((r) => setTimeout(r, 600));
        addMessage({ role: "bot", content: "예상 제작비", type: "quote", data: res }, nextStep);
        await new Promise((r) => setTimeout(r, 400));
        addMessage({
          role: "bot",
          content: "예상 제작비를 확인했습니다.\n더 정확한 견적과 상담을 위해 몇 가지 정보를 추가로 입력해주세요. (약 1분 소요)",
          type: "selection",
          options: ["네, 상세 견적 이어서 진행할게요", "아니요, 견적만 확인할게요"],
        }, nextStep);
      } else if (currentStep === 7) {
        if (option === "네, 상세 견적 이어서 진행할게요") {
          setState((prev) => ({ ...prev, isDetailedFlow: true, detailedStep: 1 }));
          addMessage({ role: "bot", content: "상세 인터뷰를 시작합니다. 성함을 입력해 주세요." }, 101);
        } else {
          addMessage({ role: "bot", content: "견적 확인을 마쳤습니다. 감사합니다! 🙏" }, 8);
        }
      }

      if (currentStep !== 0) setTempSelection([]);
    } else {
      const dStep = state.detailedStep;
      
      // Validation Check
      if (dStep === 1) { // 성함
        if (!option || (option as string).trim().length < 2) {
            addMessage({ role: "bot", content: "성함을 2자 이상 입력해 주세요." }, 101);
            return;
        }
        setState((prev) => ({ ...prev, details: { ...prev.details, name: (option as string).trim() }, detailedStep: 2 }));
        addMessage({ role: "bot", content: "연락처를 입력해 주세요. (상담을 위해 반드시 필요합니다)", type: "contact" }, 102);
      } 
      else if (dStep === 2) { // 연락처 통합 (Email + Phone)
        const { email, phone } = option as { email: string; phone: string };
        setState((prev) => ({ ...prev, details: { ...prev.details, email, phone }, detailedStep: 3 }));
        addMessage({ 
            role: "bot", 
            content: "사업 운영 중이신 업종은 무엇인가요?",
            type: "selection",
            options: ["IT/기술", "교육/강의", "제조/물류", "서비스/숙박", "요식업/카페", "건설/인테리어", "의료/법률", "개인 브랜딩", "기타"]
        }, 103);
      } 
      else if (dStep === 3) { // 업종 완료 -> 고객층
        setState((prev) => ({ ...prev, details: { ...prev.details, industry: option as string }, detailedStep: 4 }));
        addMessage({ 
            role: "bot", 
            content: "홈페이지의 주요 타켓 고객은 누구인가요?",
            type: "selection",
            options: ["일반 대중 (B2C)", "기업/파트너 (B2B)", "2030 MZ세대", "중장년층", "해외 고객", "특정 분야 전문가", "+ 기타"]
        }, 104);
      } 
      else if (dStep === 4) { // 고객층 완료 -> 목적
        setState((prev) => ({ ...prev, details: { ...prev.details, targetAudience: option as string }, detailedStep: 5 }));
        addMessage({ 
            role: "bot", 
            content: "제작하시려는 가장 큰 목적은 무엇인가요?",
            type: "selection",
            options: ["신뢰도 향상/회사 소개", "서비스 신청/예약 유도", "제품 판매 및 결제", "포트폴리오 전시", "DB 수집 및 광고 랜딩", "+ 기타"]
        }, 105);
      } 
      else if (dStep === 5) { // 목적 완료 -> 참고 사이트
        setState((prev) => ({ ...prev, details: { ...prev.details, purpose: option as string }, detailedStep: 6 }));
        addMessage({ role: "bot", content: "참고하시려는 경쟁사나 선호하는 사이트 주소를 입력해주세요. (없으면 '없음' 입력 가능)" }, 106);
      } 
      else if (dStep === 6) { // 참고 사이트 완료 -> 분위기
        if (option !== "없음" && (option as string).length > 4) {
            const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
            if (!urlRegex.test(option as string) && !(option as string).includes(".")) {
                addMessage({ role: "bot", content: "올바른 URL 형식을 입력하거나, 없으면 '없음'을 입력해 주세요." }, 106);
                return;
            }
        }
        setState((prev) => ({ ...prev, details: { ...prev.details, refSites: [option as string] }, detailedStep: 7 }));
        addMessage({ 
            role: "bot", 
            content: "선호하시는 디자인 무드가 있으신가요?",
            type: "selection",
            options: ["깔끔하고 미니멀한", "화려하고 역동적인", "차분하고 전문적인", "부드럽고 따뜻한", "트렌디하고 파격적인"]
        }, 107);
      } 
      else if (dStep === 7) { // 분위기 완료 -> 컬러 톤
        setState((prev) => ({ ...prev, details: { ...prev.details, designMood: option as string }, detailedStep: 8 }));
        addMessage({ 
            role: "bot", 
            content: "홈페이지에 사용할 브랜드 컬러와 보조 컬러를 알려주세요. (최소 2개 이상 선택 권장)",
            type: "color-multi"
        }, 108);
      } 
      else if (dStep === 8) { // 컬러 톤 완료 -> 로고
        const hasBrand = (option as string).includes("브랜드 컬러");
        const hasSecondary = (option as string).includes("보조 컬러");
        
        if (!(hasBrand && hasSecondary) && option !== "잘 모르겠어요 / 없음") {
          addMessage({ role: "bot", content: "최소한 브랜드 컬러와 보조 컬러를 모두 지정해 주세요." }, 108);
          return;
        }

        setState((prev) => ({ ...prev, details: { ...prev.details, colorTone: option as string }, detailedStep: 9 }));
        addMessage({
          role: "bot",
          content: "현재 브랜드 로고를 보유하고 계신가요?",
          type: "selection",
          options: ["네, 있습니다", "아니요, 제작이 필요합니다", "임시 로고 사용 중"],
        }, 109);
      } 
      else if (dStep === 9) { // 로고 완료 -> 일정
        setState((prev) => ({ ...prev, details: { ...prev.details, logoStatus: option as string }, detailedStep: 10 }));
        addMessage({
          role: "bot",
          content: "희망하시는 오픈 일정이 있으신가요?",
          type: "selection",
          options: ["최대한 빨리 (한 달 이내)", "두 달 이내", "협의 가능/미정"],
        }, 110);
      } 
      else if (dStep === 10) { // 일정 -> 파일 업로드
        setState((prev) => ({ ...prev, details: { ...prev.details, targetSchedule: option as string }, detailedStep: 11 }));
        addMessage({
          role: "bot",
          content: "마지막으로 참고할 자료를 업로드해주세요. (로고, 회사소개서, 기획안 등)",
          type: "form",
        }, 111);
      } 
      else if (dStep === 11) { // 파일 -> 추가 요청사항
        setState((prev) => ({ ...prev, detailedStep: 12 }));
        addMessage({ role: "bot", content: "더 전달하실 추가 요청사항이 있으신가요? (없으면 '없음')" }, 112);
      }
      else if (dStep === 12) { // 완료 -> 제출
        setState((prev) => ({ ...prev, details: { ...prev.details, additionalRequest: option as string }, detailedStep: 13 }));
        setIsTyping(true);
        // 제출을 시작한다는 짧은 안내
        addMessage({ role: "bot", content: "모든 정보가 취합되었습니다. 브리프를 제출하는 중입니다..." }, 113);
        await new Promise((r) => setTimeout(r, 1000));
        await submitInterview({ ...state.details, additionalRequest: option as string });
      }
    }
  } finally {
      setIsTyping(false);
      setShowEtcInput(false);
    }
  };

  const goToStep = (stepIndex: number) => {
    // 2차 상세 인터뷰 단계(101 이상)로 돌아가는 경우
    if (stepIndex >= 101) {
      const targetDStep = stepIndex - 100;
      setState((prev) => ({ ...prev, detailedStep: targetDStep }));
      setMessages((prev) => {
        // 해당 스텝의 유저 답변 메시지부터 그 이후를 모두 삭제
        const userMsgIdx = prev.findIndex((m) => m.step === stepIndex && m.role === "user");
        if (userMsgIdx !== -1) return prev.slice(0, userMsgIdx);
        // 답변 전이라면 해당 봇 질문만 남기고 이후 삭제
        const botMsgIdx = prev.findLastIndex((m) => m.step === stepIndex && m.role === "bot");
        return prev.slice(0, botMsgIdx + 1);
      });
      return;
    }

    // 1차 간편 견적 단계(0~8)로 돌아가는 경우
    setState((prev) => ({ ...prev, step: stepIndex, isDetailedFlow: false, detailedStep: 0 }));
    setMessages((prev) => {
      const userMsgIdx = prev.findIndex((m) => m.step === stepIndex && m.role === "user");
      if (userMsgIdx !== -1) return prev.slice(0, userMsgIdx);
      const botMsgIdx = prev.findLastIndex((m) => m.step === stepIndex && m.role === "bot");
      return prev.slice(0, botMsgIdx + 1);
    });

    if (stepIndex === 1) setTempSelection(["메인"]);
    else setTempSelection([]);
    setTempPageSections([]);
  };

  const submitInterview = async (finalDetails?: any) => {
    setIsTyping(true);
    const details = finalDetails || state.details;
    const res = calculateEstimate(
      state.confirmed.pages,
      state.confirmed.boards,
      state.confirmed.features,
      state.confirmed.designLevel,
      state.confirmed.dataReadiness
    );

    const formData = new FormData();
    formData.append("type", state.confirmed.type);
    formData.append("pages", state.confirmed.pages.map((p) => `${p.name}(${p.count})`).join(", "));
    formData.append("components", state.confirmed.components.join(", "));
    formData.append("boards", state.confirmed.boards.join(", "));
    formData.append("features", state.confirmed.features.join(", "));
    formData.append("sections", res.totalSections.toString());
    formData.append("totalPrice", res.basePrice.toString());
    formData.append("priceRange", `${res.minPrice.toLocaleString()} ~ ${res.maxPrice.toLocaleString()}`);
    formData.append("dataReadiness", state.confirmed.dataReadiness);
    formData.append("designLevel", state.confirmed.designLevel);
    formData.append("name", details.name);
    formData.append("email", details.email);
    formData.append("phone", details.phone);
    formData.append("industry", details.industry);
    formData.append("targetAudience", details.targetAudience);
    formData.append("purpose", details.purpose);
    formData.append("refSites", details.refSites.join(", "));
    formData.append("designMood", details.designMood);
    formData.append("colorTone", details.colorTone || "");
    formData.append("logoStatus", details.logoStatus);
    formData.append("targetSchedule", details.targetSchedule);
    formData.append("additionalRequest", details.additionalRequest || "");
    if (details.file) formData.append("file", details.file);

    try {
      const response = await fetch("/api/submit", { method: "POST", body: formData });
      if (response.ok) {
        addMessage({
          role: "bot",
          content: "견적 상담 브리프가 성공적으로 제출되었습니다! 🎉\n\n똑디 기획팀에서 상세 내용을 검토한 후, 24시간 이내에 입력하신 연락처로 회신 드리겠습니다. 감사합니다.",
        }, 113);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Submission failed");
      }
    } catch (err: any) {
      console.error("SUBMIT_ERROR:", err);
      addMessage({ 
        role: "bot", 
        content: `통신 중 오류가 발생했습니다: ${err.message}\nDB 설정이나 네트워크 상태를 확인해주세요.` 
      }, 113);
    }
    setIsTyping(false);
  };

  const updatePageSection = (index: number, delta: number) => {
    setTempPageSections((prev) =>
      prev.map((p, i) => (i === index ? { ...p, count: Math.max(1, p.count + delta) } : p))
    );
  };

  const setPageSectionPreset = (index: number, val: number) => {
    setTempPageSections((prev) => prev.map((p, i) => (i === index ? { ...p, count: val } : p)));
    setExpandedSectionIdx(null);
  };

  return (
    <main className="flex flex-col h-screen max-w-2xl mx-auto relative overflow-hidden bg-[#f5f5f7]">
      {/* Apple glass header */}
      <div
        className="z-20 shrink-0"
        style={{
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "saturate(180%) blur(20px)",
          WebkitBackdropFilter: "saturate(180%) blur(20px)",
          borderBottom: "1px solid rgba(0,0,0,0.08)",
        }}
      >
        <header className="px-6 h-12 flex items-center justify-between">
          <h1 className="flex items-center">
            <img src="/logo.png" alt="DDokD" className="h-5 object-contain" />
          </h1>
          <div className="flex items-center gap-3">
            <span style={{ fontSize: "12px", letterSpacing: "-0.12px", color: "rgba(0,0,0,0.48)" }}>
              {Math.min(state.step + 1, TOTAL_STEPS)} / {TOTAL_STEPS}
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-[#0071e3] animate-pulse" />
          </div>
        </header>
        <div className="h-0.5 overflow-hidden" style={{ background: "rgba(0,0,0,0.06)" }}>
          <motion.div
            className="h-full bg-[#0071e3]"
            initial={{ width: 0 }}
            animate={{ width: `${(Math.min(state.step + 1, TOTAL_STEPS) / TOTAL_STEPS) * 100}%` }}
            transition={{ type: "spring", damping: 20, stiffness: 100 }}
          />
        </div>
      </div>

      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth pb-20">
        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const isActiveStep = state.isDetailedFlow 
              ? msg.step === state.detailedStep + 100
              : msg.step === state.step;
            const isUser = msg.role === "user";

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={cn("flex flex-col", isUser ? "items-end" : "items-start")}
              >
                <div className="relative group max-w-[85%]">
                  <div
                    className={cn(
                      "transition-all",
                      isUser
                        ? "px-5 py-3.5 rounded-[18px] text-[15px] text-white"
                        : msg.type === "quote"
                        ? "w-full my-4"
                        : "px-5 py-4 rounded-[18px] text-[15px] whitespace-pre-wrap"
                    )}
                    style={
                      isUser
                        ? { background: "#1d1d1f", letterSpacing: "-0.374px", lineHeight: "1.47" }
                        : msg.type === "quote"
                        ? {}
                        : {
                            background: "white",
                            color: "#1d1d1f",
                            letterSpacing: "-0.374px",
                            lineHeight: "1.47",
                            boxShadow: "rgba(0,0,0,0.08) 0px 1px 4px 0px",
                          }
                    }
                  >
                    {msg.type === "quote" && msg.data ? (
                      <ResultCard data={msg.data} state={state} />
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>

                {/* Single-select */}
                {msg.type === "selection" && msg.options && (
                  <div className={cn("mt-4 w-full space-y-3", (!isActiveStep && editingStep !== msg.step) && "hidden")}>
                    <div className="flex flex-wrap gap-2">
                      {msg.options.map((opt) => (
                        <ChoiceButton
                          key={opt}
                          label={opt}
                          variant={opt.includes("기타") ? "etc" : (opt === "잘 모르겠어요" || opt === "아니요" ? "secondary" : "primary")}
                          onClick={() => {
                            if (opt.includes("기타")) {
                                setShowEtcInput(true);
                            } else {
                                handleSelection(opt);
                            }
                          }}
                        />
                      ))}
                    </div>
                    
                    <AnimatePresence>
                      {isActiveStep && showEtcInput && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="flex gap-2"
                        >
                          <input
                            autoFocus
                            className="flex-1 h-12 px-4 bg-white text-[#1d1d1f] text-[15px] rounded-[14px] focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
                            style={{ border: "1px solid rgba(0,0,0,0.12)", letterSpacing: "-0.374px" }}
                            placeholder="직접 입력해 주세요..."
                            value={etcInputValue}
                            onChange={(e) => setEtcInputValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && etcInputValue.trim()) {
                                handleSelection(etcInputValue.trim());
                                setEtcInputValue(""); 
                                setShowEtcInput(false);
                              }
                            }}
                          />
                          <button
                            onClick={() => {
                              if (etcInputValue.trim()) {
                                handleSelection(etcInputValue.trim());
                                setEtcInputValue("");
                                setShowEtcInput(false);
                              }
                            }}
                            className="h-12 px-6 text-white rounded-[12px] font-bold text-[14px]"
                            style={{ background: "#0071e3" }}
                          >
                            확인
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Multi-select */}
                {msg.type === "multi-selection" && msg.options && (
                  <div className={cn("mt-4 w-full space-y-3", (!isActiveStep && editingStep !== msg.step) && "hidden")}>
                    <div className="flex flex-wrap gap-2">
                      {state.step === 1 && (
                        <ChoiceButton label="메인" selected locked onClick={() => {}} />
                      )}

                      {msg.options.map((opt) => (
                        <ChoiceButton
                          key={opt}
                          label={opt}
                          selected={tempSelection.includes(opt)}
                          onClick={() => {
                            if (opt === "잘 모르겠어요") {
                              setTempSelection((prev) =>
                                prev.includes("잘 모르겠어요") ? prev.filter((i) => i !== "잘 모르겠어요") : ["메인", "잘 모르겠어요"]
                              );
                            } else {
                              setTempSelection((prev) => {
                                const filtered = prev.filter((i) => i !== "잘 모르겠어요");
                                return filtered.includes(opt) ? filtered.filter((i) => i !== opt) : [...filtered, opt];
                              });
                            }
                          }}
                        />
                      ))}

                      {state.customOptions[state.step]?.map((opt) => (
                        <ChoiceButton
                          key={opt}
                          label={opt}
                          selected={tempSelection.includes(opt)}
                          onClick={() => {
                            setTempSelection((prev) => {
                              const filtered = prev.filter((i) => i !== "잘 모르겠어요");
                              return filtered.includes(opt) ? filtered.filter((i) => i !== opt) : [...filtered, opt];
                            });
                          }}
                        />
                      ))}

                      <div className="flex flex-wrap gap-2 w-full mt-1">
                        <ChoiceButton
                          label="잘 모르겠어요"
                          variant="secondary"
                          selected={tempSelection.includes("잘 모르겠어요")}
                          onClick={() =>
                            setTempSelection((prev) =>
                              prev.includes("잘 모르겠어요") ? prev.filter((i) => i !== "잘 모르겠어요") : ["메인", "잘 모르겠어요"]
                            )
                          }
                        />
                        <ChoiceButton
                          label="해당 없음"
                          variant="secondary"
                          selected={tempSelection.includes("해당 없음")}
                          onClick={() =>
                            setTempSelection((prev) => {
                              const filtered = prev.filter((i) => i !== "잘 모르겠어요");
                              return filtered.includes("해당 없음") ? filtered.filter((i) => i !== "해당 없음") : [...filtered, "해당 없음"];
                            })
                          }
                        />
                        {isActiveStep && (
                          <ChoiceButton label="기타 +" variant="etc" onClick={() => setShowEtcInput(!showEtcInput)} />
                        )}
                      </div>
                    </div>

                    <AnimatePresence>
                      {isActiveStep && showEtcInput && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="flex gap-2"
                        >
                          <input
                            autoFocus
                            className="flex-1 h-10 px-4 bg-white text-[#1d1d1f] text-[15px] rounded-[11px] focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
                            style={{ border: "1px solid rgba(0,0,0,0.12)", letterSpacing: "-0.374px" }}
                            placeholder="항목 직접 입력..."
                            value={etcInputValue}
                            onChange={(e) => setEtcInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && addCustomOption()}
                          />
                          <button
                            onClick={addCustomOption}
                            className="h-10 px-4 text-white rounded-[8px] text-[14px] hover:opacity-90 transition-opacity"
                            style={{ background: "#0071e3", letterSpacing: "-0.224px" }}
                          >
                            추가
                          </button>
                          <button
                            onClick={() => setShowEtcInput(false)}
                            className="h-10 px-3 rounded-[8px]"
                            style={{ background: "rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.48)" }}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <button
                      disabled={tempSelection.length === 0}
                      className="w-full h-12 text-white rounded-[8px] text-[17px] font-normal flex items-center justify-center gap-2 transition-all mt-1 disabled:opacity-40 hover:opacity-90"
                      style={{ background: "#0071e3", letterSpacing: "-0.374px" }}
                      onClick={() => handleSelection(tempSelection)}
                    >
                      다음 <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Section adjustment */}
                {msg.type === "section-adjustment" && (
                  <div className={cn("mt-4 w-full space-y-4", (!isActiveStep && editingStep !== msg.step) && "hidden")}>
                    <div
                      className="bg-white rounded-[12px] p-6 space-y-5"
                      style={{ boxShadow: "rgba(0,0,0,0.08) 0px 1px 4px 0px" }}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="p-1.5 rounded-[8px] shrink-0 mt-0.5" style={{ background: "#0071e3" }}>
                            <Info className="w-4 h-4 text-white" />
                          </div>
                          <div className="space-y-1 text-left">
                            <h4 style={{ fontSize: "17px", fontWeight: 600, color: "#1d1d1f", lineHeight: "1.24", letterSpacing: "-0.374px" }}>
                              섹션이란?
                            </h4>
                            <p style={{ fontSize: "15px", color: "rgba(0,0,0,0.8)", lineHeight: "1.47", letterSpacing: "-0.374px" }}>
                              섹션은 페이지 안의 콘텐츠 묶음 단위입니다.<br />
                              섹션 수가 많아질수록 제작 범위가 커집니다.
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowSectionHelp(true)}
                          className="ml-10 hover:underline"
                          style={{ fontSize: "14px", color: "#0066cc", letterSpacing: "-0.224px" }}
                        >
                          [섹션 예시 및 상세 설명 보기]
                        </button>
                      </div>

                      <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: "16px" }}>
                        <p style={{ fontSize: "11px", fontWeight: 600, color: "rgba(0,0,0,0.48)", letterSpacing: "0.3em", textTransform: "uppercase" }}>
                          페이지별 섹션 구성 설정
                        </p>
                      </div>

                      <div className="space-y-3">
                        {tempPageSections.map((page, idx) => (
                          <div key={idx} className="space-y-2">
                            <div className="flex items-center justify-between p-4 rounded-[8px]" style={{ background: "#f5f5f7" }}>
                              <span style={{ fontSize: "14px", fontWeight: 600, color: "#1d1d1f", letterSpacing: "-0.224px" }}>
                                {page.name}
                              </span>
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => updatePageSection(idx, -1)}
                                  className="w-8 h-8 rounded-[8px] flex items-center justify-center active:scale-90 transition-all"
                                  style={{ background: "white", border: "1px solid rgba(0,0,0,0.1)" }}
                                >
                                  <Minus className="w-3.5 h-3.5" style={{ color: "#1d1d1f" }} />
                                </button>
                                <span style={{ width: "32px", textAlign: "center", fontSize: "17px", fontWeight: 600, color: "#1d1d1f", letterSpacing: "-0.374px" }}>
                                  {page.count}
                                </span>
                                <button
                                  onClick={() => updatePageSection(idx, 1)}
                                  className="w-8 h-8 rounded-[8px] flex items-center justify-center active:scale-90 transition-all"
                                  style={{ background: "white", border: "1px solid rgba(0,0,0,0.1)" }}
                                >
                                  <Plus className="w-3.5 h-3.5" style={{ color: "#1d1d1f" }} />
                                </button>
                                <button
                                  onClick={() => setExpandedSectionIdx(expandedSectionIdx === idx ? null : idx)}
                                  className="px-3 py-1.5 rounded-[8px] transition-all"
                                  style={{
                                    fontSize: "11px",
                                    fontWeight: 600,
                                    background: expandedSectionIdx === idx ? "#0071e3" : "white",
                                    color: expandedSectionIdx === idx ? "white" : "rgba(0,0,0,0.48)",
                                    border: expandedSectionIdx === idx ? "none" : "1px solid rgba(0,0,0,0.1)",
                                  }}
                                >
                                  빠른 선택
                                </button>
                              </div>
                            </div>
                            <AnimatePresence>
                              {expandedSectionIdx === idx && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="grid grid-cols-3 gap-2 overflow-hidden px-2"
                                >
                                  {[
                                    { label: "간단", val: 3 },
                                    { label: "보통", val: 6 },
                                    { label: "상세", val: 10 },
                                  ].map((p) => (
                                    <button
                                      key={p.label}
                                      onClick={() => setPageSectionPreset(idx, p.val)}
                                      className="py-2.5 rounded-[8px] transition-all hover:bg-[#0071e3] hover:text-white"
                                      style={{
                                        background: "white",
                                        border: "1px solid rgba(0,0,0,0.1)",
                                        fontSize: "12px",
                                        fontWeight: 600,
                                        color: "rgba(0,0,0,0.48)",
                                        letterSpacing: "-0.12px",
                                      }}
                                    >
                                      {p.label}({p.val}개)
                                    </button>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      className="w-full h-12 text-white rounded-[8px] font-normal text-[17px] flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                      style={{ background: "#0071e3", letterSpacing: "-0.374px" }}
                      onClick={() => handleSelection(tempPageSections)}
                    >
                      페이지 구성 확정 <Check className="w-4 h-4" />
                    </button>
                  </div>
                )}

                 {/* Contact input form (Email + Phone) */}
                {msg.type === "contact" && (
                  <div className="mt-4 w-full">
                    <ContactInputCard
                      onConfirm={(data) => handleSelection(data)}
                      isActive={isActiveStep || editingStep === msg.step}
                      initialData={{ email: state.details.email, phone: state.details.phone }}
                    />
                  </div>
                )}

                {/* Inline Direct Input (Name: 101, Additional Request: 112) */}
                {msg.role === "bot" && (msg.step === 101 || msg.step === 112) && !msg.type && (
                  <div className="mt-4 w-full">
                    <DirectInputCard
                      onConfirm={(val) => handleSelection(val)}
                      isActive={isActiveStep || editingStep === msg.step}
                      placeholder={
                        msg.step === 101 ? "성함을 입력해주세요" : 
                        "추가 요청사항을 입력해주세요"
                      }
                      initialData={
                        msg.step === 101 ? state.details.name : 
                        state.details.additionalRequest
                      }
                      showNoneButton={msg.step === 112}
                    />
                  </div>
                )}

                {/* Multi Color Picker Input (Step: 108) */}
                {msg.role === "bot" && msg.step === 108 && msg.type === "color-multi" && (
                  <div className="mt-4 w-full">
                    <MultiColorPickerCard
                      onConfirm={(val) => handleSelection(val)}
                      isActive={isActiveStep || editingStep === msg.step}
                    />
                  </div>
                )}

                {/* Inline URL List Input (Reference Sites: 106) */}
                {msg.role === "bot" && msg.step === 106 && (
                  <div className="mt-4 w-full">
                    <UrlListInputCard
                      onConfirm={(urls) => handleSelection(urls)}
                      isActive={isActiveStep || editingStep === msg.step}
                      initialData={state.details.refSites}
                    />
                  </div>
                )}

                {/* File upload form */}
                {msg.type === "form" && (
                  <div className="mt-4 w-full">
                    <DetailedStage2Form
                      state={state}
                      setState={setState}
                      onNext={() => handleSelection(state.details.file ? "자료 포함 완료" : "자료 없음")}
                      isActive={isActiveStep || editingStep === msg.step}
                    />
                  </div>
                )}
              </motion.div>
            );
          })}
          {isTyping && <TypingIndicator />}
        </AnimatePresence>
      </div>
      
      {/* 상세 인터뷰 중에는 하단 바 숨김 (인라인 UI 사용) */}
      <AnimatePresence>
        {editingStep !== null && editingStep < 100 && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            exit={{ y: 20, opacity: 0 }}
            className="px-6 py-4 bg-white border-t border-[#EBEDF3] flex gap-2 items-center"
            style={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(10px)" }}
          >
            <input 
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.nativeEvent.isComposing && chatInput.trim()) {
                  const val = chatInput;
                  setChatInput("");
                  handleSelection(val);
                }
              }}
              placeholder="내용을 입력하세요..."
              className="flex-1 bg-[#F1F2F6] border border-[#EBEDF3] rounded-2xl px-5 py-3 text-[15px] outline-none focus:border-[#0071e3] transition-all"
            />
            <button 
              onClick={() => {
                if (chatInput.trim()) {
                  const val = chatInput;
                  setChatInput("");
                  handleSelection(val);
                }
              }}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-opacity"
              style={{ background: chatInput.trim() ? "#0071e3" : "#F1F2F6", color: chatInput.trim() ? "white" : "rgba(0,0,0,0.2)" }}
            >
              <Send className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Apple glass footer */}
      <footer
        className="px-8 py-4 shrink-0 text-center"
        style={{
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "saturate(180%) blur(20px)",
          WebkitBackdropFilter: "saturate(180%) blur(20px)",
          borderTop: "1px solid rgba(0,0,0,0.08)",
        }}
      >
        <p style={{ fontSize: "9px", fontWeight: 600, color: "rgba(0,0,0,0.3)", letterSpacing: "0.3em", textTransform: "uppercase" }}>
          VAT EXCLUDED • FINAL QUOTE AFTER CONSULTATION
        </p>
      </footer>

      <AnimatePresence>
        {showSectionHelp && <SectionHelpModal onClose={() => setShowSectionHelp(false)} />}
      </AnimatePresence>
    </main>
  );
}

function ChoiceButton({
  label,
  selected,
  variant = "primary",
  onClick,
  locked,
  disabled,
}: {
  label: string;
  selected?: boolean;
  variant?: "primary" | "secondary" | "outline" | "etc";
  onClick: () => void;
  locked?: boolean;
  disabled?: boolean;
}) {
  const isEtc = variant === "etc";
  const [isHovered, setIsHovered] = useState(false);

  const style: React.CSSProperties = (() => {
    if (locked || selected) return { background: "#1d1d1f", color: "white", border: "1px solid #1d1d1f" };
    if (variant === "secondary") return { background: "rgba(0,0,0,0.05)", color: "#1d1d1f", border: "1px solid rgba(0,0,0,0.1)" };
    if (variant === "etc") return { 
      background: "#FFFFFF", 
      color: isHovered ? "#161A1C" : "#818496", 
      border: isHovered ? "1px solid #161A1C" : "1px dashed #CDD3DB",
    };
    if (variant === "outline") return { background: "white", color: "#0066cc", border: "1px solid #0066cc" };
    return { background: "white", color: "#1d1d1f", border: "1px solid rgba(0,0,0,0.1)" };
  })();

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "h-11 px-5 rounded-[8px] text-[15px] font-normal transition-all duration-150 flex items-center justify-center gap-1.5",
        isEtc ? "shadow-none" : "",
        variant === "outline" && "rounded-[980px]",
        locked && "pointer-events-none",
        disabled && !locked && "opacity-40 cursor-not-allowed"
      )}
      style={{ ...style, letterSpacing: "-0.374px" }}
    >
      {label}
      {locked && <Check className="w-4 h-4" />}
    </button>
  );
}

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-1.5 px-5 py-4 rounded-[18px] w-fit"
      style={{ background: "white", boxShadow: "rgba(0,0,0,0.08) 0px 1px 4px 0px" }}
    >
      <span className="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.3s]" style={{ background: "rgba(0,0,0,0.3)" }} />
      <span className="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.15s]" style={{ background: "rgba(0,0,0,0.3)" }} />
      <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "rgba(0,0,0,0.3)" }} />
    </motion.div>
  );
}

function SectionHelpModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-[12px] p-8 max-w-sm w-full relative"
        style={{ boxShadow: "rgba(0,0,0,0.22) 3px 5px 30px 0px" }}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 transition-colors hover:text-[#1d1d1f]"
          style={{ color: "rgba(0,0,0,0.3)" }}
        >
          <X className="w-5 h-5" />
        </button>
        <h2
          style={{
            fontFamily: '-apple-system, "SF Pro Display", "Helvetica Neue", Arial, sans-serif',
            fontSize: "21px",
            fontWeight: 600,
            color: "#1d1d1f",
            letterSpacing: "0.231px",
            lineHeight: "1.19",
            marginBottom: "20px",
            marginTop: "4px",
          }}
        >
          섹션(Section)이란?
        </h2>
        <div className="space-y-4" style={{ fontSize: "15px", lineHeight: "1.47", color: "rgba(0,0,0,0.8)", letterSpacing: "-0.374px" }}>
          <p>
            페이지 안에서 하나의 주제로 묶여 있는{" "}
            <strong style={{ color: "#1d1d1f" }}>콘텐츠 블록</strong>입니다.
          </p>
          <div className="rounded-[8px] p-4" style={{ background: "#f5f5f7" }}>
            <ul className="space-y-1.5" style={{ fontSize: "14px", color: "rgba(0,0,0,0.8)", letterSpacing: "-0.224px" }}>
              <li>• 히어로 배너 영역</li>
              <li>• 서비스 소개 블록</li>
              <li>• 고객 후기 슬라이드</li>
              <li>• 하단 문의 폼 영역</li>
            </ul>
          </div>
          <p>
            섹션이 많아질수록 기획과 디자인 투입량이 늘어나므로,{" "}
            <strong style={{ color: "#1d1d1f" }}>섹션 수를 기준</strong>으로 가장 합리적인 견적을 산출합니다.
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-full h-12 mt-8 text-white rounded-[8px] font-normal text-[17px] hover:opacity-90 transition-opacity"
          style={{ background: "#0071e3", letterSpacing: "-0.374px" }}
        >
          확인했습니다
        </button>
      </motion.div>
    </motion.div>
  );
}

function ResultCard({ data }: { data: any; state: InterviewState }) {
  return (
    <div
      className="w-full bg-[#1c1c1e] text-white rounded-[24px] overflow-hidden shadow-2xl"
      style={{
        border: "1px solid rgba(255,255,255,0.1)",
        backdropFilter: "saturate(180%) blur(20px)",
      }}
    >
      {/* Header */}
      <div className="p-8 pb-6 border-b border-white border-opacity-10 text-center">
        <p style={{ fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.48)", letterSpacing: "0.4em", textTransform: "uppercase" }}>
          Estimated Quote
        </p>
        <h2 className="mt-4 text-[15px] font-medium text-white opacity-60">예상 제작 비용 범위</h2>
        <div className="mt-2 flex items-baseline justify-center gap-2">
          <span className="text-[28px] md:text-[32px] font-bold tracking-tight">
            ₩ {data.minPrice.toLocaleString()} ~ {data.maxPrice.toLocaleString()}
          </span>
        </div>
        <p className="mt-3 text-[12px]" style={{ color: "rgba(255,255,255,0.4)" }}>
          위 금액은 제작비 기준 예상 범위입니다. (VAT 별도)
        </p>
      </div>

      {/* Details */}
      <div className="p-8 space-y-8">
        <div>
          <p style={{ fontSize: "10px", fontWeight: 600, color: "rgba(255,255,255,0.48)", letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: "20px" }}>
            Quote Breakdown
          </p>
          <ul className="space-y-4 text-[14px]">
            <li className="flex justify-between pb-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <span style={{ color: "rgba(255,255,255,0.48)" }}>섹션 제작비 ({data.totalSections}개)</span>
              <span className="font-semibold text-white">₩ {data.pureSectionPrice?.toLocaleString()}</span>
            </li>
            {(data.featureTotalPrice || 0) > 0 && (
              <li className="flex justify-between pb-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <span style={{ color: "rgba(255,255,255,0.48)" }}>추가 기능 비용</span>
                <span className="font-semibold text-white">₩ {data.featureTotalPrice?.toLocaleString()}</span>
              </li>
            )}
            {(data.boardTotalPrice || 0) > 0 && (
              <li className="flex justify-between pb-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <span style={{ color: "rgba(255,255,255,0.48)" }}>게시판 구축비 ({data.totalBoards}개)</span>
                <span className="font-semibold text-white">₩ {data.boardTotalPrice?.toLocaleString()}</span>
              </li>
            )}
            <li className="flex justify-between pb-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <span style={{ color: "rgba(255,255,255,0.48)" }}>난이도 및 자료 준비 가중치</span>
              <span className="font-semibold text-[#00ffcc]">x {data.difficultyWeight.toFixed(1)}</span>
            </li>
            <li className="flex justify-between items-start pt-4 border-t border-white border-opacity-10">
              <span style={{ color: "rgba(255,255,255,0.48)" }}>기본 호스팅 비용</span>
              <div className="text-right">
                <span className="block text-[#1cdcf5]">월 ₩ {PRICING.BASE_HOSTING_MONTHLY.toLocaleString()}</span>
                <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>연 단위 결제 기준</span>
              </div>
            </li>
            {data.isMultilingual && (
              <li className="flex justify-between items-start">
                <span style={{ color: "rgba(255,255,255,0.48)" }}>다국어 디자인 가산 (섹션당)</span>
                <div className="text-right">
                  <span className="block text-[#1cdcf5]">₩ {data.designAddonPrice?.toLocaleString()} 추가</span>
                </div>
              </li>
            )}
          </ul>
        </div>

        <div className="p-5 rounded-[8px] space-y-2" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <p style={{ fontSize: "10px", fontWeight: 600, color: "rgba(255,255,255,0.48)", letterSpacing: "0.3em", textTransform: "uppercase" }}>
            Notices
          </p>
          <div className="space-y-1.5" style={{ fontSize: "11px", color: "rgba(255,255,255,0.48)", lineHeight: "1.47", letterSpacing: "-0.08px" }}>
            <p>• 모든 비용은 부가세(VAT) 별도입니다.</p>
            <p>• 제작 범위 및 기능 난이도에 따라 최종 견적은 변동될 수 있습니다.</p>
            <p>• 2차 상세 인터뷰 완료 시 더 정확한 실행 견적이 산출됩니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ContactInputCard({
  onConfirm,
  isActive,
  initialData,
}: {
  onConfirm: (data: { email: string; phone: string }) => void;
  isActive: boolean;
  initialData?: { email: string; phone: string };
}) {
  const [email, setEmail] = useState(initialData?.email || "");
  const [p1, setP1] = useState(initialData?.phone?.split("-")[0] || "010");
  const [p2, setP2] = useState(initialData?.phone?.split("-")[1] || "");
  const [p3, setP3] = useState(initialData?.phone?.split("-")[2] || "");

  const inputStyle = {
    background: "#f5f5f7",
    border: "1px solid rgba(0,0,0,0.1)",
    borderRadius: "12px",
    padding: "12px",
    width: "100%",
    fontSize: "16px",
    fontWeight: 500,
    outline: "none",
    transition: "all 0.2s ease",
  };

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPhoneComplete = p1.length >= 3 && p2.length >= 3 && p3.length === 4;
  const canConfirm = isEmailValid && isPhoneComplete;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn("bg-white rounded-[18px] p-6 space-y-6", !isActive && "opacity-30 pointer-events-none")}
      style={{ boxShadow: "rgba(0,0,0,0.08) 0px 4px 16px 0px" }}
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[12px] font-semibold text-gray-400 ml-1">이메일 주소</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@email.com"
            style={inputStyle}
            className="focus:ring-2 focus:ring-[#0071e3] focus:border-transparent"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[12px] font-semibold text-gray-400 ml-1">휴대폰 번호</label>
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={p1}
              onChange={(e) => setP1(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="010"
              maxLength={3}
              style={{ ...inputStyle, textAlign: "center" }}
              className="focus:ring-2 focus:ring-[#0071e3]"
            />
            <span className="text-gray-300">-</span>
            <input
              type="text"
              value={p2}
              onChange={(e) => setP2(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="0000"
              maxLength={4}
              style={{ ...inputStyle, textAlign: "center" }}
              className="focus:ring-2 focus:ring-[#0071e3]"
            />
            <span className="text-gray-300">-</span>
            <input
              type="text"
              value={p3}
              onChange={(e) => setP3(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="0000"
              maxLength={4}
              style={{ ...inputStyle, textAlign: "center" }}
              className="focus:ring-2 focus:ring-[#0071e3]"
            />
          </div>
        </div>
      </div>

      <button
        onClick={() => {
          if (canConfirm) onConfirm({ email, phone: `${p1}-${p2}-${p3}` });
        }}
        disabled={!canConfirm}
        className="w-full h-12 text-white rounded-[12px] font-semibold text-[16px] flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-30 disabled:grayscale"
        style={{ background: "#1d1d1f" }}
      >
        다음 <Check className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

function DetailedStage2Form({
  state,
  setState,
  onNext,
  isActive,
}: {
  state: any;
  setState: any;
  onNext: () => void;
  isActive: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn("bg-white rounded-[12px] p-6 space-y-5", !isActive && "opacity-30 pointer-events-none")}
      style={{ boxShadow: "rgba(0,0,0,0.08) 0px 1px 4px 0px" }}
    >
      <div className="space-y-3">
        <p style={{ fontSize: "11px", fontWeight: 600, color: "rgba(0,0,0,0.48)", letterSpacing: "0.3em", textTransform: "uppercase" }}>
          File Upload / Attachments
        </p>
        <div className="relative">
          <input
            type="file"
            className="hidden"
            id="stage2-file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setState((p: any) => ({ ...p, details: { ...p.details, file } }));
            }}
          />
          <label
            htmlFor="stage2-file"
            className="flex flex-col items-center justify-center rounded-[8px] p-8 cursor-pointer transition-all hover:border-[#0071e3]"
            style={{ border: "2px dashed rgba(0,0,0,0.1)", background: "#f5f5f7" }}
          >
            {state.details.file ? (
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-[#0071e3] w-6 h-6" />
                <span style={{ fontSize: "14px", fontWeight: 600, color: "#1d1d1f", letterSpacing: "-0.224px" }}>
                  {state.details.file.name}
                </span>
              </div>
            ) : (
              <>
                <Upload className="w-7 h-7 mb-3" style={{ color: "rgba(0,0,0,0.3)" }} />
                <span style={{ fontSize: "14px", color: "rgba(0,0,0,0.48)", letterSpacing: "-0.224px" }}>
                  참고 자료를 업로드해주세요. (선택)
                </span>
              </>
            )}
          </label>
        </div>
      </div>
      <button
        onClick={onNext}
        className="w-full h-12 text-white rounded-[8px] font-normal text-[17px] flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
        style={{ background: "#0071e3", letterSpacing: "-0.374px" }}
      >
        {state.details.file ? "파일 포함하여 다음으로" : "파일 없이 다음으로"}
      </button>
    </motion.div>
  );
}

function DirectInputCard({ 
  onConfirm, 
  isActive, 
  placeholder, 
  initialData,
  showNoneButton = false
}: { 
  onConfirm: (val: string) => void; 
  isActive: boolean; 
  placeholder: string; 
  initialData?: string;
  showNoneButton?: boolean;
}) {
  const [val, setVal] = useState(initialData || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isActive) setIsSubmitting(false);
  }, [isActive]);

  const handleConfirm = () => {
    if (isSubmitting || !isActive) return;
    const finalVal = val.trim() || "없음";
    setIsSubmitting(true);
    onConfirm(finalVal);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-6 bg-white rounded-[24px] border border-[#EBEDF3] shadow-sm transition-all",
        (!isActive || isSubmitting) && "opacity-40 pointer-events-none"
      )}
    >
      <input
        type="text"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.nativeEvent.isComposing) handleConfirm();
        }}
        placeholder={placeholder}
        className="w-full bg-[#F1F2F6] border-none rounded-xl px-4 py-4 text-[15px] outline-none focus:ring-2 focus:ring-[#0071e3] transition-all"
        autoFocus
      />
      
      {showNoneButton ? (
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => {
              if (!isSubmitting) {
                setIsSubmitting(true);
                onConfirm("없음");
              }
            }}
            disabled={isSubmitting}
            className="flex-1 h-12 bg-gray-100 text-gray-500 rounded-xl font-semibold text-[15px] hover:bg-gray-200 transition-all disabled:opacity-30"
          >
            없음
          </button>
          <button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="flex-[2] h-12 text-white bg-[#1d1d1f] rounded-xl font-semibold text-[15px] transition-all active:scale-[0.98] disabled:opacity-30"
          >
            {isSubmitting ? "처리 중..." : "확인"}
          </button>
        </div>
      ) : (
        <button
          onClick={handleConfirm}
          disabled={!val.trim() || isSubmitting}
          className="w-full h-12 mt-4 text-white rounded-xl font-semibold text-[16px] transition-all active:scale-[0.98] disabled:opacity-30"
          style={{ background: "#1d1d1f" }}
        >
          {isSubmitting ? "처리 중..." : "확인"}
        </button>
      )}
    </motion.div>
  );
}

function MultiColorPickerCard({ onConfirm, isActive }: { onConfirm: (val: string) => void; isActive: boolean }) {
  const [colors, setColors] = useState([
    { type: "브랜드 컬러", hex: "#0071e3", note: "" },
    { type: "보조 컬러", hex: "#f5c400", note: "" }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const colorTypes = ["브랜드 컬러", "보조 컬러", "버튼 컬러", "강조 컬러", "배경 컬러", "기타"];

  const addColor = () => {
    setColors([...colors, { type: "기타", hex: "#000000", note: "" }]);
  };

  const removeColor = (idx: number) => {
    if (colors.length <= 1) return;
    setColors(colors.filter((_, i) => i !== idx));
  };

  const updateColor = (idx: number, field: string, val: string) => {
    setColors(prev => prev.map((c, i) => i === idx ? { ...c, [field]: val } : c));
  };

  const handleConfirm = () => {
    if (isSubmitting || !isActive) return;
    
    const hasBrand = colors.some(c => c.type === "브랜드 컬러" && c.hex);
    const hasSecondary = colors.some(c => c.type === "보조 컬러" && c.hex);
    
    if (!(hasBrand && hasSecondary)) {
        alert("최소한 브랜드 컬러와 보조 컬러를 모두 지정해 주세요.");
        return;
    }

    setIsSubmitting(true);
    const result = colors
      .map(c => `${c.type}:${c.hex}${c.note ? `(${c.note})` : ""}`)
      .join(", ");
    onConfirm(result);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "space-y-4 transition-all",
        (!isActive || isSubmitting) && "opacity-40 pointer-events-none"
      )}
    >
      <div className="space-y-3">
        {colors.map((c, idx) => (
          <div key={idx} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
            <div className="flex items-center justify-between">
              <select
                value={c.type}
                onChange={(e) => updateColor(idx, "type", e.target.value)}
                className="bg-gray-50 border-none rounded-xl px-3 py-2 text-[13px] font-black focus:ring-2 focus:ring-[#0071e3]"
              >
                {colorTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              {colors.length > 2 && (
                <button onClick={() => removeColor(idx)} className="p-2 text-gray-300 hover:text-red-500">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl">
              <div className="relative w-12 h-12 shrink-0">
                <input
                  type="color"
                  value={c.hex}
                  onChange={(e) => updateColor(idx, "hex", e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div 
                  className="w-full h-full rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: c.hex }}
                />
              </div>
              <div className="flex flex-col flex-1">
                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">HEX CODE</span>
                <span className="text-[15px] font-black text-black">{c.hex.toUpperCase()}</span>
              </div>
            </div>

            <input
              type="text"
              value={c.note}
              onChange={(e) => updateColor(idx, "note", e.target.value)}
              placeholder="설명을 입력하세요 (예: 포인트 색상)"
              className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-[14px] outline-none focus:ring-2 focus:ring-[#0071e3]"
            />
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          onClick={addColor}
          className="flex-1 h-14 bg-white border-2 border-dashed border-gray-200 text-gray-400 rounded-2xl font-bold text-[14px] flex items-center justify-center gap-2 hover:border-black hover:text-black transition-all"
        >
          <Plus className="w-4 h-4" /> 컬러 추가
        </button>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          onClick={() => onConfirm("잘 모르겠어요 / 없음")}
          className="flex-1 h-14 bg-gray-100 text-gray-400 rounded-2xl font-bold text-[15px] hover:bg-gray-200 transition-all"
        >
          건너뛰기
        </button>
        <button
          onClick={handleConfirm}
          className="flex-[2.5] h-14 bg-black text-white rounded-2xl font-bold text-[15px] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"
        >
          이 설정으로 완료
        </button>
      </div>
    </motion.div>
  );
}

function ColorPickerCard({ onConfirm, isActive, initialColor }: { onConfirm: (val: string) => void; isActive: boolean; initialColor?: string }) {
  const [color, setColor] = useState(initialColor || "#0071e3");
  const [desc, setDesc] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isActive) setIsSubmitting(false);
  }, [isActive]);

  const handleConfirm = () => {
    if (isSubmitting || !isActive) return;
    setIsSubmitting(true);
    onConfirm(`${color} (${desc || '지정 색상'})`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-6 bg-white rounded-[24px] border border-[#EBEDF3] shadow-sm transition-all",
        (!isActive || isSubmitting) && "opacity-40 pointer-events-none"
      )}
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-4 bg-[#F1F2F6] p-4 rounded-2xl">
          <div className="relative w-12 h-12 shrink-0">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div 
              className="w-full h-full rounded-full border-2 border-white shadow-sm"
              style={{ backgroundColor: color }}
            />
          </div>
          <div className="flex flex-col gap-1 flex-1">
            <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest leading-none">Color Code</span>
            <span className="text-[17px] font-black text-black leading-none">{color.toUpperCase()}</span>
          </div>
        </div>

        <input
          type="text"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="색상에 대한 설명을 입력해주세요 (예: 메인 포인트 컬러)"
          className="w-full bg-[#F1F2F6] border-none rounded-xl px-4 py-4 text-[15px] outline-none focus:ring-2 focus:ring-[#0071e3] transition-all"
        />

        <div className="flex gap-2">
          <button
            onClick={() => onConfirm("없음")}
            className="flex-1 h-12 bg-gray-100 text-gray-500 rounded-xl font-semibold text-[15px] hover:bg-gray-200 transition-all"
          >
            없음
          </button>
          <button
            onClick={handleConfirm}
            className="flex-[2] h-12 bg-black text-white rounded-xl font-semibold text-[15px] hover:bg-black/90 transition-all"
          >
            선택 완료
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function UrlListInputCard({ onConfirm, isActive, initialData }: { onConfirm: (urls: string[]) => void; isActive: boolean; initialData?: string[] }) {
  const [urls, setUrls] = useState<string[]>(initialData && initialData.length > 0 ? initialData : [""]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isActive) setIsSubmitting(false);
  }, [isActive]);

  const addUrl = () => setUrls([...urls, ""]);
  const removeUrl = (idx: number) => {
    if (urls.length === 1) {
      setUrls([""]);
      return;
    }
    setUrls(urls.filter((_, i) => i !== idx));
  };
  const updateUrl = (idx: number, val: string) => {
    const newUrls = [...urls];
    newUrls[idx] = val;
    setUrls(newUrls);
  };

  const handleConfirm = () => {
    if (isSubmitting || !isActive) return;
    const filtered = urls.map(u => u.trim()).filter(u => u !== "");
    setIsSubmitting(true);
    onConfirm(filtered.length > 0 ? filtered : ["없음"]);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-white rounded-[18px] p-6 space-y-5 shadow-sm border border-[#EBEDF3] transition-all",
        (!isActive || isSubmitting) && "opacity-40 pointer-events-none"
      )}
    >
      <div className="space-y-3">
        {urls.map((url, idx) => (
          <div key={idx} className="flex gap-2 group">
            <div className="relative flex-1">
              <input
                type="text"
                className="w-full h-12 pl-5 pr-10 bg-[#f5f5f7] rounded-[12px] focus:ring-2 focus:ring-[#0071e3] outline-none text-[14px]"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => updateUrl(idx, e.target.value)}
              />
            </div>
            {urls.length > 1 && (
              <button
                onClick={() => removeUrl(idx)}
                className="w-12 h-12 flex items-center justify-center bg-gray-50 rounded-[12px] text-gray-400 hover:text-red-500 transition-colors"
                disabled={isSubmitting}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
        <button
          onClick={addUrl}
          disabled={isSubmitting}
          className="w-full h-12 flex items-center justify-center gap-2 border-2 border-dashed border-gray-100 rounded-[12px] text-gray-400 font-semibold text-[14px] hover:border-[#0071e3] hover:text-[#0071e3] transition-all disabled:opacity-30"
        >
          <Plus className="w-4 h-4" /> 사이트 추가
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => {
            if (!isSubmitting) {
              setIsSubmitting(true);
              onConfirm(["없음"]);
            }
          }}
          disabled={isSubmitting}
          className="flex-1 h-12 bg-gray-100 text-gray-500 rounded-[12px] font-semibold text-[15px] hover:bg-gray-200 transition-all disabled:opacity-30"
        >
          없음
        </button>
        <button
          onClick={handleConfirm}
          disabled={isSubmitting}
          className="flex-[2] h-12 text-white bg-[#1d1d1f] rounded-[12px] font-semibold text-[15px] active:scale-[0.98] disabled:opacity-30"
        >
          {isSubmitting ? "처리 중..." : "확인"}
        </button>
      </div>
    </motion.div>
  );
}
