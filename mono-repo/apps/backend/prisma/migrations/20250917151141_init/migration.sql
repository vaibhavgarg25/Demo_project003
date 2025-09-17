-- CreateEnum
CREATE TYPE "public"."JobCardStatusEnum" AS ENUM ('open', 'close');

-- CreateEnum
CREATE TYPE "public"."CleaningSlotStatusEnum" AS ENUM ('free', 'booked', 'in_progress');

-- CreateEnum
CREATE TYPE "public"."OperationalStatusEnum" AS ENUM ('In_Service', 'Standby', 'Under_Maintenance');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Train" (
    "id" SERIAL NOT NULL,
    "trainname" TEXT NOT NULL,
    "trainID" TEXT NOT NULL,
    "current_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "Train_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FitnessCertificates" (
    "id" SERIAL NOT NULL,
    "rollingStockFitnessStatus" BOOLEAN NOT NULL,
    "rollingStockFitnessExpiryDate" TIMESTAMP(3) NOT NULL,
    "signallingFitnessStatus" BOOLEAN NOT NULL,
    "signallingFitnessExpiryDate" TIMESTAMP(3) NOT NULL,
    "telecomFitnessStatus" BOOLEAN NOT NULL,
    "telecomFitnessExpiryDate" TIMESTAMP(3) NOT NULL,
    "trainId" TEXT NOT NULL,

    CONSTRAINT "FitnessCertificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."JobCardStatus" (
    "id" SERIAL NOT NULL,
    "jobCardStatus" "public"."JobCardStatusEnum" NOT NULL,
    "openJobCards" INTEGER NOT NULL,
    "closedJobCards" INTEGER NOT NULL,
    "lastJobCardUpdate" TIMESTAMP(3) NOT NULL,
    "trainId" TEXT NOT NULL,

    CONSTRAINT "JobCardStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Branding" (
    "id" SERIAL NOT NULL,
    "brandingActive" BOOLEAN NOT NULL,
    "brandCampaignID" TEXT,
    "exposureHoursAccrued" INTEGER NOT NULL,
    "exposureHoursTarget" INTEGER NOT NULL,
    "exposureDailyQuota" INTEGER NOT NULL,
    "trainId" TEXT NOT NULL,

    CONSTRAINT "Branding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Mileage" (
    "id" SERIAL NOT NULL,
    "totalMileageKM" INTEGER NOT NULL,
    "mileageSinceLastServiceKM" INTEGER NOT NULL,
    "mileageBalanceVariance" INTEGER NOT NULL,
    "brakepadWearPercent" INTEGER NOT NULL,
    "hvacWearPercent" INTEGER NOT NULL,
    "trainId" TEXT NOT NULL,

    CONSTRAINT "Mileage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Cleaning" (
    "id" SERIAL NOT NULL,
    "cleaningRequired" BOOLEAN NOT NULL,
    "cleaningSlotStatus" "public"."CleaningSlotStatusEnum" NOT NULL,
    "bayOccupancyIDC" TEXT,
    "cleaningCrewAssigned" INTEGER,
    "lastCleanedDate" TIMESTAMP(3) NOT NULL,
    "trainId" TEXT NOT NULL,

    CONSTRAINT "Cleaning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Stabling" (
    "id" SERIAL NOT NULL,
    "bayPositionID" INTEGER NOT NULL,
    "shuntingMovesRequired" INTEGER NOT NULL,
    "stablingSequenceOrder" INTEGER NOT NULL,
    "trainId" TEXT NOT NULL,

    CONSTRAINT "Stabling_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Operations" (
    "id" SERIAL NOT NULL,
    "operationalStatus" "public"."OperationalStatusEnum" NOT NULL,
    "reasonForStatus" TEXT,
    "trainId" TEXT NOT NULL,

    CONSTRAINT "Operations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Train_trainname_key" ON "public"."Train"("trainname");

-- CreateIndex
CREATE UNIQUE INDEX "Train_trainID_key" ON "public"."Train"("trainID");

-- CreateIndex
CREATE UNIQUE INDEX "FitnessCertificates_trainId_key" ON "public"."FitnessCertificates"("trainId");

-- CreateIndex
CREATE UNIQUE INDEX "JobCardStatus_trainId_key" ON "public"."JobCardStatus"("trainId");

-- CreateIndex
CREATE UNIQUE INDEX "Branding_trainId_key" ON "public"."Branding"("trainId");

-- CreateIndex
CREATE UNIQUE INDEX "Mileage_trainId_key" ON "public"."Mileage"("trainId");

-- CreateIndex
CREATE UNIQUE INDEX "Cleaning_trainId_key" ON "public"."Cleaning"("trainId");

-- CreateIndex
CREATE UNIQUE INDEX "Stabling_trainId_key" ON "public"."Stabling"("trainId");

-- CreateIndex
CREATE UNIQUE INDEX "Operations_trainId_key" ON "public"."Operations"("trainId");

-- AddForeignKey
ALTER TABLE "public"."FitnessCertificates" ADD CONSTRAINT "FitnessCertificates_trainId_fkey" FOREIGN KEY ("trainId") REFERENCES "public"."Train"("trainID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JobCardStatus" ADD CONSTRAINT "JobCardStatus_trainId_fkey" FOREIGN KEY ("trainId") REFERENCES "public"."Train"("trainID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Branding" ADD CONSTRAINT "Branding_trainId_fkey" FOREIGN KEY ("trainId") REFERENCES "public"."Train"("trainID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Mileage" ADD CONSTRAINT "Mileage_trainId_fkey" FOREIGN KEY ("trainId") REFERENCES "public"."Train"("trainID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Cleaning" ADD CONSTRAINT "Cleaning_trainId_fkey" FOREIGN KEY ("trainId") REFERENCES "public"."Train"("trainID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Stabling" ADD CONSTRAINT "Stabling_trainId_fkey" FOREIGN KEY ("trainId") REFERENCES "public"."Train"("trainID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Operations" ADD CONSTRAINT "Operations_trainId_fkey" FOREIGN KEY ("trainId") REFERENCES "public"."Train"("trainID") ON DELETE RESTRICT ON UPDATE CASCADE;
