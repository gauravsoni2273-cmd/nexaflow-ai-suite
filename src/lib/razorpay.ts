export interface RazorpayOptions {
  orgId: string;
  userEmail: string;
  userName: string;
  onSuccess: () => void;
}

export function openRazorpayCheckout({ orgId, userEmail, userName, onSuccess }: RazorpayOptions) {
  const options = {
    key: import.meta.env.VITE_RAZORPAY_KEY_ID,
    amount: 249900,
    currency: 'INR',
    name: 'NexaFlow',
    description: 'Pro Plan — 5,000 Credits',
    notes: { org_id: orgId, plan: 'pro', credits: '5000' },
    handler: function (_response: any) {
      onSuccess();
    },
    prefill: { email: userEmail, name: userName },
    theme: { color: '#00E5CC' },
  };
  const rzp = new (window as any).Razorpay(options);
  rzp.open();
}
