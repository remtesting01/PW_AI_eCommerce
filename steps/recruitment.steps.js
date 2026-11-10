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
  "the user adds a candidate using the Recruitment test data and saves",
  async ({ recruitmentPage, excelReader }) => {
    const candidate = excelReader.getExcelData("Recruitment", "addCandidate");
    await recruitmentPage.addCandidate(candidate);
  }
);

Then("the candidate should be saved successfully", async ({ recruitmentPage }) => {
  await expect(recruitmentPage.successMessage).toBeVisible();
});
