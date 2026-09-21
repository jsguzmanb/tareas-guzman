import { prisma } from "@/lib/prisma";
import { NEXT_ACTION_LIMIT } from "@/lib/constants";
import ReviewChecklist from "@/components/ReviewChecklist";
import { requireActiveUser } from "@/lib/dal";

export default async function ReviewPage() {
  const user = await requireActiveUser();
  const [inboxCount, projectsCount, somedayCount, nextActionsCount, lastReview] =
    await Promise.all([
      prisma.task.count({ where: { ownerId: user.id, status: "INBOX" } }),
      prisma.project.count({ where: { ownerId: user.id, archived: false } }),
      prisma.task.count({ where: { ownerId: user.id, status: "SOMEDAY" } }),
      prisma.task.count({ where: { ownerId: user.id, status: "NEXT_ACTION" } }),
      prisma.weeklyReview.findFirst({
        where: { ownerId: user.id },
        orderBy: { completedAt: "desc" },
      }),
    ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-neutral-900">Revisión semanal</h1>
      <ReviewChecklist
        inboxCount={inboxCount}
        projectsCount={projectsCount}
        somedayCount={somedayCount}
        nextActionsCount={nextActionsCount}
        limit={NEXT_ACTION_LIMIT}
        lastReviewAt={
          lastReview
            ? lastReview.completedAt.toLocaleDateString("es-MX", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })
            : null
        }
      />
    </div>
  );
}
