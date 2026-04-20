function DirectInputCard({ onConfirm, isActive, placeholder, initialData }: { onConfirm: (val: string) => void; isActive: boolean; placeholder: string; initialData?: string }) {
  const [val, setVal] = useState(initialData || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isActive) setIsSubmitting(false);
  }, [isActive]);

  const handleConfirm = () => {
    if (!val.trim() || isSubmitting || !isActive) return;
    setIsSubmitting(true);
    onConfirm(val.trim());
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
      <button
        onClick={handleConfirm}
        disabled={!val.trim() || isSubmitting}
        className="w-full h-12 mt-4 text-white rounded-xl font-semibold text-[16px] transition-all active:scale-[0.98] disabled:opacity-30"
        style={{ background: "#1d1d1f" }}
      >
        {isSubmitting ? "처리 중..." : "확인"}
      </button>
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
