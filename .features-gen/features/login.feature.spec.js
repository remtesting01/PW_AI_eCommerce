// Generated from: features\login.feature
import { test } from "../../fixtures/fixtures.js";

test.describe('E-commerce Login', () => {

  test.beforeEach('Background', async ({ Given, logger, page }, testInfo) => { if (testInfo.error) return;
    await Given('User navigates to the E-commerce application', null, { logger, page }); 
  });
  
  test('Verify successful login', async ({ When, Then, excelReader, logger, loginPage }) => { 
    await When('User enters valid login credentials from Excel', null, { excelReader, logger, loginPage }); 
    await Then('User should navigate to the product page', null, { logger, loginPage }); 
  });

});

// == technical section ==

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('features\\login.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":10,"pickleLine":6,"tags":[],"steps":[{"pwStepLine":7,"gherkinStepLine":4,"keywordType":"Context","textWithKeyword":"Given User navigates to the E-commerce application","isBg":true,"stepMatchArguments":[]},{"pwStepLine":11,"gherkinStepLine":7,"keywordType":"Action","textWithKeyword":"When User enters valid login credentials from Excel","stepMatchArguments":[]},{"pwStepLine":12,"gherkinStepLine":8,"keywordType":"Outcome","textWithKeyword":"Then User should navigate to the product page","stepMatchArguments":[]}]},
]; // bdd-data-end