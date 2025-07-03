import React from 'react'
import {createBrowserRouter, Router, RouterProvider} from "react-router-dom"
import './App.css'
import './index.css'
import RegisterForm from '../components/RegisterForm'
import SignIn from '../components/SignIn'
import Home from '../components/Home'
import Dashboard from '../components/Dashboard'
import SignDocument from '../components/SignDocument'

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <Home/>,
    },
    {
      path: "/register",
      element: <RegisterForm />,
    },
    {
      path: "/login",
      element: <SignIn />,
    },
    {
      path: "/Dashboard",
      element: <Dashboard />,
    },
    {
      path: "/sign/:docId",
      element: <SignDocument />,
    },
  ]
)

function App() {

  return (
    <>
     <RouterProvider router={router} />
    </>
  )
}

export default App
