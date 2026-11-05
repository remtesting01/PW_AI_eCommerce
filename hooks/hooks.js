import { createBdd } from 'playwright-bdd';
import { test } from '../fixtures/fixtures.js';

const { BeforeStep, AfterStep } = createBdd(test);

// Before every step
// BeforeStep(async ({ logger, $step }) => {
//     logger.info(`Step Started: ${$step.title}`);
// });

// After every step
AfterStep(async ({ logger, $step }) => {
    logger.info(`Step Completed: ${$step.title}`);
});