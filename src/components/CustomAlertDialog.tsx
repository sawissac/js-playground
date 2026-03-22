"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { IconAlertCircle, IconAlertTriangle, IconInfoCircle, IconCheck } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

export type AlertType = "info" | "warning" | "error" | "success";

export interface AlertDialogOptions {
  title?: string;
  message: string;
  type?: AlertType;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface CustomAlertDialogProps extends AlertDialogOptions {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showCancel?: boolean;
}

export function CustomAlertDialog({
  open,
  onOpenChange,
  title,
  message,
  type = "info",
  confirmText = "OK",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  showCancel = false,
}: CustomAlertDialogProps) {
  const handleConfirm = () => {
    onConfirm?.();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  const getIcon = () => {
    switch (type) {
      case "error":
        return <IconAlertCircle className="text-red-500" size={24} />;
      case "warning":
        return <IconAlertTriangle className="text-amber-500" size={24} />;
      case "success":
        return <IconCheck className="text-green-500" size={24} />;
      default:
        return <IconInfoCircle className="text-blue-500" size={24} />;
    }
  };

  const getHeaderStyle = () => {
    switch (type) {
      case "error":
        return "text-red-700";
      case "warning":
        return "text-amber-700";
      case "success":
        return "text-green-700";
      default:
        return "text-blue-700";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {getIcon()}
            <DialogTitle className={cn("text-lg", getHeaderStyle())}>
              {title || (type === "error" ? "Error" : type === "warning" ? "Warning" : type === "success" ? "Success" : "Information")}
            </DialogTitle>
          </div>
        </DialogHeader>
        <DialogDescription className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
          {message}
        </DialogDescription>
        <DialogFooter className="gap-2 sm:gap-0">
          {showCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
            >
              {cancelText}
            </Button>
          )}
          <Button
            type="button"
            onClick={handleConfirm}
            variant={type === "error" ? "destructive" : "default"}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
