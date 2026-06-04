export interface CursorData {
  createdAt: string;
  id: string;
}

export function encodeCursor(data: CursorData): string {
  return Buffer.from(JSON.stringify(data), "utf8").toString("base64url");
}

export function decodeCursor(cursor: string | undefined): CursorData | null {
  if (!cursor) {
    return null;
  }
  try {
    const value = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as Partial<CursorData>;
    if (typeof value.createdAt !== "string" || typeof value.id !== "string") {
      return null;
    }
    return {
      createdAt: value.createdAt,
      id: value.id
    };
  } catch {
    return null;
  }
}
