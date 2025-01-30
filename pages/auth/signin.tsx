import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/router";

const SignIn = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Call NextAuth signIn API
    const result = await signIn("credentials", {
      redirect: false, // Set to false to handle redirects manually
      username,
      password,
    });
    console.log(result);
    if (result?.error) {
      setError("Invalid credentials, please try again.");
    } else {
      console.log(result);
      // Redirect to the home page or a protected page upon successful login
      // router.push("/");
    }
  };

  return (
    <div>
      <h2>Sign In</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit">Sign In</button>
      </form>
    </div>
  );
};

export default SignIn;
