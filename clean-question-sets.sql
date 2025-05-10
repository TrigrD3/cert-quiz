-- This script removes all derived question sets (shuffled and challenge mode versions)
-- It handles foreign key constraints by deleting in the correct order

-- First, identify the question sets to delete
WITH sets_to_delete AS (
  SELECT id FROM "QuestionSet"
  WHERE title LIKE '% (Shuffled)' OR title LIKE '% (Challenge Mode%'
)

-- Delete question attempts linked to questions in the target question sets
DELETE FROM "QuestionAttempt"
WHERE "questionId" IN (
  SELECT q.id FROM "Question" q
  JOIN sets_to_delete std ON q."questionSetId" = std.id
);

-- Delete quiz attempts associated with these question sets
DELETE FROM "QuizAttempt"
WHERE "questionSetId" IN (SELECT id FROM sets_to_delete);

-- Delete answers associated with questions in these question sets
DELETE FROM "Answer"
WHERE "questionId" IN (
  SELECT q.id FROM "Question" q
  JOIN sets_to_delete std ON q."questionSetId" = std.id
);

-- Delete questions associated with these question sets
DELETE FROM "Question"
WHERE "questionSetId" IN (SELECT id FROM sets_to_delete);

-- Finally, delete the question sets themselves
DELETE FROM "QuestionSet"
WHERE id IN (SELECT id FROM sets_to_delete);

-- Verify that only base question sets remain
SELECT id, title FROM "QuestionSet";