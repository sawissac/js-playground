"use client";

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { v4 as uuidv4 } from "uuid";
import type { Runner, CdnPackage, VariableInterface, FunctionInterface } from "@/state/types";

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * A single canvas renderer instance and its runner configuration.
 * Each renderer node on the canvas gets its own CanvasRendererEntry.
 */
export interface CanvasRendererEntry {
  /** Stable renderer DOM ID — matches the `id` of the canvas renderer node */
  rendererId: string;
  /** Human-readable label shown in the renderer node header */
  label: string;
  /**
   * Ordered runner steps for *this* renderer.
   * Derived from the canvas edge connections but editable independently.
   */
  runner: Runner[];
  /**
   * Snapshot of variables scoped to this renderer's package.
   * Copied from the editor slice so the canvas runner is fully independent.
   * Variable names are enforced unique within each renderer entry.
   */
  variables: VariableInterface[];
  /**
   * Snapshot of functions available to this renderer.
   */
  functions: FunctionInterface[];
  /**
   * CDN packages loaded by this renderer. Each renderer only runs its own CDN list.
   */
  cdnPackages: CdnPackage[];
  /** Package this renderer belongs to */
  packageId: string;
}

export interface CanvasRunnerState {
  /** Map from rendererId → CanvasRendererEntry */
  renderers: Record<string, CanvasRendererEntry>;
}

