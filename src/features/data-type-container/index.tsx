"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import { useEffect, useState } from "react";
import {
  IconArrowMerge,
  IconBox,
  IconCircleDashedPlus,
  IconEyeMinus,
  IconEyePlus,
  IconFileTypography,
  IconX,
} from "@tabler/icons-react";
import { updateDataType } from "@/state/slices/editorSlice";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircleIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DataTypeContainer = () => {
  const dispatch = useAppDispatch();
  const variables = useAppSelector((state) => state.editor.variables);
  const dataTypes = useAppSelector((state) => state.editor.dataTypes);
  const [selectedVariable, setSelectedVariable] = useState("");
  const [selectedDataType, setSelectedDataType] = useState("");
  const [error, setError] = useState("");
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    if (selectedVariable.trim() === "") {
      setShowDetail(false);
      setSelectedDataType("");
      setError("");
    }
  }, [selectedVariable]);

  const handleAddVariable = () => {
    if (selectedVariable.trim() === "") {
      setError("Variable name cannot be empty");
      return;
    }

    if (selectedDataType.trim() === "") {
      setError("Data type cannot be empty");
      return;
    }

    setError("");

    dispatch(
      updateDataType({ name: selectedVariable, type: selectedDataType })
    );
  };

  const handleUpdateDataType = (variable: string) => {
    setSelectedVariable(variable);
    setSelectedDataType(variables.find((v) => v.name === variable)?.type || "");
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
        <Badge variant="secondary"> Data Type</Badge>
        <Badge variant="outline">
          {variables.filter((v) => v.type).length}
        </Badge>
      </div>
      <div className="flex items-center justify-between gap-2">
        <IconBox size={16} className="shrink-0"/>
        <Select
          disabled={!variables.length}
          value={selectedVariable}
          onValueChange={setSelectedVariable}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Variables" />
          </SelectTrigger>
          <SelectContent>
            {variables.map((variable) => {
              return (
                <SelectItem key={variable.name} value={variable.name}>
                  {variable.name}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        <IconFileTypography size={16} className="shrink-0"/>
        <Select
          disabled={!variables.length}
          value={selectedDataType}
          onValueChange={setSelectedDataType}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Data Types" />
          </SelectTrigger>
          <SelectContent>
            {dataTypes.map((type) => {
              return (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        <Button
          disabled={!variables.length}
          onClick={handleAddVariable}
          size="icon"
        >
          <IconArrowMerge size={16} className="shrink-0"/>
        </Button>
        <Button
          disabled={!variables.length || variables.every((v) => !v.type)}
          onClick={handleShowDetail}
          size="icon"
        >
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
      <div className="flex flex-wrap gap-2">
        {showDetail &&
          variables
            .filter((variable) => variable.type !== "")
            .map((variable) => (
              <Badge
                key={variable.name}
                variant="outline"
                className="group transition-all duration-300 ease-in-out hover:bg-accent hover:text-accent-foreground cursor-pointer space-x-1 p-2"
                onClick={() => handleUpdateDataType(variable.name)}
              >
                <p className="text-sm">{variable.name}</p>
                <Badge variant="outline" className="bg-blue-500 text-white">
                  <p className="text-sm">{variable.type}</p>
                </Badge>
              </Badge>
            ))}
      </div>
    </div>
  );
};

export default DataTypeContainer;
