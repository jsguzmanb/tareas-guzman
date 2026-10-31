-- CreateTable
CREATE TABLE "Routine" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "pausedAt" TIMESTAMP(3),
    "lastScheduledFor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Routine_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Routine_weekday_check" CHECK ("weekday" BETWEEN 0 AND 6)
);

-- AlterTable
ALTER TABLE "Task" ADD COLUMN "routineId" TEXT;
ALTER TABLE "Task" ADD COLUMN "routineScheduledFor" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Routine_id_ownerId_key" ON "Routine"("id", "ownerId");
CREATE INDEX "Routine_ownerId_pausedAt_idx" ON "Routine"("ownerId", "pausedAt");
CREATE INDEX "Task_ownerId_routineId_idx" ON "Task"("ownerId", "routineId");
CREATE UNIQUE INDEX "Task_routineId_routineScheduledFor_key" ON "Task"("routineId", "routineScheduledFor");

-- AddForeignKey
ALTER TABLE "Routine" ADD CONSTRAINT "Routine_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_routineId_ownerId_fkey" FOREIGN KEY ("routineId", "ownerId") REFERENCES "Routine"("id", "ownerId") ON DELETE RESTRICT ON UPDATE CASCADE;
