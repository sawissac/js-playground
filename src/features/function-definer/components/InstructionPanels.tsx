import React from "react";
import { cn } from "@/lib/utils";
import { IconInfoCircle } from "@tabler/icons-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export const TokensReference = () => (
  <div className="text-xs text-muted-foreground space-y-0.5">
    <p className="font-semibold text-foreground mb-1">@ Tokens:</p>
    <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
      <span>
        <code className="bg-muted px-1 rounded">@arg1</code>,{" "}
        <code className="bg-muted px-1 rounded">@arg2</code> — args
      </span>
      <span>
        <code className="bg-muted px-1 rounded">@this</code> /{" "}
        <code className="bg-muted px-1 rounded">@t</code> — value
      </span>
      <span>
        <code className="bg-muted px-1 rounded">@temp1</code>,{" "}
        <code className="bg-muted px-1 rounded">@math1</code> — temp
      </span>
      <span>
        <code className="bg-muted px-1 rounded">@renderer</code> /{" "}
        <code className="bg-muted px-1 rounded">@r</code> — DOM ID
      </span>
      <span>
        <code className="bg-muted px-1 rounded">@space</code>,{" "}
        <code className="bg-muted px-1 rounded">@comma</code>,{" "}
        <code className="bg-muted px-1 rounded">@empty</code>
      </span>
    </div>
  </div>
);

export const InstructionPanel = () => {
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
      <PopoverContent className="w-96" align="start">
        <div className="space-y-3 text-xs">
          <div>
            <p className="text-blue-900 font-semibold mb-1">
              Building Function Chains
            </p>
            <p className="text-blue-800 line-clamp-3">
              Build step-by-step action chains for each function. Each action runs on the result of the previous step, allowing you to transform data progressively.
            </p>
          </div>
          <div className="space-y-1.5">
            <p className="font-semibold text-blue-900 border-b border-blue-100 pb-1">Magic actions:</p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-blue-800">
              <span className="flex items-start gap-1.5 overflow-hidden">
                <code className="bg-blue-100 px-1.5 rounded font-medium mt-0.5 shrink-0">math</code>
                <span className="text-[11px] leading-tight text-blue-700 w-full break-words">eval expression</span>
              </span>
              <span className="flex items-start gap-1.5 overflow-hidden">
                <code className="bg-blue-100 px-1.5 rounded font-medium mt-0.5 shrink-0">temp</code>
                <span className="text-[11px] leading-tight text-blue-700 w-full break-words">save value</span>
              </span>
              <span className="flex items-start gap-1.5 overflow-hidden">
                <code className="bg-blue-100 px-1.5 rounded font-medium mt-0.5 shrink-0">return</code>
                <span className="text-[11px] leading-tight text-blue-700 w-full break-words">return value</span>
              </span>
              <span className="flex items-start gap-1.5 overflow-hidden">
                <code className="bg-blue-100 px-1.5 rounded font-medium mt-0.5 shrink-0">use</code>
                <span className="text-[11px] leading-tight text-blue-700 w-full break-words">switch context</span>
              </span>
              <span className="flex items-start gap-1.5 overflow-hidden">
                <code className="bg-rose-100 px-1.5 rounded text-rose-700 font-medium mt-0.5 shrink-0">
                  if
                </code>
                <span className="text-[11px] leading-tight text-rose-600 w-full break-words">condition check</span>
              </span>
              <span className="flex items-start gap-1.5 overflow-hidden">
                <code className="bg-violet-100 px-1.5 rounded text-violet-700 font-medium mt-0.5 shrink-0">
                  when
                </code>
                <span className="text-[11px] leading-tight text-violet-600 w-full break-words">conditional block</span>
              </span>
              <span className="flex items-start gap-1.5 overflow-hidden">
                <code className="bg-indigo-100 px-1.5 rounded text-indigo-700 font-medium mt-0.5 shrink-0">
                  loop
                </code>
                <span className="text-[11px] leading-tight text-indigo-600 w-full break-words">iteration block</span>
              </span>
              <span className="flex items-start gap-1.5 overflow-hidden">
                <code className="bg-teal-100 px-1.5 rounded text-teal-700 font-medium mt-0.5 shrink-0">
                  code
                </code>
                <span className="text-[11px] leading-tight text-teal-600 w-full break-words">JavaScript block</span>
              </span>
            </div>
          </div>
          
          <div className="pt-2">
            <TokensReference />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
