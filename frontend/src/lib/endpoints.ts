import { apiFetch } from "./api";
import type {
  ActivityEntry,
  BoardDetail,
  BoardMember,
  BoardRole,
  BoardSnapshot,
  BoardSummary,
  ChecklistItem,
  Column,
  Comment,
  Label,
  Priority,
  Task,
  TaskType,
  User,
} from "./types";

type ManageableRole = Extract<BoardRole, "editor" | "viewer">;

// --- Auth ---
export const authApi = {
  signup: (data: { email: string; password: string; name: string }) =>
    apiFetch<User>("/auth/signup", { method: "POST", body: data }),
  login: (data: { email: string; password: string }) =>
    apiFetch<User>("/auth/login", { method: "POST", body: data }),
  logout: () => apiFetch<{ message: string }>("/auth/logout", { method: "POST" }),
  me: () => apiFetch<User>("/auth/me"),
  requestReset: (email: string) =>
    apiFetch<{ message: string }>("/auth/password-reset/request", {
      method: "POST",
      body: { email },
    }),
  confirmReset: (token: string, new_password: string) =>
    apiFetch<{ message: string }>("/auth/password-reset/confirm", {
      method: "POST",
      body: { token, new_password },
    }),
};

// --- Boards ---
export const boardsApi = {
  list: () => apiFetch<BoardSummary[]>("/boards"),
  create: (data: { name: string; description?: string; color?: string }) =>
    apiFetch<BoardSummary>("/boards", { method: "POST", body: data }),
  get: (id: number) => apiFetch<BoardDetail>(`/boards/${id}`),
  update: (
    id: number,
    data: { name?: string; description?: string; color?: string },
  ) => apiFetch<BoardSummary>(`/boards/${id}`, { method: "PATCH", body: data }),
  remove: (id: number) =>
    apiFetch<void>(`/boards/${id}`, { method: "DELETE" }),
  addMember: (id: number, email: string, role: ManageableRole) =>
    apiFetch<BoardMember>(`/boards/${id}/members`, {
      method: "POST",
      body: { email, role },
    }),
  updateMemberRole: (id: number, userId: number, role: ManageableRole) =>
    apiFetch<BoardMember>(`/boards/${id}/members/${userId}`, {
      method: "PATCH",
      body: { role },
    }),
  removeMember: (id: number, userId: number) =>
    apiFetch<void>(`/boards/${id}/members/${userId}`, { method: "DELETE" }),
};

// --- Columns ---
export const columnsApi = {
  list: (boardId: number) =>
    apiFetch<Column[]>(`/boards/${boardId}/columns`),
  create: (boardId: number, name: string) =>
    apiFetch<Column>(`/boards/${boardId}/columns`, {
      method: "POST",
      body: { name },
    }),
  rename: (boardId: number, columnId: number, name: string) =>
    apiFetch<Column>(`/boards/${boardId}/columns/${columnId}`, {
      method: "PATCH",
      body: { name },
    }),
  remove: (boardId: number, columnId: number) =>
    apiFetch<void>(`/boards/${boardId}/columns/${columnId}`, {
      method: "DELETE",
    }),
  reorder: (boardId: number, columnIds: number[]) =>
    apiFetch<Column[]>(`/boards/${boardId}/columns/reorder`, {
      method: "POST",
      body: { column_ids: columnIds },
    }),
};

// --- Tasks ---
export interface TaskInput {
  title: string;
  description?: string | null;
  due_date?: string | null;
  priority?: Priority;
  type?: TaskType;
  assignee_id?: number | null;
  label_ids?: number[];
}

export const tasksApi = {
  snapshot: (boardId: number) =>
    apiFetch<BoardSnapshot>(`/boards/${boardId}/tasks`),
  create: (boardId: number, columnId: number, data: TaskInput) =>
    apiFetch<Task>(`/boards/${boardId}/tasks?column_id=${columnId}`, {
      method: "POST",
      body: data,
    }),
  update: (boardId: number, taskId: number, data: Partial<TaskInput>) =>
    apiFetch<Task>(`/boards/${boardId}/tasks/${taskId}`, {
      method: "PATCH",
      body: data,
    }),
  remove: (boardId: number, taskId: number) =>
    apiFetch<void>(`/boards/${boardId}/tasks/${taskId}`, { method: "DELETE" }),
  move: (boardId: number, taskId: number, columnId: number, position: number) =>
    apiFetch<Task>(`/boards/${boardId}/tasks/${taskId}/move`, {
      method: "POST",
      body: { column_id: columnId, position },
    }),
};

// --- Checklist (subtasks) ---
export const checklistApi = {
  list: (boardId: number, taskId: number) =>
    apiFetch<ChecklistItem[]>(`/boards/${boardId}/tasks/${taskId}/checklist`),
  create: (boardId: number, taskId: number, content: string) =>
    apiFetch<ChecklistItem>(`/boards/${boardId}/tasks/${taskId}/checklist`, {
      method: "POST",
      body: { content },
    }),
  update: (
    boardId: number,
    taskId: number,
    itemId: number,
    data: { content?: string; is_done?: boolean },
  ) =>
    apiFetch<ChecklistItem>(
      `/boards/${boardId}/tasks/${taskId}/checklist/${itemId}`,
      { method: "PATCH", body: data },
    ),
  reorder: (boardId: number, taskId: number, itemIds: number[]) =>
    apiFetch<ChecklistItem[]>(
      `/boards/${boardId}/tasks/${taskId}/checklist/reorder`,
      { method: "POST", body: { item_ids: itemIds } },
    ),
  remove: (boardId: number, taskId: number, itemId: number) =>
    apiFetch<void>(`/boards/${boardId}/tasks/${taskId}/checklist/${itemId}`, {
      method: "DELETE",
    }),
};

// --- Comments ---
export const commentsApi = {
  list: (boardId: number, taskId: number) =>
    apiFetch<Comment[]>(`/boards/${boardId}/tasks/${taskId}/comments`),
  create: (boardId: number, taskId: number, content: string) =>
    apiFetch<Comment>(`/boards/${boardId}/tasks/${taskId}/comments`, {
      method: "POST",
      body: { content },
    }),
  remove: (boardId: number, taskId: number, commentId: number) =>
    apiFetch<void>(`/boards/${boardId}/tasks/${taskId}/comments/${commentId}`, {
      method: "DELETE",
    }),
};

// --- Labels ---
export const labelsApi = {
  list: (boardId: number) => apiFetch<Label[]>(`/boards/${boardId}/labels`),
  create: (boardId: number, name: string, color: string) =>
    apiFetch<Label>(`/boards/${boardId}/labels`, {
      method: "POST",
      body: { name, color },
    }),
  remove: (boardId: number, labelId: number) =>
    apiFetch<void>(`/boards/${boardId}/labels/${labelId}`, { method: "DELETE" }),
};

// --- Activity ---
export const activityApi = {
  list: (boardId: number, limit = 20) =>
    apiFetch<ActivityEntry[]>(`/boards/${boardId}/activity?limit=${limit}`),
};
