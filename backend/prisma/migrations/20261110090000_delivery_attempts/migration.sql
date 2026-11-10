CREATE TYPE "DeliveryAttemptStatus" AS ENUM ('STARTED', 'SUCCEEDED', 'FAILED');

ALTER TABLE "Delivery" ADD COLUMN "retryGeneration" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "DeliveryAttempt" (
    "id" UUID NOT NULL,
    "deliveryId" UUID NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "status" "DeliveryAttemptStatus" NOT NULL DEFAULT 'STARTED',
    "responseStatus" INTEGER,
    "responseBody" VARCHAR(4096),
    "error" VARCHAR(500),
    "durationMs" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeliveryAttempt_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DeliveryAttempt_deliveryId_attemptNumber_idx"
    ON "DeliveryAttempt"("deliveryId", "attemptNumber");

ALTER TABLE "DeliveryAttempt" ADD CONSTRAINT "DeliveryAttempt_deliveryId_fkey"
    FOREIGN KEY ("deliveryId") REFERENCES "Delivery"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
