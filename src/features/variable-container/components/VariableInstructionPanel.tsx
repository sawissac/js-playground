import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { IconInfoCircle } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

export const VariableInstructionPanel = () => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-1.5 w-full text-left text-blue-700 font-medium text-xs",
            "rounded-md border border-blue-200 bg-blue-50 p-2",
            "transition-all duration-200 hover:shadow-sm hover:text-blue-800",
          )}
        >
          <IconInfoCircle size={13} />
          What can I do here?
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-3 text-xs">
          <div>
            <p className="text-blue-900 font-semibold mb-1">
              Variable Management
            </p>
            <p className="text-blue-800 line-clamp-3">
              Define state variables to track data inside this package.
            </p>
          </div>
          
          <div className="space-y-1.5">
            <p className="font-semibold text-blue-900 border-b border-blue-100 pb-1">Features & Shortcuts:</p>
            <div className="space-y-2 text-blue-800 mt-1.5">
              <div className="flex items-start gap-2">
                <span className="shrink-0 mt-0.5 text-blue-500">•</span>
                <div>
                  <p className="text-[11px] leading-tight text-blue-900 mb-0.5">Define inline types:</p>
                  <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono text-[10px]">myVar:string</code>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="shrink-0 mt-0.5 text-blue-500">•</span>
                <div>
                  <p className="text-[11px] leading-tight text-blue-900 mb-0.5">Bulk definition:</p>
                  <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono text-[10px]">a:string, b:array, c</code>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="shrink-0 mt-0.5 text-blue-500">•</span>
                <div>
                  <p className="text-[11px] leading-tight text-blue-900 mb-0.5">Range creation:</p>
                  <div className="flex items-center gap-1 flex-wrap">
                    <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono text-[10px]">x(1-3)</code>
                    <span className="text-[10px] text-blue-500">→</span>
                    <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono text-[10px]">x1, x2, x3</code>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-100/50 p-2 rounded-md border border-blue-200 mt-2 flex items-center justify-between text-blue-800">
            <span className="text-[11px] flex gap-1 items-center">
              <kbd className="bg-white border border-blue-200 shadow-sm px-1 rounded text-[9px] font-mono">⌘ 1</kbd>
              Focus input
            </span>
            <span className="text-[11px] flex gap-1 items-center">
              <kbd className="bg-white border border-blue-200 shadow-sm px-1 rounded text-[9px] font-mono">Enter</kbd>
              Submit
            </span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
