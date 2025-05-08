import { importQuestionSet } from './import';
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
      return;
    }

    const result = await importQuestionSet(sampleData);
    console.log(`Imported ${result.questions.length} questions for "${result.title}"`);
  } catch (error) {
    console.error('Error importing sample questions:', error);
  }
}

export default importSampleData;