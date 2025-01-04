import { Deck, idToShareId } from "@gi-tcg/utils";

export interface PlayerInfo {
  isGuest: boolean;
  id: number | string;
  name: string;
  deck: Deck;
}

export function getAvatarUrl(userId: number) {
  return `https://avatars.githubusercontent.com/u/${userId}?v=4`;
}

export function getPlayerAvatarUrl(player: PlayerInfo) {
  if (player.isGuest) {
    return `https://placehold.jp/50x50.png?text=${encodeURIComponent(
      String.fromCodePoint(player.name.codePointAt(0)!),
    )}`;
  } else {
    return getAvatarUrl(player.id as number);
  }
}

export async function copyToClipboard(content: string) {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(content);
  } else {
    const textarea = document.createElement("textarea");
    textarea.value = content;
    textarea.style.position = "fixed";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      document.execCommand("copy");
    } finally {
      document.body.removeChild(textarea);
    }
  }
}

export function roomIdToCode(id: number) {
  return String(id).padStart(4, "0");
}

export function roomCodeToId(code: string) {
  return Number.parseInt(code, 10);
}
