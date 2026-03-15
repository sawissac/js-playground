"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { IconHelpCircle } from "@tabler/icons-react";

export function HelpModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" className="h-6 w-6 text-slate-500 hover:text-blue-600 hover:bg-slate-200" title="Editor Help & Tips">
          <IconHelpCircle size={16} />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editor Tokens & Pro Tips</DialogTitle>
          <DialogDescription>
            Learn how to use runtime tokens and navigate the code editor to build powerful logic seamlessly.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-4">
          
          {/* Section: Dynamic Tokens */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 border-b pb-1">Dynamic Tokens</h3>
            <p className="text-xs text-slate-600">
              Tokens allow you to reference values, variables, and runtime contexts inside your <b>Actions</b> and <b>Code blocks</b>. 
              Prefix them with an <code>@</code> symbol.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-md border">
                <p className="font-semibold text-blue-600 mb-1">State &amp; Context</p>
                <ul className="space-y-1.5 text-slate-700 list-disc ml-4">
                  <li><code>@this</code> or <code>@t</code> - The current working value in the action fluid pipe.</li>
                  <li><code>@temp[N]</code> (e.g., <code>@temp1</code>) - Temporary stored variables via the "temp" action.</li>
                  <li><code>@math[N]</code> - Results evaluated from the "math" action block.</li>
                  <li><code>@pick(N)</code> - Pull values saved from specific previous steps (1-indexed).</li>
                </ul>
              </div>
              <div className="bg-slate-50 p-3 rounded-md border">
                <p className="font-semibold text-green-600 mb-1">Function Arguments</p>
                <ul className="space-y-1.5 text-slate-700 list-disc ml-4">
                  <li><code>@arg[N]</code> (e.g., <code>@arg1</code>, <code>@arg2</code>) - Access arguments passed down by the caller or loop block.</li>
                </ul>
                <p className="font-semibold text-purple-600 mt-3 mb-1">Shortcuts</p>
                <ul className="space-y-1.5 text-slate-700 list-disc ml-4">
                  <li><code>@space</code> or <code>@s</code> - Inserts a space character " ".</li>
                  <li><code>@comma</code> or <code>@c</code> - Inserts a comma ",".</li>
                  <li><code>@empty</code> or <code>@e</code> - Inserts an empty string.</li>
                </ul>
              </div>
            </div>

            <div className="bg-yellow-50/50 p-3 rounded-md border border-yellow-200 mt-2">
              <p className="text-xs font-medium text-yellow-800 mb-1">Pro Tip: Dot Property Access</p>
              <p className="text-xs text-yellow-700">
                You can traverse objects dynamically! Example: <code>@this.length</code> or <code>@arg1.user.name</code>.
              </p>
            </div>
          </div>

          {/* Section: Code Editor Blocks */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 border-b pb-1">Writing Custom &quot;Code&quot; Blocks</h3>
            <p className="text-xs text-slate-600">
              When using the <b>code</b> action, you can write vanilla Javascript to manipulate the fluid pipe.
            </p>

            <ul className="text-xs space-y-2 text-slate-700 list-disc ml-4">
              <li>
                <b>Return statements:</b> To pass data to the next block, use the <code>return</code> keyword. 
                <br /><code className="bg-slate-100 px-1 py-0.5 rounded ml-2">return @this.map(x =&gt; x.toUpperCase());</code>
              </li>
              <li>
                <b>Asynchronous operations:</b> The code engine natively supports asynchronous logic! You can use Top-Level await seamlessly.
                <br /><code className="bg-slate-100 px-1 py-0.5 rounded ml-2">const res = await fetch('https://api.example.com'); return await res.json();</code>
              </li>
              <li>
                <b>Token Contexts:</b> All your <code>@</code> tokens resolve correctly inside code execution strings. They become native javascript objects behind the scenes!
              </li>
            </ul>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
