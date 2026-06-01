"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Trash2, UserPlus, SlidersHorizontal, Users } from "lucide-react";
import {
  Dialog,
  DialogBody,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Avatar } from "@/components/ui/misc";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { ApiRequestError } from "@/lib/api";
import {
  useInviteMember,
  useRemoveMember,
  useUpdateBoard,
  useUpdateMemberRole,
} from "@/hooks/use-boards";
import type { BoardDetail, BoardMember } from "@/lib/types";

const COLORS = ["#58A6FF", "#3FB950", "#D29922", "#F85149", "#BC8CFF", "#39C5CF"];

export function BoardSettingsDialog({
  board,
  open,
  onClose,
}: {
  board: BoardDetail;
  open: boolean;
  onClose: () => void;
}) {
  const t = useT();
  const [tab, setTab] = useState<"details" | "members">("details");

  const TABS = [
    { id: "details" as const, key: "settings.tab.details", icon: SlidersHorizontal },
    { id: "members" as const, key: "settings.tab.members", icon: Users },
  ];

  return (
    <Dialog open={open} onClose={onClose} className="max-w-2xl">
      <DialogHeader title={t("settings.title")} onClose={onClose} />
      <div className="grid sm:grid-cols-[180px_1fr]">
        {/* Side tab rail */}
        <div className="flex gap-1 border-b border-border/70 p-3 sm:flex-col sm:border-b-0 sm:border-e">
          {TABS.map(({ id, key, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "flex flex-1 items-center gap-2.5 rounded-md px-3 py-2 text-left text-[13.5px] font-medium transition-colors sm:flex-none",
                tab === id
                  ? "glass-clear text-fg"
                  : "text-fg-muted hover:bg-fg/[0.07] hover:text-fg",
              )}
            >
              <Icon size={16} className="shrink-0" />
              {t(key)}
            </button>
          ))}
        </div>

        {/* Active pane */}
        <div className="min-w-0">
          {tab === "details" ? (
            <DetailsTab board={board} onClose={onClose} />
          ) : (
            <MembersTab board={board} />
          )}
        </div>
      </div>
    </Dialog>
  );
}

function DetailsTab({
  board,
  onClose,
}: {
  board: BoardDetail;
  onClose: () => void;
}) {
  const t = useT();
  const update = useUpdateBoard(board.id);
  const [name, setName] = useState(board.name);
  const [description, setDescription] = useState(board.description ?? "");
  const [color, setColor] = useState(board.color);

  const save = () => {
    if (!name.trim()) return;
    update.mutate(
      { name: name.trim(), description: description.trim() || undefined, color },
      {
        onSuccess: () => {
          toast.success(t("settings.details.saved"));
          onClose();
        },
        onError: () => toast.error(t("settings.details.error")),
      },
    );
  };

  return (
    <>
      <DialogBody>
        <div className="space-y-4">
          <div>
            <Label htmlFor="b-name">{t("createBoard.name")}</Label>
            <Input
              id="b-name"
              dir="auto"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="b-desc">{t("createBoard.description")}</Label>
            <Textarea
              id="b-desc"
              dir="auto"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>{t("createBoard.color")}</Label>
            <div className="mt-2 flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={cn(
                    "h-7 w-7 rounded-full transition-transform",
                    color === c
                      ? "ring-2 ring-fg ring-offset-2 ring-offset-bg-subtle scale-110"
                      : "hover:scale-110",
                  )}
                  aria-label={c}
                />
              ))}
            </div>
          </div>
        </div>
      </DialogBody>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>
          {t("common.cancel")}
        </Button>
        <Button
          onClick={save}
          loading={update.isPending}
          disabled={!name.trim()}
        >
          {t("settings.details.save")}
        </Button>
      </DialogFooter>
    </>
  );
}

