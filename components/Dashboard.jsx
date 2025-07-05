
import React, { useEffect, useState } from "react";
import Navbar from "./Navbar";
import { Loader2, Trash2 } from "lucide-react";
import { FaFileSignature } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const [documents, setDocuments] = useState([]);
  const [isUploading, setUploading] = useState(false);

  const navigate = useNavigate();

  const fetchDocuments = async () => {
  try {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/docs`, {
      method: "GET",
      credentials: "include",
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Error ${res.status}`);
    }

    const data = await res.json();

    // Fix: Handle both array and wrapped object safely
    const docs = Array.isArray(data)
      ? data
      : Array.isArray(data.docs)
      ? data.docs
      : [];

    setDocuments(docs);  // always an array
  } catch (err) {
    console.error("Failed to fetch documents:", err.message);
    setDocuments([]); // fallback to empty array
  }
};


  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleDelete = async (docId, publicId) => {
    // optimistic update
    setDocuments((prev) => prev.filter((d) => d._id !== docId));

    try {
      await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/docs/${docId}`,
        {
          method: "DELETE",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publicId }), // see server route below
        }
      );
    } catch (err) {
      console.error("Delete failed, reloading list:", err);
      fetchDocuments(); // rollback by re-syncing
    }
  };

  const handleUploadStart = () => setUploading(true);
  const handleUploadFinish = () => {
    setUploading(false);
    fetchDocuments();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50">
      <Navbar
        onUploadStart={handleUploadStart}
        onUploadSuccess={handleUploadFinish}
      />

      {isUploading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="animate-spin w-10 h-10 text-white" />
            <p className="text-white text-lg font-medium">Uploading document…</p>
          </div>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-4 py-8">
        <header className="flex items-center gap-3 mb-6">
          <FaFileSignature className="text-cyan-600 w-6 h-6" />
          <h2 className="text-2xl font-semibold tracking-tight">Your Documents</h2>
        </header>

        {documents.length === 0 ? (
          <p className="text-gray-500 text-sm">No documents uploaded yet.</p>
        ) : (
          <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {documents.map(({ _id, originalName, cloudinaryUrl, publicId }) => (
              <article
                key={_id}
                className="group relative overflow-hidden rounded-2xl  bg-white shadow-sm ring-1 ring-gray-200 hover:shadow-lg transition-shadow"
              >
                <iframe
                  src={cloudinaryUrl}
                  title={originalName}
                  className="w-full h-56 "
                  id="custom"
                />

                <div className="p-4 space-y-3 flex flex-col">
                  <h3 className="text-sm font-medium truncate">{originalName}</h3>

                  <div className="flex justify-between items-center">
                    <button
                      onClick={() =>
                        navigate(`/sign/${_id}`, {
                          state: { cloudinaryUrl, originalName },
                        })
                      }
                      className="inline-flex items-center gap-2 rounded-md bg-cyan-600/10 px-3 py-1.5 text-xs font-semibold text-cyan-800 hover:bg-cyan-600/20 transition-colors group-hover:-translate-y-0.5 group-hover:scale-[1.02]"
                    >
                      <FaFileSignature className="w-4 h-4" />
                      Sign
                    </button>

                    <button
                      onClick={() =>
                        window.confirm(`Delete “${originalName}” permanently?`) &&
                        handleDelete(_id, publicId)
                      }
                      className="text-red-600 hover:text-red-800 transition-colors"
                      aria-label={`Delete ${originalName}`}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
