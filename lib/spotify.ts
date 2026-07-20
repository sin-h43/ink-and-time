// Spotify OAuth 2.0 PKCE flow.
//
// generateCodeVerifier / generateCodeChallenge / startSpotifyLogin are real, working
// browser crypto — no external service needed for this half. What's missing is the
// token exchange, which has to happen server-side (Spotify's client secret can't live
// in the browser) and needs your own Spotify Developer app:
//
// 1. Create an app at https://developer.spotify.com/dashboard
// 2. Add to .env.local:
//      NEXT_PUBLIC_SPOTIFY_CLIENT_ID=...
//      NEXT_PUBLIC_SPOTIFY_REDIRECT_URI=http://localhost:3000/api/spotify/callback
//      SPOTIFY_CLIENT_SECRET=...        (server-only, never exposed to the client)
// 3. Add an app/api/spotify/callback/route.ts that exchanges the ?code= for an access
//    token via POST https://accounts.spotify.com/api/token, using the verifier stored
//    in sessionStorage below.
// 4. Once you have an access token, GET https://api.spotify.com/v1/me and branch on the
//    `product` field: "premium" → Web Playback SDK mini-player, "free" → deep-link to
//    spotify:// and fall back to the local ambient noise already built into Focus mode.

function base64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let str = "";
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function generateCodeVerifier(length = 64): string {
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  return base64url(arr.buffer);
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64url(digest);
}

export async function startSpotifyLogin(): Promise<void> {
  const verifier = generateCodeVerifier();
  sessionStorage.setItem("spotify_verifier", verifier);
  const challenge = await generateCodeChallenge(verifier);

  const params = new URLSearchParams({
    client_id: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID ?? "",
    response_type: "code",
    redirect_uri: process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI ?? "",
    code_challenge_method: "S256",
    code_challenge: challenge,
    scope: "streaming user-read-email user-read-private",
  });

  window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
}
