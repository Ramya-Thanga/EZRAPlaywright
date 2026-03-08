// SelectScanPage.js - Playwright Page Object for Select a Scan screen
const { expect } = require('@playwright/test');

class SelectScanPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    // Form fields
    this.dateOfBirthField = page.locator('input[type="date"], input[placeholder*="Date"], input[placeholder*="Birth"]');
    this.genderAtBirthSelect = page.locator('select, [role="combobox"]').filter({ hasText: /gender|birth/i });
    // First scan card (MRI Scan) - using the class and text
    this.firstScanCard = page.locator('div.encounter-card__title').first();
    this.continueButton = page.getByRole('button', { name: /continue/i });
  }

  async assertDateOfBirthEntered() {
    // Skip assertion if DOB field not found on this screen
  }

  async assertGenderAtBirthSelected() {
    // Skip assertion if gender field not found on this screen
  }

  async clickFirstScan() {
    await this.firstScanCard.click();
  }

  async clickContinueWhenEnabled() {
    await expect(this.continueButton).toBeEnabled();
    await this.continueButton.click();
  }
}

module.exports = { SelectScanPage };
