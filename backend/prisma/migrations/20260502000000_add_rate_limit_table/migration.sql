CREATE TABLE "rate_limit_entries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rate_limit_entries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "rate_limit_entries_key_module_created_at_idx" ON "rate_limit_entries"("key", "module", "created_at");
