import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import pool from "@/lib/mysql";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        try {
          const email = user.email.toLowerCase();
          const name = user.name || email.split("@")[0];

          // Check if user already exists in MySQL
          const [rows]: any = await pool.query(
            "SELECT id, role FROM users WHERE email = ?",
            [email]
          );

          let userId = "";
          let userRole = "USER";

          if (rows.length > 0) {
            userId = rows[0].id;
            userRole = rows[0].role;
          } else {
            // Google Registration: Check device_id cookie and IP for duplicate pendaftaran
            const { cookies, headers } = await import("next/headers");
            const cookieStore = await cookies();
            const headerList = await headers();
            const deviceId = cookieStore.get("device_id")?.value;

            // Get client IP address
            const xForwardedFor = headerList.get("x-forwarded-for");
            const xRealIp = headerList.get("x-real-ip");
            const rawIp = xForwardedFor || xRealIp || "127.0.0.1";
            const clientIp = rawIp.split(',')[0].trim();

            // 1. Check duplicate fingerprint
            if (deviceId) {
              const [dupDevice]: any = await pool.query(
                "SELECT id, email FROM users WHERE device_fingerprint = ?",
                [deviceId]
              );
              if (dupDevice.length > 0) {
                // Set temporary cookie for frontend notifications
                cookieStore.set("oauth_error", "DEVICE_ALREADY_REGISTERED", { path: "/", maxAge: 60 });
                return false;
              }
            }

            // 2. Check duplicate IP
            if (clientIp && clientIp !== "127.0.0.1" && clientIp !== "localhost" && clientIp !== "::1") {
              const [dupIp]: any = await pool.query(
                "SELECT id, email FROM users WHERE registration_ip = ?",
                [clientIp]
              );
              if (dupIp.length > 0) {
                // Set temporary cookie for frontend notifications
                cookieStore.set("oauth_error", "DEVICE_ALREADY_REGISTERED", { path: "/", maxAge: 60 });
                return false;
              }
            }

            userId = `usr-${Date.now()}`;
            userRole = "USER";

            await pool.query(
              `INSERT INTO users (id, name, email, role, password_hash, device_fingerprint, registration_ip, created_at)
               VALUES (?, ?, ?, ?, 'GOOGLE_OAUTH', ?, ?, NOW())`,
              [userId, name, email, userRole, deviceId || null, clientIp || null]
            );
          }

          // Attach database properties to user object
          user.id = userId;
          (user as any).role = userRole;
          return true;
        } catch (error) {
          console.error("Error in signIn callback:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "padi-invoice-pwa-nextauth-secret-12345",
  pages: {
    signIn: "/login",
  },
});

export { handler as GET, handler as POST };
