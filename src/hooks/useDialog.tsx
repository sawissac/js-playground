"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { CustomAlertDialog, AlertDialogOptions, AlertType } from "@/components/CustomAlertDialog";

interface DialogContextType {
  alert: (message: string, options?: Partial<AlertDialogOptions>) => void;
  confirm: (message: string, options?: Partial<AlertDialogOptions>) => Promise<boolean>;
  showDialog: (options: AlertDialogOptions & { showCancel?: boolean }) => void;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export function DialogProvider({ children }: { children: ReactNode }) {
  const [dialogState, setDialogState] = useState<{
    open: boolean;
    options: AlertDialogOptions & { showCancel?: boolean };
    resolver?: (value: boolean) => void;
  }>({
    open: false,
    options: { message: "" },
  });

  const showDialog = useCallback((options: AlertDialogOptions & { showCancel?: boolean }) => {
    setDialogState({
      open: true,
      options,
      resolver: undefined,
    });
  }, []);

  const alert = useCallback((message: string, options: Partial<AlertDialogOptions> = {}) => {
    showDialog({
      message,
      type: options.type || "info",
      title: options.title,
      confirmText: options.confirmText || "OK",
      showCancel: false,
      onConfirm: options.onConfirm,
    });
  }, [showDialog]);

  const confirm = useCallback((message: string, options: Partial<AlertDialogOptions> = {}): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialogState({
        open: true,
        options: {
          message,
          type: options.type || "warning",
          title: options.title,
          confirmText: options.confirmText || "Yes",
          cancelText: options.cancelText || "No",
          showCancel: true,
        },
        resolver: resolve,
      });
    });
  }, []);

  const handleConfirm = () => {
    if (dialogState.resolver) {
      dialogState.resolver(true);
    }
    dialogState.options.onConfirm?.();
    setDialogState((prev) => ({ ...prev, open: false }));
  };

  const handleCancel = () => {
    if (dialogState.resolver) {
      dialogState.resolver(false);
    }
    dialogState.options.onCancel?.();
    setDialogState((prev) => ({ ...prev, open: false }));
  };

  return (
    <DialogContext.Provider value={{ alert, confirm, showDialog }}>
      {children}
      <CustomAlertDialog
        open={dialogState.open}
        onOpenChange={(open) => {
          if (!open) handleCancel();
        }}
        {...dialogState.options}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("useDialog must be used within a DialogProvider");
  }
  return context;
}
