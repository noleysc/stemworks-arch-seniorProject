-- CreateTable
CREATE TABLE "UserMembership" (
    "id" TEXT NOT NULL,
    "authUserId" TEXT NOT NULL,
    "ventureId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'staff',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserMembership_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserMembership_ventureId_idx" ON "UserMembership"("ventureId");

-- CreateIndex
CREATE UNIQUE INDEX "UserMembership_authUserId_ventureId_key" ON "UserMembership"("authUserId", "ventureId");

-- AddForeignKey
ALTER TABLE "UserMembership" ADD CONSTRAINT "UserMembership_ventureId_fkey" FOREIGN KEY ("ventureId") REFERENCES "Venture"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
