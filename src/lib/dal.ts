import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const requireActiveUser = cache(async () => {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findFirst({
    where: {
      id: session.userId,
      accessGrants: {
        some: {
          entitlement: "tasks",
          active: true,
        },
      },
    },
    select: {
      id: true,
      identityEmail: true,
      username: true,
    },
  });

  if (!user) redirect("/login?reason=access_revoked");
  return user;
});
