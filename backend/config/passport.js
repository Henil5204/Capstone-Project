const passport        = require("passport");
const GoogleStrategy  = require("passport-google-oauth20").Strategy;
const AppleStrategy   = require("passport-apple").Strategy;
const User            = require("../models/User");

// ── Google ─────────────────────────────────────────────────────────────────
passport.use(new GoogleStrategy({
  clientID:     process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL:  process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/api/auth/google/callback",
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email     = profile.emails?.[0]?.value;
    const firstName = profile.name?.givenName  || profile.displayName?.split(" ")[0] || "User";
    const lastName  = profile.name?.familyName || profile.displayName?.split(" ").slice(1).join(" ") || "";
    const avatar    = profile.photos?.[0]?.value;

    if (!email) return done(new Error("No email returned from Google"), null);

    let user = await User.findOne({ email });
    if (user) {
      if (!user.googleId) { user.googleId = profile.id; if (avatar) user.avatar = avatar; await user.save(); }
    } else {
      user = await User.create({
        firstName, lastName, email, googleId: profile.id, avatar,
        role: "employee", availability: "Full-Time",
        password: Math.random().toString(36) + Date.now().toString(36),
        oauthProvider: "google",
      });
    }
    return done(null, user);
  } catch (err) { return done(err, null); }
}));

// ── Apple ──────────────────────────────────────────────────────────────────
if (process.env.APPLE_CLIENT_ID) {
  passport.use(new AppleStrategy({
    clientID:           process.env.APPLE_CLIENT_ID,
    teamID:             process.env.APPLE_TEAM_ID,
    keyID:              process.env.APPLE_KEY_ID,
    privateKeyLocation: process.env.APPLE_PRIVATE_KEY_PATH,
    callbackURL:        process.env.APPLE_CALLBACK_URL || "http://localhost:5000/api/auth/apple/callback",
    passReqToCallback:  true,
  }, async (req, accessToken, refreshToken, idToken, profile, done) => {
    try {
      const bodyUser  = req.body?.user ? JSON.parse(req.body.user) : {};
      const email     = idToken?.email || bodyUser?.email;
      const firstName = bodyUser?.name?.firstName || "Apple";
      const lastName  = bodyUser?.name?.lastName  || "User";
      const appleId   = idToken?.sub;

      if (!email && !appleId) return done(new Error("No identifier from Apple"), null);

      let user = email ? await User.findOne({ email }) : await User.findOne({ appleId });
      if (user) {
        if (!user.appleId) { user.appleId = appleId; await user.save(); }
      } else {
        user = await User.create({
          firstName, lastName, appleId,
          email: email || `apple_${appleId}@shiftup.local`,
          role: "employee", availability: "Full-Time",
          password: Math.random().toString(36) + Date.now().toString(36),
          oauthProvider: "apple",
        });
      }
      return done(null, user);
    } catch (err) { return done(err, null); }
  }));
}

passport.serializeUser((user, done)   => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try { done(null, await User.findById(id)); } catch (e) { done(e, null); }
});

module.exports = passport;