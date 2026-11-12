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
    this.candidateNameFilter = page.getByPlaceholder("Type for hints...");
    this.searchButton = page.getByRole("button", { name: "Search", exact: true });
  }

  async readVacancyRecords() {
    await expect(this.page.getByRole("heading", { name: "Vacancies", exact: true })).toBeVisible();
    await expect(this.vacancyRecordCount).toBeVisible();
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

    await this.candidatesTab.click();
    await this.candidateNameFilter.fill(candidate.fullName);
    await this.searchButton.click();

    const candidateCard = this.vacancyCards.filter({ hasText: candidate.fullName });
    await expect(candidateCard).toHaveCount(1);
    await candidateCard.getByRole("button").first().click();

    //await expect(this.email).toHaveValue(candidate.email);
    //await expect(this.page.getByText(candidate.fullName, { exact: true })).toBeVisible();
    //await expect(this.page.getByText(candidate.vacancy, { exact: true })).toBeVisible();
    //await expect(this.page.getByText(candidate.hiringManager, { exact: true })).toBeVisible();

    await this.vacanciesTab.click();
    const vacancy = (await this.readVacancyRecords()).find(
      (record) => record.vacancy === candidate.vacancy
    );
    expect(vacancy, `Vacancy "${candidate.vacancy}" was not found after saving`).toBeDefined();
    expect(vacancy.hiringManager).toBe(candidate.hiringManager);
  }
}
