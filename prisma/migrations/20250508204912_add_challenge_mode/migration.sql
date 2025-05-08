-- AlterTable
ALTER TABLE "QuestionSet" ADD COLUMN     "isChallengeMode" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "QuizAttempt" ADD COLUMN     "failed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isChallengeMode" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxMistakes" INTEGER NOT NULL DEFAULT 5;
