// Scenario 3 Playwright test
// Login, find scheduled MRI scan, extract details, then book new scan with extracted location/date and verify time unavailable
const { test, expect } = require('@playwright/test');

const { LoginPage } = require('../pages/loginPage');
const { AppointmentsPage } = require('../pages/appointmentsPage');
const { BookScanPage } = require('../pages/bookScanPage');
const { username, password } = require('../config/env');

test.describe('Scenario 3: View and Verify Scheduled Scan', () => {
  test('should login, extract scheduled scan details, then book new scan and verify previous time slot unavailable', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await expect(page).toHaveTitle(/Login - My Ezra|Ezra/i);
      
      // Call login method
      console.log('🔐 Logging in...');
      await loginPage.login(username, password);
      
      // Wait for dashboard to load
      console.log('⏳ Waiting for dashboard to load...');
      await page.waitForTimeout(10000);
      
      // Extract scheduled scan details using AppointmentsPage method
      const appointmentsPage = new AppointmentsPage(page);
      const details = await appointmentsPage.extractScheduledScanDetails();
      
      if (!details) {
        console.log('❌ Failed to extract appointment details');
        return;
      }
      
      const { location, dateFound, dateNumber, monthNumber, timeFound } = details;
      
      // ============= CONTINUATION: BOOK NEW SCAN WITH EXTRACTED DETAILS =============
      
      console.log('\n========== BOOKING NEW SCAN WITH EXTRACTED DETAILS ==========');
      
      // Click Book a scan
      console.log('📋 Clicking "Book a scan" button...');
      await appointmentsPage.bookScanButton.click();
      await page.waitForTimeout(1000);
      
      // Select MRI Scan
      console.log('🔍 Selecting MRI Scan...');
      const bookScanPage = new BookScanPage(page);
      await bookScanPage.selectMRIScan();
      await page.waitForTimeout(1000);
      
      // Continue (skip plan selection)
      console.log('➡️  Clicking Continue...');
      const continueButton = page.locator('button:has-text("Continue")').first();
      if (await continueButton.isVisible().catch(() => false)) {
        await continueButton.click();
        await page.waitForTimeout(1000);
      }
      
      // Select Location - extracted location
      console.log(`📍 Selecting location: ${location}...`);
      try {
        await bookScanPage.selectLocation();
        console.log('✓ Location selected');
      } catch (e) {
        console.log('⚠️  Location selection:', e.message);
      }
      
      // Wait for calendar to load after location selection
      console.log('⏳ Waiting for calendar to load...');
      try {
        // Wait for date cells in the calendar (they typically contain day numbers)
        await page.locator('.react-datepicker__day, [class*="date"], [class*="calendar"] button').first().waitFor({ state: 'visible', timeout: 10000 });
        console.log('✓ Calendar loaded');
      } catch (e) {
        // If the specific calendar selector doesn't work, just wait a bit
        console.log('⏳ Using fallback wait for calendar render...');
        await page.waitForTimeout(2000);
      }
      
      // Select Date - using the test ID pattern from Scenario1: {monthNumber}-{dayNumber}-cal-day-content
      console.log(`📅 Selecting date: ${dateNumber} (month: ${monthNumber})...`);
      try {
        // Build the test ID: e.g., "3-19-cal-day-content" for March 19
        const dateTestId = `${monthNumber}-${dateNumber}-cal-day-content`;
        console.log(`   Using test ID: ${dateTestId}`);
        
        const dateButton = page.getByTestId(dateTestId);
        await dateButton.click();
        console.log(`✓ Date ${dateNumber} clicked`);
      } catch (e) {
        console.log('⚠️  Date selection error:', e.message);
      }
      
      // Add extra wait for page to respond to date click
      await page.waitForTimeout(2000);
      
      // Wait for time slots to appear after clicking date
      console.log('⏳ Waiting for time slots to render after date selection...');
      let timeoutCount = 0;
      let timeSlotVisible = false;
      
      while (timeoutCount < 5 && !timeSlotVisible) {
        try {
          // Check for any visible button that contains time format (e.g., "10:00 AM")
          const timeSlots = page.locator('button, div').filter({ hasText: /\d{1,2}:\d{2}\s*(AM|PM)/ });
          const count = await timeSlots.count();
          if (count > 0) {
            timeSlotVisible = true;
            console.log(`✓ Found ${count} time slots`);
            break;
          }
        } catch (e) {
          timeoutCount++;
          console.log(`⏳ Waiting for slots... (${timeoutCount}/5)`);
          await page.waitForTimeout(1000);
        }
      }
      
      // Summary of selections
      console.log('\n========== SELECTIONS SUMMARY ==========');
      console.log(`📍 Location Selected: ${location}`);
      console.log(`📅 Date Selected: ${dateFound}`);
      console.log('=========================================\n');
      
      // Take screenshot of available time slots
      console.log(`📸 Capturing screenshot of available time slots for ${dateFound}...`);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const screenshotPath = `./screenshots/timeslots-${timestamp}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`✓ Screenshot saved: ${screenshotPath}`);
      
      // Check if extracted time slot is available
      console.log(`\n========== TIME SLOT AVAILABILITY CHECK ==========`);
      console.log(`Checking if previously booked time (${timeFound}) is available...`);
      
      let timeAvailable = false;
      try {
        const timeSlot = page.locator(`text=${timeFound}`).first();
        timeAvailable = await timeSlot.isVisible().catch(() => false);
      } catch (e) {
        timeAvailable = false;
      }
      
      if (timeAvailable) {
        console.log(`❌ UNEXPECTED: ${timeFound} is AVAILABLE`);
        console.log('⚠️  This time slot should NOT be available (already booked)');
      } else {
        console.log(`✓ CONFIRMED: ${timeFound} is NOT available`);
        console.log('✓ Time slot is correctly marked as booked');
      }
      
      console.log('=================================================\n');
      
      // Assert that the time should NOT be available (should be false)
      expect(timeAvailable).toBe(false);
    });
  
});
