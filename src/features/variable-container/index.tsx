"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import React, { useState } from "react";
import {
  IconBox,
  IconCircleDashedPlus,
  IconEdit,
  IconEyeMinus,
  IconEyePlus,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import {
  addVariable,
  removeVariable,
  updateDataType,
  updateVariable,
} from "@/state/slices/editorSlice";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircleIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const DataTypeContainer = () => {
  const dispatch = useAppDispatch();
  const variables = useAppSelector((state) => state.editor.variables);
  const dataTypes = useAppSelector((state) => state.editor.dataTypes);
  const [oldVariable, setOldVariable] = useState("");
  const [newVariable, setNewVariable] = useState("");
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  const handleAddVariable = () => {
    const variableNameLists = variables.map((variable) => variable.name);
    const temp: string[] = [];

    if (newVariable.trim() === "") {
      setError("Variable name cannot be empty");
      return;
    }

    if (variableNameLists.includes(newVariable.trim())) {
      setError("Variable name already exists");
      return;
    }

    setError("");

    if (isEditing) {
      dispatch(updateVariable({ oldVariable, newVariable }));
    }

    const isComma = newVariable.includes(",");

    if (isComma && !isEditing) {
      const varComma = newVariable.split(",");
      varComma.forEach((vc) => {
        if (temp.includes(vc.trim())) {
          setError("Variable name already exists");
          return;
        }

        const hasDataTypePrefix = vc.trim().includes(":");

        if (hasDataTypePrefix) {
          const variableName = vc.trim().split(":")[0];
          const dataType = vc.trim().split(":")[1];

          if (variableNameLists.includes(variableName.trim())) {
            setError("Variable name already exists");
            return;
          }

          if (!dataTypes.includes(dataType.trim())) {
            setError("Data type does not exist");
            return;
          }

          temp.push(variableName.trim());
          dispatch(addVariable(variableName.trim()));
          dispatch(updateDataType({ name: variableName, type: dataType }));
        } else {
          temp.push(vc.trim());
          dispatch(addVariable(vc.trim()));
        }
      });
    }

    if (!isEditing && !isComma) {
      const hasDataTypePrefix = newVariable.trim().includes(":");

      if (hasDataTypePrefix) {
        const variableName = newVariable.trim().split(":")[0];
        const dataType = newVariable.trim().split(":")[1];

        if (variableNameLists.includes(variableName.trim())) {
          setError("Variable name already exists");
          return;
        }

        if (!dataTypes.includes(dataType.trim())) {
          setError("Data type does not exist");
          return;
        }

        dispatch(addVariable(variableName.trim()));
        dispatch(updateDataType({ name: variableName, type: dataType }));
      } else {
        dispatch(addVariable(newVariable.trim()));
      }
    }

    handleCancelUpdate();
  };

  const handleRemoveVariable = (variable: string) => {
    dispatch(removeVariable(variable));
    handleCancelUpdate();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleAddVariable();
    }
  };

  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewVariable(e.target.value);
  };

  const handleUpdateVariable = (variable: string) => {
    setOldVariable(variable);
    setNewVariable(variable);
    setIsEditing(true);
  };

  const handleCancelUpdate = () => {
    setNewVariable("");
    setOldVariable("");
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
        <Badge variant="secondary"> Variable Name</Badge>
        <Badge variant="outline">{variables.length}</Badge>
      </div>
      <div className="flex items-center justify-between gap-2">
        <IconBox size={16} />
        <Input
          value={newVariable}
          onChange={handleOnChange}
          onKeyDown={handleKeyDown}
          placeholder="Variable Name"
        />
        <Button onClick={handleAddVariable} size="icon">
          <IconCircleDashedPlus size={16} />
        </Button>
        <Button onClick={handleShowDetail} size="icon">
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
          variables.map((variable) => (
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
                  handleRemoveVariable(variable.name);
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

export default DataTypeContainer;
