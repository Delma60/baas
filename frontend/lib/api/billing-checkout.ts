// frontend/lib/api/billing-checkout.ts
import { internalFetch } from "@/lib/api/client";

export interface CheckoutResponse {
  authorization_url: string;
  access_code: string;
  reference: string;
  amount: number;
  currency: string;
}

/**
 * Initiate a Flutterwave payment for an invoice
 */
export async function initiateCheckout(
  userId: string,
  invoiceId: string
): Promise<CheckoutResponse> {
  return internalFetch<CheckoutResponse>(
    `/billing/checkout?user_id=${encodeURIComponent(userId)}&invoice_id=${encodeURIComponent(invoiceId)}`,
    {
      method: "POST",
    }
  );
}

/**
 * Load Flutterwave script dynamically
 */
export function loadFlutterwaveScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window !== "undefined" && (window as any).FlutterwaveCheckout) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.flutterwave.com/v3.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Flutterwave script"));
    document.head.appendChild(script);
  });
}

/**
 * Trigger Flutterwave payment modal
 */
export async function triggerFlutterwavePayment(
  accessCode: string,
  reference: string,
  onSuccess: () => void,
  onError: (error: string) => void
): Promise<void> {
  await loadFlutterwaveScript();

  const FlutterwaveCheckout = (window as any).FlutterwaveCheckout;
  if (!FlutterwaveCheckout) {
    onError("Flutterwave is not loaded");
    return;
  }

  FlutterwaveCheckout({
    public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY,
    tx_ref: reference,
    amount: 0, // Amount is already set on the backend
    currency: "NGN",
    customer: {
      email: "", // Will be populated by the backend
    },
    customizations: {
      title: "YourBaaS Invoice Payment",
      description: "Pay your invoice now",
      logo: "https://yourbaas.com/logo.png",
    },
    callback: (data: any) => {
      if (data.status === "completed") {
        onSuccess();
      } else {
        onError("Payment was not completed");
      }
    },
    onclose: () => {
      onError("Payment was cancelled");
    },
  });
}
