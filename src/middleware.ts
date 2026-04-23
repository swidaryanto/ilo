import { auth } from "@/auth";
import { type NextRequest, NextResponse } from "next/server";

export default auth((req: NextRequest & { auth: unknown }) => {
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
