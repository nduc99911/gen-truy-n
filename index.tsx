import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  Pencil, 
  Image as ImageIcon, 
  Save, 
  Sparkles, 
  User, 
  BookOpen, 
  RefreshCw,
  Layout,
  Download,
  Palette,
  Move,
  Check,
  Plus,
  X,
  Users,
  Eye,
  EyeOff,
  Trash2,
  Settings,
  Lightbulb,
  Cloud,
  MessageCircle,
  FolderOpen,
  Sticker as StickerIcon,
  Zap,
  Upload,
  MousePointer2,
  Grid,
  Key
} from 'lucide-react';

// --- Constants & Types ---

const GENERATION_MODEL = "gemini-3-pro-image-preview"; // High quality images
const SCRIPT_MODEL = "gemini-2.5-flash"; // Fast thinking for script

interface CharacterConfig {
  name: string;
  gender: string;
  bodyType: string;
  eyeStyle: string;
  hairStyle: string;
  hairColor: string;
  outfitStyle: string;
  outfitColor: string;
  accessory: string;
}

interface SideCharacter {
  id: string;
  name: string;
  description: string;
}

interface StickerData {
  id: string;
  type: 'emoji' | 'image';
  content: string; // emoji char or image url
  x: number; // percentage
  y: number; // percentage
  scale: number;
}

interface ComicPanel {
  panelNumber: number;
  description: string;
  dialogue_character: string;
  dialogue_text: string;
  thought_text?: string;
  visual_prompt: string;
  imageUrl?: string;
  isGeneratingImage?: boolean;
  bubblePosition?: { x: number, y: number };
  thoughtBubblePosition?: { x: number, y: number };
  showMainCharacter: boolean;
  additionalCharacters: string[];
  stickers: StickerData[];
}

const PRESET_SIDE_CHARACTERS = [
  { name: "Doraemon", description: "Mèo máy màu xanh, tròn ủng, đeo chuông vàng, túi thần kỳ." },
  { name: "Nobita", description: "Cậu bé đeo kính tròn, mặc áo thun vàng, quần soóc xanh, hậu đậu." },
  { name: "Mẹ", description: "Phụ nữ đeo kính tròn, mặc tạp dề, tóc uốn, nghiêm khắc." },
  { name: "Bố", description: "Người đàn ông mặc vest, đi làm về, hút thuốc, hiền lành." },
  { name: "Chaien", description: "To béo, áo cam sọc đen, dữ dằn, hay hát." },
  { name: "Xeko", description: "Gầy, mỏ nhọn, tóc vuốt keo, hay khoe khoang." },
  { name: "Shizuka", description: "Bé gái dễ thương, tóc hai bím, váy hồng." },
  { name: "Dorami", description: "Mèo máy vàng, nơ đỏ, đuôi hoa tulip." },
  { name: "Thầy giáo", description: "Mặc vest xanh, nghiêm khắc, hay mắng." }
];

const GADGETS = [
  { name: "Chong chóng tre", icon: "🚁" },
  { name: "Cửa thần kỳ", icon: "🚪" },
  { name: "Đèn pin thu nhỏ", icon: "🔦" },
  { name: "Bánh mì ghi nhớ", icon: "🍞" },
  { name: "Cỗ máy thời gian", icon: "🕰️" },
  { name: "Đại bác", icon: "💣" },
  { name: "Túi thần kỳ", icon: "👜" },
  { name: "Bánh rán", icon: "🍩" },
];

const EFFECTS = [
  { name: "Giận dữ", icon: "💢" },
  { name: "Đổ mồ hôi", icon: "💧" },
  { name: "Lấp lánh", icon: "✨" },
  { name: "Ngạc nhiên", icon: "❗" },
  { name: "Hỏi chấm", icon: "❓" },
  { name: "Ngủ", icon: "💤" },
  { name: "Yêu", icon: "😍" },
  { name: "Sốc", icon: "😱" },
  { name: "Âm nhạc", icon: "🎵" },
  { name: "Chóng mặt", icon: "💫" },
  { name: "Nổ", icon: "💥" },
];

// --- Helper Components ---

const Button = ({ onClick, disabled, children, className = "", variant = "primary", size = "normal" }: any) => {
  const baseClass = "rounded-full font-bold transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2";
  const sizeClass = size === "small" ? "px-3 py-1 text-sm" : "px-6 py-2";
  
  const variants: any = {
    primary: "bg-[#0096e7] text-white hover:bg-[#007bbd] shadow-lg shadow-blue-200",
    secondary: "bg-white text-[#0096e7] border-2 border-[#0096e7] hover:bg-blue-50",
    danger: "bg-red-500 text-white hover:bg-red-600",
    success: "bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-200",
    ghost: "bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-700 shadow-none"
  };
  
  return (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      className={`${baseClass} ${sizeClass} ${variants[variant]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed transform-none' : ''}`}
    >
      {children}
    </button>
  );
};

const Card = ({ children, title, icon: Icon, className = "" }: any) => (
  <div className={`bg-white rounded-2xl shadow-xl p-6 border-2 border-blue-100 ${className}`}>
    {title && (
      <div className="flex items-center gap-2 mb-4 border-b pb-2 border-blue-50">
        {Icon && <Icon className="w-6 h-6 text-[#0096e7]" />}
        <h2 className="text-xl font-bold text-gray-700">{title}</h2>
      </div>
    )}
    {children}
  </div>
);

