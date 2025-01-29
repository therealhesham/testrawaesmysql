-- CreateTable
CREATE TABLE `homemaid` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `Nationalitycopy` VARCHAR(1024) NULL,
    `Name` VARCHAR(1024) NULL,
    `Religion` VARCHAR(1024) NULL,
    `officeID` INTEGER NULL,
    `Passportnumber` VARCHAR(1024) NULL,
    `clientphonenumber` VARCHAR(1024) NULL,
    `Picture` JSON NULL,
    `ExperienceYears` VARCHAR(1024) NULL,
    `maritalstatus` VARCHAR(1024) NULL,
    `Experience` VARCHAR(1024) NULL,
    `dateofbirth` VARCHAR(1024) NULL,
    `Nationality` JSON NULL,
    `age` INTEGER NULL,
    `flag` JSON NULL,
    `phone` VARCHAR(1024) NULL,
    `bookingstatus` VARCHAR(1024) NULL,
    `ages` VARCHAR(1024) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Office` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `Officename` VARCHAR(191) NOT NULL,
    `Location` VARCHAR(191) NOT NULL,
    `phonenumber` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Office_Officename_key`(`Officename`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Client` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `isUser` BOOLEAN NULL,
    `fullname` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `phonenumber` VARCHAR(191) NULL,
    `password` VARCHAR(191) NULL,
    `HomeMaidRecod` INTEGER NULL,
    `createdat` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Client_email_key`(`email`),
    UNIQUE INDEX `Client_phonenumber_key`(`phonenumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `phonenumber` INTEGER NULL,
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `admin` BOOLEAN NULL DEFAULT false,
    `pictureurl` VARCHAR(191) NULL DEFAULT '',
    `username` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NULL DEFAULT 'قسم الاستقدام',
    `idnumber` INTEGER NULL,

    UNIQUE INDEX `User_phonenumber_key`(`phonenumber`),
    UNIQUE INDEX `User_idnumber_key`(`idnumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FemalWorker` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `clientname` VARCHAR(191) NOT NULL,
    `insurance` VARCHAR(191) NOT NULL,
    `musanedContract` VARCHAR(191) NOT NULL,
    `visanumber` VARCHAR(191) NOT NULL,
    `idnumber` VARCHAR(191) NOT NULL,
    `mobilenumber` INTEGER NOT NULL,
    `passportnumber` VARCHAR(191) NOT NULL,
    `workername` VARCHAR(191) NOT NULL,
    `age` INTEGER NOT NULL,
    `experience` VARCHAR(191) NOT NULL,
    `contractstatus` VARCHAR(191) NOT NULL,
    `city` VARCHAR(191) NOT NULL,
    `orderDate` DATETIME(3) NOT NULL,
    `canceled` BOOLEAN NOT NULL DEFAULT false,
    `ended` BOOLEAN NOT NULL DEFAULT false,
    `externaloffice` VARCHAR(191) NOT NULL,
    `nationality` VARCHAR(191) NOT NULL,
    `externalmusanedcontract` VARCHAR(191) NOT NULL,
    `visaordernumber` VARCHAR(191) NOT NULL,
    `notes` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `neworder` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ClientName` VARCHAR(191) NULL,
    `PhoneNumber` VARCHAR(191) NULL,
    `clientID` INTEGER NULL,
    `HomemaidId` INTEGER NULL,
    `bookingstatus` VARCHAR(1024) NULL,
    `ReasonOfRejection` VARCHAR(191) NULL,
    `Nationalitycopy` VARCHAR(1024) NULL,
    `Name` VARCHAR(1024) NULL,
    `Religion` VARCHAR(1024) NULL,
    `Passportnumber` VARCHAR(1024) NULL,
    `clientphonenumber` VARCHAR(1024) NULL,
    `Picture` JSON NULL,
    `ExperienceYears` VARCHAR(1024) NULL,
    `maritalstatus` VARCHAR(1024) NULL,
    `Experience` VARCHAR(1024) NULL,
    `dateofbirth` VARCHAR(1024) NULL,
    `Nationality` JSON NULL,
    `age` INTEGER NULL,
    `flag` JSON NULL,
    `phone` VARCHAR(1024) NULL,
    `ages` VARCHAR(1024) NULL,
    `createdAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL,
    `updatedBy` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrderStatus` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `orderId` INTEGER NOT NULL,
    `status` VARCHAR(1024) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `OrderStatus_orderId_status_key`(`orderId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MaleWorker` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `clientname` VARCHAR(191) NOT NULL,
    `insurance` VARCHAR(191) NOT NULL,
    `musanedContract` VARCHAR(191) NOT NULL,
    `visanumber` VARCHAR(191) NOT NULL,
    `idnumber` VARCHAR(191) NOT NULL,
    `mobilenumber` INTEGER NOT NULL,
    `passportnumber` VARCHAR(191) NOT NULL,
    `workername` VARCHAR(191) NOT NULL,
    `canceled` BOOLEAN NOT NULL DEFAULT false,
    `ended` BOOLEAN NOT NULL DEFAULT false,
    `age` INTEGER NOT NULL,
    `job` VARCHAR(191) NOT NULL,
    `experience` VARCHAR(191) NOT NULL,
    `contractstatus` VARCHAR(191) NOT NULL,
    `city` VARCHAR(191) NOT NULL,
    `orderDate` DATETIME(3) NOT NULL,
    `externaloffice` VARCHAR(191) NOT NULL,
    `nationality` VARCHAR(191) NOT NULL,
    `externalmusanedcontract` VARCHAR(191) NOT NULL,
    `visaordernumber` VARCHAR(191) NOT NULL,
    `notes` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `arrivallist` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `SponsorName` VARCHAR(191) NULL,
    `InternalmusanedContract` VARCHAR(191) NULL,
    `SponsorIdnumber` INTEGER NULL,
    `OrderId` INTEGER NOT NULL,
    `SponsorPhoneNumber` VARCHAR(191) NULL,
    `PassportNumber` VARCHAR(191) NULL,
    `KingdomentryDate` DATETIME(3) NULL,
    `WorkDuration` VARCHAR(191) NULL,
    `Cost` VARCHAR(191) NULL,
    `HomemaIdnumber` INTEGER NULL,
    `HomemaidName` VARCHAR(191) NULL,
    `Notes` VARCHAR(191) NULL,
    `ArrivalCity` VARCHAR(191) NULL,
    `MusanadDuration` VARCHAR(191) NULL,
    `DateOfApplication` DATETIME(3) NULL,
    `DayDate` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ExternalDateLinking` DATETIME(3) NULL,
    `ExternalOFficeApproval` DATETIME(3) NULL,
    `AgencyDate` DATETIME(3) NULL,
    `EmbassySealing` DATETIME(3) NULL,
    `BookinDate` DATETIME(3) NULL,
    `GuaranteeDurationEnd` DATETIME(3) NULL,
    `medicalCheckFile` VARCHAR(191) NULL,
    `ticketFile` VARCHAR(191) NULL,
    `receivingFile` VARCHAR(191) NULL,
    `approvalPayment` VARCHAR(191) NULL,
    `additionalfiles` JSON NULL,

    UNIQUE INDEX `arrivallist_OrderId_key`(`OrderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Transfer` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `client` VARCHAR(191) NULL,
    `mobilenumber` VARCHAR(191) NULL,
    `nationalidnumber` VARCHAR(191) NULL,
    `passportnumber` VARCHAR(191) NULL,
    `homemaid` VARCHAR(191) NULL,
    `nationality` VARCHAR(191) NULL,
    `kingdomentrydate` VARCHAR(191) NULL,
    `daydate` DATETIME(3) NULL,
    `workduration` INTEGER NULL,
    `newclientname` VARCHAR(191) NULL,
    `newclientmobilenumber` VARCHAR(191) NULL,
    `newclientnationalidnumber` VARCHAR(191) NULL,
    `newclientcity` VARCHAR(191) NULL,
    `experimentstart` VARCHAR(191) NULL,
    `experimentend` VARCHAR(191) NULL,
    `dealcost` VARCHAR(191) NULL,
    `paid` VARCHAR(191) NULL,
    `restofpaid` VARCHAR(191) NULL,
    `experimentresult` VARCHAR(191) NULL,
    `accomaditionnumber` VARCHAR(191) NULL,
    `marketeername` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `homemaid` ADD CONSTRAINT `homemaid_officeID_fkey` FOREIGN KEY (`officeID`) REFERENCES `Office`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Client` ADD CONSTRAINT `Client_HomeMaidRecod_fkey` FOREIGN KEY (`HomeMaidRecod`) REFERENCES `homemaid`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `neworder` ADD CONSTRAINT `neworder_clientID_fkey` FOREIGN KEY (`clientID`) REFERENCES `Client`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `neworder` ADD CONSTRAINT `neworder_HomemaidId_fkey` FOREIGN KEY (`HomemaidId`) REFERENCES `homemaid`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderStatus` ADD CONSTRAINT `OrderStatus_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `neworder`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `arrivallist` ADD CONSTRAINT `arrivallist_SponsorIdnumber_fkey` FOREIGN KEY (`SponsorIdnumber`) REFERENCES `Client`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `arrivallist` ADD CONSTRAINT `arrivallist_OrderId_fkey` FOREIGN KEY (`OrderId`) REFERENCES `neworder`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
