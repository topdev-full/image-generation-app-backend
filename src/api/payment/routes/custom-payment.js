module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/payments/create-intent',
      handler: 'payment.createPaymentIntent',
      config: {
        policies: [],
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/payments/confirm',
      handler: 'payment.confirmPayment',
      config: {
        policies: [],
        auth: false,
      },
    },
  ],
}; 