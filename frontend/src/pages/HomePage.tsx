import React from 'react';
import { Link } from 'react-router-dom';
import { Camera, Layers, UploadCloud as CloudUpload } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

import { useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function base64ToBlob(base64: string, mime: string) {
  const byteString = atob(base64.split(",")[1]);
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const intArray = new Uint8Array(arrayBuffer);
  for (let i = 0; i < byteString.length; i++) {
    intArray[i] = byteString.charCodeAt(i);
  }
  return new Blob([intArray], { type: mime });
}




const HomePage: React.FC = () => {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authorized = params.get("authorized");
  
    if (authorized === "true") {
      const base64Image = localStorage.getItem("imageToUpload");
  
      if (base64Image) {
        const blob = base64ToBlob(base64Image, "image/png");
  
        const formData = new FormData();
        formData.append("file", blob, "id-photo.png");
        formData.append("description", "Uploaded from ID Photo Processor");
  
        fetch("http://localhost:8080/upload", {
          method: "POST",
          body: formData,
        })
          .then(async (res) => {
            const result = await res.json();
            if (res.ok) {
              toast.success(
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div style={{ fontSize: "1.6rem", fontWeight: "700", color: "#065f46" }}>
                    ✅ Upload Successful!
                  </div>
              
                  <div style={{ fontSize: "1.2rem", color: "#333" }}>
                    File name: <strong>{result.fileName}</strong>
                  </div>
              
                  <div>
                    <a
                      href={result.driveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: "0.6rem 1.2rem",
                        fontSize: "1rem",
                        textDecoration: "none",
                        backgroundColor: "#0d9488",
                        color: "#fff",
                        borderRadius: "6px",
                        display: "inline-block",
                        fontWeight: 500,
                      }}
                    >
                      📂 Open in Google Drive
                    </a>
                  </div>
                </div>
              );

              // toast.success(
              //   <div>
              //     <div style={{ fontSize: "1.4rem", marginBottom: "0.5rem" }}>✅ Uploaded!</div>
              //     <div style={{ fontWeight: 700 }}>{result.fileName}</div>
              //     <a
              //       href={result.driveUrl}
              //       target="_blank"
              //       rel="noopener noreferrer"
              //       style={{
              //         marginTop: "0.75rem",
              //         fontSize: "1rem",
              //         textDecoration: "underline",
              //         color: "#0d9488"
              //       }}
              //     >
              //       Open in Google Drive
              //     </a>
              //   </div>
              // );
              
              // toast.success(
              //   <>
              //     <div className="text-lg font-semibold">✅ Uploaded: <strong>{result.fileName}</strong></div>
              //     <div className="mt-2">
              //       <a
              //         href={result.driveUrl}
              //         target="_blank"
              //         rel="noopener noreferrer"
              //         className="underline text-blue-500 text-base"
              //         style={{
              //           color: "#2563eb",
              //           textDecoration: "underline",
              //           fontWeight: 600,
              //           marginTop: "0.5rem",
              //           display: "inline-block"
              //         }}
              //       >
              //         🔗 Open in Google Drive
              //       </a>
              //     </div>
              //   </>,
              //   {
              //     style: {
              //       fontSize: "16px",
              //       padding: "16px",
              //       lineHeight: "1.6",
              //       textAlign: "center",
              //       minWidth: "300px",
              //     },
              //     position: "top-center", // optional if you want it centered
              //   }
              // );
              // toast.success(
              //   <>
              //     ✅ Uploaded: <strong>{result.fileName}</strong> <br />
              //     <a
              //       href={result.driveUrl}
              //       target="_blank"
              //       rel="noopener noreferrer"
              //       className="underline text-blue-400"
              //     >
              //       Open in Google Drive
              //     </a>
              //   </>,
              //   {
              //     position: "top-center", // Centered
              //     autoClose: 6000,
              //     style: { fontSize: "1.1rem" },
              //   }
              // );
              localStorage.removeItem("imageToUpload");
  
              // Optional redirect to Drive after upload
              setTimeout(() => {
                window.open(result.driveUrl, "_blank");
              }, 4000);
            } else {
              toast.error(result.error || "Upload failed", {
                position: "top-center",
                style: { fontSize: "1.1rem" },
              });
            }
          })
          .catch((err) => {
            toast.error("Upload error: " + err.message, {
              position: "top-center",
              style: { fontSize: "1.1rem" },
            });
          });
  
        // ✅ Clean up the URL
        const url = new URL(window.location.href);
        url.searchParams.delete("authorized");
        window.history.replaceState({}, document.title, url.toString());
      } else {
        toast.info("You're authorized, but no image found.", {
          position: "top-center",
          style: { fontSize: "1.1rem" },
        });
      }
    }
  }, []);
  const features = [
    {
      icon: <Camera className="h-8 w-8 text-indigo-600" />,
      title: 'Accurate Background Removal & Replacement',
      description: 'Uses deep learning technology to precisely detect and isolate people in photos, allowing seamless background replacement with solid colors or custom images.'
    },
    {
      icon: <Layers className="h-8 w-8 text-indigo-600" />,
      title: 'Batch Processing',
      description: 'Process multiple photos at once with the same settings, saving time for large groups or organizations.'
    },
    {
      icon: <CloudUpload className="h-8 w-8 text-indigo-600" />,
      title: 'Cloud Integration',
      description: 'Save processed photos directly to Google Drive, Dropbox, or AWS S3 for easy access and sharing.'
    }
    
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Professional ID Photos in Seconds</h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              Transform your photos into perfect ID pictures with our advanced AI-powered processing system.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link 
                to="/process" 
                className="bg-white text-indigo-700 hover:bg-indigo-50 px-6 py-3 rounded-lg font-medium text-lg transition-colors"
              >
                Process a Photo
              </Link>
              <Link 
                to="/batch" 
                className="bg-indigo-800 bg-opacity-50 hover:bg-opacity-70 text-white px-6 py-3 rounded-lg font-medium text-lg transition-colors"
              >
                Batch Processing
              </Link>
            </div>
          </div>
        </section>
        
        {/* Features Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 justify-items-center">
              {features.map((feature, index) => (
                <div key={index} className="bg-white p-6 rounded-lg shadow-md">
                  <div className="mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* How It Works Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-indigo-600">1</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Upload Your Photo</h3>
                <p className="text-gray-600">Upload any portrait photo from your device or cloud storage.</p>
              </div>
              
              <div className="text-center">
                <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-indigo-600">2</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Process & Customize</h3>
                <p className="text-gray-600">Remove background, adjust cropping, replace clothes, and enhance quality.</p>
              </div>
              
              <div className="text-center">
                <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-indigo-600">3</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Download or Share</h3>
                <p className="text-gray-600">Get your professional ID photo in various formats ready for printing or digital use.</p>
              </div>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="bg-indigo-700 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to Create Perfect ID Photos?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Start processing your photos now and get professional results in seconds.
            </p>
            <Link 
              to="/process" 
              className="bg-white text-indigo-700 hover:bg-indigo-50 px-8 py-3 rounded-lg font-medium text-lg transition-colors"
            >
              Get Started
            </Link>
          </div>
        </section>
      </main>
      
      <Footer />

      <ToastContainer
        position="top-center"
        autoClose={6000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        toastClassName="Toastify__toast"
        bodyClassName="Toastify__toast-body"
        // toastClassName="text-lg text-gray-800 font-semibold shadow-lg rounded-xl px-6 py-4"
        // bodyClassName="flex justify-center items-center text-center"
      />
    </div>
  );
};

export default HomePage;