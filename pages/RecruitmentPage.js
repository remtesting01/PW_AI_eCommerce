import { randomBytes, randomInt, randomUUID } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { expect } from "@playwright/test";

const randomName = (length) =>
  Array.from(randomBytes(length), (byte) => String.fromCharCode(65 + (byte % 26))).join("");

const createDummyPdf = () => {
  const content = [
    "BT",
    "/F1 12 Tf",
    "72 720 Td",
    "(Dummy resume for automated testing) Tj",
    "ET",
  ].join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const [index, object] of objects.entries()) {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  }

  const crossReferenceOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${crossReferenceOffset}\n%%EOF\n`;
  return Buffer.from(pdf);
};

export class RecruitmentPage {
  constructor(page) {
    this.page = page;
    this.recruitmentLink = page.getByRole("link", { name: "Recruitment", exact: true });
    this.candidatesTab = page.getByRole("link", { name: "Candidates", exact: true });
    this.vacanciesTab = page.getByRole("link", { name: "Vacancies", exact: true });
    this.addButton = page.locator("button:has(.bi-plus)");
    this.firstName = page.getByRole("textbox", { name: "First Name" });
    this.lastName = page.getByRole("textbox", { name: "Last Name" });
    this.email = page.locator('input[placeholder="Type here"]').first();
    this.vacancySelector = page.getByText("-- Select --", { exact: true });
    this.vacancyOptions = page.getByRole("option");
    this.resumeInput = page.locator('input[type="file"]');
    this.saveButton = page.getByRole("button", { name: "Save", exact: true });
    this.successMessage = page.getByText("Successfully Saved", { exact: true });
    this.addCandidateHeading = page.getByRole("heading", { name: "Add Candidate", exact: true });
    this.vacancyCards = page.locator(".oxd-table-card");
    this.vacancyRecordCount = page.getByText(/\(\d+\) Records Found/);
    this.noVacancyRecords = page.getByText("No Records Found", { exact: true });
    this.candidateNameFilter = page.getByPlaceholder("Type for hints...");
    this.searchButton = page.getByRole("button", { name: "Search", exact: true });
    this.applicationStatus = page.getByText(/^Status: /);
    this.candidateEmailField = page.locator(
      'div.oxd-input-group:has(label:has-text("Email")) input'
    );
    this.profileNotes = page.locator(
      'div.oxd-input-group:has(label:has-text("Notes")) textarea'
    );
    this.editProfileToggle = page.getByRole("checkbox", { name: "Edit" });
    this.actionNotes = page.locator('textarea[placeholder="Type here"]');
    this.interviewTitleInput = page.locator(
      'div.oxd-input-group:has(label:has-text("Interview Title")) input'
    );
    this.interviewerInput = page.locator(
      'div.oxd-input-group:has(label:has-text("Interviewer")) input[placeholder="Type for hints..."]'
    );
    this.interviewerOptions = page.getByRole("option");
    this.interviewDateInput = page.locator('input[placeholder="yyyy-dd-mm"]');
    this.interviewTimeInput = page.locator('input[placeholder="hh:mm"]');
    this.interviewTitleError = this.page
      .locator('.oxd-input-group:has(label:has-text("Interview Title"))')
      .locator(".oxd-input-field-error-message");
    this.interviewDateError = this.page
      .locator('.oxd-input-group:has(label:has-text("Date"))')
      .locator(".oxd-input-field-error-message");
    this.requiredFieldError = page.getByText("Required", { exact: true });
    this.candidateHistoryCards = page.locator(".oxd-table-card");
    this.cancelButton = page.getByRole("button", { name: "Cancel", exact: true });
  }

  async readVacancyRecords() {
    await expect(this.page.getByRole("heading", { name: "Vacancies", exact: true })).toBeVisible();
    await expect
      .poll(
        async () =>
          (await this.vacancyRecordCount.isVisible()) ||
          (await this.noVacancyRecords.isVisible()),
        { message: "Vacancy records did not finish loading." }
      )
      .toBe(true);

    if (await this.noVacancyRecords.isVisible()) {
      return [];
    }

    const headerCells = (await this.page.getByRole("columnheader").allInnerTexts()).map((text) =>
      text.trim()
    );
    const vacancyColumn = headerCells.indexOf("Vacancy");
    const hiringManagerColumn = headerCells.indexOf("Hiring Manager");
    const rows = await this.page.getByRole("row").all();

    if (vacancyColumn === -1 || hiringManagerColumn === -1) {
      if (headerCells.length === 0 && rows.length === 0) {
        return [];
      }

      const currentUrl = this.page.url();
      const pageText = (await this.page.locator("body").innerText())
        .replace(/\s+/g, " ")
        .slice(0, 1000);
      throw new Error(
        `Could not inspect Vacancy and Hiring Manager columns at ${currentUrl} ` +
          `(found ${headerCells.length} column headers and ${rows.length} rows). Page: ${pageText}`
      );
    }

    const records = [];

    for (const row of rows.slice(1)) {
      const cells = await row.getByRole("cell").allInnerTexts();
      const vacancy = cells[vacancyColumn]?.trim();
      if (vacancy) {
        records.push({
          vacancy,
          hiringManager: cells[hiringManagerColumn]?.trim(),
        });
      }
    }

    return records;
  }

  async addCandidate() {
    await this.recruitmentLink.click();
    await this.vacanciesTab.click();
    const vacancyRecords = await this.readVacancyRecords();

    await this.candidatesTab.click();
    await this.addButton.click();
    await expect(this.addCandidateHeading).toBeVisible();
    await this.vacancySelector.click();
    if (vacancyRecords.length > 0) {
      await expect
        .poll(
          async () => {
            const options = (await this.vacancyOptions.allTextContents()).map((text) =>
              text.trim()
            );
            return vacancyRecords.some(({ vacancy }) => options.includes(vacancy));
          },
          { message: "Vacancy dropdown did not load any listed vacancies." }
        )
        .toBe(true);
    }
    const dropdownOptions = (await this.vacancyOptions.allTextContents()).map((text) =>
      text.trim()
    );
    const eligibleVacancies = vacancyRecords.filter(
      ({ vacancy, hiringManager }) =>
        dropdownOptions.includes(vacancy) &&
        hiringManager &&
        !/^(?:\(deleted\)|n\/a|-- select --)$/i.test(hiringManager.trim())
    );

    if (eligibleVacancies.length === 0) {
      throw new Error(
        `No available vacancy has a non-deleted Hiring Manager ` +
          `(dropdown options: ${dropdownOptions.join(", ") || "none"}; ` +
          `${vacancyRecords.length} vacancy records inspected).`
      );
    }

    const selectedVacancy = eligibleVacancies[randomInt(eligibleVacancies.length)];
    await this.page
      .getByRole("option", { name: selectedVacancy.vacancy, exact: true })
      .click();
    await expect(this.page.getByText(selectedVacancy.vacancy, { exact: true })).toBeVisible();

    const candidateId = randomUUID();
    const candidate = {
      firstName: randomName(8),
      lastName: randomName(10),
      email: `${candidateId}@example.test`,
      vacancy: selectedVacancy.vacancy,
      hiringManager: selectedVacancy.hiringManager,
    };
    candidate.fullName = `${candidate.firstName} ${candidate.lastName}`;

    const resumeDirectory = await mkdtemp(path.join(os.tmpdir(), "orangehrm-recruitment-"));
    const resumePath = path.join(resumeDirectory, `resume-${candidateId}.pdf`);

    try {
      await writeFile(resumePath, createDummyPdf());
      await this.firstName.fill(candidate.firstName);
      await this.lastName.fill(candidate.lastName);
      await this.email.fill(candidate.email);
      await this.resumeInput.setInputFiles(resumePath);
      await expect(this.page.getByText(path.basename(resumePath), { exact: true })).toBeVisible();
      await this.saveButton.click();
      //await expect(this.successMessage).toBeVisible();
    } finally {
      await rm(resumeDirectory, { recursive: true, force: true });
    }

    this.savedCandidate = candidate;
  }

  async verifyCandidateSaved() {
    const candidate = this.savedCandidate;
    expect(candidate, "No candidate was submitted in this scenario").toBeDefined();
    await expect(this.successMessage).toBeVisible();

    await this.openCandidateByEmail();
    await expect(this.page.getByText(candidate.vacancy, { exact: true }).first()).toBeVisible();
    await expect(this.page.getByText(candidate.hiringManager, { exact: true })).toBeVisible();

    await this.vacanciesTab.click();
    const vacancy = (await this.readVacancyRecords()).find(
      (record) => record.vacancy === candidate.vacancy
    );
    expect(vacancy, `Vacancy "${candidate.vacancy}" was not found after saving`).toBeDefined();
    expect(vacancy.hiringManager).toBe(candidate.hiringManager);
  }

  async openCandidateByEmail() {
    const candidate = this.savedCandidate;
    expect(candidate, "No candidate is available for this application stage").toBeDefined();

    await this.candidatesTab.click();
    await this.candidateNameFilter.fill(candidate.fullName);
    await this.searchButton.click();

    const candidateCard = this.vacancyCards.filter({ hasText: candidate.fullName });
    await expect(
      candidateCard,
      `Could not uniquely locate candidate ${candidate.email} by its generated name`
    ).toHaveCount(1);
    await candidateCard.locator("button:has(.bi-eye-fill)").click();
    await expect(this.page.getByRole("heading", { name: "Application Stage", exact: true })).toBeVisible();
    await expect(this.candidateEmailField).toHaveValue(candidate.email);
  }

  async prepareCandidateForApplicationEditing() {
    await this.openCandidateByEmail();
    await this.assertCandidateStatus("Application Initiated");
  }

  async editCandidateApplication() {
    const candidate = this.savedCandidate;
    await expect(this.editProfileToggle).not.toBeChecked();
    await this.editProfileToggle.click();

    candidate.updatedNotes = `Recruitment edit ${candidate.email}`;
    await this.profileNotes.fill(candidate.updatedNotes);
    await this.saveButton.click();

    await expect(this.profileNotes).toHaveValue(candidate.updatedNotes);
    await this.assertCandidateStatus("Application Initiated");
  }

  async verifyCandidateApplicationUpdated() {
    const candidate = this.savedCandidate;
    expect(candidate.updatedNotes, `No application update was saved for ${candidate.email}`).toBeDefined();
    await expect(this.profileNotes).toHaveValue(candidate.updatedNotes);
    await this.assertCandidateStatus("Application Initiated");
  }

  async verifyInvalidApplicationEditRejected() {
    const candidate = this.savedCandidate;
    if (!(await this.editProfileToggle.isChecked())) {
      await this.editProfileToggle.click();
    }
    await this.firstName.fill("");
    await this.saveButton.click();

    await expect(this.requiredFieldError).toBeVisible();
    await this.assertCandidateStatus("Application Initiated");
    await expect(this.profileNotes).toHaveValue(candidate.updatedNotes);

    await this.firstName.fill(candidate.firstName);
    await this.saveButton.click();
    await expect(this.profileNotes).toHaveValue(candidate.updatedNotes);
    await expect(this.candidateEmailField).toHaveValue(candidate.email);
  }

  async prepareCandidateForShortlist() {
    await this.openCandidateByEmail();
    await this.assertCandidateStatus("Application Initiated");
    await expect(this.page.getByRole("button", { name: "Shortlist", exact: true })).toBeVisible();
  }

  async shortlistCandidate() {
    const candidate = this.savedCandidate;
    await this.changeCandidateStatus(
      "Shortlist",
      "Shortlist Candidate",
      "Shortlisted",
      `Shortlist ${candidate.email}`,
      `Shortlisted for ${candidate.vacancy}`
    );
  }

  async verifyCandidateShortlisted() {
    const candidate = this.savedCandidate;
    await this.assertCandidateStatus("Shortlisted");
    await this.assertCandidateHistoryContains(`Shortlisted for ${candidate.vacancy}`);
  }

  async verifyShortlistActionUnavailable() {
    await this.assertCandidateStatus("Shortlisted");
    await expect(this.page.getByRole("button", { name: "Shortlist", exact: true })).toHaveCount(0);
  }

  async prepareCandidateForInterviewScheduling() {
    await this.openCandidateByEmail();
    await this.advanceCandidateToStatus("Shortlisted");
    await expect(
      this.page.getByRole("button", { name: "Schedule Interview", exact: true })
    ).toBeVisible();
  }

  async prepareCandidateWithScheduledInterview() {
    await this.openCandidateByEmail();
    await this.advanceCandidateToStatus("Interview Scheduled");
  }

  async prepareCandidateForOfferJob() {
    await this.openCandidateByEmail();
    await this.advanceCandidateToStatus("Interview Passed");
    await expect(this.page.getByRole("button", { name: "Offer Job", exact: true })).toBeVisible();
  }

  async prepareCandidateForHire() {
    await this.openCandidateByEmail();
    await this.advanceCandidateToStatus("Job Offered");
    await expect(this.page.getByRole("button", { name: "Hire", exact: true })).toBeVisible();
  }

  async scheduleInterview(validateRequiredFields = false) {
    const candidate = this.savedCandidate;

    if (validateRequiredFields) {
      await this.openInterviewForm();
      await this.saveButton.click();
      await expect(this.interviewTitleError).toHaveText("Required");
      await expect(this.interviewDateError).toHaveText("Required");
      this.interviewRequiredFieldsRejected = true;
      await this.cancelButton.click();
      await this.assertCandidateStatus("Shortlisted");
    }

    await this.openInterviewForm();
    const interviewTitle = `Interview ${candidate.email.slice(0, 8)}`;
    await this.interviewTitleInput.fill(interviewTitle);

    await this.interviewerInput.fill("a");
    await expect
      .poll(() => this.interviewerOptions.count(), {
        message: `No current interviewers were offered for candidate ${candidate.email}`,
      })
      .toBeGreaterThan(0);
    const interviewers = (await this.interviewerOptions.allTextContents())
      .map((text) => text.trim())
      .filter(Boolean);
    if (interviewers.length === 0) {
      throw new Error(`No selectable interviewer was found for candidate ${candidate.email}`);
    }
    const interviewer = interviewers[randomInt(interviewers.length)];
    await this.page.getByRole("option", { name: interviewer, exact: true }).click();

    const interviewDate = new Date();
    interviewDate.setDate(interviewDate.getDate() + 7);
    while (interviewDate.getDay() === 0 || interviewDate.getDay() === 6) {
      interviewDate.setDate(interviewDate.getDate() + 1);
    }
    const year = interviewDate.getFullYear();
    const month = String(interviewDate.getMonth() + 1).padStart(2, "0");
    const day = String(interviewDate.getDate()).padStart(2, "0");
    const dateForInput = `${year}-${day}-${month}`;
    const dateForHistory = `${year}-${month}-${day}`;
    const interviewTime = `${String(9 + randomInt(8)).padStart(2, "0")}:${String(
      randomInt(4) * 15
    ).padStart(2, "0")}`;

    await this.interviewDateInput.fill(dateForInput);
    await this.interviewTimeInput.fill(interviewTime);
    await this.actionNotes.fill(`Interview ${candidate.email}`);

    candidate.interview = {
      title: interviewTitle,
      interviewer,
      date: dateForHistory,
      time: interviewTime,
    };
    const candidateId = this.page.url().split("/").pop();
    expect(candidateId, `Unable to identify the profile for ${candidate.email}`).toMatch(/^\d+$/);
    const historyResponsePromise = this.page.waitForResponse(
      (response) =>
        response.request().method() === "GET" &&
        response.url().includes(`/candidates/${candidateId}/history`)
    );
    await this.saveButton.click();

    const historyResponse = await historyResponsePromise;
    expect(
      historyResponse.ok(),
      `Interview history request failed for candidate ${candidate.email}`
    ).toBe(true);
    const history = await historyResponse.json();
    expect(
      Array.isArray(history.data),
      `Interview history response was invalid for candidate ${candidate.email}`
    ).toBe(true);
    const savedInterviewEntry = history.data.find(
      (entry) => entry.interview && entry.interview.name === interviewTitle
    );
    expect(
      savedInterviewEntry,
      `Interview "${interviewTitle}" was not found in the saved history for ${candidate.email}`
    ).toBeDefined();
    expect(savedInterviewEntry.interview.date).toBe(dateForHistory);
    expect(savedInterviewEntry.interview.time).toBe(interviewTime);
    candidate.savedInterview = savedInterviewEntry.interview;

    await this.assertCandidateStatus("Interview Scheduled");
    await this.assertCandidateHistoryContains(
      `scheduled ${interviewTitle} on ${dateForHistory} with ${interviewer}`
    );
  }

  async verifyInterviewScheduled() {
    const candidate = this.savedCandidate;
    expect(candidate.interview, `No interview was scheduled for ${candidate.email}`).toBeDefined();
    expect(
      candidate.savedInterview,
      `No saved interview record was returned for ${candidate.email}`
    ).toBeDefined();
    expect(candidate.savedInterview.date).toBe(candidate.interview.date);
    expect(candidate.savedInterview.time).toBe(candidate.interview.time);
    await this.assertCandidateStatus("Interview Scheduled");
    await this.assertCandidateHistoryContains(
      `scheduled ${candidate.interview.title} on ${candidate.interview.date} with ${candidate.interview.interviewer}`
    );
  }

  async verifyInterviewRequiredDataRejected() {
    expect(
      this.interviewRequiredFieldsRejected,
      "The interview form's missing required fields were not validated"
    ).toBe(true);
    await this.assertCandidateStatus("Interview Scheduled");
  }

  async markInterviewPassed() {
    const candidate = this.savedCandidate;
    await this.changeCandidateStatus(
      "Mark Interview Passed",
      "Mark Interview Passed",
      "Interview Passed",
      `Interview passed ${candidate.email}`,
      `marked ${candidate.interview.title} as passed for ${candidate.vacancy}`
    );
  }

  async verifyInterviewPassed() {
    const candidate = this.savedCandidate;
    await this.assertCandidateStatus("Interview Passed");
    await this.assertCandidateHistoryContains(
      `marked ${candidate.interview.title} as passed for ${candidate.vacancy}`
    );
  }

  async verifyInterviewPassedActionUnavailable() {
    await this.assertCandidateStatus("Interview Passed");
    await expect(
      this.page.getByRole("button", { name: "Mark Interview Passed", exact: true })
    ).toHaveCount(0);
  }

  async offerJob() {
    const candidate = this.savedCandidate;
    await this.changeCandidateStatus(
      "Offer Job",
      "Offer Job",
      "Job Offered",
      `Job offer ${candidate.email}`,
      `offered the job for ${candidate.vacancy}`
    );
  }

  async verifyJobOfferRecorded() {
    const candidate = this.savedCandidate;
    await this.assertCandidateStatus("Job Offered");
    await this.assertCandidateHistoryContains(`offered the job for ${candidate.vacancy}`);
  }

  async verifyOfferJobActionUnavailable() {
    await this.assertCandidateStatus("Job Offered");
    await expect(this.page.getByRole("button", { name: "Offer Job", exact: true })).toHaveCount(0);
  }

  async hireCandidate() {
    const candidate = this.savedCandidate;
    await this.changeCandidateStatus(
      "Hire",
      "Hire Candidate",
      "Hired",
      `Hire ${candidate.email}`,
      `hired ${candidate.fullName} for ${candidate.vacancy}`
    );
  }

  async verifyCandidateHired() {
    const candidate = this.savedCandidate;
    await this.assertCandidateStatus("Hired");
    await this.assertCandidateHistoryContains(
      `hired ${candidate.fullName} for ${candidate.vacancy}`
    );
  }

  async verifyHireActionUnavailable() {
    await this.assertCandidateStatus("Hired");
    await expect(this.page.getByRole("button", { name: "Hire", exact: true })).toHaveCount(0);
  }

  async openInterviewForm() {
    await this.page.getByRole("button", { name: "Schedule Interview", exact: true }).click();
    await expect(
      this.page.getByRole("heading", { name: "Schedule Interview", exact: true })
    ).toBeVisible();
  }

  async changeCandidateStatus(action, formHeading, expectedStatus, note, historyText) {
    await this.page.getByRole("button", { name: action, exact: true }).click();
    await expect(this.page.getByRole("heading", { name: formHeading, exact: true })).toBeVisible();
    await this.actionNotes.fill(note);
    await this.saveButton.click();
    await expect(
      this.page.getByRole("heading", { name: "Application Stage", exact: true })
    ).toBeVisible();
    await this.assertCandidateStatus(expectedStatus);
    await this.assertCandidateHistoryContains(historyText);
  }

  async advanceCandidateToStatus(targetStatus) {
    const statusOrder = [
      "Application Initiated",
      "Shortlisted",
      "Interview Scheduled",
      "Interview Passed",
      "Job Offered",
      "Hired",
    ];
    const targetIndex = statusOrder.indexOf(targetStatus);
    if (targetIndex === -1) {
      throw new Error(`Unsupported recruitment preparation status "${targetStatus}"`);
    }

    let currentStatus = await this.readCandidateStatus();
    let currentIndex = statusOrder.indexOf(currentStatus);
    if (currentIndex === -1 || currentIndex > targetIndex) {
      throw new Error(
        `Candidate ${this.savedCandidate.email} is in status "${currentStatus}" and cannot be prepared for "${targetStatus}"`
      );
    }

    while (currentIndex < targetIndex) {
      if (currentStatus === "Application Initiated") {
        await this.shortlistCandidate();
      } else if (currentStatus === "Shortlisted") {
        await this.scheduleInterview();
      } else if (currentStatus === "Interview Scheduled") {
        await this.markInterviewPassed();
      } else if (currentStatus === "Interview Passed") {
        await this.offerJob();
      } else if (currentStatus === "Job Offered") {
        await this.hireCandidate();
      }

      currentStatus = await this.readCandidateStatus();
      currentIndex = statusOrder.indexOf(currentStatus);
    }
  }

  async readCandidateStatus() {
    await expect(this.applicationStatus).toBeVisible();
    return (await this.applicationStatus.innerText()).replace(/^Status:\s*/, "").trim();
  }

  async assertCandidateStatus(expectedStatus) {
    const candidate = this.savedCandidate;
    await expect(
      this.applicationStatus,
      `Candidate ${candidate.email} should be in status "${expectedStatus}"`
    ).toHaveText(`Status: ${expectedStatus}`);
  }

  async assertCandidateHistoryContains(eventText) {
    const event = this.candidateHistoryCards.filter({ hasText: eventText });
    await expect(
      event,
      `Candidate ${this.savedCandidate.email} history does not contain "${eventText}"`
    ).toHaveCount(1);
  }
}
