import React from "react";
import { cn } from "@/lib/utils";
import { IconCheck, IconChevronDown } from "@tabler/icons-react";
import {
  MAGIC_NAMES,
  MAGIC_INDICATORS,
  IF_INDICATOR,
  WHEN_INDICATOR,
  LOOP_INDICATOR,
  CALL_PREFIX,
  CALL_INDICATOR,
} from "../constants";
import { MagicName } from "../types";

export const MethodItem = ({
  name,
  params,
  isMagic,
  isCall,
  isSelected,
  onSelect,
}: {
  name: string;
  params: string | number;
  isMagic: boolean;
  isCall?: boolean;
  isSelected: boolean;
  onSelect: (v: string) => void;
}) => {
  const info = isMagic ? MAGIC_INDICATORS[name as MagicName] : null;
  const displayName = isCall ? name.slice(CALL_PREFIX.length) : name;
  return (
    <button
      type="button"
      onClick={() => onSelect(name)}
      className={cn(
        "flex items-center w-full px-2 py-1 gap-1.5 text-left hover:bg-accent",
        isSelected && "bg-accent",
      )}
    >
      {isMagic && info ? (
        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", info.dot)} />
      ) : isCall ? (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full shrink-0",
            CALL_INDICATOR.dot,
          )}
        />
      ) : (
        <span className="w-1.5 shrink-0" />
      )}
      <span
        className={cn(
          "flex-1 font-mono text-xs",
          (isMagic || isCall) && "font-semibold",
        )}
      >
        {displayName}
      </span>
      <span
        className={cn(
          "text-[10px] px-1 rounded font-mono shrink-0",
          params === 0
            ? "text-slate-400 bg-slate-100"
            : "text-blue-600 bg-blue-50",
        )}
      >
        {params === 0 ? "∅" : params === "n" ? "n" : `${params}p`}
      </span>
      {isSelected ? (
        <IconCheck size={10} className="text-green-600 shrink-0" />
      ) : (
        <span className="w-2.5 shrink-0" />
      )}
    </button>
  );
};

