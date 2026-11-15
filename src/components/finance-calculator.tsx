"use client";

import { useMemo, useState } from "react";
import { Calculator, TrendingUp } from "lucide-react";
import {
  calculateAffordability,
  calculateInstalment,
  DEFAULT_INTEREST_RATE,
  PRIME_RATE,
} from "@/lib/finance";
import { formatCurrency } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InfoTip } from "@/components/ui/info-tip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TERM_OPTIONS = [12, 24, 36, 48, 60, 72, 84, 96];
const BALLOON_OPTIONS = [0, 5, 10, 15, 20, 25, 30];

/**
 * The instalment / affordability calculator — the reusable core behind
 * the `/finance` page and the PDP's "Calculate Finance" dialog.
 */
export function FinanceCalculator({ initialPrice = "" }: { initialPrice?: string }) {
  const [price, setPrice] = useState(initialPrice);
  const [deposit, setDeposit] = useState("");
  const [rate, setRate] = useState(String(DEFAULT_INTEREST_RATE));
  const [term, setTerm] = useState("72");
  const [balloon, setBalloon] = useState("0");

  const [income, setIncome] = useState("");
  const [expenses, setExpenses] = useState("");

  const instalmentResult = useMemo(() => {
    const p = Number(price);
    if (!p || p <= 0) return null;
    return calculateInstalment({
      price: p,
      deposit: Number(deposit) || 0,
      rate: Number(rate) || 0,
      termMonths: Number(term),
      balloonPct: Number(balloon),
    });
  }, [price, deposit, rate, term, balloon]);

  const affordabilityResult = useMemo(() => {
    const inc = Number(income);
    if (!inc || inc <= 0) return null;
    return calculateAffordability({
      income: inc,
      expenses: Number(expenses) || 0,
    });
  }, [income, expenses]);

  return (
    <Tabs defaultValue="instalment">
      <TabsList>
        <TabsTrigger value="instalment">
          <Calculator className="h-4 w-4" />
          Monthly Instalment
        </TabsTrigger>
        <TabsTrigger value="affordability">
          <TrendingUp className="h-4 w-4" />
          Affordability Check
        </TabsTrigger>
      </TabsList>

      <TabsContent value="instalment" className="mt-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border">
            <div className="border-b bg-muted px-5 py-3 text-sm font-semibold">
              Instalment calculator
            </div>
            <div className="flex flex-col gap-5 p-5">
              <div className="flex flex-col gap-1.5">
                <Label>Vehicle Price (R)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 450000"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5">
                  <Label>Deposit (R)</Label>
                  <InfoTip label="deposit">
                    Cash you pay upfront. It comes off the price, so you borrow less. Leave it blank if you&apos;re not putting down a deposit.
                  </InfoTip>
                </div>
                <Input
                  type="number"
                  placeholder="e.g. 50000"
                  value={deposit}
                  onChange={(e) => setDeposit(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5">
                  <Label>Interest Rate (% per annum)</Label>
                  <InfoTip label="interest rate">
                    The yearly rate the bank charges you. Banks usually quote it as prime plus a margin, depending on your credit record. If you have a finance quote, use its rate.
                  </InfoTip>
                </div>
                <Input
                  type="number"
                  step="0.01"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  SA Prime Rate: {PRIME_RATE}% | Linked rate varies per lender
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5">
                  <Label>Repayment Term (Months)</Label>
                  <InfoTip label="repayment term">
                    How long you take to pay the loan back. A longer term means smaller instalments, but more interest in total.
                  </InfoTip>
                </div>
                <Select value={term} onValueChange={(v) => v && setTerm(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {(v: string | null) => {
                        const t = Number(v ?? term);
                        return `${t} months (${(t / 12).toFixed(0)} year${t > 12 ? "s" : ""})`;
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {TERM_OPTIONS.map((t) => (
                      <SelectItem key={t} value={String(t)}>
                        {t} months ({(t / 12).toFixed(0)} year{t > 12 ? "s" : ""})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5">
                  <Label>Balloon Payment (%)</Label>
                  <InfoTip label="balloon payment">
                    A lump sum you still owe at the end of the term, as a percentage of the amount financed. It lowers your instalments, but you&apos;ll need to pay it off (or refinance it) when the term ends.
                  </InfoTip>
                </div>
                <Select value={balloon} onValueChange={(v) => v && setBalloon(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {(v: string | null) => {
                        const b = v ?? balloon;
                        return `${b}% ${b === "0" ? "(None)" : ""}`;
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {BALLOON_OPTIONS.map((b) => (
                      <SelectItem key={b} value={String(b)}>
                        {b}% {b === 0 ? "(None)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center rounded-2xl bg-muted p-8">
            {instalmentResult ? (
              <div className="w-full">
                <p className="text-center text-sm font-medium text-muted-foreground uppercase">
                  Estimated Monthly Instalment
                </p>
                <p className="mt-2 text-center text-4xl font-semibold tracking-tight">
                  {formatCurrency(instalmentResult.monthlyInstalment)}
                  <span className="text-base font-medium text-muted-foreground">/mo</span>
                </p>
                <div className="mt-6 flex flex-col gap-3 border-t pt-6 text-sm">
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      Amount Financed
                      <InfoTip label="amount financed">The vehicle price minus your deposit: what you borrow.</InfoTip>
                    </span>
                    <span className="font-semibold">
                      {formatCurrency(instalmentResult.principal)}
                    </span>
                  </div>
                  {instalmentResult.balloonAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                      Balloon Payment
                      <InfoTip label="balloon payment">The lump sum still owed at the end of the term.</InfoTip>
                    </span>
                      <span className="font-semibold">
                        {formatCurrency(instalmentResult.balloonAmount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      Total Interest
                      <InfoTip label="total interest">What the loan costs you on top of the amount financed, over the whole term.</InfoTip>
                    </span>
                    <span className="font-semibold">
                      {formatCurrency(instalmentResult.totalInterest)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      Total Repayment
                      <InfoTip label="total repayment">Everything you pay the bank: all your instalments plus any balloon payment.</InfoTip>
                    </span>
                    <span className="font-semibold">
                      {formatCurrency(instalmentResult.totalRepayment)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                <Calculator className="mx-auto h-8 w-8 opacity-40" />
                <p className="mt-3 text-sm">
                  Enter a vehicle price to calculate your monthly instalment.
                </p>
              </div>
            )}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="affordability" className="mt-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border">
            <div className="border-b bg-muted px-5 py-3 text-sm font-semibold">
              Affordability check
            </div>
            <div className="flex flex-col gap-5 p-5">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5">
                  <Label>Gross Monthly Income (R)</Label>
                  <InfoTip label="gross monthly income">
                    What you earn each month before tax and other deductions, as on your payslip. Include any other regular income.
                  </InfoTip>
                </div>
                <Input
                  type="number"
                  placeholder="e.g. 35000"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5">
                  <Label>Total Monthly Expenses (R)</Label>
                  <InfoTip label="total monthly expenses">
                    Everything that goes out each month: tax and other payslip deductions, rent or bond, food, utilities, insurance, school fees and the repayments on any debt you already have.
                  </InfoTip>
                </div>
                <Input
                  type="number"
                  placeholder="e.g. 18000"
                  value={expenses}
                  onChange={(e) => setExpenses(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Include tax and deductions, rent, food, utilities and debt repayments
                </p>
              </div>
              <p className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
                Based on South African banking guidelines, vehicle finance should not
                exceed 30% of disposable income. This tool uses a 72-month term at{" "}
                {DEFAULT_INTEREST_RATE}% p.a. for estimation.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center rounded-2xl bg-muted p-8">
            {affordabilityResult ? (
              <div className="w-full">
                <p className="text-center text-sm font-medium text-muted-foreground uppercase">
                  Estimated Affordable Vehicle Price
                </p>
                <p className="mt-2 text-center text-4xl font-semibold tracking-tight">
                  {formatCurrency(affordabilityResult.maxVehiclePrice)}
                </p>
                <div className="mt-6 flex flex-col gap-3 border-t pt-6 text-sm">
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      Disposable Income
                      <InfoTip label="disposable income">Your income minus your expenses: what&apos;s left over each month.</InfoTip>
                    </span>
                    <span className="font-semibold">
                      {formatCurrency(affordabilityResult.disposableIncome)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      Max Recommended Instalment
                      <InfoTip label="max recommended instalment">30% of your disposable income, a common guideline so a car doesn&apos;t stretch your budget.</InfoTip>
                    </span>
                    <span className="font-semibold">
                      {formatCurrency(affordabilityResult.maxInstalment)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                <TrendingUp className="mx-auto h-8 w-8 opacity-40" />
                <p className="mt-3 text-sm">
                  Enter your monthly income to check your vehicle affordability.
                </p>
              </div>
            )}
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
