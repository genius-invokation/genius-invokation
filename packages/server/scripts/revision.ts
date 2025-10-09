import { getRevision } from "./revision.macro" with { type: "macro" };

export const revision = await getRevision();
