import { useAppDispatch, useAppSelector } from "@/state/hooks";
import { useEffect, useRef, useState } from "react";
import {
  addFunctionName,
  removeFunctionName,
  updateFunctionName,
} from "@/state/slices/editorSlice";
import { listenToKeys } from "@/lib/keyListener-utils";
import { addLog } from "@/state/slices/logSlice";

export const useFunctionManager = () => {
  const dispatch = useAppDispatch();
  const functions = useAppSelector(
    (state) =>
      state.editor.packages.find((p) => p.id === state.editor.activePackageId)!
        .functions,
  );
  
  const [oldFunctionName, setOldFunctionName] = useState("");
  const [newFunctionName, setNewFunctionName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [rangePreview, setRangePreview] = useState<string[] | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const inputStopListening = listenToKeys((e: KeyboardEvent) => {
      if (
        e.key === "e" &&
        (e.altKey || e.metaKey || e.ctrlKey) &&
        inputRef.current &&
        inputRef.current === document.activeElement
      ) {
        e.preventDefault();
        buttonRef.current?.click();
      }
    }, inputRef.current);
    const stopListening = listenToKeys((e: KeyboardEvent) => {
      if (
        e.key === "3" &&
        (e.altKey || e.metaKey || e.ctrlKey) &&
        inputRef.current
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    });
    return () => {
      inputStopListening();
      stopListening();
    };
  }, []);

  const expandRanges = (input: string): string => {
    return input
      .split(",")
      .flatMap((seg) => {
        const match = seg.trim().match(/^([^(]+)\((\d+)-(\d+)\)(.*)$/);
        if (!match) return [seg.trim()];
        const [, prefix, startStr, endStr, suffix] = match;
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        if (start > end) return [seg.trim()];
        const results: string[] = [];
        for (let i = start; i <= end; i++) {
          results.push(`${prefix.trim()}${i}${suffix.trim()}`);
        }
        return results;
      })
      .join(", ");
  };

  const handleCancelUpdate = () => {
    setNewFunctionName("");
    setOldFunctionName("");
    setIsEditing(false);
    setRangePreview(null);
  };

  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNewFunctionName(val);

    const hasRange = val
      .split(",")
      .some((seg) => /^[^(]+\(\d+-\d+\).*$/.test(seg.trim()));
    if (hasRange) {
      const expanded = expandRanges(val);
      setRangePreview(
        expanded
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      );
      return;
    }
    setRangePreview(null);
  };

  const handleAddFunction = () => {
    const functionNameLists = functions.map((fun) => fun.name);
    const temp: string[] = [];
    if (newFunctionName.trim() === "") {
      dispatch(
        addLog({ type: "warning", message: "Function name cannot be empty" }),
      );
      return;
    }
    if (isEditing) {
      if (functionNameLists.includes(newFunctionName.trim()) && newFunctionName.trim() !== oldFunctionName) {
        dispatch(
          addLog({ type: "warning", message: "Function name already exists" }),
        );
        return;
      }
      const func = functions.find((f) => f.name === oldFunctionName);
      if (func)
        dispatch(updateFunctionName({ id: func.id, newName: newFunctionName }));
      handleCancelUpdate();
      return;
    }

    const expanded = expandRanges(newFunctionName);
    expanded.split(",").forEach((vc) => {
      const trimmedVc = vc.trim();
      if (!trimmedVc) return;
      if (temp.includes(trimmedVc) || functionNameLists.includes(trimmedVc)) {
        dispatch(
          addLog({
            type: "warning",
            message: "Function name already exists",
          }),
        );
        return;
      }
      temp.push(trimmedVc);
      dispatch(addFunctionName(trimmedVc));
    });

    handleCancelUpdate();
  };

  const handleRemoveFunction = (id: string) => {
    dispatch(removeFunctionName(id));
    handleCancelUpdate();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleAddFunction();
  };

  const handleUpdateFunction = (name: string) => {
    setOldFunctionName(name);
    setNewFunctionName(name);
    setIsEditing(true);
  };

  return {
    functions,
    newFunctionName,
    isEditing,
    showDetail,
    setShowDetail,
    rangePreview,
    inputRef,
    buttonRef,
    handleOnChange,
    handleKeyDown,
    handleAddFunction,
    handleUpdateFunction,
    handleRemoveFunction,
    handleCancelUpdate
  };
};
