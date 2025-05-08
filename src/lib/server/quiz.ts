import prisma from './database';
import type { Question, Answer, QuizAttempt, User } from '@prisma/client';

export interface QuestionWithAnswers extends Question {
  answers: Answer[];
}

export interface QuestionSetWithQuestions {
  id: string;
  title: string;
  description: string | null;
  certificationTypeId: string;
  questions: QuestionWithAnswers[];
}

// Shuffle array using Fisher-Yates algorithm
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export async function getQuestionSet(questionSetId: string, shuffleQuestions = false): Promise<QuestionSetWithQuestions | null> {
  const questionSet = await prisma.questionSet.findUnique({
    where: { id: questionSetId },
    include: {
      questions: {
        include: {
          answers: true
        }
      }
    }
  });

  if (!questionSet) return null;

  // Shuffle the questions if requested (for shuffled versions of practice sets)
  const questions = shuffleQuestions 
    ? shuffleArray(questionSet.questions) 
    : questionSet.questions;

  // Always shuffle the answers for each question
  const questionsWithShuffledAnswers = questions.map(question => ({
    ...question,
    answers: shuffleArray(question.answers)
  }));

  return {
    ...questionSet,
    questions: questionsWithShuffledAnswers
  };
}

export async function getAllQuestionSets() {
  return prisma.questionSet.findMany({
    include: {
      certificationType: true,
      _count: {
        select: { questions: true }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
}

export async function createQuizAttempt(
  questionSetId: string,
  userId?: string,
  shuffleQuestions = false,
  isChallengeMode = false,
  maxMistakes = 5
): Promise<QuizAttempt> {
  const questionSet = await getQuestionSet(questionSetId, shuffleQuestions);
  
  if (!questionSet) {
    throw new Error('Question set not found');
  }

  const totalQuestions = questionSet.questions.length;

  const quizAttempt = await prisma.quizAttempt.create({
    data: {
      questionSetId,
      userId,
      score: 0,
      totalQuestions,
      correctAnswers: 0,
      isChallengeMode,
      maxMistakes
    }
  });

  return quizAttempt;
}

export async function submitAnswer(
  quizAttemptId: string,
  questionId: string,
  answerId: string,
  timeSpent?: number
): Promise<{isCorrect: boolean; attemptFailed?: boolean}> {
  // Get the question and selected answer
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: {
      answers: true
    }
  });

  if (!question) {
    throw new Error('Question not found');
  }

  const selectedAnswer = question.answers.find(a => a.id === answerId);
  if (!selectedAnswer) {
    throw new Error('Answer not found');
  }

  const isCorrect = selectedAnswer.isCorrect;
  
  // Get the current quiz attempt to check if it's a challenge mode
  const quizAttempt = await prisma.quizAttempt.findUnique({
    where: { id: quizAttemptId },
    include: {
      _count: {
        select: { 
          questionAttempts: {
            where: { isCorrect: false }
          }
        }
      }
    }
  });
  
  if (!quizAttempt) {
    throw new Error('Quiz attempt not found');
  }

  // Record the question attempt
  await prisma.questionAttempt.create({
    data: {
      quizAttemptId,
      questionId,
      answerId,
      isCorrect,
      timeSpent
    }
  });

  let attemptFailed = false;
  
  // Check if this is a challenge mode quiz and if the user has exceeded max mistakes
  if (!isCorrect && quizAttempt.isChallengeMode) {
    const incorrectAnswers = quizAttempt._count.questionAttempts;
    
    // If the user has reached the maximum number of mistakes allowed
    if (incorrectAnswers >= quizAttempt.maxMistakes) {
      // Get the current correct answers count before marking as failed
      const correctAnswersCount = await prisma.questionAttempt.count({
        where: {
          quizAttemptId,
          isCorrect: true
        }
      });
      
      // Calculate the score based on correct answers so far
      const score = quizAttempt.totalQuestions > 0 
        ? (correctAnswersCount / quizAttempt.totalQuestions) * 100
        : 0;
        
      // Mark the attempt as failed but preserve correct answer count
      await prisma.quizAttempt.update({
        where: { id: quizAttemptId },
        data: {
          completedAt: new Date(),
          score: 0, // Failed attempt gets zero score
          correctAnswers: correctAnswersCount,
          failed: true
        }
      });
      
      attemptFailed = true;
    }
  }

  // If answer is correct, update the quiz attempt score
  if (isCorrect) {
    await prisma.quizAttempt.update({
      where: { id: quizAttemptId },
      data: {
        correctAnswers: {
          increment: 1
        }
      }
    });
  }

  return { isCorrect, attemptFailed };
}

export async function completeQuizAttempt(quizAttemptId: string): Promise<QuizAttempt> {
  const quizAttempt = await prisma.quizAttempt.findUnique({
    where: { id: quizAttemptId },
    include: {
      questionAttempts: true
    }
  });

  if (!quizAttempt) {
    throw new Error('Quiz attempt not found');
  }

  const score = (quizAttempt.correctAnswers / quizAttempt.totalQuestions) * 100;

  return prisma.quizAttempt.update({
    where: { id: quizAttemptId },
    data: {
      completedAt: new Date(),
      score
    }
  });
}

export async function getUserQuizHistory(userId: string) {
  return prisma.quizAttempt.findMany({
    where: { 
      userId,
      completedAt: { not: null }
    },
    include: {
      questionSet: true,
      _count: {
        select: { questionAttempts: true }
      }
    },
    orderBy: {
      startedAt: 'desc'
    }
  });
}

export async function getUserStats(userId: string) {
  const attempts = await prisma.quizAttempt.findMany({
    where: { 
      userId,
      completedAt: { not: null }
    },
    include: {
      questionSet: {
        include: {
          certificationType: true
        }
      }
    }
  });

  // Group by certification type
  const certificationStats = attempts.reduce<Record<string, { 
    totalAttempts: number;
    avgScore: number;
    bestScore: number;
  }>>((acc, attempt) => {
    const certName = attempt.questionSet.certificationType.name;
    if (!acc[certName]) {
      acc[certName] = { totalAttempts: 0, avgScore: 0, bestScore: 0 };
    }
    
    acc[certName].totalAttempts += 1;
    acc[certName].avgScore = (acc[certName].avgScore * (acc[certName].totalAttempts - 1) + attempt.score) / acc[certName].totalAttempts;
    acc[certName].bestScore = Math.max(acc[certName].bestScore, attempt.score);
    
    return acc;
  }, {});

  // Overall stats
  const overallStats = {
    totalAttempts: attempts.length,
    avgScore: attempts.reduce((sum, attempt) => sum + attempt.score, 0) / (attempts.length || 1),
    bestScore: attempts.length ? Math.max(...attempts.map(a => a.score)) : 0
  };

  return {
    overall: overallStats,
    certifications: certificationStats
  };
}

// Create shuffled version of a question set
export async function createShuffledQuestionSet(sourceQuestionSetId: string): Promise<QuestionSetWithQuestions | null> {
  // Get the source question set
  const sourceQuestionSet = await prisma.questionSet.findUnique({
    where: { id: sourceQuestionSetId },
    include: {
      questions: {
        include: {
          answers: true
        }
      },
      certificationType: true
    }
  });

  if (!sourceQuestionSet) {
    throw new Error('Source question set not found');
  }

  // Check if a shuffled version already exists
  const existingShuffled = await prisma.questionSet.findFirst({
    where: {
      title: {
        contains: `${sourceQuestionSet.title} (Shuffled)`
      }
    }
  });

  if (existingShuffled) {
    return getQuestionSet(existingShuffled.id, true);
  }

  // Create a new question set with the same questions but marked as shuffled
  const newQuestionSet = await prisma.questionSet.create({
    data: {
      title: `${sourceQuestionSet.title} (Shuffled)`,
      description: sourceQuestionSet.description
        ? `${sourceQuestionSet.description} - Questions will be shuffled for each attempt.`
        : 'Questions will be shuffled for each attempt.',
      certificationTypeId: sourceQuestionSet.certificationTypeId,
      jsonSource: sourceQuestionSet.jsonSource,
      questions: {
        create: sourceQuestionSet.questions.map(q => ({
          questionText: q.questionText,
          explanation: q.explanation,
          externalId: q.externalId,
          answers: {
            create: q.answers.map(a => ({
              answerText: a.answerText,
              isCorrect: a.isCorrect,
              externalId: a.externalId
            }))
          }
        }))
      }
    },
    include: {
      questions: {
        include: {
          answers: true
        }
      }
    }
  });

  return newQuestionSet;
}

// Create challenge mode version of a question set (max 5 mistakes)
export async function createChallengeQuestionSet(sourceQuestionSetId: string, shuffle = false): Promise<QuestionSetWithQuestions | null> {
  // Get the source question set
  const sourceQuestionSet = await prisma.questionSet.findUnique({
    where: { id: sourceQuestionSetId },
    include: {
      questions: {
        include: {
          answers: true
        }
      },
      certificationType: true
    }
  });

  if (!sourceQuestionSet) {
    throw new Error('Source question set not found');
  }
  
  const challengeTitle = shuffle 
    ? `${sourceQuestionSet.title} (Challenge Mode - Shuffled)` 
    : `${sourceQuestionSet.title} (Challenge Mode)`;

  // Check if a challenge version already exists
  const existingChallenge = await prisma.questionSet.findFirst({
    where: {
      title: {
        equals: challengeTitle
      }
    }
  });

  if (existingChallenge) {
    return getQuestionSet(existingChallenge.id, shuffle);
  }

  // Create a new question set with the same questions but marked as challenge mode
  const newQuestionSet = await prisma.questionSet.create({
    data: {
      title: challengeTitle,
      description: sourceQuestionSet.description
        ? `${sourceQuestionSet.description} - Challenge mode: You can only make 5 mistakes before failing.${shuffle ? ' Questions will be shuffled for each attempt.' : ''}`
        : `Challenge mode: You can only make 5 mistakes before failing.${shuffle ? ' Questions will be shuffled for each attempt.' : ''}`,
      certificationTypeId: sourceQuestionSet.certificationTypeId,
      jsonSource: sourceQuestionSet.jsonSource,
      isChallengeMode: true,
      questions: {
        create: sourceQuestionSet.questions.map(q => ({
          questionText: q.questionText,
          explanation: q.explanation,
          externalId: q.externalId,
          answers: {
            create: q.answers.map(a => ({
              answerText: a.answerText,
              isCorrect: a.isCorrect,
              externalId: a.externalId
            }))
          }
        }))
      }
    },
    include: {
      questions: {
        include: {
          answers: true
        }
      }
    }
  });

  return newQuestionSet;
}