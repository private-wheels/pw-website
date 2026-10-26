/**
 * When a listing fee should be refunded. Drives the default of the refund
 * checkbox when rejecting a listing, and the Refund guide page. Keep this in
 * line with the public Refund Policy.
 */
export type RefundAdvice = { refund: boolean; why: string };

export function refundAdvice(opts: {
  hasPayment: boolean;
  feeWaived: boolean;
  wasApproved: boolean;
  preLaunch: boolean;
}): RefundAdvice {
  if (opts.feeWaived) return { refund: false, why: "The fee was waived (admin listing), so there's nothing to refund." };
  if (!opts.hasPayment) return { refund: false, why: "There's no successful payment on this listing." };
  if (!opts.wasApproved) {
    return {
      refund: true,
      why: "It never went live, so the seller gets a full refund — whether we rejected it or they asked to cancel.",
    };
  }
  if (opts.preLaunch) {
    return {
      refund: true,
      why: "Founding seller before launch day: refund in full if they asked to cancel. Untick if you're removing it for breaking the listing rules.",
    };
  }
  return {
    refund: false,
    why: "It was live, so the service was delivered — no refund. Tick only if the takedown is our mistake or there's a good reason (e.g. a duplicate charge).",
  };
}
