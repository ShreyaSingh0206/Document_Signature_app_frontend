import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";

const SignIn = () => {
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(data),
        }
      );

      const res = await response.json();
      if (!response.ok) throw new Error(res.message || "Signin failed");

      alert(res.message);
      navigate("/Dashboard");
    } catch (err) {
      alert(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center bg-purple-100 dark:bg-gray-900 px-4 sm:px-6">
      {/* CARD WRAPPER */}
      <div className="w-full max-w-sm sm:max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
        <div className="p-6 sm:p-8">
          <h1 className="text-center text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Sign in to your account
          </h1>

          <form
            className="flex flex-col gap-5"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            {/*  👉 EMAIL  */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="email"
                className="text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="name@company.com"
                autoComplete="email"
                className="w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-gray-900 focus:border-purple-600 focus:ring-purple-600 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-purple-500 dark:focus:ring-purple-500"
                {...register("email", {
                  required: "This field is required",
                })}
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/*  👉 PASSWORD  */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="password"
                className="text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-gray-900 focus:border-purple-600 focus:ring-purple-600 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-purple-500 dark:focus:ring-purple-500"
                {...register("password", {
                  required: "This field is required",
                })}
              />
              {errors.password && (
                <p className="text-xs text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/*  👉 SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg py-2.5 font-medium text-white transition disabled:opacity-70 bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-4 focus:ring-purple-300 dark:focus:ring-purple-800"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>

            {/*  👉 FOOTER LINK */}
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              Don’t have an account? {" "}
              <Link
                to="/register"
                className="font-medium text-purple-600 hover:underline"
              >
                Sign up
              </Link>
            </p>
          </form>
        </div>
      </div>
    </section>
  );
};

export default SignIn;

