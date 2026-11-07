-- CreateTable
CREATE TABLE "GithubIdentity" (
    "subject" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "GithubIdentity_pkey" PRIMARY KEY ("subject")
);

-- CreateTable
CREATE TABLE "GithubOAuthState" (
    "stateHash" TEXT NOT NULL,
    "verifierHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "GithubOAuthState_pkey" PRIMARY KEY ("stateHash")
);

-- CreateIndex
CREATE UNIQUE INDEX "GithubIdentity_userId_key" ON "GithubIdentity"("userId");

-- CreateIndex
CREATE INDEX "GithubOAuthState_expiresAt_idx" ON "GithubOAuthState"("expiresAt");

-- AddForeignKey
ALTER TABLE "GithubIdentity" ADD CONSTRAINT "GithubIdentity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
