
import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { test } from "../fixtures/fixtures.js";

const { Given, When, Then } = createBdd(test);

Given('User navigates to the E-commerce application', async ({page}) => {
await page.goto('/web/index.php/auth/login');
});

When('User enters valid login credentials from Excel', async ({loginPage, excelReader}) => {
  const validCredentials = excelReader.getExcelData('login', 'validCredentials');
  await loginPage.login(validCredentials.username, validCredentials.password);
});

Then('User should navigate to the product page', async ({loginPage}) => {
   await expect(loginPage.banner).toBeVisible();

});

When('User enters invalid login credentials from Excel for {string} and click login', async ({loginPage, excelReader}, arg) => {
  
const invalidCredentials = excelReader.getExcelData('login', arg);
  await loginPage.login(invalidCredentials.username, invalidCredentials.password);


  
});

Then('User should see an error message', async ({loginPage}) => {
 await expect(loginPage.errorMessage).toBeVisible();
});

// When('User logs in successfully and logs out', async ({}) => {
//   // Step: When User logs in successfully and logs out
//   // From: features\login.feature:15:5
// });

// Then('User should return to the login page', async ({}) => {
//   // Step: Then User should return to the login page
//   // From: features\login.feature:16:5
// });
