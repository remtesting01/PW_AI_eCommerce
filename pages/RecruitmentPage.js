export class RecruitmentPage {
  constructor(page) {
    this.page = page;
    this.recruitmentLink = page.getByRole("link", { name: "Recruitment" });
    this.addButton = page.getByRole("button", { name: "Add" });
    this.firstName = page.getByRole("textbox", { name: "First Name" });
    this.lastName = page.getByRole("textbox", { name: "Last Name" });
    this.email = page.locator('input[placeholder="Type here"]').first();
    this.vacancySelector = page.getByText("-- Select --", { exact: true });
    this.saveButton = page.getByRole("button", { name: "Save", exact: true });
    this.successMessage = page.getByText("Successfully Saved", { exact: true });
  }

  async addCandidate(candidate) {
    await this.recruitmentLink.click();
    await this.addButton.click();
    await this.firstName.fill(candidate.FullName);
    await this.lastName.fill(candidate.LastName);
    await this.vacancySelector.click();
    await this.page.getByRole("option", { name: candidate.Vacancy, exact: true }).click();
    await this.email.fill(candidate.Email);
    await this.saveButton.click();
  }
}
