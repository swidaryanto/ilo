import { NextResponse } from "next/server";

import { auth } from "@/auth";

export default auth((_req) => {
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
