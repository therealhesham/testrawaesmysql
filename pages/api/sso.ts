import { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "الطريقة غير مسموحة" });
  }

  const { token, redirect } = req.query;

  if (!token || typeof token !== "string") {
    return res.status(400).json({ message: "Token is required" });
  }

  const redirectPath = typeof redirect === "string" ? redirect : "/admin/home";

  // 1. Set the cookie for the new domain
  res.setHeader(
    "Set-Cookie",
    `authToken=${token}; Path=/; HttpOnly; Secure; SameSite=Strict`
  );

  // 2. Return an HTML page that injects the token into localStorage and redirects
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>جاري تحويل الجلسة...</title>
        <style>
          body {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background-color: #f3f4f6;
            font-family: system-ui, -apple-system, sans-serif;
          }
          .loader {
            border: 4px solid #e5e7eb;
            border-top: 4px solid #0d9488;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin-bottom: 16px;
          }
          .container {
            text-align: center;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="loader"></div>
          <p>جاري تحويل الجلسة، يرجى الانتظار...</p>
        </div>
        <script>
          // Set token in localStorage
          localStorage.setItem("token", "${token}");
          
          // Small delay to ensure localStorage is written before redirect
          setTimeout(function() {
            window.location.href = "${redirectPath}";
          }, 500);
        </script>
      </body>
    </html>
  `);
}