const ColorPicker = ({ label, color, onChange }: { label: string, color: string, onChange: (c: string) => void }) => {
  const presets = ['#000000', '#5D4037', '#F44336', '#2196F3', '#FFEB3B', '#4CAF50', '#9C27B0', '#FFFFFF', '#FF9800', '#795548'];
  
  return (
    <div>
      <label className="block text-sm font-bold text-gray-600 mb-2">{label}</label>
      <div className="flex flex-wrap gap-2 items-center">
        {presets.map(c => (
          <button 
             key={c}
             onClick={() => onChange(c)}
             className={`w-8 h-8 rounded-full border-2 transition-transform ${color === c ? 'border-blue-500 scale-110 ring-2 ring-blue-200' : 'border-gray-200 hover:scale-105'}`}
             style={{ backgroundColor: c }}
             title={c}
          >
            {color === c && c === '#FFFFFF' && <Check size={14} className="mx-auto text-black"/>}
            {color === c && c !== '#FFFFFF' && <Check size={14} className="mx-auto text-white"/>}
          </button>
        ))}
        <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-gray-300 hover:border-blue-400 cursor-pointer group">
          <input 
            type="color" 
            value={color}
            onChange={(e) => onChange(e.target.value)}
            className="absolute -top-2 -left-2 w-12 h-12 p-0 border-0 cursor-pointer"
          />
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <Palette size={14} className="text-gray-600 group-hover:text-blue-600"/>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Draggable Element Component (Bubbles & Stickers) ---

const DraggableElement = ({ 
    type, 
    content, 
    character, 
    initialPosition, 
    scale = 1,
    onCommitPosition, 
    onDelete,
    containerRef 
}: any) => {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 }); 
  const startPosRef = useRef({ x: 0, y: 0 }); 

  useEffect(() => {
     if (initialPosition) setPosition(initialPosition);
  }, [initialPosition?.x, initialPosition?.y]);

  const handleMouseMove = (e: MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;
    
    const deltaXPercent = (deltaX / rect.width) * 100;
    const deltaYPercent = (deltaY / rect.height) * 100;

    let newX = startPosRef.current.x + deltaXPercent;
    let newY = startPosRef.current.y + deltaYPercent;

    newX = Math.max(-20, Math.min(120, newX));
    newY = Math.max(-20, Math.min(120, newY));

    setPosition({ x: newX, y: newY });
  };

  const posRef = useRef(position);
  useEffect(() => { posRef.current = position; }, [position]);

  const handleMouseUpSafe = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUpSafe);
      onCommitPosition(posRef.current, scale); // Pass scale back if needed
  };
  
  const handleMouseDownFinal = (e: React.MouseEvent) => {
      if(e.button !== 0) return; // Left click only
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      startPosRef.current = { ...position };
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUpSafe);
  }

  // Handle Resize via Wheel
  const handleWheel = (e: React.WheelEvent) => {
      if (type === 'sticker' || type === 'image') {
          e.stopPropagation();
          e.preventDefault();
          const newScale = Math.max(0.2, Math.min(5, scale + (e.deltaY > 0 ? -0.1 : 0.1)));
          onCommitPosition(position, newScale);
      }
  }

  // Render logic
  const isThought = type === 'thought';
  const isSpeech = type === 'speech';
  const isSticker = type === 'sticker' || type === 'image';

  let contentNode;

  if (isSticker) {
      const isEmoji = type === 'sticker';
      contentNode = (
          <div 
             className={`select-none cursor-move transition-transform hover:scale-110 relative group`}
             style={{ fontSize: isEmoji ? '3rem' : 'inherit', transform: `scale(${scale})` }}
             onDoubleClick={onDelete}
             onWheel={handleWheel}
             title="Kéo để di chuyển, Lăn chuột để phóng to/thu nhỏ, Click đúp để xóa"
          >
             {isEmoji ? (
                 <span style={{ textShadow: '2px 2px 0px white' }}>{content}</span>
             ) : (
                 <img src={content} alt="sticker" className="max-w-[150px] drop-shadow-lg" />
             )}
             
             {/* Delete Hint */}
             <div className="absolute -top-4 -right-4 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity scale-[0.5] print:hidden">
                 <X size={16} />
             </div>
          </div>
      );
  } else {
      // Bubbles
      const bubbleStyle = isThought 
        ? "border-[3px] border-dashed border-gray-500 rounded-[50%] bg-white/95 text-gray-700 italic"
        : "border-[3px] border-black rounded-[2rem] bg-white text-black font-bold";
        
      const tagStyle = isThought
        ? "bg-gray-400 border-gray-500"
        : "bg-[#0096e7] border-black";
      
      contentNode = (
         <div className={`${bubbleStyle} px-4 py-3 shadow-md relative select-none ${isDragging ? 'ring-2 ring-blue-400' : ''}`}>
              <p className="comic-font text-center leading-tight text-lg pointer-events-none">
                {isThought && <span className="text-xs block text-gray-400 not-italic mb-1">(Suy nghĩ)</span>}
                {content}
              </p>
              
              {!isThought && character && (
                <span className={`absolute -top-3 -left-2 ${tagStyle} text-white font-bold text-xs px-2 py-0.5 rounded-md border-2 transform -rotate-3 pointer-events-none shadow-sm`}>
                    {character}
                </span>
              )}

              {isThought && (
                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-1 pointer-events-none">
                    <div className="w-2 h-2 rounded-full bg-white border-2 border-dashed border-gray-400"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-white border border-gray-400"></div>
                </div>
              )}
         </div>
      );
  }

  return (
    <div 
      onMouseDown={handleMouseDownFinal}
      className={`absolute z-30 flex items-center justify-center ${isSticker ? '' : 'max-w-[90%] min-w-[120px]'}`}
      style={{ 
        left: `${position.x}%`, 
        top: `${position.y}%`,
        transform: 'translate(-50%, -50%)' 
      }}
    >
       {contentNode}
    </div>
  );
};

// --- Panel Item Component ---

const PanelItem = ({ 
    panel, 
    idx, 
    onUpdateBubblePosition, 
    onRegenerateImage, 
    onUpdateSticker,
    onDeleteSticker 
}: any) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle dropping stickers from toolbar (simple click-to-add for now in parent, but this ref is key for bounds)
  return (
    <div ref={containerRef} className="relative group break-inside-avoid page-break-inside-avoid">
      <div className="border-[4px] border-black rounded-lg overflow-hidden bg-gray-100 aspect-[4/3] relative shadow-xl">
        {panel.imageUrl ? (
          <img src={panel.imageUrl} alt={`Panel ${idx + 1}`} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center bg-gray-50">
             {panel.isGeneratingImage ? (
                <>
                  <RefreshCw className="w-12 h-12 mb-4 animate-spin text-[#0096e7]" />
                  <p className="font-bold text-[#0096e7]">Đang vẽ khung {idx + 1}...</p>
                </>
             ) : (
                <div className="flex flex-col items-center animate-pulse">
                   <ImageIcon className="w-16 h-16 mb-2 text-blue-200"/>
                   <p className="mb-4 text-sm text-gray-500 max-w-[200px] line-clamp-3">{panel.description}</p>
                   <Button onClick={() => onRegenerateImage(idx)} variant="secondary" className="mt-2 text-sm">
                     Vẽ minh họa
                   </Button>
                </div>
             )}
          </div>
        )}
        
        <div className="absolute top-0 left-0 bg-[#0096e7] text-white px-3 py-1 font-black z-10 text-xl border-b-2 border-r-2 border-black rounded-br-lg shadow-md">
          {idx + 1}
        </div>

        {!panel.isGeneratingImage && panel.imageUrl && (
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-20 print:hidden">
                <button 
                    onClick={() => onRegenerateImage(idx)} 
                    className="bg-white hover:bg-blue-50 text-[#0096e7] p-2 rounded-full shadow-lg border-2 border-blue-200 transition-transform hover:scale-110"
                    title="Vẽ lại hình này"
                >
                    <RefreshCw size={20} />
                </button>
            </div>
        )}
      </div>

      {/* Speech Bubble */}
      {panel.imageUrl && panel.dialogue_text && (
         <DraggableElement 
           type="speech"
           content={panel.dialogue_text} 
           character={panel.dialogue_character}
           initialPosition={panel.bubblePosition || { x: 50, y: 85 }}
           containerRef={containerRef}
           onCommitPosition={(pos: any) => onUpdateBubblePosition(idx, 'speech', pos.x, pos.y)}
         />
      )}

      {/* Thought Bubble */}
      {panel.imageUrl && panel.thought_text && (
         <DraggableElement 
           type="thought"
           content={panel.thought_text} 
           initialPosition={panel.thoughtBubblePosition || { x: 50, y: 20 }}
           containerRef={containerRef}
           onCommitPosition={(pos: any) => onUpdateBubblePosition(idx, 'thought', pos.x, pos.y)}
         />
      )}

      {/* Stickers */}
      {panel.imageUrl && panel.stickers && panel.stickers.map((sticker: StickerData) => (
          <DraggableElement
            key={sticker.id}
            type={sticker.type === 'image' ? 'image' : 'sticker'}
            content={sticker.content}
            initialPosition={{ x: sticker.x, y: sticker.y }}
            scale={sticker.scale}
            containerRef={containerRef}
            onCommitPosition={(pos: any, scale: number) => onUpdateSticker(idx, sticker.id, pos, scale)}
            onDelete={() => onDeleteSticker(idx, sticker.id)}
          />
      ))}
    </div>
  );
};

// --- Main Application ---

