import { runSealProof } from "./actions/sealProofAction";

export default function SealReviewPage() {
  // This is a Server Component. The <form action> points at a "use server" function.
  return (
    <main className="p-6 bg-slate-50">
      <h1 className="text-2xl font-semibold text-slate-900 mb-4">
        🧾 Tower · Seal Review
      </h1>

      <form action={runSealProof}>
        <button
          type="submit"
          className="rounded-md bg-emerald-600 px-4 py-2 text-white font-semibold hover:bg-emerald-700"
        >
          Seal Proof
        </button>
      </form>

      <p className="mt-3 text-sm text-slate-600">
        This calls a Server Action on submit (no inline "use server" here).
      </p>
    </main>
  );
}
