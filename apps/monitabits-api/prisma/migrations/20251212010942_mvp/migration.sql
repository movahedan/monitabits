-- CreateTable
CREATE TABLE "devices" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "lockdownMinutes" INTEGER NOT NULL DEFAULT 60,
    "timeRemaining" INTEGER,
    "timeAhead" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "actions" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "sessionId" TEXT,
    "type" TEXT NOT NULL,
    "serverTime" TIMESTAMP(3) NOT NULL,
    "lockdownStarted" BOOLEAN NOT NULL DEFAULT false,
    "consequences" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "check_ins" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "sessionId" TEXT,
    "type" TEXT NOT NULL,
    "serverTime" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "check_ins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "lockdownMinutes" INTEGER NOT NULL DEFAULT 60,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "follow_ups" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "actionId" TEXT,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "harmIds" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "follow_ups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_logs" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "serverTime" TIMESTAMP(3) NOT NULL,
    "clientTime" TIMESTAMP(3) NOT NULL,
    "timezoneOffset" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sessions_deviceId_idx" ON "sessions"("deviceId");

-- CreateIndex
CREATE INDEX "sessions_deviceId_status_idx" ON "sessions"("deviceId", "status");

-- CreateIndex
CREATE INDEX "actions_deviceId_idx" ON "actions"("deviceId");

-- CreateIndex
CREATE INDEX "actions_sessionId_idx" ON "actions"("sessionId");

-- CreateIndex
CREATE INDEX "check_ins_deviceId_idx" ON "check_ins"("deviceId");

-- CreateIndex
CREATE INDEX "check_ins_sessionId_idx" ON "check_ins"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "settings_deviceId_key" ON "settings"("deviceId");

-- CreateIndex
CREATE INDEX "follow_ups_deviceId_idx" ON "follow_ups"("deviceId");

-- CreateIndex
CREATE INDEX "security_logs_deviceId_idx" ON "security_logs"("deviceId");

-- CreateIndex
CREATE INDEX "security_logs_eventType_idx" ON "security_logs"("eventType");

-- CreateIndex
CREATE INDEX "security_logs_createdAt_idx" ON "security_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actions" ADD CONSTRAINT "actions_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actions" ADD CONSTRAINT "actions_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settings" ADD CONSTRAINT "settings_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follow_ups" ADD CONSTRAINT "follow_ups_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follow_ups" ADD CONSTRAINT "follow_ups_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "actions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_logs" ADD CONSTRAINT "security_logs_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
