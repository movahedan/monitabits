/*
  Warnings:

  - You are about to drop the column `lockdownMinutes` on the `settings` table. All the data in the column will be lost.
  - You are about to drop the `actions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `check_ins` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `follow_ups` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `security_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sessions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "actions" DROP CONSTRAINT "actions_deviceId_fkey";

-- DropForeignKey
ALTER TABLE "actions" DROP CONSTRAINT "actions_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "check_ins" DROP CONSTRAINT "check_ins_deviceId_fkey";

-- DropForeignKey
ALTER TABLE "check_ins" DROP CONSTRAINT "check_ins_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "follow_ups" DROP CONSTRAINT "follow_ups_actionId_fkey";

-- DropForeignKey
ALTER TABLE "follow_ups" DROP CONSTRAINT "follow_ups_deviceId_fkey";

-- DropForeignKey
ALTER TABLE "security_logs" DROP CONSTRAINT "security_logs_deviceId_fkey";

-- DropForeignKey
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_deviceId_fkey";

-- AlterTable
ALTER TABLE "settings" DROP COLUMN "lockdownMinutes",
ADD COLUMN     "longBreakMinutes" INTEGER NOT NULL DEFAULT 15,
ADD COLUMN     "shortBreakMinutes" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "workMinutes" INTEGER NOT NULL DEFAULT 25;

-- DropTable
DROP TABLE "actions";

-- DropTable
DROP TABLE "check_ins";

-- DropTable
DROP TABLE "follow_ups";

-- DropTable
DROP TABLE "security_logs";

-- DropTable
DROP TABLE "sessions";

-- CreateTable
CREATE TABLE "timers" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "durationSeconds" INTEGER NOT NULL,
    "remainingSeconds" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3),
    "pausedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "timers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pomodoro_sessions" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "durationSeconds" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pomodoro_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "timers_deviceId_key" ON "timers"("deviceId");

-- CreateIndex
CREATE INDEX "timers_deviceId_idx" ON "timers"("deviceId");

-- CreateIndex
CREATE INDEX "pomodoro_sessions_deviceId_idx" ON "pomodoro_sessions"("deviceId");

-- CreateIndex
CREATE INDEX "pomodoro_sessions_deviceId_completedAt_idx" ON "pomodoro_sessions"("deviceId", "completedAt");

-- AddForeignKey
ALTER TABLE "timers" ADD CONSTRAINT "timers_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pomodoro_sessions" ADD CONSTRAINT "pomodoro_sessions_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
