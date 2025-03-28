import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { HabitColor, ColorScheme, getSchemeGradient, ColorOption } from "@/api/types/appTypes";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ScrollArea } from "./ui/scroll-area";

interface ColorPickerProps {
  value: HabitColor;
  onChange: (value: HabitColor) => void;
  onSchemeChange?: (scheme: ColorScheme) => void;
  selectedScheme?: ColorScheme;
  disabled?: boolean;
}

export function ColorPicker({ 
  value, 
  onChange, 
  onSchemeChange, 
  selectedScheme, 
  disabled 
}: ColorPickerProps) {
  const [activeTab, setActiveTab] = useState<string>("singleColor");
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // 添加点击外部关闭功能
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    // 如果下拉菜单打开，添加事件监听器
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    // 清理函数
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // 格式化颜色名称
  const formatColorName = (name: string): string => {
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };

  // 单色选项
  const singleColorOptions = Object.entries(HabitColor).map(([key, value]) => ({
    value: value,
    label: formatColorName(key),
  }));

  // 配色方案选项，按类别分组
  const schemeOptions = [
    {
      category: "Sequential (Single-Hue)",
      schemes: [
        ColorScheme.BLUES,
        ColorScheme.GREENS,
        ColorScheme.GREYS,
        ColorScheme.ORANGES,
        ColorScheme.PURPLES,
        ColorScheme.REDS,
      ]
    },
    {
      category: "Sequential (Multi-Hue)",
      schemes: [
        ColorScheme.BUGN,
        ColorScheme.BUPU,
        ColorScheme.GNBU,
        ColorScheme.ORRD,
        ColorScheme.PUBU,
        ColorScheme.PUBUGN,
        ColorScheme.PURD,
        ColorScheme.RDPU,
        ColorScheme.YLGNBU,
        ColorScheme.YLGN,
        ColorScheme.YLORBR,
        ColorScheme.YLORRD,
        ColorScheme.CIVIDIS,
        ColorScheme.VIRIDIS,
        ColorScheme.INFERNO,
        ColorScheme.MAGMA,
        ColorScheme.PLASMA,
        ColorScheme.WARM,
        ColorScheme.COOL,
        ColorScheme.CUBEHELIXDEFAULT,
        ColorScheme.TURBO,
      ]
    },
    {
      category: "Diverging",
      schemes: [
        ColorScheme.BRBG,
        ColorScheme.PRGN,
        ColorScheme.PIYG,
        ColorScheme.PUOR,
        ColorScheme.RDBU,
        ColorScheme.RDGY,
        ColorScheme.RDYLBU,
        ColorScheme.RDYLGN,
        ColorScheme.SPECTRAL,
      ]
    },
    {
      category: "Cyclical",
      schemes: [
        ColorScheme.RAINBOW,
        ColorScheme.SINEBOW,
      ]
    }
  ];

  // 切换颜色选择器面板显示状态
  const toggleColorPicker = () => {
    setIsOpen(!isOpen);
  };

  // 处理颜色选择
  const handleColorSelect = (color: HabitColor) => {
    onChange(color);
    setIsOpen(false);
  };

  // 处理配色方案选择
  const handleSchemeSelect = (scheme: ColorScheme) => {
    if (onSchemeChange) {
      onSchemeChange(scheme);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative w-full" ref={pickerRef}>
      {/* 颜色选择按钮 */}
      <Button
        type="button"
        variant="outline"
        onClick={toggleColorPicker}
        disabled={disabled}
        className={cn(
          "w-full flex justify-between items-center h-10 px-3 py-2",
          isOpen && "border-primary"
        )}
      >
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "w-6 h-6 rounded-md overflow-hidden",
              selectedScheme && "rounded-md"
            )}
            style={{ 
              background: selectedScheme 
                ? getSchemeGradient(selectedScheme)
                : value 
            }}
          />
          <span className="truncate">
            {selectedScheme 
              ? selectedScheme 
              : formatColorName(Object.keys(HabitColor).find(key => HabitColor[key as keyof typeof HabitColor] === value) || "")}
          </span>
        </div>
        <span className="text-xs text-muted-foreground mr-1">
          {selectedScheme ? "Scheme" : "Single Color"}
        </span>
        {isOpen ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
      </Button>

      {/* 颜色选择面板 */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-popover rounded-md border border-border shadow-lg">
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="singleColor">Single Color</TabsTrigger>
              <TabsTrigger value="scheme">Scheme</TabsTrigger>
            </TabsList>
            
            {/* 单色选项卡 */}
            <TabsContent value="singleColor" className="p-4">
              <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-3">
                {singleColorOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleColorSelect(option.value as HabitColor)}
                    className="flex flex-col items-center space-y-1.5 group"
                  >
                    <div className="relative">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-full group-hover:scale-110 transition-transform",
                          value === option.value && "ring-2 ring-primary ring-offset-1"
                        )}
                        style={{ backgroundColor: option.value }}
                      />
                      {value === option.value && (
                        <Check className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-white" />
                      )}
                    </div>
                    <span className="text-xs whitespace-nowrap">{option.label}</span>
                  </button>
                ))}
              </div>
            </TabsContent>
            
            {/* 配色方案选项卡 */}
            <TabsContent value="scheme" className="p-0">
              <ScrollArea className="h-[360px] p-4">
                {schemeOptions.map((group, groupIndex) => (
                  <div key={groupIndex} className="mb-6">
                    <h3 className="font-medium mb-3 px-3 text-sm border-b pb-1">{group.category}</h3>
                    <div className="grid grid-cols-1 gap-2">
                      {group.schemes.map((scheme) => (
                        <button
                          key={scheme}
                          type="button"
                          onClick={() => handleSchemeSelect(scheme)}
                          className={cn(
                            "w-full px-3 py-2 rounded-md hover:bg-accent/50 transition-colors",
                            selectedScheme === scheme && "bg-accent"
                          )}
                        >
                          <div className="flex items-center gap-3 w-full">
                            <span className="text-sm min-w-20 text-left flex-shrink-0 whitespace-nowrap">{scheme}</span>
                            <div
                              className="h-5 flex-grow rounded-md"
                              style={{ background: getSchemeGradient(scheme) }}
                            />
                            {selectedScheme === scheme && (
                              <Check className="w-4 h-4 flex-shrink-0 ml-1" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
