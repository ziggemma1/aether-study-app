import React from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '../context/AppContext';
import { CreditCard, CheckCircle2, Zap, Shield, Star, Receipt } from 'lucide-react';

export default function SubscriptionManagement() {
  const { user } = useAppContext();

  const plans = [
    {
      name: 'Free',
      price: '0',
      features: ['5 Materials per month', 'AI Summaries', 'Basic Quizzes'],
      current: user?.plan === 'free',
    },
    {
      name: 'Pro',
      price: '9.99',
      features: ['Unlimited Materials', 'Advanced AI Analysis', 'Custom Reading Plans', 'Priority Support'],
      current: user?.plan === 'pro',
      popular: true,
    },
  ];

  return (
    <div className="p-4 md:p-8 lg:p-12 max-w-5xl mx-auto">
      <header className="mb-12">
        <h1 className="text-3xl font-bold mb-2 text-text-main">Subscription Management</h1>
        <p className="text-text-muted">Manage your plan and billing information.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Current Plan Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-8 bg-primary text-white">
            <h3 className="text-lg font-bold mb-6">Current Plan</h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                <Star className="text-secondary" size={20} />
              </div>
              <div>
                <p className="text-sm text-white/70">Plan Type</p>
                <p className="text-xl font-bold capitalize">{user?.plan} Plan</p>
              </div>
            </div>
            <p className="text-sm text-white/60 mb-8">Your next billing date is April 25, 2024.</p>
            <button className="w-full py-3 bg-white text-primary rounded-xl font-bold hover:bg-secondary hover:text-white transition-colors">
              Manage Billing
            </button>
          </div>

          <div className="glass-card p-6">
            <h3 className="font-bold mb-4 text-text-main">Usage This Month</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-text-muted">Materials</span>
                  <span className="font-bold text-text-main">3 / 5</span>
                </div>
                <div className="h-1.5 bg-surface rounded-full overflow-hidden border border-border">
                  <div className="h-full bg-primary w-[60%]" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-text-muted">AI Quizzes</span>
                  <span className="font-bold text-text-main">8 / 10</span>
                </div>
                <div className="h-1.5 bg-surface rounded-full overflow-hidden border border-border">
                  <div className="h-full bg-secondary w-[80%]" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Plan Selection */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  "glass-card p-8 flex flex-col border-2 transition-all",
                  plan.current ? "border-primary bg-primary/5" : "border-border"
                )}
              >
                {plan.popular && (
                  <div className="self-start px-3 py-1 bg-secondary text-white text-xs font-bold rounded-full mb-4">
                    MOST POPULAR
                  </div>
                )}
                <h3 className="text-xl font-bold mb-2 text-text-main">{plan.name}</h3>
                <div className="text-3xl font-bold mb-6 text-text-main">${plan.price}<span className="text-sm font-normal text-text-muted">/mo</span></div>
                
                <ul className="space-y-3 mb-8 flex-grow">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-text-muted">
                      <CheckCircle2 size={16} className="text-secondary" /> {feature}
                    </li>
                  ))}
                </ul>

                <button
                  disabled={plan.current}
                  className={cn(
                    "w-full py-3 rounded-xl font-bold transition-all",
                    plan.current
                      ? "bg-surface text-text-muted cursor-not-allowed border border-border"
                      : "btn-primary"
                  )}
                >
                  {plan.current ? 'Current Plan' : `Upgrade to ${plan.name}`}
                </button>
              </div>
            ))}
          </div>

          <div className="glass-card p-8">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-text-main">
              <Receipt size={20} className="text-primary" /> Billing History
            </h3>
            <div className="space-y-4">
              {[
                { date: 'Mar 25, 2024', amount: '$9.99', status: 'Paid' },
                { date: 'Feb 25, 2024', amount: '$9.99', status: 'Paid' },
                { date: 'Jan 25, 2024', amount: '$9.99', status: 'Paid' },
              ].map((invoice, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 hover:bg-surface rounded-xl transition-colors border border-transparent hover:border-border">
                  <div>
                    <p className="font-bold text-text-main">{invoice.date}</p>
                    <p className="text-xs text-text-muted">Pro Plan Subscription</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-text-main">{invoice.amount}</p>
                    <span className="text-xs font-bold text-green-500 uppercase">{invoice.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { cn } from '../lib/utils';
