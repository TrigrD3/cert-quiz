import { importQuestionSet } from './import';
import { createShuffledQuestionSet } from './quiz';
import sampleData from './sample-questions.json';
import prisma from './database';

async function importSampleData() {
  console.log('Starting import of sample questions...');
  try {
    // Check if already imported to avoid duplicates
    const existingSet = await prisma.questionSet.findFirst({
      where: {
        title: sampleData.title
      }
    });

    if (existingSet) {
      console.log('Sample data already imported. Skipping...');
      return existingSet;
    }

    const result = await importQuestionSet(sampleData);
    console.log(`Imported ${result.questions.length} questions for "${result.title}"`);
    return result;
  } catch (error) {
    console.error('Error importing sample questions:', error);
    return null;
  }
}

async function createShuffledSampleSets() {
  try {
    // Find all question sets without "(Shuffled)" in the title
    const regularSets = await prisma.questionSet.findMany({
      where: {
        title: {
          not: {
            contains: '(Shuffled)'
          }
        }
      }
    });

    // Create shuffled versions for each regular set
    for (const set of regularSets) {
      // Check if a shuffled version already exists
      const existingShuffled = await prisma.questionSet.findFirst({
        where: {
          title: {
            contains: `${set.title} (Shuffled)`
          }
        }
      });

      if (!existingShuffled) {
        console.log(`Creating shuffled version of "${set.title}"...`);
        await createShuffledQuestionSet(set.id);
      } else {
        console.log(`Shuffled version of "${set.title}" already exists. Skipping...`);
      }
    }
  } catch (error) {
    console.error('Error creating shuffled sample sets:', error);
  }
}

// Import samples and create shuffled versions
async function initializeSampleData() {
  // First import regular sample set
  const result = await importSampleData();
  
  // Then create shuffled versions
  if (result) {
    await createShuffledSampleSets();
  }
}

export default initializeSampleData;