export const MethodSelector = ({
  value,
  funcList,
  funcDataType,
  onChange,
}: {
  value: string;
  funcList: { name: string | number; params: string | number }[];
  funcDataType: string;
  onChange: (v: string) => void;
}) => {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      )
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  React.useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 0);
    else setSearch("");
  }, [open]);

  const magic = funcList.filter((fn) =>
    MAGIC_NAMES.includes(fn.name as MagicName),
  );
  const callable = funcList.filter((fn) =>
    String(fn.name).startsWith(CALL_PREFIX),
  );
  const builtin = funcList.filter(
    (fn) =>
      !MAGIC_NAMES.includes(fn.name as MagicName) &&
      !String(fn.name).startsWith(CALL_PREFIX),
  );
  const q = search.toLowerCase();
  const filteredMagic = q
    ? magic.filter((fn) => String(fn.name).includes(q))
    : magic;
  const filteredCallable = q
    ? callable.filter((fn) =>
        String(fn.name).slice(CALL_PREFIX.length).includes(q),
      )
    : callable;
  const filteredBuiltin = q
    ? builtin.filter((fn) => String(fn.name).includes(q))
    : builtin;

  const isMagicSelected = MAGIC_NAMES.includes(value as MagicName);
  const magicInfo = isMagicSelected
    ? MAGIC_INDICATORS[value as MagicName]
    : null;
  const isCallSelected = value.startsWith(CALL_PREFIX);
  const callTarget = isCallSelected ? value.slice(CALL_PREFIX.length) : null;
  const isIfSelected = value === "if";
  const isWhenSelected = value === "when";
  const isLoopSelected = value === "loop";
  const selectedFn = funcList.find((fn) => fn.name === value);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "h-7 text-xs flex items-center gap-1 px-2 rounded border w-[130px]",
          isMagicSelected && magicInfo
            ? magicInfo.badge
            : isCallSelected
              ? CALL_INDICATOR.badge
              : isIfSelected
                ? IF_INDICATOR.badge
                : isWhenSelected
                  ? WHEN_INDICATOR.badge
                  : isLoopSelected
                    ? LOOP_INDICATOR.badge
                    : "border-input bg-background text-foreground hover:bg-accent",
        )}
      >
        {isMagicSelected && magicInfo && (
          <span
            className={cn("w-1.5 h-1.5 rounded-full shrink-0", magicInfo.dot)}
          />
        )}
        {isCallSelected && (
          <span
            className={cn(
              "w-1.5 h-1.5 rounded-full shrink-0",
              CALL_INDICATOR.dot,
            )}
          />
        )}
        {isIfSelected && (
          <span
            className={cn(
              "w-1.5 h-1.5 rounded-full shrink-0",
              IF_INDICATOR.dot,
            )}
          />
        )}
        {isWhenSelected && (
          <span
            className={cn(
              "w-1.5 h-1.5 rounded-full shrink-0",
              WHEN_INDICATOR.dot,
            )}
          />
        )}
        {isLoopSelected && (
          <span
            className={cn(
              "w-1.5 h-1.5 rounded-full shrink-0",
              LOOP_INDICATOR.dot,
            )}
          />
        )}
        <span className="flex-1 text-left font-mono text-xs truncate">
          {value ? (
            isCallSelected ? (
              callTarget
            ) : (
              value
            )
          ) : (
            <span className="text-muted-foreground font-sans">method</span>
          )}
        </span>
        {selectedFn && (
          <span className="text-[10px] text-muted-foreground font-mono shrink-0">
            {selectedFn.params === 0
              ? "∅"
              : selectedFn.params === "n"
                ? "n"
                : `${selectedFn.params}p`}
          </span>
        )}
        <IconChevronDown size={10} className="shrink-0 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute z-50 left-0 top-full mt-1 w-56 rounded-md border bg-white shadow-lg overflow-hidden">
          <div className="px-2 py-1.5 border-b bg-slate-50">
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search method..."
              className="w-full text-xs outline-none bg-transparent placeholder:text-muted-foreground"
            />
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filteredMagic.length > 0 && (
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide px-2 pt-1.5 pb-0.5">
                  Magic
                </p>
                {filteredMagic.map((fn) => (
                  <MethodItem
                    key={fn.name}
                    name={String(fn.name)}
                    params={fn.params}
                    isMagic
                    isSelected={value === fn.name}
                    onSelect={(v) => {
                      onChange(v);
                      setOpen(false);
                    }}
                  />
                ))}
              </div>
            )}
            {filteredCallable.length > 0 && (
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide px-2 pt-1.5 pb-0.5">
                  Call Function
                </p>
                {filteredCallable.map((fn) => (
                  <MethodItem
                    key={fn.name}
                    name={String(fn.name)}
                    params={fn.params}
                    isMagic={false}
                    isCall
                    isSelected={value === fn.name}
                    onSelect={(v) => {
                      onChange(v);
                      setOpen(false);
                    }}
                  />
                ))}
              </div>
            )}
            {filteredBuiltin.length > 0 && (
              <div>
                {funcDataType && (
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide px-2 pt-1.5 pb-0.5">
                    {funcDataType}
                  </p>
                )}
                {filteredBuiltin.map((fn) => (
                  <MethodItem
                    key={fn.name}
                    name={String(fn.name)}
                    params={fn.params}
                    isMagic={false}
                    isSelected={value === fn.name}
                    onSelect={(v) => {
                      onChange(v);
                      setOpen(false);
                    }}
                  />
                ))}
              </div>
            )}
            {filteredMagic.length === 0 &&
              filteredCallable.length === 0 &&
              filteredBuiltin.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-3">
                  No methods found
                </p>
              )}
          </div>
        </div>
      )}
    </div>
  );
};
