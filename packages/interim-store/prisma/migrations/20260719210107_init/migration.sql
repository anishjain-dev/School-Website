-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "childPersonId" TEXT,
    "parentName" TEXT,
    "parentPhone" TEXT NOT NULL,
    "parentEmail" TEXT,
    "childName" TEXT NOT NULL,
    "childDob" DATE NOT NULL,
    "source" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "lostReason" TEXT,
    "heldFromStage" TEXT,
    "assignedOfficerPostingId" TEXT,
    "targetYear" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "lastActivityAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Requisition" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "owningOrgUnitId" TEXT NOT NULL,
    "headcount" INTEGER NOT NULL,
    "employmentType" TEXT NOT NULL,
    "intendedLegalEntityId" TEXT,
    "salaryBand" TEXT,
    "status" TEXT NOT NULL,
    "validFrom" DATE,
    "validTo" DATE,

    CONSTRAINT "Requisition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Candidacy" (
    "id" TEXT NOT NULL,
    "personId" TEXT,
    "requisitionId" TEXT,
    "stage" TEXT NOT NULL,
    "rejectStage" TEXT,
    "rejectReason" TEXT,
    "holdReason" TEXT,

    CONSTRAINT "Candidacy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsentRecord" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT,
    "purpose" TEXT NOT NULL,
    "dataCategory" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "at" TIMESTAMP(3) NOT NULL,
    "grantedBy" TEXT,
    "method" TEXT,
    "fiduciaryEntity" TEXT,
    "packVersion" TEXT,

    CONSTRAINT "ConsentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebSubmission" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "leadId" TEXT,
    "candidacyId" TEXT,
    "applicantName" TEXT,
    "applicantEmail" TEXT,
    "applicantPhone" TEXT,
    "coverNote" TEXT,
    "sourcePath" TEXT NOT NULL,
    "noticeVersion" TEXT NOT NULL,
    "turnstileOutcome" TEXT NOT NULL,
    "ipHash" TEXT,
    "status" TEXT NOT NULL,
    "migratedAt" TIMESTAMP(3),
    "nucleusPersonId" TEXT,

    CONSTRAINT "WebSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebDocument" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "bytes" BYTEA NOT NULL,
    "sha256" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "mimeDetected" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL,
    "scanStatus" TEXT NOT NULL,
    "scannedAt" TIMESTAMP(3),
    "retentionClass" TEXT NOT NULL,

    CONSTRAINT "WebDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebPurgeRun" (
    "id" TEXT NOT NULL,
    "ranAt" TIMESTAMP(3) NOT NULL,
    "rule" TEXT NOT NULL,
    "rowsDeleted" INTEGER NOT NULL,
    "detail" JSONB,

    CONSTRAINT "WebPurgeRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WebSubmission_leadId_key" ON "WebSubmission"("leadId");

-- CreateIndex
CREATE UNIQUE INDEX "WebSubmission_candidacyId_key" ON "WebSubmission"("candidacyId");

-- CreateIndex
CREATE UNIQUE INDEX "WebDocument_submissionId_key" ON "WebDocument"("submissionId");
