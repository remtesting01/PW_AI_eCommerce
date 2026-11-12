import { createBdd } from "playwright-bdd";
import { expect } from "@playwright/test";
import { test } from "../fixtures/fixtures.js";

const { Given, When, Then } = createBdd(test);

Given("the user is logged in to OrangeHRM", async ({ page, loginPage, excelReader }) => {
  await page.goto("/web/index.php/auth/login");
  const credentials = excelReader.getExcelData("login", "validCredentials");
  await loginPage.login(credentials.username, credentials.password);
  await expect(page.getByRole("link", { name: "Recruitment" })).toBeVisible();
});

When(
  "the user creates a candidate with a vacancy that has a hiring manager",
  async ({ recruitmentPage, recruitmentExcelReader }) => {
    const candidateData = recruitmentExcelReader.getExcelData("Recruitment", "addCandidate");
    expect(candidateData, 'Missing Recruitment/addCandidate test data').toBeDefined();
    await recruitmentPage.addCandidate();
  }
);

Then(
  "the candidate should be saved with the selected vacancy and hiring manager",
  async ({ recruitmentPage }) => {
    await recruitmentPage.verifyCandidateSaved();
  }
);
