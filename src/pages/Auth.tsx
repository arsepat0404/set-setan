// Legacy AuthPage — replaced by home page (access code) + lobby (nickname).
// Kept as a thin redirect component to avoid breaking existing imports.
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";

export default function AuthPage() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ to: "/" });
  }, [navigate]);
  return null;
}
