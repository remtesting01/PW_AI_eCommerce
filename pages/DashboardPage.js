export class DashboardPage {
  constructor(page) {
    this.page = page;
    this.heading = page.getByRole('heading');
    this.sideMenu = page.getByRole('navigation', { name: 'Sidepanel' });
    this.exactText = (text) => page.getByText(text, { exact: true });
    this.sideMenuItem = (name) => this.sideMenu.getByRole('link', { name, exact: true });
  }

  async waitForHeading() {
    await this.heading.waitFor({ state: 'visible' });
  }

  getWidgetTitle(title) {
    return this.exactText(title);
  }

  getMainMenuItem(name) {
    return this.sideMenuItem(name);
  }
}
