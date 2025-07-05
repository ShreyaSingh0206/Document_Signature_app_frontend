import React, { useRef } from 'react';
import { useNavigate } from "react-router-dom";

const Navbar = ({ onUploadStart, onUploadSuccess }) => {
  const fileInputRef = useRef(null);
  const navigate = useNavigate(); 

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    onUploadStart?.();

  if (file.type !== 'application/pdf') {
      alert('Only PDF files are allowed!');
      onUploadSuccess?.();          // hide spinner again
      return;
    }
  
  const formData = new FormData();
  formData.append('pdf', file);


    try {
      await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/docs/upload`,
        { method: 'POST', body: formData, credentials: 'include' }
      );
    } catch (err) {
      console.error("Upload failed:", err?.message || err);
      alert('Upload failed, try again.');
    } finally {
      /* ② hide spinner + let Dashboard refresh list */
      onUploadSuccess?.();
    }
  };

   const handleLogout = async () => {
    try {
      await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/logout`,
        { method: "POST", credentials: "include" }
      );
    } catch (err) {
      console.error("Logout failed:", err?.message || err);
    } finally {
      // client‑side clean‑up if you store anything in localStorage/etc.
      navigate("/login", { replace: true });   // redirect to login page
    }
  };

  return (
    <div>
      <nav className="bg-purple-600 w-full px-4 py-4 shadow-md z-10">
        <div className="max-w-full ">
          <div className="flex flex-col  md:flex-row md:items-center justify-between">
            {/* Upload Button (moves below on small screens) */}
          <div className="text-2xl font-bold tracking-wide text-white ">SignSwift</div>
            <div className='flex gap-8'>
               <div >
              <button 
              className="w-full md:w-45 bg-purple-100 font-bold text-purple-900 px-2 py-2 rounded-md transition hover:-translate-y-1 hover:scale-105"
              onClick={handleUploadClick}
              type="button"
              >
                Upload Document
              </button>
             
             
               <input
          type="file"
          accept=".pdf"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
            </div>
            <div className="ml-auto">
            <button
              onClick={handleLogout}
              type="button"
              className="w-full md:w-32 bg-white/20 text-white font-semibold px-2 py-2 rounded-md transition hover:-translate-y-1 hover:scale-105"
            >
              Logout
            </button>
          </div>
            </div>
            
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Navbar;

