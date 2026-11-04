type PrismaKnownErrorLike = {
  code: string;
  meta?: Record<string, unknown>;
};

export function isConsumedAccessTokenConflict(error: PrismaKnownErrorLike) {
  if (error.code !== "P2002") return false;

  if (error.meta?.modelName === "ConsumedAccessToken") return true;

  const target = error.meta?.target;
  return Array.isArray(target)
    ? target.includes("jti")
    : typeof target === "string" && target.includes("jti");
}
