import { NextResponse } from "next/server";
import { readProofJson } from "../../_lib/proofStore";
import {
  CfoExceptionsResponse,
  buildExceptionsFallback,
} from "../data";

export async function GET() {
  const data = await readProofJson<CfoExceptionsResponse>(
    "cfo_exceptions.json",
    buildExceptionsFallback(),
  );

  return NextResponse.json(data);
}
