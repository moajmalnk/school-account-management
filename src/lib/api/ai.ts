import { apiRequest } from "@/lib/api/client";
import { normalizeFeezoNavigation } from "@/lib/ai-navigation";

export type FeezoLocale = "en" | "ml";

export type FeezoChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type FeezoUiBlock =
  | {
      type: "table";
      title?: string;
      columns: string[];
      rows: Array<Array<string | number | null>>;
    }
  | {
      type: "cards";
      items: Array<{ title: string; subtitle?: string; value?: string }>;
    }
  | {
      type: "chart";
      chartType: "pie" | "bar" | "line";
      title?: string;
      labels: string[];
      values: number[];
    }
  | {
      type: "buttons";
      items: Array<{
        label: string;
        action: "navigate" | string;
        to?: string;
        search?: Record<string, string | undefined>;
      }>;
    }
  | {
      type: "text";
      text: string;
    };

export type FeezoPendingAction = {
  id: string;
  type: string;
  summary: string;
  payload: Record<string, unknown>;
  api: string;
  status: string;
};

export type FeezoNavigation = {
  to: string;
  search?: Record<string, string | undefined>;
  label?: string;
};

export type FeezoChatResponse = {
  reply: string;
  blocks: FeezoUiBlock[];
  pendingActions: FeezoPendingAction[];
  navigations: FeezoNavigation[];
  model?: string;
};

export async function apiAiChat(input: {
  messages: FeezoChatMessage[];
  locale: FeezoLocale;
}): Promise<FeezoChatResponse> {
  const data = await apiRequest<FeezoChatResponse>("/api/ai/chat.php", {
    method: "POST",
    body: input,
    timeoutMs: 90_000,
  });
  const navigations: FeezoNavigation[] = [];
  if (Array.isArray(data.navigations)) {
    for (const nav of data.navigations) {
      const n = normalizeFeezoNavigation(nav);
      if (n) {
        navigations.push({ to: n.to, search: n.search, label: n.label });
      }
    }
  }

  return {
    reply: data.reply ?? "",
    blocks: Array.isArray(data.blocks) ? data.blocks : [],
    pendingActions: Array.isArray(data.pendingActions) ? data.pendingActions : [],
    navigations,
    model: data.model,
  };
}

export type FeezoFeedbackRating = "up" | "down";

export async function apiAiFeedback(input: {
  messageId: string;
  rating: FeezoFeedbackRating | null;
  content?: string;
  locale?: FeezoLocale;
  model?: string;
}): Promise<{ id?: string; rating?: string; messageId: string; cleared?: boolean }> {
  return apiRequest("/api/ai/feedback.php", {
    method: "POST",
    body: {
      messageId: input.messageId,
      rating: input.rating,
      content: input.content,
      locale: input.locale ?? "en",
      model: input.model,
    },
  });
}
