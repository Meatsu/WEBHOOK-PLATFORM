CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED');

CREATE TABLE "Delivery" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "webhookId" UUID,
    "endpointName" VARCHAR(100) NOT NULL,
    "targetUrl" VARCHAR(2048) NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "responseStatus" INTEGER,
    "responseBody" VARCHAR(4096),
    "error" VARCHAR(500),
    "durationMs" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Delivery_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Delivery_userId_createdAt_idx" ON "Delivery"("userId", "createdAt");
CREATE INDEX "Delivery_webhookId_createdAt_idx" ON "Delivery"("webhookId", "createdAt");

ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_webhookId_fkey"
    FOREIGN KEY ("webhookId") REFERENCES "Webhook"("id") ON DELETE SET NULL ON UPDATE CASCADE;
