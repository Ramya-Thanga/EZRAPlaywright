// BookScanPage.js - Playwright Page Object for Book a Scan flow
const { expect } = require('@playwright/test');
const { booking } = require('../config/testData');

/**
 * BookScanPage - POM for scan booking workflow
 * Handles scan selection, plan selection, location selection, date/time selection, and booking submission
 */
class BookScanPage {
  /**
   * @param {import('@playwright/test').Page} page - Playwright page instance
   */
  constructor(page) {
    this.page = page;
    
    // Scan selection
    this.mriScanOption = page.getByText(booking.scanText);
    
    // Plan selection
    this.selectPlanSubmitButton = page.getByTestId(booking.planSubmitTestId);
    
    // Location selection
    this.recommendedLocation = page.getByText(booking.locationText);
    
    // Date selection
    this.dateContent = page.getByTestId(booking.dateTestId);
    this.activeDatesCells = page.locator('.vuecal__cell:not(.vuecal__cell--disabled) .vc-day-content');
    this.calendarContainer = page.locator('[class*="vuecal"]');
    
    // Time slot selection
    this.timeSlotElements = page.locator('[class*="appointment"], [class*="slot"], [class*="time"]');
    this.timeSlotXPath = page.locator('//*[@class="appointments__individual-appointment"][1]');
    
    // Submit button
    this.submitButton = page.locator(`[data-test="${booking.submitTestId}"]`);
    
    // Wait configurations
    this.calendarWaitTimeout = 2000;
    this.timeSlotsWaitTimeout = 5000;
  }

  /**
   * Click on MRI Scan option
   */
  async selectMRIScan() {
    await this.mriScanOption.click();
  }

  /**
   * Click plan selection submit button
   */
  async selectPlan() {
    await this.selectPlanSubmitButton.click();
  }

  /**
   * Click on recommended location
   */
  async selectLocation() {
    await this.recommendedLocation.click();
  }

  /**
   * Click on predefined date (legacy method - for backwards compatibility)
   */
  async selectDate() {
    await this.dateContent.click();
  }

  /**
   * Select the 3rd available date in the calendar
   * Uses CSS selector to target non-disabled date cells
   */
  async selectThirdAvailableDate() {
    // Wait for calendar to load
    await this.calendarContainer.waitFor({ state: 'visible' }).catch(() => {});
    await this.page.waitForTimeout(this.calendarWaitTimeout);
    
    // Wait for the 3rd date to be available (0-indexed, so index 2)
    await this.activeDatesCells.nth(2).waitFor();
    
    // Click the 3rd available date
    await this.activeDatesCells.nth(2).click();
    console.log('✓ Selected 3rd available date');
    
    // Scroll down to show time slots section
    await this.page.evaluate(() => window.scrollBy(0, 500));
    console.log('📜 Scrolled to show time slots');
  }

  /**
   * Select the first available time slot
   * Uses class-based filtering with time pattern matching and fallback XPath selector
   */
  async selectFirstAvailableTimeSlot() {
    console.log('⏳ Waiting for time slots to render...');
    let timeoutCount = 0;
    let timeSlotFound = false;
    
    while (timeoutCount < 5 && !timeSlotFound) {
      try {
        // Filter time slot elements by time pattern (HH:MM AM/PM)
        const timeSlots = this.timeSlotElements.filter({ 
          hasText: /\d{1,2}:\d{2}\s*(AM|PM)/ 
        });
        const count = await timeSlots.count();
        
        if (count > 0) {
          const firstSlot = timeSlots.first();
          
          // Verify it's actually clickable
          const isClickable = await firstSlot.evaluate(el => {
            return el.offsetParent !== null && (el.onclick !== null || el.tagName === 'BUTTON' || el.getAttribute('role') === 'button');
          }).catch(() => true);
          
          if (isClickable) {
            timeSlotFound = true;
            console.log(`✓ Found clickable time slot`);
            
            // Scroll into view and click
            await firstSlot.scrollIntoViewIfNeeded();
            await this.page.evaluate(() => window.scrollBy(0, 300));
            console.log('📜 Scrolled to show time slots');
            
            const slotText = await firstSlot.textContent();
            await firstSlot.click();
            console.log(`✓ Selected first available time slot: ${slotText?.substring(0, 30)}`);
            break;
          }
        }
        
        if (!timeSlotFound) {
          timeoutCount++;
          console.log(`⏳ Waiting for slots... (${timeoutCount}/5)`);
          await this.page.waitForTimeout(1000);
        }
      } catch (e) {
        timeoutCount++;
        console.log(`⏳ Waiting for slots... (${timeoutCount}/5) - ${e.message}`);
        await this.page.waitForTimeout(1000);
      }
    }
    
    if (!timeSlotFound) {
      // Fallback: use XPath selector
      console.log('⚠️  Using fallback XPath selector');
      await this.timeSlotXPath.click();
      console.log(`✓ Selected first available appointment slot (XPath)`);
    }
  }

  /**
   * Submit the booking form
   */
  async submitBooking() {
    await this.submitButton.click();
  }
}

module.exports = { BookScanPage };
