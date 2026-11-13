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

When(
  "the candidate is located by the generated email and prepared for application editing",
  async ({ recruitmentPage }) => {
    await recruitmentPage.prepareCandidateForApplicationEditing();
  }
);

When(
  "the user updates permitted application details with runtime-generated data",
  async ({ recruitmentPage }) => {
    await recruitmentPage.editCandidateApplication();
  }
);

Then(
  "the updated application details should be persisted and visible on the candidate record",
  async ({ recruitmentPage }) => {
    await recruitmentPage.verifyCandidateApplicationUpdated();
  }
);

Then(
  "invalid or incomplete required details should be rejected without overwriting the saved values where applicable",
  async ({ recruitmentPage }) => {
    await recruitmentPage.verifyInvalidApplicationEditRejected();
  }
);

When(
  "the candidate is located by the generated email and prepared for the available Shortlist action",
  async ({ recruitmentPage }) => {
    await recruitmentPage.prepareCandidateForShortlist();
  }
);

When("the user performs the available Shortlist action", async ({ recruitmentPage }) => {
  await recruitmentPage.shortlistCandidate();
});

Then(
  "the updated application status and candidate history should confirm the Shortlisted transition",
  async ({ recruitmentPage }) => {
    await recruitmentPage.verifyCandidateShortlisted();
  }
);

Then(
  "the Shortlist action should no longer be available for the shortlisted candidate",
  async ({ recruitmentPage }) => {
    await recruitmentPage.verifyShortlistActionUnavailable();
  }
);

When(
  "the candidate is located by the generated email and prepared for interview scheduling",
  async ({ recruitmentPage }) => {
    await recruitmentPage.prepareCandidateForInterviewScheduling();
  }
);

When(
  "the user schedules an interview with a runtime-selected interviewer and valid future date and time",
  async ({ recruitmentPage }) => {
    await recruitmentPage.scheduleInterview(true);
  }
);

Then(
  "the saved interview record should contain the interviewer, date, and time, with status Interview Scheduled",
  async ({ recruitmentPage }) => {
    await recruitmentPage.verifyInterviewScheduled();
  }
);

Then(
  "incomplete or invalid interview details should be rejected without advancing the application where applicable",
  async ({ recruitmentPage }) => {
    await recruitmentPage.verifyInterviewRequiredDataRejected();
  }
);

When(
  "the candidate is located by the generated email and prepared with a scheduled interview",
  async ({ recruitmentPage }) => {
    await recruitmentPage.prepareCandidateWithScheduledInterview();
  }
);

When(
  "the user updates the interview to a status available in the application",
  async ({ recruitmentPage }) => {
    await recruitmentPage.markInterviewPassed();
  }
);

Then(
  "the saved interview status and application history should reflect the update",
  async ({ recruitmentPage }) => {
    await recruitmentPage.verifyInterviewPassed();
  }
);

Then(
  "the Mark Interview Passed action should no longer be available after the status update",
  async ({ recruitmentPage }) => {
    await recruitmentPage.verifyInterviewPassedActionUnavailable();
  }
);

When(
  "the candidate is located by the generated email and prepared for the available Offer Job action",
  async ({ recruitmentPage }) => {
    await recruitmentPage.prepareCandidateForOfferJob();
  }
);

When(
  "the user submits a runtime-generated offer note through the available Offer Job action",
  async ({ recruitmentPage }) => {
    await recruitmentPage.offerJob();
  }
);

Then(
  "the offer history entry and Job Offered status should be verified",
  async ({ recruitmentPage }) => {
    await recruitmentPage.verifyJobOfferRecorded();
  }
);

Then(
  "the Offer Job action should no longer be available after the offer is recorded",
  async ({ recruitmentPage }) => {
    await recruitmentPage.verifyOfferJobActionUnavailable();
  }
);

When(
  "the candidate is located by the generated email and prepared for the available Hire action",
  async ({ recruitmentPage }) => {
    await recruitmentPage.prepareCandidateForHire();
  }
);

When("the user completes the hiring action", async ({ recruitmentPage }) => {
  await recruitmentPage.hireCandidate();
});

Then(
  "the candidate history and final Hired application status should be verified",
  async ({ recruitmentPage }) => {
    await recruitmentPage.verifyCandidateHired();
  }
);

Then(
  "the Hire action should no longer be available after the Hired status is saved",
  async ({ recruitmentPage }) => {
    await recruitmentPage.verifyHireActionUnavailable();
  }
);
