
// Login Page Object Model for Playwright
const { expect } = require('@playwright/test');
const { baseURL } = require('../config/env');

class LoginPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.exampleButton = page.locator('button#example');
    this.usernameInput = page.getByRole('textbox', { name: 'Email' });
    this.passwordInput = page.getByRole('textbox', { name: 'Password' });
    this.submitButton = page.getByRole('button', { name: 'Submit' });
    this.acceptButton = page.getByRole('button', { name: 'Accept' });
  }

  async goto() {
    await this.page.goto(baseURL);
  }
  async login(username, password) {
    await this.usernameInput.fill(username);
    await this.page.keyboard.press('Tab'); // trigger blur/change
    await this.acceptButton.click(); // Click Accept button if it appears
    await this.passwordInput.fill(password);
    await this.page.keyboard.press('Tab'); // trigger blur/change
    await this.submitButton.click();
  }

  async clickExampleButton() {
    await this.exampleButton.click();
  }
}

module.exports = { LoginPage };