const initialState: CanvasRunnerState = {
  renderers: {},
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Ensure a variable name is unique within the variables list. Suffix with _N if collision. */
function deduplicateVariableName(
  name: string,
  existing: VariableInterface[],
  excludeId?: string
): string {
  const others = existing.filter((v) => v.id !== excludeId);
  if (!others.some((v) => v.name === name)) return name;

  let counter = 1;
  let candidate = `${name}_${counter}`;
  while (others.some((v) => v.name === candidate)) {
    counter++;
    candidate = `${name}_${counter}`;
  }
  return candidate;
}

// ─── Slice ────────────────────────────────────────────────────────────────────

const canvasRunnerSlice = createSlice({
  name: "canvasRunner",
  initialState,
  reducers: {
    // ── Renderer Registration ──────────────────────────────────────────────

    /** Register a new renderer node. Called when a renderer node is added to the canvas. */
    registerRenderer(
      state,
      action: PayloadAction<{
        rendererId: string;
        label: string;
        packageId: string;
        runner?: Runner[];
        variables?: VariableInterface[];
        functions?: FunctionInterface[];
        cdnPackages?: CdnPackage[];
      }>
    ) {
      const {
        rendererId,
        label,
        packageId,
        runner = [],
        variables = [],
        functions = [],
        cdnPackages = [],
      } = action.payload;
      if (state.renderers[rendererId]) return; // Already registered

      // Deduplicate variable names within this renderer's scope
      const deduped: VariableInterface[] = [];
      for (const v of variables) {
        const safeName = deduplicateVariableName(v.name, deduped);
        deduped.push({ ...v, name: safeName });
      }

      state.renderers[rendererId] = {
        rendererId,
        label,
        packageId,
        runner,          // ← seeded from the editor package runner
        variables: deduped,
        functions,
        cdnPackages,
      };
    },

    /** Unregister a renderer node — called when the renderer node is deleted. */
    unregisterRenderer(state, action: PayloadAction<string>) {
      delete state.renderers[action.payload];
    },

    /** Update the label of a renderer entry (syncs with canvas node rename). */
    setRendererLabel(
      state,
      action: PayloadAction<{ rendererId: string; label: string }>
    ) {
      const entry = state.renderers[action.payload.rendererId];
      if (entry) {
        entry.label = action.payload.label;
      }
    },

    // ── Runner Steps ───────────────────────────────────────────────────────

    /** Replace the entire runner steps array for a renderer */
    setCanvasRunner(
      state,
      action: PayloadAction<{ rendererId: string; runner: Runner[] }>
    ) {
      const entry = state.renderers[action.payload.rendererId];
      if (entry) {
        entry.runner = action.payload.runner;
      }
    },

    /** Add a "set" step to a renderer's runner */
    addSetStep(
      state,
      action: PayloadAction<{ rendererId: string; target: [string, string] }>
    ) {
      const entry = state.renderers[action.payload.rendererId];
      if (entry) {
        entry.runner.push({
          id: uuidv4(),
          type: "set",
          target: action.payload.target,
          args: [],
        });
      }
    },

    /** Add a "call" step to a renderer's runner */
    addCallStep(
      state,
      action: PayloadAction<{
        rendererId: string;
        target: [string, string];
        args: string[];
      }>
    ) {
      const entry = state.renderers[action.payload.rendererId];
      if (entry) {
        entry.runner.push({
          id: uuidv4(),
          type: "call",
          target: action.payload.target,
          args: action.payload.args,
        });
      }
    },

    /** Add a "code" step to a renderer's runner */
    addCodeStep(
      state,
      action: PayloadAction<{
        rendererId: string;
        target: [string, string];
        code?: string;
      }>
    ) {
      const entry = state.renderers[action.payload.rendererId];
      if (entry) {
        entry.runner.push({
          id: uuidv4(),
          type: "code",
          target: action.payload.target,
          args: [],
          code: action.payload.code ?? "return @this;\n",
        });
      }
    },

    /** Update a specific runner step */
    updateCanvasRunnerStep(
      state,
      action: PayloadAction<{ rendererId: string; stepId: string; step: Runner }>
    ) {
      const entry = state.renderers[action.payload.rendererId];
      if (entry) {
        const idx = entry.runner.findIndex((r) => r.id === action.payload.stepId);
        if (idx !== -1) {
          entry.runner[idx] = { ...action.payload.step, id: action.payload.stepId };
        }
      }
    },

    /** Remove a runner step */
    removeCanvasRunnerStep(
      state,
      action: PayloadAction<{ rendererId: string; stepId: string }>
    ) {
      const entry = state.renderers[action.payload.rendererId];
      if (entry) {
        entry.runner = entry.runner.filter((r) => r.id !== action.payload.stepId);
      }
    },

    /** Reorder runner steps */
    reorderCanvasRunnerSteps(
      state,
      action: PayloadAction<{ rendererId: string; fromIndex: number; toIndex: number }>
    ) {
      const entry = state.renderers[action.payload.rendererId];
      if (entry) {
        const { fromIndex, toIndex } = action.payload;
        const [moved] = entry.runner.splice(fromIndex, 1);
        entry.runner.splice(toIndex, 0, moved);
      }
    },

    // ── Variables (canvas-scoped, no-duplicate enforcement) ────────────────

    /** Sync variables from the editor package into this renderer (called on save or init). */
    syncRendererVariables(
      state,
      action: PayloadAction<{ rendererId: string; variables: VariableInterface[] }>
    ) {
      const entry = state.renderers[action.payload.rendererId];
      if (!entry) return;

      const deduped: VariableInterface[] = [];
      for (const v of action.payload.variables) {
        const safeName = deduplicateVariableName(v.name, deduped);
        deduped.push({ ...v, name: safeName });
      }
      entry.variables = deduped;
    },

    /** Sync runner steps from the editor package into this renderer.
     * Only replaces the runner if it is currently empty (never overwrite
     * custom steps the user may have configured). Use setCanvasRunner to
     * force-replace.
     */
    syncRendererRunner(
      state,
      action: PayloadAction<{ rendererId: string; runner: Runner[] }>
    ) {
      const entry = state.renderers[action.payload.rendererId];
      if (entry) {
        // Always keep in sync — canvas runner mirrors the editor runner steps
        entry.runner = action.payload.runner;
      }
    },

    /** Update a single variable's value for this renderer */
    updateRendererVariableValue(
      state,
      action: PayloadAction<{ rendererId: string; variableId: string; value: any }>
    ) {
      const entry = state.renderers[action.payload.rendererId];
      if (entry) {
        const v = entry.variables.find((v) => v.id === action.payload.variableId);
        if (v) v.value = action.payload.value;
      }
    },

    // ── Functions (canvas-scoped) ──────────────────────────────────────────

    /** Sync functions from the editor package into this renderer (called on save or init). */
    syncRendererFunctions(
      state,
      action: PayloadAction<{ rendererId: string; functions: FunctionInterface[] }>
    ) {
      const entry = state.renderers[action.payload.rendererId];
      if (entry) {
        entry.functions = action.payload.functions;
      }
    },

    // ── CDN Packages ──────────────────────────────────────────────────────

    /** Replace CDN packages for a renderer */
    setRendererCdnPackages(
      state,
      action: PayloadAction<{ rendererId: string; cdnPackages: CdnPackage[] }>
    ) {
      const entry = state.renderers[action.payload.rendererId];
      if (entry) {
        entry.cdnPackages = action.payload.cdnPackages;
      }
    },

    /** Add a CDN package to a specific renderer */
    addRendererCdnPackage(
      state,
      action: PayloadAction<{ rendererId: string; name: string; url: string }>
    ) {
      const entry = state.renderers[action.payload.rendererId];
      if (entry) {
        const { name, url } = action.payload;
        // Prevent duplicates by URL
        if (!entry.cdnPackages.some((c) => c.url === url)) {
          entry.cdnPackages.push({ id: uuidv4(), name, url, enabled: true });
        }
      }
    },

    /** Remove a CDN package from a renderer */
    removeRendererCdnPackage(
      state,
      action: PayloadAction<{ rendererId: string; cdnId: string }>
    ) {
      const entry = state.renderers[action.payload.rendererId];
      if (entry) {
        entry.cdnPackages = entry.cdnPackages.filter(
          (c) => c.id !== action.payload.cdnId
        );
      }
    },

    /** Toggle enabled state of a CDN package */
    toggleRendererCdnPackage(
      state,
      action: PayloadAction<{ rendererId: string; cdnId: string }>
    ) {
      const entry = state.renderers[action.payload.rendererId];
      if (entry) {
        const cdn = entry.cdnPackages.find((c) => c.id === action.payload.cdnId);
        if (cdn) cdn.enabled = !cdn.enabled;
      }
    },

    // ── Bulk state hydration (for persistence restore) ─────────────────────

    /** Restore all renderer state from persisted data */
    hydrateCanvasRunner(state, action: PayloadAction<CanvasRunnerState>) {
      return action.payload;
    },

    /** Clear all canvas runner state */
    clearCanvasRunners(state) {
      state.renderers = {};
    },
  },
});

export const {
  registerRenderer,
  unregisterRenderer,
  setRendererLabel,
  setCanvasRunner,
  addSetStep,
  addCallStep,
  addCodeStep,
  updateCanvasRunnerStep,
  removeCanvasRunnerStep,
  reorderCanvasRunnerSteps,
  syncRendererVariables,
  syncRendererRunner,
  updateRendererVariableValue,
  syncRendererFunctions,
  setRendererCdnPackages,
  addRendererCdnPackage,
  removeRendererCdnPackage,
  toggleRendererCdnPackage,
  hydrateCanvasRunner,
  clearCanvasRunners,
} = canvasRunnerSlice.actions;

export default canvasRunnerSlice.reducer;
