// api/src/config/passport.js
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { findOrCreateGoogleUser } = require("../services/authService");

// GOOGLE_CLIENT_ID/SECRET are only in .env as empty placeholders until the
// owner fills them in from Google Cloud Console — skip registering the
// strategy until then, otherwise passport-google-oauth20 throws at boot.
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL:
          process.env.GOOGLE_CALLBACK_URL ||
          "http://localhost:4000/api/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error("GOOGLE_NO_EMAIL"));
          }

          const result = await findOrCreateGoogleUser({
            googleId: profile.id,
            email,
            fullName: profile.displayName,
          });

          done(null, result);
        } catch (err) {
          done(err);
        }
      }
    )
  );
} else {
  console.warn(
    "[passport] GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET not set — Google login is disabled until you add them to api/.env."
  );
}

module.exports = passport;
