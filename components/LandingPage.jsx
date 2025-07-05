import React, { useState, useEffect } from "react";
import { NavLink, Outlet } from 'react-router-dom'
import { Typewriter } from "react-simple-typewriter";
import { motion, AnimatePresence } from "framer-motion";

export default function LandingPage() {
  const [typingDone, setTypingDone] = useState(false);

  const MotionNavLink = motion(NavLink);

  useEffect(() => {
    const totalTypingTime =
      "Digitally Sign Documents with Ease".length * 70 + 1000;
    const timer = setTimeout(() => {
      setTypingDone(true);
    }, totalTypingTime);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-purple-100 overflow-x-hidden">
      {/* Navbar */}
      <nav className="flex justify-between items-center px-6 sm:px-8 py-6 bg-gradient-to-r from-purple-500 to-purple-400 text-white shadow-md flex-wrap">
        <div className="text-2xl font-bold tracking-wide ">SignSwift</div>
        <div className="flex items-center space-x-4 sm:space-x-6 mt-4 sm:mt-0 flex-wrap">
         
          <NavLink to="./login"
            className="rounded-lg bg-white text-purple-700 font-semibold px-4 py-2 shadow-sm
                       hover:bg-purple-100 transition-colors"
          >
            Sign In
          </NavLink>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="flex-1 flex flex-col-reverse lg:flex-row items-center justify-between px-6 sm:px-10 lg:px-24 py-16 gap-10 relative">
        {/* Text */}
        <div className="max-w-xl text-center lg:text-left z-10">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-purple-800 leading-tight">
            <Typewriter
              words={["Digitally Sign Documents with Ease"]}
              loop={1}
              typeSpeed={70}
              deleteSpeed={50}
              delaySpeed={1000}
              onLoopDone={() => setTypingDone(true)}
              onType={() => setTypingDone(false)}
              
            />
          </h1>

          <AnimatePresence>
            {typingDone && (
              <motion.p
                className="mt-6 text-purple-900/90 text-base sm:text-lg"
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8 }}
              >
                Upload, sign, and manage your documents securely. Save time and
                paper with seamless e‑signatures.
              </motion.p>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {typingDone && (
              <MotionNavLink
              to="./register"
                className="mt-8 inline-block rounded-lg bg-gradient-to-r from-purple-600 to-purple-500 text-white
                       text-lg font-semibold px-6 py-3 shadow-lg hover:brightness-110 transition-all"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.6 }}
              >
                Get Started
              </MotionNavLink>
            )}
          </AnimatePresence>
        </div>

        {/* Hero Image */}
        <div className="w-full max-w-xl lg:max-w-2xl z-0">
          <img
            src="/Room - Girl Working - Copy@1-1536x826.png"
            alt="Person signing documents"
            className="w-full h-auto object-contain"
          />
        </div>
      </header>

      {/* Footer */}
      <footer className="text-center py-6 bg-gradient-to-r from-purple-500 to-purple-400 text-white text-sm">
        © {new Date().getFullYear()} SignSwift. All rights reserved.
      </footer>
    </div>
  );
}
