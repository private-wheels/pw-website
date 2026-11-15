/**
 * Our vehicle finance partner. Buyers apply on the partner's own online
 * application (hosted by Seriti Solutions), not on Private Wheels: we don't
 * provide credit and never see the application.
 */
export const FINANCE_PARTNER = {
  name: "Future Car Finance",
  /** Their online application, with our referral codes. */
  applyUrl:
    "https://torque.seritisolutions.co.za/app/financeapplication?CompanyCode=FUTU&UniqueCode=D0910F67-E876-434D-A6D5-6BE749937482",
  /** Their logo in `public/` (400 × 270, on white). */
  logo: { src: "/partners/future-car-finance.png", width: 400, height: 270 },
};
