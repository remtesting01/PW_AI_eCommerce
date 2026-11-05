import { expect } from "@playwright/test";

export class LoginPage {

  constructor(page) {
    this.page = page;

    this.username = page.getByRole('textbox', { name: 'Username' });
    this.password = page.getByRole('textbox', { name: 'Password' });
    this.loginButton = page.getByRole('button', { name: 'Login' });
    this.banner = page.getByRole('img', { name: 'client brand banner' });
    this.errorMessage = page.getByText('Invalid credentials');

  }

  async navigateToLogin() {
    await this.page.goto('/web/index.php/auth/login');
  }

  async login(username, password) {
    await this.username.fill(username);
    await this.password.fill(password);
    await this.loginButton.click();
  }

  async verifyErrorMessage() {
    await expect(this.errorMessage).toBeVisible();
  }
}