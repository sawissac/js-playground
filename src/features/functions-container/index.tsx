"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import React, { useEffect, useState } from "react";
import {
  IconBox,
  IconCircleDashedPlus,
  IconEdit,
  IconEyeMinus,
  IconEyePlus,
  IconFunction,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import {
  addFunctionName,
  removeFunctionName,
  updateFunctionName,
} from "@/state/slices/editorSlice";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircleIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { listenToKeys } from "@/lib/keyListener-utils";

const FunctionsContainer = () => {
  const dispatch = useAppDispatch();
  const functions = useAppSelector((state) => state.editor.functions);
  const [oldFunctionName, setOldFunctionName] = useState("");
  const [newFunctionName, setNewFunctionName] = useState("");
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const inputStopListening = listenToKeys((e: KeyboardEvent) => {
      if (
        e.altKey &&
        e.key === "e" &&
        inputRef.current &&
        inputRef.current === document.activeElement
      ) {
        e.preventDefault();
        buttonRef.current?.click();
      }
    }, inputRef.current);

    const stopListening = listenToKeys((e: KeyboardEvent) => {
      if (e.key === "3" && e.altKey && inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    });

    return () => {
      inputStopListening();
      stopListening();
    };
  }, []);

  const handleAddFunction = () => {
    const functionNameLists = functions.map((fun) => fun.name);
    const temp: string[] = [];

    if (newFunctionName.trim() === "") {
      setError("Function name cannot be empty");
      return;
    }

    if (functionNameLists.includes(newFunctionName.trim())) {
      setError("Function name already exists");
      return;
    }

    setError("");

    if (isEditing) {
      dispatch(
        updateFunctionName({
          oldFunctionName: oldFunctionName,
          newFunctionName: newFunctionName,
        })
      );
    }

    const isComma = newFunctionName.includes(",");

    if (isComma && !isEditing) {
      const funComma = newFunctionName.split(",");
      funComma.forEach((vc) => {
        if (temp.includes(vc.trim())) {
          setError("Function name already exists");
          return;
        }

        temp.push(vc.trim());
        dispatch(addFunctionName(vc.trim()));
      });
    }

    if (!isComma && !isEditing) {
      dispatch(addFunctionName(newFunctionName.trim()));
    }

    handleCancelUpdate();
  };

  const handleRemoveFunction = (variable: string) => {
    dispatch(removeFunctionName(variable));
    handleCancelUpdate();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleAddFunction();
    }
  };

  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewFunctionName(e.target.value);
  };

  const handleUpdateVariable = (variable: string) => {
    setOldFunctionName(variable);
    setNewFunctionName(variable);
    setIsEditing(true);
  };

  const handleCancelUpdate = () => {
    setNewFunctionName("");
    setOldFunctionName("");
    setIsEditing(false);
  };

  const handleClearError = () => {
    setError("");
  };

  const handleShowDetail = () => {
    setShowDetail(!showDetail);
  };

  return (
    <div className="w-full p-2 shadow-md shadow-slate-200 rounded-md space-y-2">
      <div className="flex flex-row gap-2">
        <Badge variant="secondary"> Function Name</Badge>
        <Badge variant="outline">{functions.length}</Badge>
      </div>
      <div className="flex items-center justify-between gap-2">
        <IconFunction size={16} className="shrink-0" />
        <Input
          ref={inputRef}
          value={newFunctionName}
          onChange={handleOnChange}
          onKeyDown={handleKeyDown}
          placeholder="Variable Name"
        />
        <Button onClick={handleAddFunction} size="icon">
          <IconCircleDashedPlus size={16} />
        </Button>
        <Button ref={buttonRef} onClick={handleShowDetail} size="icon">
          {showDetail ? <IconEyeMinus size={16} /> : <IconEyePlus size={16} />}
        </Button>
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertDescription className="flex items-center justify-between">
            <p>Error:{error}</p>
            <button onClick={handleClearError}>
              <IconX size={16} />
            </button>
          </AlertDescription>
        </Alert>
      )}
      {isEditing && (
        <Badge variant="secondary" className="cursor-pointer">
          <p className="text-sm">UPDATE</p>
          <div onClick={handleCancelUpdate}>
            <IconX size={16} />
          </div>
        </Badge>
      )}
      <div className="flex flex-wrap gap-2">
        {showDetail &&
          functions.map((variable) => (
            <Badge
              key={variable.name}
              variant="outline"
              className="group transition-all duration-300 ease-in-out hover:bg-accent hover:text-accent-foreground cursor-pointer space-x-1"
            >
              <p className="text-sm">{variable.name}</p>
              <button
                type="button"
                onClick={() => {
                  handleUpdateVariable(variable.name);
                }}
                className={cn(
                  "group-hover:block hidden",
                  isEditing && "group-hover:hidden"
                )}
              >
                <IconEdit size={16} />
              </button>
              <button
                type="button"
                onClick={() => {
                  handleRemoveFunction(variable.name);
                }}
                className={cn(
                  "group-hover:block hidden",
                  isEditing && "group-hover:hidden"
                )}
              >
                <IconTrash size={16} />
              </button>
            </Badge>
          ))}
      </div>
    </div>
  );
};

export default FunctionsContainer;
