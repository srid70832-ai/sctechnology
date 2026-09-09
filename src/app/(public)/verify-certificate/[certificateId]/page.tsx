import { redirect } from "next/navigation";

export default function VerifyCertificateRedirect({
  params,
}: {
  params: { certificateId: string };
}) {
  redirect(`/verify/${encodeURIComponent(params.certificateId)}`);
}
