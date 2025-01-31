import cookie from "cookie";

export default function handler(req, res) {
  // Check if it's a POST request
  if (req.method === "POST") {
    // Clear the token cookie by setting an expired date
    res.setHeader(
      "Set-Cookie",
      "authToken=" + "" + "; Path=/; HttpOnly; Secure; SameSite=Strict"
    );
    // Respond with a success message
    res.status(200).json({ message: "Logged out successfully" });
  } else {
    res.status(405).json({ message: "Method Not Allowed" }); // Only POST method is allowed
  }
}
