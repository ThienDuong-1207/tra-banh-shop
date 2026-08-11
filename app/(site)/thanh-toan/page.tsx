import CheckoutForm from "@/components/CheckoutForm";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ loi?: string }>;
}) {
  const { loi } = await searchParams;
  return <CheckoutForm errorMessage={loi ?? null} />;
}
