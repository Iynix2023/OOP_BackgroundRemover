import React from 'react';
import { Link } from 'react-router-dom';
import { Camera, Users, Layers, UploadCloud as CloudUpload } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const HomePage: React.FC = () => {
  const features = [
    {
      icon: <Camera className="h-8 w-8 text-indigo-600" />,
      title: 'Advanced Background Removal',
      description: 'Automatically remove and replace backgrounds with solid colors or custom images using AI-powered technology.'
    },
    {
      icon: <Users className="h-8 w-8 text-indigo-600" />,
      title: 'Clothes Replacement',
      description: 'Replace clothing with professional attire for formal ID photos using deep learning-based segmentation.'
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
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
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
    </div>
  );
};

export default HomePage;