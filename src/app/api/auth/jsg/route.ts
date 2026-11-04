import { Prisma } from "@/generated/prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { verifyJsgAccessToken } from "@/lib/jsg-access-token";
import {
  consumeJsgAccessToken,
  IdentityConflictError,
} from "@/lib/jsg-identity";
import { isConsumedAccessTokenConflict } from "@/lib/prisma-errors";
import { prisma } from "@/lib/prisma";

function loginRedirect(request: NextRequest, reason: string) {
  const url = new URL("/login", request.url);
  url.searchParams.set("reason", reason);
  return NextResponse.redirect(url, 303);
}

export async function POST(request: NextRequest) {
  let token = "";
  try {
    const formData = await request.formData();
    token = String(formData.get("token") ?? "");
  } catch {
    return loginRedirect(request, "invalid_invitation");
  }

  let claims;
  try {
    claims = await verifyJsgAccessToken(token);
  } catch {
    return loginRedirect(request, "invalid_invitation");
  }

  try {
    const result = await prisma.$transaction(
      (tx) => consumeJsgAccessToken(tx, claims),
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    if (!result.membershipActive) {
      return loginRedirect(request, "access_revoked");
    }

    await createSession(result.userId);
    return NextResponse.redirect(new URL("/", request.url), 303);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      isConsumedAccessTokenConflict(error)
    ) {
      return loginRedirect(request, "link_used");
    }
    if (error instanceof IdentityConflictError) {
      return loginRedirect(request, "identity_conflict");
    }
    console.error("[jsg-access] no se pudo consumir el token", error);
    return loginRedirect(request, "access_error");
  }
}
