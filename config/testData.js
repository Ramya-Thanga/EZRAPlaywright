module.exports = {
  // Authentication
  auth: {
    email: 'testing4@gm.co',
    password: 'Testing@1357',
    confirmationUrl: 'https://myezra-staging.ezra.com/sign-up/scan-confirm'
  },

  // Booking Flow - Selectors
  booking: {
    scanText: 'MRI Scan Available at $',
    planSubmitTestId: 'select-plan-submit-btn',
    locationText: 'Recommended AMRICNew York,',
    dateTestId: '3-19-cal-day-content',
    submitTestId: 'submit',
    amountSelector: '$'
  },

  // Payment - Stripe Iframe
  stripe: {
    iframeName: '__privateStripeFrame*',
    cardNumber: '4242 4242 4242 4242',
    expirationDate: '12 / 27',
    securityCode: '234',
    postalCode: '55443',
    zipCode: '55443',
    country: 'US',
    cardNumberLabel: 'Card number',
    cardNumberInputId: 'payment-numberInput',
    expirationLabel: 'Expiration date MM / YY',
    expirationMMYYLabel: 'Expiration (MM/YY) MM / YY',
    securityCodeLabel: 'Security code',
    postalCodeLabel: 'Postal code',
    zipCodeLabel: 'ZIP code',
    countryLabel: 'Country'
  },

  // UI Elements
  ui: {
    buttonsSelector: '.buttons',
    arrowDownCount: {
      postalCode: 3,
      zipCode: 7
    }
  },

  // Navigation
  navigation: {
    homeLink: 'Home'
  }
};
