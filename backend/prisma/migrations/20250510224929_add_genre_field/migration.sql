-- AlterTable
ALTER TABLE `movie` ADD COLUMN `genre` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `review` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
