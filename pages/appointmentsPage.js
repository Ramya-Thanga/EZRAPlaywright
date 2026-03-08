// AppointmentsPage.js - Playwright Page Object for Appointments screen
const { expect } = require('@playwright/test');
const { baseURL } = require('../config/env');

/**
 * AppointmentsPage - POM for the Appointments/Dashboard screen
 * Handles viewing scheduled scans, extracting appointment details, and initiating new bookings
 */
class AppointmentsPage {
  /**
   * @param {import('@playwright/test').Page} page - Playwright page instance
   */
  constructor(page) {
    this.page = page;
    // Locators
    this.bookScanButton = page.getByRole('button', { name: 'Book a scan' });
    this.header = page.locator('h1, h2, h3');
    this.mriScanText = page.locator('text=MRI Scan').first();
    this.scheduleDate = page.locator('text=/\\d{1,2}\\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i');
    this.questionnaireButton = page.locator('button:has-text("Begin Medical Questionnaire")').first();
  }

  /**
   * Navigate to appointments page
   */
  async goto() {
    await this.page.goto(baseURL);
  }

  /**
   * Verify user is on the Appointments screen
   */
  async isAtAppointmentsScreen() {
    await expect(this.header).toContainText(/appointments/i);
  }

  /**
   * Verify Book a Scan button is enabled
   */
  async isBookScanButtonActive() {
    await expect(this.bookScanButton).toBeEnabled();
  }

  /**
   * Click Book a Scan button and wait for Select Scan screen
   */
  async clickBookScanAndConfirmSelectScan() {
    await this.bookScanButton.waitFor({ state: 'visible' });
    await this.bookScanButton.waitFor({ state: 'enabled' });
    await this.bookScanButton.click();
    // Wait for Select your Scan screen
    await expect(this.header).toContainText(/select your scan/i);
  }

  /**
   * Verify dashboard shows scan details after booking
   * @returns {Promise<Object>} Object with visibility status of dashboard components
   */
  async verifyDashboardAfterBooking() {
    const scanDetailsVisible = await this.mriScanText.isVisible().catch(() => false);
    const scheduleVisible = await this.scheduleDate.isVisible().catch(() => false);
    const questionnaireVisible = await this.questionnaireButton.isVisible().catch(() => false);

    if (scanDetailsVisible) {
      console.log('✓ Scan details visible on dashboard');
    }
    if (scheduleVisible) {
      console.log('✓ Schedule details visible on dashboard');
    }
    if (questionnaireVisible) {
      console.log('✓ "Begin Medical Questionnaire" button found on dashboard');
    } else {
      console.log('ℹ️  "Begin Medical Questionnaire" button not visible yet');
    }

    return { scanDetailsVisible, scheduleVisible, questionnaireVisible };
  }

  /**
   * Extract scheduled scan details from dashboard
   * @returns {Promise<Object>} Appointment details including location, date, and time
   */
  async extractScheduledScanDetails() {
    const pageHTML = await this.page.content();
    const pageText = await this.page.locator('body').textContent();

    console.log('\n========== SCHEDULED SCAN DETAILS ==========');

    // Check if MRI Scan exists
    const mriScanVisible = await this.mriScanText.isVisible().catch(() => false);
    if (!mriScanVisible) {
      console.log('❌ No MRI Scan found on dashboard');
      console.log('==========================================\n');
      return null;
    }

    console.log('✓ Found MRI Scan scheduled');

    // Extract location
    let location = 'Not found';
    const locationPatterns = ['New York', 'AMRIC', 'Dallas', 'Chicago'];
    for (const pattern of locationPatterns) {
      if (pageText.includes(pattern)) {
        location = pattern;
        console.log(`📍 Location: ${location}`);
        break;
      }
    }
    console.log(`📍 Location: ${location}`);

    // Extract date from "Scheduled on" marker
    let dateFound = 'Not found';
    let extractedDateNumber = '';
    let extractedMonthNumber = '';

    console.log('📝 Extracting date from appointment details...');

    const scheduledOnIndex = pageText.indexOf('Scheduled on');
    if (scheduledOnIndex !== -1) {
      const scheduleSection = pageText.substring(scheduledOnIndex, scheduledOnIndex + 200);
      console.log('   Found "Scheduled on" text, extracting date...');

      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];
      const monthNamesFull = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];

      for (let i = 0; i < monthNames.length; i++) {
        const month = monthNames[i];
        const monthIndex = scheduleSection.indexOf(month);
        if (monthIndex !== -1) {
          const beforeMonth = scheduleSection.substring(Math.max(0, monthIndex - 5), monthIndex);
          const afterMonth = scheduleSection.substring(monthIndex, monthIndex + 10);

          // Try "19 Mar" pattern
          const dateMatch1 = beforeMonth.match(/(\d{1,2})\s*$/);
          if (dateMatch1) {
            dateFound = `${dateMatch1[1]} ${month}`;
            extractedDateNumber = dateMatch1[1];
            const fullMonthIndex = monthNamesFull.findIndex(m => month.toLowerCase().startsWith(m.toLowerCase().substring(0, 3)));
            extractedMonthNumber = String(fullMonthIndex + 1);
            break;
          }

          // Try "Mar 19" pattern
          const dateMatch2 = afterMonth.match(/^[a-zA-Z]+\s+(\d{1,2})/);
          if (dateMatch2) {
            dateFound = `${month} ${dateMatch2[1]}`;
            extractedDateNumber = dateMatch2[1];
            const fullMonthIndex = monthNamesFull.findIndex(m => month.toLowerCase().startsWith(m.toLowerCase().substring(0, 3)));
            extractedMonthNumber = String(fullMonthIndex + 1);
            break;
          }
        }
      }
    }

    console.log(`📅 Date: ${dateFound}`);
    console.log(`📌 Date Number to Click: ${extractedDateNumber}, Month: ${extractedMonthNumber}`);

    // Extract time
    let timeFound = 'Not found';
    const scheduledOnIndex2 = pageText.indexOf('Scheduled on');
    if (scheduledOnIndex2 !== -1) {
      const timeSection = pageText.substring(scheduledOnIndex2, scheduledOnIndex2 + 200);
      const timeMatch = timeSection.match(/(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)/);
      if (timeMatch) {
        timeFound = `${timeMatch[1]}:${timeMatch[2]} ${timeMatch[3].toUpperCase()}`;
      }
    }

    console.log(`⏰ Time: ${timeFound}`);
    console.log('==========================================\n');

    return {
      location,
      dateFound,
      dateNumber: extractedDateNumber,
      monthNumber: extractedMonthNumber,
      timeFound
    };
  }
}

module.exports = { AppointmentsPage };
