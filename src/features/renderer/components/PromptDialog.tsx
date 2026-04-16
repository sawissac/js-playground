"use client";

import React, { useState, useMemo } from "react";
import { useAppSelector } from "@/state/hooks";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { IconCopy, IconCheck } from "@tabler/icons-react";
import { buildRendererPrompt } from "@/lib/prompts";

interface PromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rendererId: string;
}

const PromptDialog = ({
  open,
  onOpenChange,
  rendererId,
}: PromptDialogProps) => {
  const [copied, setCopied] = useState(false);
  const editorState = useAppSelector((s) => s.editor);
  const activePackage = useAppSelector(
    (s) => s.editor.packages.find((p) => p.id === s.editor.activePackageId)!,
  );

  const prompt = useMemo(() => {
    return buildRendererPrompt(
      {
        projectName: editorState.projectName,
        packageName: activePackage.name,
        variables: activePackage.variables,
        functions: activePackage.functions,
        runner: activePackage.runner,
        cdnPackages: activePackage.cdnPackages || [],
      },
      rendererId
    );
  }, [
    rendererId,
    editorState.projectName,
    activePackage.name,
    activePackage.variables,
    activePackage.functions,
    activePackage.runner,
    activePackage.cdnPackages,
  ]);

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-sm">Copy Prompt</DialogTitle>
          <DialogDescription className="text-xs">
            Copy this prompt and paste it into an AI assistant to vibe code your
            renderer visualization.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto">
          <pre className="text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl p-4 whitespace-pre-wrap leading-relaxed">
            {prompt}
          </pre>
        </div>
        <DialogFooter>
          <Button
            variant="default"
            size="sm"
            className="gap-1.5"
            onClick={handleCopy}
          >
            {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
            {copied ? "Copied!" : "Copy to Clipboard"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PromptDialog;
