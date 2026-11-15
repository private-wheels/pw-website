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
}): RefundAdvice {
  if (opts.feeWaived) return { refund: false, why: "The fee was waived (admin listing), so there's nothing to refund." };
  if (!opts.hasPayment) return { refund: false, why: "There's no successful payment on this listing." };
  if (!opts.wasApproved) {
    return {
      refund: true,
      why: "It hasn't been approved, so the seller gets a full refund, whether we rejected it or they asked to cancel.",
    };
  }
  return {
    refund: false,
    why: "It was approved, so the service was delivered: no refund (founding sellers waiting for launch included). Tick only if the takedown is our mistake.",
  };
}
