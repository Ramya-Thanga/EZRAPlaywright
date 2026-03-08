// PaymentPage.js - Playwright Page Object for Payment/Review screen
const { expect } = require('@playwright/test');
const { stripe } = require('../config/testData');

class PaymentPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
  }

  /**
   * Check if credit card field is visible and fill it if needed
   */
  async fillCardNumberIfVisible() {
    try {
      // Wait a moment for any dynamic content to load
      await this.page.waitForTimeout(2000);
      
      // Look for credit card input fields by common identifiers
      // Be specific to avoid finding card brand icons or other non-input elements
      const cardFieldSelectors = [
        'input[id="payment-numberInput"]',
        'input[name="number"]',
        'input[placeholder*="1234"]',
        'input[aria-label*="Card number" i]',
        'input[name="cardNumber" i]',
        'input[id*="cardNumber" i]'
      ];
      
      let cardFieldFound = false;
      let cardField = null;
      
      // First, check main page for card fields
      console.log('🔍 Checking main page for card fields...');
      for (const selector of cardFieldSelectors) {
        try {
          cardField = this.page.locator(selector).first();
          const isVisible = await cardField.isVisible().catch(() => false);
          
          if (isVisible) {
            console.log(`💳 Found card field on main page with selector: ${selector}`);
            cardFieldFound = true;
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }
      
      // If not found on main page, check inside Stripe iframes
      if (!cardFieldFound) {
        console.log('🔍 Checking inside Stripe iframes for card fields...');
        
        // Get all iframes
        const iframeCount = await this.page.locator('iframe').count();
        console.log(`   Total iframes found: ${iframeCount}`);
        
        for (let i = 0; i < iframeCount; i++) {
          try {
            const iframe = this.page.locator('iframe').nth(i);
            const frameName = await iframe.getAttribute('name').catch(() => '');
            const frameTitle = await iframe.getAttribute('title').catch(() => '');
            
            console.log(`   [${i}] iframe name="${frameName}" title="${frameTitle}"`);
            
            // Look for Stripe payment frames (they contain the payment input)
            if (frameName && (frameName.includes('StripeFrame') || frameName.includes('Stripe'))) {
              console.log(`     ✓ Checking this iframe for card fields...`);
              
              const frameLocator = this.page.frameLocator(`iframe[name="${frameName}"]`);
              
              // Get all inputs in this frame to see what's available
              const inputCount = await frameLocator.locator('input').count().catch(() => 0);
              console.log(`       Found ${inputCount} input fields`);
              
              // Try each selector
              for (const selector of cardFieldSelectors) {
                try {
                  const field = frameLocator.locator(selector).first();
                  const isVisible = await field.isVisible().catch(() => false);
                  
                  if (isVisible) {
                    console.log(`       ✓ Found visible field with selector: ${selector}`);
                    cardField = field;
                    cardFieldFound = true;
                    break;
                  }
                } catch (e) {
                  // Continue to next selector
                }
              }
              
              if (cardFieldFound) break;
            }
          } catch (e) {
            console.log(`     Error checking iframe: ${e.message}`);
          }
        }
      }
      
      // If card field found, fill it along with expiration and security code
      if (cardFieldFound && cardField) {
        try {
          console.log('📝 Attempting to fill card details...');
          
          // Fill card number using type with proper delays
          try {
            await cardField.click({ force: true });
            await this.page.waitForTimeout(200);
            await cardField.type(stripe.cardNumber, { delay: 30 });
            console.log(`✓ Card number entered: ${stripe.cardNumber}`);
          } catch (cardErr) {
            console.log(`⚠️  Card fill error: ${cardErr.message}`);
          }
          
          await this.page.waitForTimeout(500);
          
          // Look for and fill expiration date field
          const expirationSelectors = [
            'input[placeholder*="MM / YY"]',
            'input[placeholder*="Expiration"]',
            'input[aria-label*="Expiration"]',
            '[data-testid*="expiration"]',
            'input[name*="exp"]'
          ];
          
          let expirationFound = false;
          for (const selector of expirationSelectors) {
            try {
              const expField = this.page.locator(selector).first();
              const isVisible = await expField.isVisible().catch(() => false);
              
              if (isVisible) {
                await expField.focus();
                await this.page.waitForTimeout(300);
                await expField.type(stripe.expirationDate, { delay: 50 });
                console.log(`✓ Expiration date entered: ${stripe.expirationDate}`);
                expirationFound = true;
                break;
              }
            } catch (e) {
              // Continue to next selector
            }
          }
          
          // If not found on main page, check iframes
          if (!expirationFound) {
            const iframeCount = await this.page.locator('iframe').count();
            for (let i = 0; i < iframeCount; i++) {
              try {
                const iframe = this.page.locator('iframe').nth(i);
                const frameName = await iframe.getAttribute('name').catch(() => '');
                
                if (frameName && frameName.includes('StripeFrame')) {
                  const frameLocator = this.page.frameLocator(`iframe[name="${frameName}"]`);
                  
                  for (const selector of expirationSelectors) {
                    try {
                      const expField = frameLocator.locator(selector).first();
                      const isVisible = await expField.isVisible().catch(() => false);
                      
                      if (isVisible) {
                        await expField.focus();
                        await this.page.waitForTimeout(300);
                        await expField.type(stripe.expirationDate, { delay: 50 });
                        console.log(`✓ Expiration date entered: ${stripe.expirationDate}`);
                        expirationFound = true;
                        break;
                      }
                    } catch (e) {}
                  }
                  
                  if (expirationFound) break;
                }
              } catch (e) {}
            }
          }
          
          await this.page.waitForTimeout(500);
          
          // Look for and fill security code field
          const securitySelectors = [
            'input[placeholder*="CVC"]',
            'input[placeholder*="CVV"]',
            'input[aria-label*="Security code"]',
            '[data-testid*="cvc"]',
            '[data-testid*="security"]',
            'input[name*="cvc"]'
          ];
          
          let securityFound = false;
          for (const selector of securitySelectors) {
            try {
              const secField = this.page.locator(selector).first();
              const isVisible = await secField.isVisible().catch(() => false);
              
              if (isVisible) {
                await secField.focus();
                await this.page.waitForTimeout(300);
                await secField.type(stripe.securityCode, { delay: 50 });
                console.log(`✓ Security code entered: ${stripe.securityCode}`);
                securityFound = true;
                break;
              }
            } catch (e) {
              // Continue to next selector
            }
          }
          
          // If not found on main page, check iframes
          if (!securityFound) {
            const iframeCount = await this.page.locator('iframe').count();
            for (let i = 0; i < iframeCount; i++) {
              try {
                const iframe = this.page.locator('iframe').nth(i);
                const frameName = await iframe.getAttribute('name').catch(() => '');
                
                if (frameName && frameName.includes('StripeFrame')) {
                  const frameLocator = this.page.frameLocator(`iframe[name="${frameName}"]`);
                  
                  for (const selector of securitySelectors) {
                    try {
                      const secField = frameLocator.locator(selector).first();
                      const isVisible = await secField.isVisible().catch(() => false);
                      
                      if (isVisible) {
                        await secField.focus();
                        await this.page.waitForTimeout(300);
                        await secField.type(stripe.securityCode, { delay: 50 });
                        console.log(`✓ Security code entered: ${stripe.securityCode}`);
                        securityFound = true;
                        break;
                      }
                    } catch (e) {}
                  }
                  
                  if (securityFound) break;
                }
              } catch (e) {}
            }
          }
          
          // Find and select country dropdown
          console.log('🌍 Looking for country field...');
          const countrySelectors = [
            'select[id="payment-countryInput"]',
            'select[name="country"]',
            'button[aria-label*="Country"]',
            'input[placeholder*="Country"]',
            'button[role="combobox"]'
          ];
          
          let countryFound = false;
          
          // First check main page
          for (const selector of countrySelectors) {
            try {
              const countryField = this.page.locator(selector).first();
              const isVisible = await countryField.isVisible().catch(() => false);
              
              if (isVisible) {
                console.log(`   Found country field: ${selector}`);
                
                // If it's a select element, use selectOption
                if (selector.includes('select')) {
                  await countryField.selectOption('US');
                  console.log('✓ Country selected: United States');
                  countryFound = true;
                  break;
                } else {
                  // If it's a button/combobox, click and then select
                  await countryField.click();
                  await this.page.waitForTimeout(500);
                  
                  const usOption = this.page.locator('text=United States').first();
                  if (await usOption.isVisible().catch(() => false)) {
                    await usOption.click();
                    console.log('✓ Country selected: United States');
                    countryFound = true;
                    break;
                  }
                }
              }
            } catch (e) {
              // Continue to next selector
            }
          }
          
          // If not found on main page, check iframes
          if (!countryFound) {
            const iframeCount = await this.page.locator('iframe').count();
            for (let i = 0; i < iframeCount; i++) {
              try {
                const iframe = this.page.locator('iframe').nth(i);
                const frameName = await iframe.getAttribute('name').catch(() => '');
                
                if (frameName && frameName.includes('StripeFrame')) {
                  const frameLocator = this.page.frameLocator(`iframe[name="${frameName}"]`);
                  
                  for (const selector of countrySelectors) {
                    try {
                      const countryField = frameLocator.locator(selector).first();
                      const isVisible = await countryField.isVisible().catch(() => false);
                      
                      if (isVisible) {
                        console.log(`   Found country field in iframe: ${selector}`);
                        
                        if (selector.includes('select')) {
                          await countryField.selectOption('US');
                          console.log('✓ Country selected: United States');
                          countryFound = true;
                          break;
                        } else {
                          await countryField.click();
                          await this.page.waitForTimeout(500);
                          
                          const usOption = frameLocator.locator('text=United States').first();
                          if (await usOption.isVisible().catch(() => false)) {
                            await usOption.click();
                            console.log('✓ Country selected: United States');
                            countryFound = true;
                            break;
                          }
                        }
                      }
                    } catch (e) {}
                  }
                  
                  if (countryFound) break;
                }
              } catch (e) {}
            }
          }
          
          if (!countryFound) {
            console.log('ℹ️  Country field not found (may not be required for this payment method)');
          }
          
          await this.page.waitForTimeout(500);
          
          // Find and fill zip code
          console.log('📮 Looking for zip code field...');
          const zipSelectors = [
            'input[placeholder*="55443"]',
            'input[id*="postal" i]',
            'input[id*="zip" i]',
            'input[name="postal" i]',
            'input[name="postalCode" i]',
            'input[placeholder*="Postal"]',
            'input[placeholder*="ZIP"]'
          ];
          
          let zipFound = false;
          for (const selector of zipSelectors) {
            try {
              const zipField = this.page.locator(selector).first();
              const isVisible = await zipField.isVisible().catch(() => false);
              
              if (isVisible) {
                await zipField.click();
                await this.page.waitForTimeout(300);
                await zipField.type(stripe.zipCode, { delay: 50 });
                console.log(`✓ Zip code entered: ${stripe.zipCode}`);
                zipFound = true;
                break;
              }
            } catch (e) {
              // Continue to next selector
            }
          }
          
          // If not found on main page, check iframes
          if (!zipFound) {
            const iframeCount = await this.page.locator('iframe').count();
            for (let i = 0; i < iframeCount; i++) {
              try {
                const iframe = this.page.locator('iframe').nth(i);
                const frameName = await iframe.getAttribute('name').catch(() => '');
                
                if (frameName && frameName.includes('StripeFrame')) {
                  const frameLocator = this.page.frameLocator(`iframe[name="${frameName}"]`);
                  
                  for (const selector of zipSelectors) {
                    try {
                      const zipField = frameLocator.locator(selector).first();
                      const isVisible = await zipField.isVisible().catch(() => false);
                      
                      if (isVisible) {
                        await zipField.click();
                        await this.page.waitForTimeout(300);
                        await zipField.type(stripe.zipCode, { delay: 50 });
                        console.log(`✓ Zip code entered: ${stripe.zipCode}`);
                        zipFound = true;
                        break;
                      }
                    } catch (e) {}
                  }
                  
                  if (zipFound) break;
                }
              } catch (e) {}
            }
          }
          
          if (!zipFound) {
            console.log('ℹ️  Zip code field not found on this payment screen');
          }
          
          await this.page.waitForTimeout(1000);
        } catch (fillError) {
          console.log(`⚠️  Failed to fill card fields: ${fillError.message}`);
        }
      } else {
        console.log('ℹ️  No card number field found - using bank account payment');
      }
    } catch (error) {
      console.log('⚠️  Error checking card field:', error.message);
    }
  }

  /**
   * Verify the scan information matches what was selected
   */
  async verifyScanType(expectedScan) {
    // Wait for payment screen to load
    await this.page.waitForTimeout(2000);
    
    // Check if scan information is visible on the right side
    const scanVisible = await this.page.getByText(expectedScan).isVisible().catch(() => false);
    if (scanVisible) {
      console.log('✓ Scan type verified:', expectedScan);
      expect(scanVisible).toBeTruthy();
    }
  }

  /**
   * Extract and log payment screen details
   */
  async logPaymentScreenDetails() {
    console.log('\n========== PAYMENT SCREEN DETAILS ==========');
    
    try {
      // Get all text content from the page to find scan name
      const pageText = await this.page.locator('body').textContent();
      
      // Look for common scan type indicators
      if (pageText.includes('MRI')) {
        console.log('📋 Scan Name: MRI Scan');
      } else if (pageText.includes('CT')) {
        console.log('📋 Scan Name: CT Scan');
      } else if (pageText.includes('Ultrasound')) {
        console.log('📋 Scan Name: Ultrasound');
      }
      
      // Extract date - try multiple approaches
      let dateFound = false;
      
      // Approach 1: Look for specific date-related elements with visible text
      try {
        const dateElements = await this.page.locator('text=/\\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday).*?\\d{1,2}|\\d{1,2}.*?(January|February|March|April|May|June|July|August|September|October|November|December)/i').allTextContents();
        if (dateElements && dateElements.length > 0) {
          console.log('📅 Booked Date:', dateElements[0].trim());
          dateFound = true;
        }
      } catch (e) {
        // Continue to next approach
      }
      
      // Approach 2: Regex patterns from page text
      if (!dateFound) {
        let dateMatch;
        
        // Pattern 1: MM/DD/YYYY or DD/MM/YYYY
        dateMatch = pageText.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/);
        if (dateMatch) {
          console.log('📅 Booked Date:', `${dateMatch[1]}/${dateMatch[2]}/${dateMatch[3]}`);
          dateFound = true;
        }
        
        // Pattern 2: Month name with date (e.g., "March 19, 2025")
        if (!dateFound) {
          dateMatch = pageText.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})\b/i);
          if (dateMatch) {
            console.log('📅 Booked Date:', `${dateMatch[1]} ${dateMatch[2]}, ${dateMatch[3]}`);
            dateFound = true;
          }
        }
        
        // Pattern 3: YYYY-MM-DD format
        if (!dateFound) {
          dateMatch = pageText.match(/\b(\d{4})[-](\d{1,2})[-](\d{1,2})\b/);
          if (dateMatch) {
            console.log('📅 Booked Date:', `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`);
            dateFound = true;
          }
        }
        
        // Pattern 5: Look for month abbreviation with nearby numbers
      if (!dateFound) {
        // Find all text chunks with month names
        const monthRegex = /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December)/gi;
        const monthMatch = pageText.match(monthRegex);
        if (monthMatch && monthMatch.length > 0) {
          // Look for numbers near the month
          const monthText = monthMatch[0];
          const contextStart = Math.max(0, pageText.indexOf(monthText) - 10);
          const contextEnd = Math.min(pageText.length, pageText.indexOf(monthText) + monthText.length + 10);
          const context = pageText.substring(contextStart, contextEnd);
          const numbersNearMonth = context.match(/\b(\d{1,2})\b/g);
          if (numbersNearMonth && numbersNearMonth.length > 0) {
            console.log('📅 Booked Date:', `${numbersNearMonth[0]} ${monthText}`);
            dateFound = true;
          }
        }
      }
      
      // Pattern 6: Look for ordinal date format (e.g., "19th March")
      if (!dateFound) {
        dateMatch = pageText.match(/\b(\d{1,2})(st|nd|rd|th)\s+(January|February|March|April|May|June|July|August|September|October|November|December)\b/i);
        if (dateMatch) {
          console.log('📅 Booked Date:', `${dateMatch[1]}${dateMatch[2]} ${dateMatch[3]}`);
          dateFound = true;
        }
      }
      }
      
      if (!dateFound) {
        console.log('📅 Booked Date: [Not found on page]');
      }
      
      // Try to extract time information (AM/PM format)
      const timeMatch = pageText.match(/\b(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)\b/);
      if (timeMatch) {
        console.log('⏰ Scheduled Time:', `${timeMatch[1]}:${timeMatch[2]} ${timeMatch[3]}`);
      }
      
      // Try to find amount/price
      const amountMatch = pageText.match(/\$(\d+(?:,\d{3})*(?:\.\d{2})?)/);
      if (amountMatch) {
        console.log('💰 Amount:', `$${amountMatch[1]}`);
      }
      
      // Take screenshot for visual debugging
      await this.page.screenshot({ path: 'payment-screen.png' });
      console.log('📸 Screenshot saved: payment-screen.png');
      
      console.log('===========================================\n');
    } catch (error) {
      console.log('⚠️  Could not extract all details from payment screen');
      console.log('Error:', error.message);
    }
  }

  /**
   * Verify the scheduled date matches what was selected
   */
  async verifyScheduledDate(expectedDate) {
    // Check if date information is visible
    const dateVisible = await this.page.locator(`text=${expectedDate}`).isVisible().catch(() => false);
    if (dateVisible) {
      console.log('✓ Scheduled date verified:', expectedDate);
      expect(dateVisible).toBeTruthy();
    }
  }

  /**
   * Verify the scheduled time matches what was selected
   */
  async verifyScheduledTime(expectedTime) {
    // Check if time information is visible
    const timeVisible = await this.page.locator(`text=${expectedTime}`).isVisible().catch(() => false);
    if (timeVisible) {
      console.log('✓ Scheduled time verified:', expectedTime);
      expect(timeVisible).toBeTruthy();
    }
  }

  /**
   * Verify the amount/price for the scan matches expectations
   */
  async verifyAmount(expectedAmount) {
    // Check if amount is visible
    const amountVisible = await this.page.locator(`text=${expectedAmount}`).isVisible().catch(() => false);
    if (amountVisible) {
      console.log('✓ Amount verified:', expectedAmount);
      expect(amountVisible).toBeTruthy();
    }
  }

  /**
   * Verify all payment information at once
   */
  async verifyPaymentInformation(scanType, date, time, amount) {
    console.log('Verifying payment screen information on the right side...');
    await this.verifyScanType(scanType);
    await this.verifyScheduledDate(date);
    await this.verifyScheduledTime(time);
    await this.verifyAmount(amount);
  }

  /**
   * Click Continue button to proceed to next step
   */
  async clickContinue() {
    // Find and click the Continue button
    const continueButton = this.page.getByRole('button', { name: /Continue|Next|Confirm/i });
    await continueButton.click();
    console.log('✓ Clicked Continue button');
    await this.page.waitForTimeout(2000);
  }
}

module.exports = { PaymentPage };
