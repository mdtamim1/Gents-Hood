import { redirect } from 'next/navigation';

export default function CheckoutPaymentPage() {
  redirect('/checkout?step=payment');
}
