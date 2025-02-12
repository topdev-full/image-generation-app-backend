'use strict';

const { createCoreController } = require('@strapi/strapi').factories;
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = createCoreController('api::payment.payment', ({ strapi }) => ({
  async createPaymentIntent(ctx) {
    try {
      const { amount } = ctx.request.body;
      
      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount * 100, // Stripe expects amounts in cents
        currency: 'usd',
        automatic_payment_methods: {
          enabled: true,
        },
      });

      // Create payment record in Strapi
      const payment = await strapi.entityService.create('api::payment.payment', {
        data: {
          stripeId: paymentIntent.id,
          amount,
          status: 'pending',
          // Add user if authenticated
          ...(ctx.state.user ? { user: ctx.state.user.id } : {})
        },
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentId: payment.id
      };
    } catch (error) {
      ctx.throw(500, error);
    }
  },

  async confirmPayment(ctx) {
    try {
      const { paymentIntentId } = ctx.request.body;
      
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status === 'succeeded') {
        // Update payment status in database
        const payment = await strapi.db.query('api::payment.payment').findOne({
          where: { stripeId: paymentIntentId }
        });
        
        if (payment) {
          await strapi.entityService.update('api::payment.payment', payment.id, {
            data: {
              status: 'completed'
            }
          });
        }
        
        return { success: true };
      }
      
      return { success: false };
    } catch (error) {
      ctx.throw(500, error);
    }
  }
})); 