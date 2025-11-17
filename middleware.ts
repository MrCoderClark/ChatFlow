/* eslint-disable @typescript-eslint/no-explicit-any */
import arcjet, { createMiddleware, detectBot, tokenBucket } from '@arcjet/next';
import { withAuth } from '@kinde-oss/kinde-auth-nextjs/server';
import { NextRequest, NextResponse, NextFetchEvent, NextMiddleware } from 'next/server';

// Base arcjet instance with bot detection
const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    detectBot({
      mode: 'LIVE',
      allow: [
        'CATEGORY:SEARCH_ENGINE',
        'CATEGORY:PREVIEW',
        'CATEGORY:MONITOR',
        'CATEGORY:WEBHOOK',
      ],
    }),
  ],
});

// Rate limit for file uploads: 10 uploads per minute per user
const uploadRateLimit = aj.withRule(
  tokenBucket({
    mode: 'LIVE',
    characteristics: ['userId'],
    refillRate: 10,
    interval: 60,
    capacity: 10,
  })
);

// Rate limit for signed URL requests: 30 per minute per user
const signedUrlRateLimit = aj.withRule(
  tokenBucket({
    mode: 'LIVE',
    characteristics: ['userId'],
    refillRate: 30,
    interval: 60,
    capacity: 30,
  })
);

async function existingMiddleware(req: NextRequest) {
  const anyReq = req as {
    nextUrl: NextRequest['nextUrl'];
    kindeAuth?: { token?: any; user?: any };
  };

  const url = req.nextUrl;
  const userId = anyReq.kindeAuth?.user?.id || anyReq.kindeAuth?.token?.sub;

  // Apply rate limiting for file uploads
  if (url.pathname === '/api/uploads') {
    const decision = await uploadRateLimit.protect(req, { userId, requested: 1 });
    
    if (decision.isDenied()) {
      return NextResponse.json(
        { error: 'Too many uploads. Please wait a moment and try again.' },
        { status: 429 }
      );
    }
  }

  // Apply rate limiting for signed URL requests
  if (url.pathname.startsWith('/api/uploadme/')) {
    const decision = await signedUrlRateLimit.protect(req, { userId, requested: 1 });
    
    if (decision.isDenied()) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment and try again.' },
        { status: 429 }
      );
    }
  }

  const orgCode =
    anyReq.kindeAuth?.user?.org_code ||
    anyReq.kindeAuth?.token?.org_code ||
    anyReq.kindeAuth?.token?.claims?.org_code;

  if (
    url.pathname.startsWith('/workspace') &&
    !url.pathname.includes(orgCode || '')
  ) {
    url.pathname = `/workspace/${orgCode}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// const authWrapper = withAuth(existingMiddleware, {
//   publicPaths: ['/'],
// });

export default createMiddleware(aj, withAuth(existingMiddleware, {
  publicPaths: ["/"]
  }) as NextMiddleware
);


// export default createMiddleware(
//   aj,
//   async (request: NextRequest, event: NextFetchEvent) => {
//     const authResult = await authWrapper;
//     if (typeof authResult === 'function') {
//       return authResult(request, event);
//     }
//     return authResult as NextResponse;
//   }
// );

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|/rpc).*)'],
};
