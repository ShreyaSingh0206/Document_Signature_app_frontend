import React, { useRef } from 'react';

const Navbar = ({ onUploadStart, onUploadSuccess }) => {
  const fileInputRef = useRef(null);

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

  return (
    <div>
      <nav className="bg-cyan-300 w-full px-4 py-4 shadow-md z-10">
        <div className="max-w-2xl mx-auto">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            {/* Search Input and Search Button in one row */}
            <div className="w-full flex flex-row gap-2 md:w-2/3">
              <form className="relative flex-1">
                <label htmlFor="simple-search" className="sr-only">Search</label>
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 
                        4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  id="simple-search"
                  className="block w-full p-2 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Search documents..."
                />
              </form>
              <button className="bg-gray-100 text-gray-600 px-4 py-1 rounded-md transition hover:-translate-y-1 hover:scale-105">
                Search
              </button>
            </div>

            {/* Upload Button (moves below on small screens) */}
            <div className="w-full md:w-auto md:ml-15 flex justify-center md:justify-end">
              <button 
              className="w-full md:w-45 bg-gray-100 text-gray-600 px-2 py-2 rounded-md transition hover:-translate-y-1 hover:scale-105"
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
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Navbar;

