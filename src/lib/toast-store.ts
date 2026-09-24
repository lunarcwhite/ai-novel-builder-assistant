/**
 * Pure toast store (Phase 0 design-system foundation).
 * Kept in plain `.ts` so the reducer stays unit-testable without a DOM runner.
 */

export type ToastVariant = "success" | "error" | "info";

export interface ToastItem {
  id: number;
  title: string;
  description?: string;
  variant: ToastVariant;
}

export interface ToastState {
  toasts: ToastItem[];
  nextId: number;
}

export type ToastAction =
  | { type: "push"; title: string; description?: string; variant?: ToastVariant }
  | { type: "dismiss"; id: number }
  | { type: "clear" };

export const MAX_TOASTS = 3;

export const initialToastState: ToastState = { toasts: [], nextId: 1 };

export function toastReducer(state: ToastState, action: ToastAction): ToastState {
  switch (action.type) {
    case "push": {
      const item: ToastItem = {
        id: state.nextId,
        title: action.title,
        description: action.description,
        variant: action.variant ?? "success",
      };
      return {
        toasts: [...state.toasts, item].slice(-MAX_TOASTS),
        nextId: state.nextId + 1,
      };
    }
    case "dismiss":
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) };
    case "clear":
      return { ...state, toasts: [] };
  }
}