const App = () => {
  // State
  const [hasKey, setHasKey] = useState(false);
  const [isCheckingKey, setIsCheckingKey] = useState(true);
  const [customApiKey, setCustomApiKey] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [tempApiKey, setTempApiKey] = useState("");
  
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Config, 2: Script, 3: Final
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Story Settings
  const [storyLength, setStoryLength] = useState<4 | 8>(4);
  const [panelsPerPage, setPanelsPerPage] = useState<2 | 3 | 4>(4);
  const [comicBackgroundColor, setComicBackgroundColor] = useState('#ffffff');
  
  // Character Config
  const [character, setCharacter] = useState<CharacterConfig>({
    name: "Tí",
    gender: "bé trai",
    bodyType: "dáng người trung bình",
    eyeStyle: "mắt to tròn (regular big eyes)",
    hairStyle: "tóc chôm chôm (spiky messy hair)",
    hairColor: "#000000",
    outfitStyle: "áo thun và quần soóc",
    outfitColor: "#FFEB3B", // Yellow
    accessory: "không có"
  });

  // Side Characters
  const [sideCharacters, setSideCharacters] = useState<SideCharacter[]>([]);
  const [newSideCharName, setNewSideCharName] = useState("");
  const [newSideCharDesc, setNewSideCharDesc] = useState("");

  // Story
  const [storyTopic, setStoryTopic] = useState("Tí tìm thấy một cánh cửa thần kỳ dẫn đến thế giới bánh kẹo.");
  const [script, setScript] = useState<ComicPanel[]>([]);

  // Editor State
  const [activeEditorTab, setActiveEditorTab] = useState<'gadgets' | 'effects' | 'upload' | 'style'>('gadgets');

  // Suggestion logic
  const matchingPreset = PRESET_SIDE_CHARACTERS.find(
    p => newSideCharName && (
      p.name.toLowerCase().includes(newSideCharName.trim().toLowerCase()) || 
      newSideCharName.trim().toLowerCase().includes(p.name.toLowerCase())
    )
  );

  // --- API Handlers ---

  useEffect(() => {
    async function checkKey() {
      // Check for manually saved key first
      const storedKey = localStorage.getItem('dora_api_key');
      if (storedKey) {
        setCustomApiKey(storedKey);
        setHasKey(true);
        setIsCheckingKey(false);
        return;
      }

      if ((window as any).aistudio && (window as any).aistudio.hasSelectedApiKey) {
        const has = await (window as any).aistudio.hasSelectedApiKey();
        setHasKey(has);
      } else {
        // Fallback for dev environments
        setHasKey(!!process.env.API_KEY);
      }
      setIsCheckingKey(false);
    }
    checkKey();
  }, []);

  const handleSelectKey = async () => {
     if ((window as any).aistudio && (window as any).aistudio.openSelectKey) {
        await (window as any).aistudio.openSelectKey();
        setHasKey(true);
     }
  }

  const handleSaveCustomKey = () => {
      if (!tempApiKey.trim()) return;
      localStorage.setItem('dora_api_key', tempApiKey.trim());
      setCustomApiKey(tempApiKey.trim());
      setHasKey(true);
      setTempApiKey("");
      setShowSettings(false);
      alert("Đã lưu API Key mới!");
  };

  const getEffectiveKey = () => {
      return customApiKey || process.env.API_KEY;
  };

  const getCharacterDescription = () => {
     return `${character.name} là một ${character.gender} với ${character.bodyType}, ${character.eyeStyle}. Có mái tóc ${character.hairStyle} màu ${character.hairColor}. Mặc ${character.outfitStyle} màu ${character.outfitColor}. Phụ kiện: ${character.accessory}.`;
  };

  const generateScript = async () => {
    const apiKey = getEffectiveKey();
    if (!apiKey) {
      setError("API Key chưa được cấu hình.");
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey });
      
      const charDescription = getCharacterDescription();

      const sideCharPrompt = sideCharacters.length > 0 
        ? "Nhân vật phụ có thể xuất hiện: " + sideCharacters.map(c => `${c.name} (${c.description})`).join(", ")
        : "Không có nhân vật phụ.";

      const prompt = `
        Hãy viết kịch bản truyện tranh ${storyLength} khung phong cách Doraemon.
        
        Nhân vật chính: ${charDescription}
        ${sideCharPrompt}
        
        Cốt truyện: ${storyTopic}
        
        Yêu cầu output JSON với cấu trúc:
        [
          {
            "panelNumber": 1,
            "description": "Mô tả chi tiết hình ảnh cho AI vẽ (tiếng Anh). Đảm bảo miêu tả đúng đặc điểm nhân vật: ${character.hairStyle} màu ${character.hairColor}, ${character.outfitStyle} màu ${character.outfitColor}.",
            "dialogue_character": "Tên nhân vật nói",
            "dialogue_text": "Lời thoại ngắn gọn (Tiếng Việt)",
            "visual_prompt": "Prompt chi tiết để vẽ hình ảnh phong cách anime 90s, Doraemon style, flat color, thick lines (Tiếng Anh). Chú ý: ${character.bodyType}, ${character.eyeStyle}."
          }
        ]
        
        Đảm bảo nội dung hài hước, dễ thương, phù hợp trẻ em. Lời thoại ngắn để dễ đọc. 
        Nếu có nhân vật phụ xuất hiện, hãy thêm họ vào visual_prompt.
      `;

      const response = await ai.models.generateContent({
        model: SCRIPT_MODEL,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                panelNumber: { type: Type.INTEGER },
                description: { type: Type.STRING },
                dialogue_character: { type: Type.STRING },
                dialogue_text: { type: Type.STRING },
                visual_prompt: { type: Type.STRING }
              },
              required: ["panelNumber", "description", "dialogue_text", "visual_prompt"]
            }
          }
        }
      });

      if (response.text) {
        const parsedScript = JSON.parse(response.text);
        const scriptWithPositions = parsedScript.map((p: any) => {
          const detectedSideChars = sideCharacters
            .filter(sc => p.description.toLowerCase().includes(sc.name.toLowerCase()) || p.visual_prompt.toLowerCase().includes(sc.name.toLowerCase()))
            .map(sc => sc.id);

          return {
            ...p,
            bubblePosition: { x: 50, y: 80 },
            thoughtBubblePosition: { x: 70, y: 20 }, 
            showMainCharacter: true,
            additionalCharacters: detectedSideChars,
            thought_text: "",
            stickers: []
          };
        });
        setScript(scriptWithPositions);
        setStep(2);
      }
    } catch (err: any) {
      setError("Lỗi tạo kịch bản: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const generatePanelImage = async (panelIndex: number) => {
    const panel = script[panelIndex];
    if (!panel) return;
    const apiKey = getEffectiveKey();

    setScript(prev => {
        const copy = [...prev];
        copy[panelIndex] = { ...copy[panelIndex], isGeneratingImage: true };
        return copy;
    });

    try {
      const ai = new GoogleGenAI({ apiKey: apiKey! });
      
      const mainCharVisual = `Main character is a cute anime style kid, ${character.gender}.
      Body: ${character.bodyType}.
      Face: ${character.eyeStyle}.
      Hair: ${character.hairColor} color, ${character.hairStyle}.
      Outfit: ${character.outfitColor} color, ${character.outfitStyle}.
      Accessory: ${character.accessory}.`;

      const charactersInSceneDetails = [];
      
      if (panel.showMainCharacter) {
        charactersInSceneDetails.push(`MAIN CHARACTER (${character.name}): ${mainCharVisual}`);
      }

      if (panel.additionalCharacters && panel.additionalCharacters.length > 0) {
        panel.additionalCharacters.forEach(id => {
          const sc = sideCharacters.find(c => c.id === id);
          if (sc) {
            charactersInSceneDetails.push(`SIDE CHARACTER (${sc.name}): ${sc.description}`);
          }
        });
      }
      
      const charactersPrompt = charactersInSceneDetails.length > 0 
        ? `CHARACTERS PRESENT IN SCENE:\n${charactersInSceneDetails.join("\n")}` 
        : "NO CHARACTERS IN SCENE, BACKGROUND ONLY.";

      const fullPrompt = `Fujiko F. Fujio art style, Doraemon anime style, 1990s anime screenshot, cel shaded. 
      ${charactersPrompt}
      Scene Action & Setting: ${panel.visual_prompt}. 
      High quality, clean lines, flat colors, bright atmosphere, no text bubbles in image. Aspect ratio 4:3.`;

      const response = await ai.models.generateContent({
        model: GENERATION_MODEL,
        contents: {
          parts: [{ text: fullPrompt }]
        },
        config: {
          imageConfig: {
             aspectRatio: "4:3",
             imageSize: "1K"
          }
        }
      });

      let imageUrl = "";
      for (const part of response.candidates?.[0]?.content?.parts || []) {
         if (part.inlineData) {
            imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            break;
         }
      }

      setScript(prev => {
        const copy = [...prev];
        copy[panelIndex] = { 
            ...copy[panelIndex], 
            imageUrl: imageUrl, 
            isGeneratingImage: false 
        };
        return copy;
      });

    } catch (err: any) {
      console.error(err);
      setScript(prev => {
        const copy = [...prev];
        copy[panelIndex] = { ...copy[panelIndex], isGeneratingImage: false };
        return copy;
      });
      alert(`Không thể tạo ảnh cho khung ${panelIndex + 1}`);
    }
  };

  const generateAllImages = async () => {
    setLoading(true);
    setStep(3);
    await Promise.all(script.map((_, idx) => generatePanelImage(idx)));
    setLoading(false);
  };

  const handleUpdateBubblePosition = (index: number, type: 'speech' | 'thought', x: number, y: number) => {
      setScript(prev => {
          const copy = [...prev];
          if (type === 'speech') {
             copy[index] = { ...copy[index], bubblePosition: { x, y } };
          } else {
             copy[index] = { ...copy[index], thoughtBubblePosition: { x, y } };
          }
          return copy;
      });
  };

  // --- Sticker Logic ---

  const handleAddSticker = (type: 'emoji' | 'image', content: string) => {
      const targetPanelIdx = script.findIndex(p => p.imageUrl);
      if (targetPanelIdx === -1) return;

      const newSticker: StickerData = {
          id: Date.now().toString() + Math.random(),
          type,
          content,
          x: 50,
          y: 50,
          scale: 1
      };

      setScript(prev => {
          const copy = [...prev];
          const panel = copy[targetPanelIdx];
          copy[targetPanelIdx] = { ...panel, stickers: [...(panel.stickers || []), newSticker] };
          return copy;
      });
      
      const toast = document.createElement('div');
      toast.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/70 text-white px-4 py-2 rounded-lg pointer-events-none z-50';
      toast.innerText = `Đã thêm vào Khung ${targetPanelIdx + 1}. Kéo để di chuyển!`;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 1500);
  };

  const handleUpdateSticker = (panelIdx: number, stickerId: string, pos: {x: number, y: number}, scale: number) => {
      setScript(prev => {
          const copy = [...prev];
          const panel = copy[panelIdx];
          const stickers = panel.stickers.map(s => s.id === stickerId ? { ...s, x: pos.x, y: pos.y, scale } : s);
          copy[panelIdx] = { ...panel, stickers };
          return copy;
      });
  };

  const handleDeleteSticker = (panelIdx: number, stickerId: string) => {
      setScript(prev => {
          const copy = [...prev];
          const panel = copy[panelIdx];
          copy[panelIdx] = { ...panel, stickers: panel.stickers.filter(s => s.id !== stickerId) };
          return copy;
      });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
          const result = ev.target?.result as string;
          handleAddSticker('image', result);
      };
      reader.readAsDataURL(file);
  };

  // --- Step 2 Logic ---

  const handleToggleSideChar = (panelIdx: number, charId: string) => {
      setScript(prev => {
          const copy = [...prev];
          const currentList = copy[panelIdx].additionalCharacters || [];
          if (currentList.includes(charId)) {
             copy[panelIdx].additionalCharacters = currentList.filter(id => id !== charId);
          } else {
             copy[panelIdx].additionalCharacters = [...currentList, charId];
          }
          return copy;
      });
  };

  const handleToggleMainChar = (idx: number) => {
     setScript(prev => {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], showMainCharacter: !copy[idx].showMainCharacter };
        return copy;
     });
  };

  const handleUpdatePrompt = (idx: number, newPrompt: string) => {
     setScript(prev => {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], visual_prompt: newPrompt };
        return copy;
     });
  };

  const handleUpdateDialogue = (idx: number, field: 'dialogue_text' | 'dialogue_character' | 'thought_text', val: string) => {
    setScript(prev => {
       const copy = [...prev];
       copy[idx] = { ...copy[idx], [field]: val };
       return copy;
    });
 };

 // --- Side Character Logic ---
 const addSideCharacter = () => {
   if (!newSideCharName.trim()) return;
   const newChar: SideCharacter = {
     id: Date.now().toString(),
     name: newSideCharName,
     description: newSideCharDesc || "No special description"
   };
   setSideCharacters([...sideCharacters, newChar]);
   setNewSideCharName("");
   setNewSideCharDesc("");
 };

 const removeSideCharacter = (id: string) => {
   setSideCharacters(sideCharacters.filter(c => c.id !== id));
 };

 // --- Save/Load Logic ---
 const handleSaveStory = () => {
   const storyData = {
     character,
     sideCharacters,
     storyLength,
     storyTopic,
     script,
     step,
     timestamp: new Date().toISOString()
   };
   localStorage.setItem('dora_comic_save', JSON.stringify(storyData));
   
   const toast = document.createElement('div');
   toast.className = 'fixed top-24 right-6 bg-green-500 text-white px-6 py-3 rounded-xl shadow-2xl z-50 animate-bounce flex items-center gap-2 font-bold';
   toast.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg> Đã lưu truyện!';
   document.body.appendChild(toast);
   setTimeout(() => toast.remove(), 2500);
 };

 const handleLoadStory = () => {
    const saved = localStorage.getItem('dora_comic_save');
    if (!saved) {
      alert("Chưa có truyện nào được lưu!");
      return;
    }
    if (window.confirm("Tải lại truyện đã lưu? Dữ liệu hiện tại sẽ bị thay thế.")) {
       try {
         const data = JSON.parse(saved);
         setCharacter(data.character);
         setSideCharacters(data.sideCharacters || []);
         setStoryLength(data.storyLength || 4);
         setStoryTopic(data.storyTopic || "");
         setScript(data.script || []);
         setStep(data.step || 1);
       } catch(e) {
         console.error("Load error", e);
         alert("File lưu bị lỗi, không thể tải.");
       }
    }
 };

  // --- Render Steps ---

  const renderStep1 = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
      <div className="space-y-6">
        <Card title="1. Thiết Kế Nhân Vật Chính" icon={User}>
          <div className="space-y-6">
            {/* --- Identity --- */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-2">Tên</label>
                <input 
                  value={character.name}
                  onChange={(e) => setCharacter({...character, name: e.target.value})}
                  className="w-full border-2 border-blue-200 rounded-lg p-2 focus:border-[#0096e7] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-2">Giới tính</label>
                <select 
                  value={character.gender}
                  onChange={(e) => setCharacter({...character, gender: e.target.value})}
                  className="w-full border-2 border-blue-200 rounded-lg p-2 focus:border-[#0096e7] outline-none"
                >
                  <option value="bé trai">Bé trai</option>
                  <option value="bé gái">Bé gái</option>
                  <option value="chú mèo máy">Mèo máy</option>
                </select>
              </div>
            </div>

             {/* --- Physical --- */}
            <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-2">Dáng người</label>
                <select 
                  value={character.bodyType}
                  onChange={(e) => setCharacter({...character, bodyType: e.target.value})}
                  className="w-full border-2 border-blue-200 rounded-lg p-2 focus:border-[#0096e7] outline-none"
                >
                  <option value="dáng người trung bình">Trung bình (Nobita)</option>
                  <option value="dáng người mập mạp, to lớn">Mập mạp (Chaien)</option>
                  <option value="dáng người thấp bé, gầy">Thấp bé (Xeko)</option>
                  <option value="dáng người cao ráo">Cao ráo</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-2">Khuôn mặt / Mắt</label>
                <select 
                  value={character.eyeStyle}
                  onChange={(e) => setCharacter({...character, eyeStyle: e.target.value})}
                  className="w-full border-2 border-blue-200 rounded-lg p-2 focus:border-[#0096e7] outline-none"
                >
                  <option value="mắt to tròn (regular big eyes)">Mắt to tròn</option>
                  <option value="mắt dấu chấm (dot eyes)">Mắt hạt đậu (số 3)</option>
                  <option value="mắt đeo kính cận to (big round glasses)">Đeo kính cận</option>
                  <option value="mắt sắc sảo, lông mi dài (sharp eyes)">Mắt sắc sảo</option>
                  <option value="mắt híp (closed happy eyes)">Mắt híp cười</option>
                </select>
              </div>
            </div>

            {/* --- Hair --- */}
            <div className="border-t border-gray-100 pt-4 space-y-4">
               <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-600 mb-2">Kiểu tóc</label>
                    <select 
                      value={character.hairStyle}
                      onChange={(e) => setCharacter({...character, hairStyle: e.target.value})}
                      className="w-full border-2 border-blue-200 rounded-lg p-2 focus:border-[#0096e7] outline-none"
                    >
                      <option value="tóc chôm chôm (spiky messy hair)">Tóc chôm chôm (Nobita)</option>
                      <option value="tóc ngắn gọn gàng (neat short hair)">Tóc ngắn gọn gàng (Dekisugi)</option>
                      <option value="tóc dài hai bím (pigtails)">Tóc hai bím (Shizuka)</option>
                      <option value="tóc nhọn mỏ vịt (ducktail hair)">Tóc mỏ vịt (Xeko)</option>
                      <option value="đầu trọc (bald)">Đầu trọc</option>
                      <option value="tóc ngắn bob (bob cut)">Tóc Bob ngắn</option>
                      <option value="tóc dài xõa vai (long straight hair)">Tóc dài xõa</option>
                      <option value="tóc xoăn (curly hair)">Tóc xoăn</option>
                    </select>
                  </div>
                  <ColorPicker 
                    label="Màu tóc" 
                    color={character.hairColor} 
                    onChange={(c) => setCharacter({...character, hairColor: c})} 
                  />
               </div>
            </div>
            
             {/* --- Outfit --- */}
            <div className="border-t border-gray-100 pt-4 space-y-4">
               <div>
                  <label className="block text-sm font-bold text-gray-600 mb-2">Trang phục</label>
                  <select 
                      value={character.outfitStyle}
                      onChange={(e) => setCharacter({...character, outfitStyle: e.target.value})}
                      className="w-full border-2 border-blue-200 rounded-lg p-2 focus:border-[#0096e7] outline-none"
                    >
                      <option value="áo thun và quần soóc (t-shirt and shorts)">Áo thun & Quần soóc</option>
                      <option value="áo sơ mi và quần yếm (shirt and overalls)">Quần yếm</option>
                      <option value="váy liền thân dễ thương (cute one-piece dress)">Váy liền thân</option>
                      <option value="đồng phục học sinh nhật bản (school uniform)">Đồng phục học sinh</option>
                      <option value="áo hoodie và quần dài (hoodie and pants)">Áo Hoodie</option>
                      <option value="bộ đồ ngủ pijama (pajamas)">Đồ ngủ Pijama</option>
                      <option value="trang phục thám hiểm (explorer outfit)">Đồ thám hiểm</option>
                    </select>
               </div>
               
               <ColorPicker 
                  label="Màu trang phục chủ đạo" 
                  color={character.outfitColor} 
                  onChange={(c) => setCharacter({...character, outfitColor: c})} 
                />

                <div className="pt-2">
                  <label className="block text-sm font-bold text-gray-600 mb-2">Phụ kiện thêm</label>
                  <select 
                      value={character.accessory}
                      onChange={(e) => setCharacter({...character, accessory: e.target.value})}
                      className="w-full border-2 border-blue-200 rounded-lg p-2 focus:border-[#0096e7] outline-none"
                    >
                      <option value="không có (none)">Không có</option>
                      <option value="túi thần kỳ trước bụng (magic pocket)">Túi thần kỳ</option>
                      <option value="mũ lưỡi trai đội ngược (backward baseball cap)">Mũ lưỡi trai</option>
                      <option value="cặp sách học sinh (school randoseru backpack)">Cặp sách Randoseru</option>
                      <option value="chong chóng tre trên đầu (bamboo copter)">Chong chóng tre</option>
                      <option value="khăn quàng cổ (scarf)">Khăn quàng cổ</option>
                      <option value="nơ cài tóc (hair bow)">Nơ cài tóc</option>
                      <option value="kính râm (sunglasses)">Kính râm</option>
                    </select>
                </div>
            </div>

          </div>
        </Card>

        {/* Side Characters Management */}
        <Card title="Nhân vật phụ (Side Characters)" icon={Users}>
          <div className="space-y-4">
             <div className="text-sm text-gray-500 mb-2">Thêm nhân vật phụ để đưa vào truyện (ví dụ: Mẹ, Bạn thân, Mèo máy...)</div>
             
             {/* List of existing side characters */}
             {sideCharacters.map((char) => (
               <div key={char.id} className="flex items-start justify-between bg-blue-50 p-3 rounded-lg border border-blue-100">
                  <div className="flex-1">
                     <div className="font-bold text-[#0096e7]">{char.name}</div>
                     <div className="text-xs text-gray-600 line-clamp-2">{char.description}</div>
                  </div>
                  <button 
                    onClick={() => removeSideCharacter(char.id)}
                    className="text-red-400 hover:text-red-600 p-1"
                  >
                    <Trash2 size={16}/>
                  </button>
               </div>
             ))}

             {/* Add New Side Character Form */}
             <div className="border-t border-gray-100 pt-3 mt-3">
                <div className="flex gap-2 mb-2">
                   <input 
                     placeholder="Tên (VD: Mẹ Nobita)" 
                     value={newSideCharName}
                     onChange={(e) => setNewSideCharName(e.target.value)}
                     className="flex-1 text-sm border-2 border-gray-200 rounded-lg p-2 focus:border-[#0096e7] outline-none"
                   />
                </div>

                {/* Intelligent Description Suggestion */}
                {matchingPreset && !newSideCharDesc && (
                  <div 
                    onClick={() => setNewSideCharDesc(matchingPreset.description)}
                    className="flex items-center gap-2 text-xs text-green-600 bg-green-50 p-2 rounded mb-2 cursor-pointer hover:bg-green-100 border border-green-200"
                  >
                    <Lightbulb size={12} />
                    <span>Gợi ý mô tả: <b>{matchingPreset.description}</b> (Nhấn để dùng)</span>
                  </div>
                )}

                <div className="flex gap-2">
                   <input 
                     placeholder="Mô tả ngoại hình (VD: đeo kính, tạp dề hồng)" 
                     value={newSideCharDesc}
                     onChange={(e) => setNewSideCharDesc(e.target.value)}
                     className="flex-1 text-sm border-2 border-gray-200 rounded-lg p-2 focus:border-[#0096e7] outline-none"
                   />
                   <button 
                     onClick={addSideCharacter}
                     disabled={!newSideCharName.trim()}
                     className="bg-[#0096e7] text-white rounded-lg px-4 hover:bg-blue-600 disabled:opacity-50"
                   >
                     <Plus size={20}/>
                   </button>
                </div>
                
                {/* Quick Add Presets */}
                <div className="mt-3">
                  <p className="text-xs text-gray-400 font-bold mb-1">Gợi ý nhanh:</p>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_SIDE_CHARACTERS.map(preset => (
                      <button
                        key={preset.name}
                        onClick={() => {
                          setNewSideCharName(preset.name);
                          setNewSideCharDesc(preset.description);
                        }}
                        className="text-xs bg-white border border-blue-200 text-blue-600 px-2 py-1 rounded-full hover:bg-blue-50 transition-colors"
                      >
                        + {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

             </div>
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        <Card title="2. Cấu hình Truyện" icon={Settings}>
           <div className="mb-4">
              <label className="block text-sm font-bold text-gray-600 mb-2">Độ dài truyện</label>
              <div className="flex gap-4">
                 <button 
                   onClick={() => setStoryLength(4)}
                   className={`flex-1 py-3 px-4 rounded-xl border-2 font-bold text-sm transition-all ${storyLength === 4 ? 'border-[#0096e7] bg-blue-50 text-[#0096e7]' : 'border-gray-200 text-gray-500 hover:border-blue-300'}`}
                 >
                   📄 1 Trang (4 khung)
                 </button>
                 <button 
                   onClick={() => setStoryLength(8)}
                   className={`flex-1 py-3 px-4 rounded-xl border-2 font-bold text-sm transition-all ${storyLength === 8 ? 'border-[#0096e7] bg-blue-50 text-[#0096e7]' : 'border-gray-200 text-gray-500 hover:border-blue-300'}`}
                 >
                   📄📄 2 Trang (8 khung)
                 </button>
              </div>
           </div>

           <div>
              <label className="block text-sm font-bold text-gray-600 mb-2 flex items-center gap-2">
                <Sparkles size={16} className="text-[#0096e7]" />
                Ý Tưởng Câu Chuyện
              </label>
              <textarea 
                value={storyTopic}
                onChange={(e) => setStoryTopic(e.target.value)}
                className="w-full h-40 border-2 border-blue-200 rounded-xl p-4 focus:border-[#0096e7] outline-none resize-none comic-font text-xl"
                placeholder="Nhập ý tưởng câu chuyện của bạn ở đây..."
              />
           </div>

          <div className="mt-4 flex justify-end">
             <Button onClick={generateScript} disabled={loading} variant="primary">
               {loading ? "Đang suy nghĩ..." : "Tạo Kịch Bản Truyện →"}
             </Button>
          </div>
        </Card>

        {/* Character Preview Summary (Text) */}
        <div className="bg-white rounded-2xl p-6 border-2 border-blue-100 opacity-90 shadow-sm">
           <h3 className="font-bold text-gray-500 mb-2 uppercase text-xs tracking-wider">Tóm tắt nhân vật chính</h3>
           <p className="text-gray-700 italic text-sm border-l-4 border-blue-400 pl-3">
             "{character.name} là {character.gender}, {character.bodyType}. {character.hairStyle} màu <span style={{color: character.hairColor, fontWeight: 'bold'}}>này</span>. Mặc {character.outfitStyle} màu <span style={{color: character.outfitColor, fontWeight: 'bold'}}>này</span>."
           </p>
        </div>

        <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100 opacity-80">
          <h3 className="font-bold text-[#0096e7] mb-2 flex items-center gap-2">
            <BookOpen size={20}/> Gợi ý chủ đề:
          </h3>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
            <li>Đi học muộn vì gặp người ngoài hành tinh.</li>
            <li>Bảo bối thần kỳ biến đồ vật thành sô-cô-la.</li>
            <li>Chuyến phiêu lưu vào thời tiền sử.</li>
          </ul>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6 sticky top-0 z-40 bg-[#f0f8ff] py-4">
        <h2 className="text-3xl font-bold text-[#0096e7] flex items-center gap-2">
          <Layout /> Chỉnh Sửa Kịch Bản ({script.length} khung)
        </h2>
        <div className="flex gap-2">
          <Button onClick={() => setStep(1)} variant="secondary">Quay lại</Button>
          <Button onClick={generateAllImages} variant="success">Vẽ Truyện Ngay!</Button>
        </div>
      </div>

      <div className="space-y-6 pb-20">
        {script.map((panel, idx) => (
          <div key={idx} className="bg-white p-6 rounded-xl shadow-md border-l-8 border-[#0096e7] flex flex-col md:flex-row gap-6">
            
            {/* Left: Metadata & Prompt */}
            <div className="flex-1 space-y-4">
               <div className="flex items-center gap-2 mb-2">
                 <div className="bg-blue-100 w-8 h-8 rounded-full flex items-center justify-center font-bold text-[#0096e7]">
                   {idx + 1}
                 </div>
                 <h4 className="font-bold text-lg text-gray-800">Nội dung khung tranh</h4>
               </div>
               
               <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1">
                     <MessageCircle size={12} /> Lời thoại
                  </label>
                  <div className="flex gap-2 mb-2">
                     <input 
                        value={panel.dialogue_character}
                        onChange={(e) => handleUpdateDialogue(idx, 'dialogue_character', e.target.value)}
                        className="w-1/3 border border-gray-300 rounded px-2 py-1 text-sm font-bold text-[#0096e7]"
                        placeholder="Tên NV"
                     />
                     <input 
                        value={panel.dialogue_text}
                        onChange={(e) => handleUpdateDialogue(idx, 'dialogue_text', e.target.value)}
                        className="w-2/3 border border-gray-300 rounded px-2 py-1 text-sm"
                        placeholder="Nội dung thoại..."
                     />
                  </div>
               </div>

               <div>
                   <label className="text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1">
                     <Cloud size={12} /> Suy nghĩ (Tùy chọn)
                   </label>
                   <input 
                        value={panel.thought_text || ''}
                        onChange={(e) => handleUpdateDialogue(idx, 'thought_text', e.target.value)}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm italic text-gray-600"
                        placeholder="Suy nghĩ trong đầu nhân vật..."
                   />
               </div>

               <div>
                 <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Mô tả hành động (Prompt)</label>
                 <textarea 
                   value={panel.visual_prompt}
                   onChange={(e) => handleUpdatePrompt(idx, e.target.value)}
                   className="w-full border border-gray-300 rounded-lg p-2 text-sm text-gray-700 h-24 focus:border-blue-400 outline-none resize-none font-mono bg-gray-50"
                 />
               </div>
            </div>

            {/* Right: Character Management */}
            <div className="md:w-64 bg-blue-50 rounded-lg p-4 h-fit border border-blue-100">
               <h5 className="font-bold text-gray-700 mb-3 flex items-center gap-2 text-sm border-b border-blue-200 pb-2">
                 <Users size={16} /> Ai xuất hiện trong khung này?
               </h5>
               
               <div className="space-y-2">
                 {/* Main Character Toggle */}
                 <label className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${panel.showMainCharacter ? 'bg-white shadow-sm ring-1 ring-blue-200' : 'hover:bg-blue-100'}`}>
                    <input 
                      type="checkbox"
                      checked={panel.showMainCharacter}
                      onChange={() => handleToggleMainChar(idx)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className={`text-sm ${panel.showMainCharacter ? 'font-bold text-gray-800' : 'text-gray-500'}`}>
                      {character.name} (Main)
                    </span>
                 </label>

                 {/* Side Characters Toggle List */}
                 {sideCharacters.length > 0 ? (
                    sideCharacters.map(sc => (
                      <label key={sc.id} className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${panel.additionalCharacters?.includes(sc.id) ? 'bg-white shadow-sm ring-1 ring-blue-200' : 'hover:bg-blue-100'}`}>
                        <input 
                          type="checkbox"
                          checked={panel.additionalCharacters?.includes(sc.id)}
                          onChange={() => handleToggleSideChar(idx, sc.id)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className={`text-sm ${panel.additionalCharacters?.includes(sc.id) ? 'font-bold text-gray-800' : 'text-gray-500'}`}>
                          {sc.name}
                        </span>
                      </label>
                    ))
                 ) : (
                    <div className="text-xs text-gray-400 italic px-2">Không có nhân vật phụ (Thêm ở Bước 1)</div>
                 )}
               </div>
            </div>
            
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep3 = () => {
    // Chunk the script into pages based on panelsPerPage
    const pages = [];
    for (let i = 0; i < script.length; i += panelsPerPage) {
      pages.push(script.slice(i, i + panelsPerPage).map((p, offset) => ({ panel: p, globalIndex: i + offset })));
    }

    return (
      <div className="flex flex-col md:flex-row gap-6 max-w-7xl mx-auto pb-20 px-4">
        {/* --- Main Comic Strip --- */}
        <div className="flex-1">
          <div className="flex justify-between items-center mb-8 sticky top-4 z-40 bg-white/90 backdrop-blur p-4 rounded-full shadow-lg border border-blue-100 print:hidden">
            <h2 className="text-2xl font-bold text-[#0096e7] ml-4">Chỉnh sửa & Xuất bản</h2>
            
            <div className="flex items-center gap-4">
              <div className="hidden lg:flex items-center gap-2 bg-gray-100 rounded-full px-2 py-1">
                  <span className="text-xs font-bold text-gray-500 ml-2">Số khung/trang:</span>
                  {[2, 3, 4].map(num => (
                    <button
                      key={num}
                      onClick={() => setPanelsPerPage(num as any)}
                      className={`w-8 h-8 rounded-full text-sm font-bold flex items-center justify-center transition-all ${panelsPerPage === num ? 'bg-white text-[#0096e7] shadow-md scale-110' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      {num}
                    </button>
                  ))}
              </div>

              <div className="flex gap-2">
                <Button onClick={() => setStep(2)} variant="secondary">Quay lại</Button>
                <Button onClick={() => window.print()} variant="primary"><Download size={18} /> Xuất PDF</Button>
              </div>
            </div>
          </div>

          <div id="comic-strip">
             {/* Title Page / Header */}
            <div 
              className="p-8 rounded-sm shadow-2xl mb-8 border-2 border-gray-100 print:border-0 print:shadow-none print:mb-4"
              style={{ backgroundColor: comicBackgroundColor }}
            >
               <h1 className="text-5xl font-black text-center mb-4 uppercase tracking-tight text-[#0096e7] comic-font print:text-black">
                {storyTopic.length > 40 ? storyTopic.slice(0, 40) + '...' : storyTopic}
               </h1>
            </div>

            {/* Pages Render Loop */}
            {pages.map((pagePanels, pageIdx) => (
              <div 
                key={pageIdx} 
                className={`
                  p-8 rounded-sm shadow-2xl border-2 border-gray-100 mb-8 
                  print:shadow-none print:border-0 print:p-0 print:m-0 print:w-full print:mb-0
                  relative
                `}
                style={{ 
                  breakAfter: pageIdx < pages.length - 1 ? 'page' : 'auto',
                  backgroundColor: comicBackgroundColor
                }}
              >
                 <div className="grid grid-cols-1 gap-12 print:gap-8">
                    {pagePanels.map(({ panel, globalIndex }) => (
                      <PanelItem 
                        key={globalIndex}
                        panel={panel}
                        idx={globalIndex}
                        onUpdateBubblePosition={handleUpdateBubblePosition}
                        onRegenerateImage={generatePanelImage}
                        onUpdateSticker={handleUpdateSticker}
                        onDeleteSticker={handleDeleteSticker}
                      />
                    ))}
                 </div>
                 
                 {/* Page Footer */}
                 <div className="mt-8 text-center text-gray-400 font-mono text-xs border-t pt-4 print:mt-4 print:pt-2">
                    Trang {pageIdx + 1} / {pages.length} • DoraMaker AI
                 </div>
              </div>
            ))}
          </div>
        </div>

        {/* --- Floating Editor Toolkit (Sticky on Desktop) --- */}
        <div className="md:w-80 print:hidden">
          <div className="bg-white rounded-2xl shadow-xl border border-blue-100 sticky top-4 overflow-hidden">
            <div className="bg-[#0096e7] p-3 text-white font-bold flex items-center gap-2">
              <Settings size={20} /> Công cụ biên tập
            </div>
            
            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              <button 
                onClick={() => setActiveEditorTab('gadgets')}
                className={`flex-1 py-3 text-sm font-bold ${activeEditorTab === 'gadgets' ? 'text-[#0096e7] border-b-2 border-[#0096e7]' : 'text-gray-500'}`}
              >
                Bảo bối
              </button>
              <button 
                onClick={() => setActiveEditorTab('effects')}
                className={`flex-1 py-3 text-sm font-bold ${activeEditorTab === 'effects' ? 'text-[#0096e7] border-b-2 border-[#0096e7]' : 'text-gray-500'}`}
              >
                Hiệu ứng
              </button>
              <button 
                onClick={() => setActiveEditorTab('upload')}
                className={`flex-1 py-3 text-sm font-bold ${activeEditorTab === 'upload' ? 'text-[#0096e7] border-b-2 border-[#0096e7]' : 'text-gray-500'}`}
              >
                Tải ảnh
              </button>
              <button 
                onClick={() => setActiveEditorTab('style')}
                className={`flex-1 py-3 text-sm font-bold ${activeEditorTab === 'style' ? 'text-[#0096e7] border-b-2 border-[#0096e7]' : 'text-gray-500'}`}
              >
                Màu nền
              </button>
            </div>

            <div className="p-4 h-[calc(100vh-200px)] overflow-y-auto">
              {activeEditorTab === 'gadgets' && (
                <div className="grid grid-cols-2 gap-3">
                  {GADGETS.map((gadget, i) => (
                      <button 
                        key={i}
                        onClick={() => handleAddSticker('emoji', gadget.icon)}
                        className="flex flex-col items-center justify-center bg-blue-50 hover:bg-blue-100 p-3 rounded-lg border border-blue-100 transition-colors"
                      >
                        <span className="text-3xl mb-1">{gadget.icon}</span>
                        <span className="text-xs text-center font-bold text-gray-700">{gadget.name}</span>
                      </button>
                  ))}
                </div>
              )}

              {activeEditorTab === 'effects' && (
                <div className="grid grid-cols-3 gap-3">
                  {EFFECTS.map((effect, i) => (
                      <button 
                        key={i}
                        onClick={() => handleAddSticker('emoji', effect.icon)}
                        className="flex flex-col items-center justify-center bg-yellow-50 hover:bg-yellow-100 p-2 rounded-lg border border-yellow-100 transition-colors"
                        title={effect.name}
                      >
                        <span className="text-3xl">{effect.icon}</span>
                      </button>
                  ))}
                </div>
              )}

              {activeEditorTab === 'upload' && (
                  <div className="text-center space-y-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:bg-gray-50 transition-colors">
                        <Upload className="mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500 mb-4">Tải lên ảnh nhân vật hoặc vật phẩm (PNG trong suốt)</p>
                        <label className="bg-[#0096e7] text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-600 font-bold text-sm inline-block">
                          Chọn file
                          <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                        </label>
                    </div>
                    
                    <div className="text-xs text-left bg-gray-50 p-3 rounded border border-gray-200">
                        <strong className="block mb-1 text-gray-700"><MousePointer2 size={12} className="inline"/> Hướng dẫn:</strong>
                        <ul className="list-disc list-inside space-y-1 text-gray-600">
                          <li>Kéo thả icon để di chuyển.</li>
                          <li>Lăn chuột để phóng to/thu nhỏ.</li>
                          <li>Click đúp để xóa.</li>
                        </ul>
                    </div>
                  </div>
              )}

              {activeEditorTab === 'style' && (
                  <div className="text-center space-y-4">
                     <p className="text-sm text-gray-500 mb-4">Thay đổi màu nền cho trang truyện tranh của bạn.</p>
                     <ColorPicker 
                        label="Màu nền truyện" 
                        color={comicBackgroundColor} 
                        onChange={setComicBackgroundColor} 
                     />
                  </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isCheckingKey) {
    return <div className="min-h-screen flex items-center justify-center bg-[#f0f8ff]"><RefreshCw className="animate-spin text-[#0096e7]" size={48}/></div>;
  }

  if (!hasKey) {
     return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#f0f8ff] p-4 text-center font-fredoka">
           <div className="w-24 h-24 bg-[#0096e7] rounded-full flex items-center justify-center text-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6 animate-bounce">
               <span className="font-black text-5xl">D</span>
           </div>
           <h1 className="text-5xl font-black text-[#0096e7] mb-4 comic-font">DoraMaker AI</h1>
           <p className="text-xl text-gray-600 mb-8 max-w-md">
             Chào mừng bạn đến với công cụ tạo truyện tranh phong cách Doraemon! Vui lòng kết nối API Key để bắt đầu sáng tạo.
           </p>
           <Button onClick={handleSelectKey} variant="primary" size="normal" className="text-xl px-8 py-4">
              <Key size={24} /> Kết nối API Key
           </Button>
           
           <div className="mt-8 border-t border-blue-200 pt-4 w-full max-w-sm">
              <p className="text-xs text-gray-500 mb-2">Hoặc nhập tay nếu bạn đã có:</p>
              <div className="flex gap-2">
                 <input 
                    type="password"
                    value={tempApiKey} 
                    onChange={e => setTempApiKey(e.target.value)} 
                    placeholder="Dán API Key của bạn vào đây (sk-...)"
                    className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm outline-none focus:border-blue-500"
                 />
                 <button onClick={handleSaveCustomKey} className="text-xs bg-blue-100 text-blue-600 px-3 py-1 rounded font-bold hover:bg-blue-200">
                    Lưu
                 </button>
              </div>
           </div>

           <p className="mt-4 text-sm text-gray-400">
             Sử dụng Gemini API (Paid Plan) để tạo ảnh chất lượng cao.
           </p>
        </div>
     )
  }

  return (
    <div className="min-h-screen bg-[#f0f8ff] text-gray-800 font-fredoka">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-blue-100 sticky top-0 z-50 print:hidden">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#0096e7] rounded-full flex items-center justify-center text-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
               <span className="font-bold text-xl">D</span>
            </div>
            <h1 className="text-2xl font-black text-[#0096e7] tracking-tight comic-font">
              DoraMaker
            </h1>
          </div>
          <div className="flex gap-4 items-center">
            {/* Save / Load Buttons */}
            <button 
              onClick={handleSaveStory}
              className="flex items-center gap-1 text-gray-600 hover:text-[#0096e7] font-bold text-sm bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 hover:border-blue-200 transition-all"
              title="Lưu truyện vào trình duyệt"
            >
              <Save size={16} /> <span className="hidden sm:inline">Lưu</span>
            </button>
            
            <button 
              onClick={handleLoadStory}
              className="flex items-center gap-1 text-gray-600 hover:text-[#0096e7] font-bold text-sm bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 hover:border-blue-200 transition-all"
              title="Tải truyện đã lưu"
            >
              <FolderOpen size={16} /> <span className="hidden sm:inline">Tải</span>
            </button>

            <button 
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-1 text-gray-600 hover:text-[#0096e7] font-bold text-sm bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 hover:border-blue-200 transition-all"
              title="Cài đặt hệ thống"
            >
              <Settings size={16} /> <span className="hidden sm:inline">Cài đặt</span>
            </button>

            {step > 1 && (
               <div className="text-sm font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full hidden sm:block">
                 Bước {step}/3
               </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 print:p-0 relative">
        {showSettings && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border-2 border-blue-100">
                    <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                        <h2 className="text-2xl font-black text-[#0096e7] flex items-center gap-2">
                            <Settings className="w-6 h-6" /> Cài Đặt
                        </h2>
                        <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                            <h3 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
                                <Key size={18} className="text-[#0096e7]"/> Cấu hình API
                            </h3>
                            <p className="text-sm text-gray-500 mb-4">
                                Quản lý kết nối với Google Gemini API.
                            </p>
                            
                            <div className="space-y-3">
                                <Button onClick={() => { handleSelectKey(); setShowSettings(false); }} variant="secondary" className="w-full text-sm">
                                    Mở hộp thoại chọn Key (Google AI Studio)
                                </Button>
                                
                                <div className="text-center text-xs text-gray-400 my-2">- Hoặc nhập thủ công -</div>
                                
                                <div className="flex gap-2">
                                     <input 
                                        type="password"
                                        value={tempApiKey}
                                        onChange={e => setTempApiKey(e.target.value)}
                                        placeholder="Dán Key (sk-...)"
                                        className="flex-1 border border-blue-200 rounded px-3 py-2 text-sm outline-none focus:border-blue-500"
                                     />
                                     <Button onClick={handleSaveCustomKey} variant="primary" size="small">
                                         Lưu
                                     </Button>
                                </div>
                                {customApiKey && (
                                    <p className="text-xs text-green-600 font-bold mt-1">✓ Đang sử dụng Key tùy chỉnh</p>
                                )}
                            </div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <h3 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
                                 <Trash2 size={18} className="text-gray-500"/> Dữ liệu ứng dụng
                            </h3>
                             <p className="text-sm text-gray-500 mb-4">
                                Xóa toàn bộ dữ liệu truyện đang làm và các cài đặt nhân vật đã lưu trong trình duyệt.
                            </p>
                             <Button onClick={() => { 
                                if(window.confirm('Bạn có chắc muốn xóa toàn bộ dữ liệu đã lưu? Hành động này không thể hoàn tác.')) {
                                    localStorage.removeItem('dora_comic_save');
                                    localStorage.removeItem('dora_api_key');
                                    setCustomApiKey("");
                                    setStep(1);
                                    setScript([]);
                                    alert('Đã xóa dữ liệu và đặt lại ứng dụng.');
                                    setShowSettings(false);
                                    window.location.reload();
                                }
                            }} variant="danger" className="w-full">
                                Xóa bộ nhớ đệm
                            </Button>
                        </div>
                    </div>
                    
                    <div className="mt-6 text-center text-xs text-gray-400">
                        DoraMaker AI v1.1
                    </div>
                </div>
            </div>
        )}

        {error && (
          <div className="max-w-2xl mx-auto mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            <strong className="font-bold">Lỗi!</strong>
            <span className="block sm:inline"> {error}</span>
            <span className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={() => setError(null)}>
              <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
            </span>
          </div>
        )}

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </main>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);