"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff, Mail, Lock, AlertCircle } from "lucide-react"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Navbar } from "../../components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Alert, AlertDescription } from "../../components/ui/alert"
import { initializeApp, getApps, getApp } from "firebase/app";  // Import getApps and getApp

// Firebase imports

import {
  getAuth,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
} from "firebase/auth"

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCtDRO6z-61fvUYZMZYTpr9ohOzf3Mmfsw",
  authDomain: "diabetic-retinopathyy.firebaseapp.com",
  projectId: "diabetic-retinopathyy",
  storageBucket: "diabetic-retinopathyy.firebasestorage.app",
  messagingSenderId: "321863243919",
  appId: "1:321863243919:web:e527fbd123f031a5fef8fa",
  measurementId: "G-6VRF6QQ01M",
}

// Initialize Firebase
let app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app)
const provider = new GoogleAuthProvider()

export default function Login() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [notification, setNotification] = useState(null)

  // Check if there's a pending user from signup
  useEffect(() => {
    const pendingUser = localStorage.getItem("pendingUser")
    if (pendingUser) {
      const userData = JSON.parse(pendingUser)
      setEmail(userData.email || "")
      setNotification(`Please verify your email before logging in.`)
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Check if email is verified
      await user.reload() // Refresh the user to get the latest emailVerified status

      if (!user.emailVerified) {
        setError("Please verify your email before logging in. Check your inbox for a verification link.")

        // Option to resend verification email
        const resendButton = document.createElement("button")
        resendButton.textContent = "Resend verification email"
        resendButton.className = "text-blue-600 hover:underline ml-2"
        resendButton.onclick = async () => {
          try {
            await sendEmailVerification(user)
            setNotification("Verification email resent. Please check your inbox.")
          } catch (err) {
            setError("Failed to resend verification email. Please try again later.")
          }
        }

        setIsLoading(false)
        return
      }

      // Email is verified, proceed with login
      const userData = {
        uid: user.uid,
        email: user.email,
        fullName: user.displayName || email.split("@")[0],
        isLoggedIn: true,
        emailVerified: true,
      }

      // Store user info in localStorage
      localStorage.setItem("user", JSON.stringify(userData))

      // Set auth cookie with HttpOnly and Secure flags for better security
      document.cookie = "auth=true; path=/; max-age=604800; SameSite=Strict" // 7 days

      // Redirect to callback URL or dashboard
      router.push(callbackUrl)
    } catch (err) {
      setError(err.message || "Invalid email or password")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    try {
      const result = await signInWithPopup(auth, provider)
      const user = result.user

      // Google accounts are pre-verified
      localStorage.setItem(
        "user",
        JSON.stringify({
          uid: user.uid,
          fullName: user.displayName,
          email: user.email,
          isLoggedIn: true,
          emailVerified: true,
        }),
      )

      // Set auth cookie with HttpOnly and Secure flags for better security
      document.cookie = "auth=true; path=/; max-age=604800; SameSite=Strict" // 7 days

      // Redirect to callback URL or dashboard
      router.push(callbackUrl)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendVerification = async () => {
    if (!email) {
      setError("Please enter your email address")
      return
    }

    setIsLoading(true)
    try {
      // We need to sign in the user first to get the user object
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      await sendEmailVerification(user)
      setNotification("Verification email resent. Please check your inbox.")
      setError("")
    } catch (err) {
      setError("Failed to resend verification email. Please check your credentials.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Login</CardTitle>
            <CardDescription className="text-center">Enter your credentials to access your account</CardDescription>
          </CardHeader>

          <CardContent>
            {notification && (
              <Alert variant="info" className="mb-4 bg-blue-50 text-blue-800 border-blue-200">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4 mr-2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <AlertDescription className="font-medium">{notification}</AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {error}
                  {error.includes("verify your email") && (
                    <Button
                      variant="link"
                      className="p-0 h-auto text-white underline ml-2"
                      onClick={handleResendVerification}
                      disabled={isLoading}
                    >
                      Resend verification email
                    </Button>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-10 w-10 text-gray-400"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </form>

            <Button
              type="button"
              variant="outline"
              className="w-full mt-4"
              onClick={handleGoogleLogin}
              disabled={isLoading}
            >
              Sign in with Google
            </Button>

            <p className="mt-4 text-center text-sm">
              Don't have an account?{" "}
              <Link href="/signup" className="text-blue-600 hover:underline">
                Sign Up
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
