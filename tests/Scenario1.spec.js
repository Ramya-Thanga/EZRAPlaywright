// Example Playwright test using Page Object Model
const { test, expect } = require('@playwright/test');

const { LoginPage } = require('../pages/loginPage');
const { AppointmentsPage } = require('../pages/appointmentsPage');
const { BookScanPage } = require('../pages/bookScanPage');
const { PaymentPage } = require('../pages/paymentPage');
const { username, password } = require('../config/env');
const { auth, navigation } = require('../config/testData');

test.describe('Appointments Flow', () => {
  test('should load login page, perform login, book scan, and complete payment', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await expect(page).toHaveTitle(/Login - My Ezra|Ezra/i);
      await loginPage.login(username, password);
      
      // Wait for button to appear (takes 5-10 seconds after login)
      await page.waitForTimeout(10000);

      const appointmentsPage = new AppointmentsPage(page);
      // Do not navigate again; user should be on Appointments page after login
      await appointmentsPage.bookScanButton.click();
      
      // Proceed with scan booking
      const bookScanPage = new BookScanPage(page);
      await bookScanPage.selectMRIScan();
      await page.waitForTimeout(1000);
      
      // Continue with plan selection
      await bookScanPage.selectPlan();
      await page.waitForTimeout(1000);
      
      await bookScanPage.selectLocation();
      await page.waitForTimeout(1000);
      
      await bookScanPage.selectThirdAvailableDate();
      await page.waitForTimeout(1000);
      
      await bookScanPage.selectFirstAvailableTimeSlot();
      await page.waitForTimeout(1000);
      
      await bookScanPage.submitBooking();
      await page.waitForTimeout(2000);

      // Wait for payment screen to load
      console.log('Waiting for payment screen...');
      await page.waitForTimeout(3000);
      
      // Process payment
      const paymentPage = new PaymentPage(page);
      
      // Log payment screen details to terminal
      await paymentPage.logPaymentScreenDetails();
      
      // Check if credit card field is visible and fill if needed
      await paymentPage.fillCardNumberIfVisible();
      
      // Verify payment information on the right side
      // MRI Scan text from booking
      await paymentPage.verifyScanType('MRI Scan');
      await page.waitForTimeout(1000);
      
      // Click Continue to proceed to next step (bank linked, no payment details needed)
      await paymentPage.clickContinue();
      
      // Wait for confirmation/dashboard page to load
      await page.waitForTimeout(3000);
      
      // Verify dashboard after booking
      console.log('\n========== DASHBOARD VERIFICATION ==========');
      await appointmentsPage.verifyDashboardAfterBooking();
      console.log('==========================================\n');
      
      // Navigate to home if link available
      try {
        await page.getByRole('link', { name: navigation.homeLink }).click();
      } catch (e) {
        console.log('Home link not found, test completed');
      }
    });
  
});