function MembersTab({ board }: { board: BoardDetail }) {
  const t = useT();
  const invite = useInviteMember(board.id);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"editor" | "viewer">("editor");

  const submitInvite = (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!value) return;
    invite.mutate(
      { email: value, role },
      {
        onSuccess: (member) => {
          toast.success(t("settings.invite.success", { name: member.user.name }));
          setEmail("");
        },
        onError: (err) => {
          const code = err instanceof ApiRequestError ? err.code : "";
          const key =
            code === "already_member"
              ? "settings.invite.alreadyMember"
              : code === "user_not_found"
                ? "settings.invite.notFound"
                : "settings.invite.error";
          toast.error(t(key));
        },
      },
    );
  };

  return (
    <DialogBody>
      {/* Invite form */}
      <form onSubmit={submitInvite} className="space-y-2">
        <Label htmlFor="invite-email">{t("settings.members.heading")}</Label>
        <div className="flex gap-2">
          <Input
            id="invite-email"
            type="email"
            dir="ltr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("settings.members.invitePlaceholder")}
            className="flex-1"
          />
          <Select
            wrapperClassName="w-auto"
            value={role}
            onChange={(e) => setRole(e.target.value as "editor" | "viewer")}
          >
            <option value="editor">{t("boards.role.editor")}</option>
            <option value="viewer">{t("boards.role.viewer")}</option>
          </Select>
          <Button
            type="submit"
            loading={invite.isPending}
            disabled={!email.trim()}
          >
            {!invite.isPending && <UserPlus size={15} />}
            {t("settings.members.invite")}
          </Button>
        </div>
        <p className="text-xs text-fg-subtle">{t("settings.members.inviteHint")}</p>
      </form>

      {/* Member list */}
      <ul className="mt-4 space-y-1.5">
        {board.members.map((m) => (
          <MemberRow key={m.user.id} boardId={board.id} member={m} />
        ))}
      </ul>
    </DialogBody>
  );
}

function MemberRow({
  boardId,
  member,
}: {
  boardId: number;
  member: BoardMember;
}) {
  const t = useT();
  const updateRole = useUpdateMemberRole(boardId);
  const removeMember = useRemoveMember(boardId);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const isOwner = member.role === "owner";

  return (
    <li className="flex items-center gap-2.5 rounded-md px-1 py-1.5">
      <Avatar name={member.user.name} src={member.user.avatar_url} size={28} />
      <div className="min-w-0 flex-1">
        <p dir="auto" className="truncate text-sm font-medium text-fg">
          {member.user.name}
        </p>
        <p dir="ltr" className="truncate text-xs text-fg-subtle">
          {member.user.email}
        </p>
      </div>

      {isOwner ? (
        <span className="rounded-full bg-bg-muted px-2 py-0.5 text-[11px] text-fg-muted">
          {t("settings.members.owner")}
        </span>
      ) : (
        <>
          <Select
            selectSize="sm"
            wrapperClassName="w-auto"
            value={member.role}
            onChange={(e) =>
              updateRole.mutate(
                { userId: member.user.id, role: e.target.value as "editor" | "viewer" },
                {
                  onSuccess: () => toast.success(t("settings.role.changed")),
                  onError: () => toast.error(t("settings.role.error")),
                },
              )
            }
            disabled={updateRole.isPending}
          >
            <option value="editor">{t("boards.role.editor")}</option>
            <option value="viewer">{t("boards.role.viewer")}</option>
          </Select>
          <button
            onClick={() => setConfirmOpen(true)}
            title={t("settings.members.remove")}
            aria-label={t("settings.members.remove")}
            className="rounded-md p-1.5 text-fg-subtle hover:bg-danger/15 hover:text-danger"
          >
            <Trash2 size={15} />
          </button>
        </>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title={t("settings.members.removeConfirmTitle")}
        message={t("settings.members.removeConfirm", { name: member.user.name })}
        confirmLabel={t("settings.members.remove")}
        destructive
        loading={removeMember.isPending}
        onConfirm={() =>
          removeMember.mutate(member.user.id, {
            onSuccess: () => {
              toast.success(t("settings.member.removed"));
              setConfirmOpen(false);
            },
            onError: () => toast.error(t("settings.member.removeError")),
          })
        }
        onCancel={() => setConfirmOpen(false)}
      />
    </li>
  );
}
