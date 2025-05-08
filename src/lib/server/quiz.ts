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

export async function getQuestionSet(questionSetId: string): Promise<QuestionSetWithQuestions | null> {
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

  return questionSet;
}

export async function getAllQuestionSets() {
  return prisma.questionSet.findMany({
    include: {
      certificationType: true,
      _count: {
        select: { questions: true }
      }
    }
  });
}

export async function createQuizAttempt(
  questionSetId: string,
  userId?: string
): Promise<QuizAttempt> {
  const questionSet = await getQuestionSet(questionSetId);
  
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
      correctAnswers: 0
    }
  });

  return quizAttempt;
}

export async function submitAnswer(
  quizAttemptId: string,
  questionId: string,
  answerId: string,
  timeSpent?: number
): Promise<boolean> {
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

  return isCorrect;
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
    avgScore: attempts.reduce((sum, attempt) => sum + attempt.score, 0) / attempts.length,
    bestScore: Math.max(...attempts.map(a => a.score))
  };

  return {
    overall: overallStats,
    certifications: certificationStats
  };
}