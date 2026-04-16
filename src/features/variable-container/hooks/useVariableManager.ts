import { useAppDispatch, useAppSelector } from "@/state/hooks";
import { useEffect, useRef, useState } from "react";
import {
  addVariable,
  removeVariable,
  updateDataType,
  updateVariable,
} from "@/state/slices/editorSlice";
import { listenToKeys } from "@/lib/keyListener-utils";
import { addLog } from "@/state/slices/logSlice";
import { v4 as uuidv4 } from "uuid";

export const useVariableManager = () => {
  const dispatch = useAppDispatch();
  const variables = useAppSelector(
    (state) =>
      state.editor.packages.find((p) => p.id === state.editor.activePackageId)!
        .variables,
  );
  const dataTypes = useAppSelector((state) => state.editor.dataTypes);
  
  const [oldVariable, setOldVariable] = useState("");
  const [newVariable, setNewVariable] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [typeSuggestions, setTypeSuggestions] = useState<string[] | null>(null);
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
        e.key === "1" &&
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
    setNewVariable("");
    setOldVariable("");
    setIsEditing(false);
    setRangePreview(null);
    setTypeSuggestions(null);
  };

  const handleAddVariable = () => {
    const variableNameLists = variables.map((variable) => variable.name);
    const temp: string[] = [];
    if (newVariable.trim() === "") {
      dispatch(
        addLog({ type: "warning", message: "Variable name cannot be empty" }),
      );
      return;
    }
    if (isEditing) {
      const variable = variables.find((v) => v.name === oldVariable);
      if (variable)
        dispatch(updateVariable({ id: variable.id, newName: newVariable }));
      handleCancelUpdate();
      return;
    }
    const expanded = expandRanges(newVariable);
    expanded.split(",").forEach((vc) => {
      const trimmedVc = vc.trim();
      if (!trimmedVc) return;
      
      const hasPrefix = trimmedVc.includes(":");
      if (hasPrefix) {
        const [vName, dType] = trimmedVc.split(":");
        if (temp.includes(vName.trim()) || variableNameLists.includes(vName.trim())) {
          dispatch(
            addLog({
              type: "warning",
              message: "Variable name already exists",
            }),
          );
          return;
        }
        if (!dataTypes.includes(dType.trim())) {
          dispatch(
            addLog({ type: "warning", message: "Data type does not exist" }),
          );
          return;
        }
        const p = { id: uuidv4(), name: vName.trim() };
        temp.push(p.name);
        dispatch(addVariable(p));
        dispatch(updateDataType({ id: p.id, type: dType }));
      } else {
        if (temp.includes(trimmedVc) || variableNameLists.includes(trimmedVc)) {
          dispatch(
            addLog({
              type: "warning",
              message: "Variable name already exists",
            }),
          );
          return;
        }
        temp.push(trimmedVc);
        dispatch(addVariable({ id: uuidv4(), name: trimmedVc }));
      }
    });

    handleCancelUpdate();
  };

  const handleRemoveVariable = (variableId: string) => {
    dispatch(removeVariable(variableId));
    handleCancelUpdate();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleAddVariable();
  };

  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNewVariable(val);

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
      setTypeSuggestions(null);
      return;
    }
    setRangePreview(null);

    const lastSegment = val.split(",").pop() ?? "";
    const colonIdx = lastSegment.lastIndexOf(":");
    if (colonIdx !== -1) {
      const typeQuery = lastSegment.slice(colonIdx + 1).toLowerCase();
      setTypeSuggestions(dataTypes.filter((dt) => dt.startsWith(typeQuery)));
    } else {
      setTypeSuggestions(null);
    }
  };

  const insertType = (dt: string) => {
    const lastComma = newVariable.lastIndexOf(",");
    const prefix =
      lastComma === -1 ? "" : newVariable.slice(0, lastComma + 1) + " ";
    const lastSegment =
      lastComma === -1 ? newVariable : newVariable.slice(lastComma + 2);
    const colonIdx = lastSegment.indexOf(":");
    const newVal =
      prefix +
      (colonIdx === -1
        ? lastSegment + ":"
        : lastSegment.slice(0, colonIdx + 1)) +
      dt;
    setNewVariable(newVal);
    setTypeSuggestions(null);
    inputRef.current?.focus();
  };

  const handleUpdateVariable = (name: string) => {
    setOldVariable(name);
    setNewVariable(name);
    setIsEditing(true);
  };

  return {
    variables,
    newVariable,
    isEditing,
    showDetail,
    setShowDetail,
    typeSuggestions,
    setTypeSuggestions,
    rangePreview,
    inputRef,
    buttonRef,
    handleOnChange,
    handleKeyDown,
    handleAddVariable,
    handleUpdateVariable,
    handleRemoveVariable,
    handleCancelUpdate,
    insertType
  };
};
