import { Accessor, createResource, createSignal } from "solid-js";
import { makePersisted } from "@solid-primitives/storage";
import axios from "axios";
import { useAuth } from "./auth";
import { useGuestInfo } from "./guest";

export interface UseChessboardColorResult {
  readonly color: Accessor<string | null>;
  readonly loading: Accessor<boolean>;
  readonly error: Accessor<any>;
  readonly refetch: () => void;
  readonly setColor: (color: string | null) => Promise<void>;
}

const [guestColor, setGuestColor] = makePersisted(
  createSignal<string | null>(null),
  { storage: localStorage },
);

export function useChessboardColor(): UseChessboardColorResult {
  const { status } = useAuth();
  const [guestInfo] = useGuestInfo();

  const [userColor, { refetch }] = createResource(
    status,
    async () => {
      const { data } = await axios.get("users/me");
      // data may be null when not logged in
      return data ? (data.chessboardColor ?? null) : null;
    },
    { initialValue: null },
  );

  const color = () => {
    const s = status();
    if (s.type === "guest") {
      return guestColor();
    }
    // user
    if (userColor.state === "ready") {
      return userColor();
    }
    return null;
  };

  const setColor = async (c: string | null) => {
    const s = status();
    if (s.type === "guest") {
      // guest: persist locally
      setGuestColor(c);
      return;
    }
    // user: update via API, then refetch
    await axios.patch("users/me", { chessboardColor: c });
    // also persist locally as fallback
    setGuestColor(c);
    await refetch();
  };

  return {
    color: () => color(),
    loading: () => status().type === "user" && userColor.loading,
    error: () => (status().type === "user" ? userColor.error : void 0),
    refetch,
    setColor,
  };
}
