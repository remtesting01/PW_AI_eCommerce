import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { test } from '../fixtures/fixtures.js';

const { Given, When, Then } = createBdd(test);

Given('the user is on the Dashboard page', async ({ dashboardPage }) => {
  await dashboardPage.waitForHeading();
});

When('the user checks the page URL against the {string} Excel record', async ({ page, excelReader }, testCase) => {
  const dashboardData = excelReader.getExcelData('dashboard', testCase);
  await expect(page).toHaveURL((url) => url.pathname.includes(dashboardData.expectedUrlPart));
});

Then('the visible heading matches expectedHeading from the {string} Excel record', async ({ dashboardPage, excelReader }, testCase) => {
  const dashboardData = excelReader.getExcelData('dashboard', testCase);
  await expect(dashboardPage.heading).toHaveText(dashboardData.expectedHeading);
});

When('the user views the dashboard widgets', async ({ dashboardPage }) => {
  await dashboardPage.waitForHeading();
});

Then('every widget listed in expectedWidgets from the {string} Excel record is visible', async ({ dashboardPage, excelReader }, testCase) => {
  const dashboardData = excelReader.getExcelData('dashboard', testCase);
  const expectedWidgets = dashboardData.expectedWidgets.split(',').map((widget) => widget.trim()).filter(Boolean);

  expect(expectedWidgets.length).toBeGreaterThan(0);
  for (const widget of expectedWidgets) {
    await expect(dashboardPage.getWidgetTitle(widget)).toBeVisible();
  }
});

When('the user views the left-side menu', async ({ dashboardPage }) => {
  await expect(dashboardPage.sideMenu).toBeVisible();
});

Then('every item listed in expectedMenuItems from the {string} Excel record is visible', async ({ dashboardPage, excelReader }, testCase) => {
  const dashboardData = excelReader.getExcelData('dashboard', testCase);
  const expectedMenuItems = dashboardData.expectedMenuItems.split(',').map((item) => item.trim()).filter(Boolean);

  expect(expectedMenuItems.length).toBeGreaterThan(0);
  for (const item of expectedMenuItems) {
    await expect(dashboardPage.getMainMenuItem(item)).toBeVisible();
  }
});
