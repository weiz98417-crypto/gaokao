-- CreateTable
CREATE TABLE "app"."User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "nickname" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "wechatOpenId" TEXT,
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."VerificationCode" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" UUID,

    CONSTRAINT "VerificationCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "app"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_wechatOpenId_key" ON "app"."User"("wechatOpenId");

-- CreateIndex
CREATE INDEX "VerificationCode_email_type_idx" ON "app"."VerificationCode"("email", "type");

-- AddForeignKey
ALTER TABLE "app"."VerificationCode" ADD CONSTRAINT "VerificationCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "app"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
