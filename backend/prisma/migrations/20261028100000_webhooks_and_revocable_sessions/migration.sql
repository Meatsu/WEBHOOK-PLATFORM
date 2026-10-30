-- Rename the previously unused token hash field for persisted access-token sessions.
ALTER TABLE "Session" RENAME COLUMN "refreshTokenHash" TO "accessTokenHash";
ALTER INDEX "Session_refreshTokenHash_key" RENAME TO "Session_accessTokenHash_key";

-- CreateTable
CREATE TABLE "Webhook" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "targetUrl" VARCHAR(2048) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Webhook_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Webhook_userId_createdAt_idx" ON "Webhook"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "Webhook" ADD CONSTRAINT "Webhook_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
