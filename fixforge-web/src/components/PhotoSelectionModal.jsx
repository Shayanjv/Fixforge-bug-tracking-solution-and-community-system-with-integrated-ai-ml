import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { X, Camera, Image, Smile, Upload } from "lucide-react";
import { toast } from "sonner";
import { useUser } from '@/hooks/useUser';

export function PhotoSelectionModal({
  isOpen,
  onClose,
  onSelectPhoto,
  onSelectAvatar,
  currentPhoto
}) {
  const API_BASE = import.meta.env.VITE_API_BASE || "https://shy6565-fixforge-backend.hf.space
";
  const API_KEY = import.meta.env.VITE_EXT_KEY || "";

  const { user } = useUser();

  const [activeTab, setActiveTab] = useState("avatars");
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);

  const avatarOptions = [
    { id: 1, color: "from-purple-500 to-purple-600", icon: "👨‍💻" },
    { id: 2, color: "from-blue-500 to-blue-600", icon: "👩‍💻" },
    { id: 3, color: "from-green-500 to-green-600", icon: "🧑‍💼" },
    { id: 4, color: "from-red-500 to-red-600", icon: "👨‍🎨" },
    { id: 5, color: "from-yellow-500 to-yellow-600", icon: "👩‍🎨" },
    { id: 6, color: "from-pink-500 to-pink-600", icon: "🧑‍🔬" },
    { id: 7, color: "from-indigo-500 to-indigo-600", icon: "👨‍🚀" },
    { id: 8, color: "from-teal-500 to-teal-600", icon: "👩‍🚀" },
    { id: 9, color: "from-orange-500 to-orange-600", icon: "🧑‍🎓" },
    { id: 10, color: "from-cyan-500 to-cyan-600", icon: "👨‍🏫" },
    { id: 11, color: "from-violet-500 to-violet-600", icon: "👩‍🏫" },
    { id: 12, color: "from-rose-500 to-rose-600", icon: "🧑‍⚕️" }
  ];

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // ✅ FIX 1: Handle file upload with proper error handling
  const handleFileUpload = async (e) => {
    if (!user) {
      toast.error("Please log in to upload photos");
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    // ✅ Create local preview immediately
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      setPreviewUrl(dataUrl);
      
      // ✅ FIX 2: If upload endpoint doesn't exist, use local preview directly
      // This is a client-side only solution until backend is ready
      console.log('📸 Image loaded locally:', dataUrl.substring(0, 50) + '...');
    };
    reader.readAsDataURL(file);

    // ✅ FIX 3: Try to upload to server, but don't fail if endpoint missing
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("user_id", user.id);

      console.log(`🔵 Attempting upload to: ${API_BASE}/users/${user.id}/upload/avatar`);

      const res = await fetch(`${API_BASE}/users/${user.id}/upload/avatar`, {
        method: "POST",
        headers: {
          "x-api-key": API_KEY,
          "Authorization": `Bearer ${user.id}`
        },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        console.log('✅ Server upload successful:', data);
        // Use server URL if available
        onSelectPhoto(data.url || data.avatar_url);
        toast.success("Photo uploaded successfully");
        onClose();
      } else {
        const errorText = await res.text();
        console.warn('⚠️ Server upload failed (404):', errorText);
        
        // ✅ FIX 4: Fallback to local preview if server upload fails
        toast.info("Using local preview (server upload unavailable)");
        // Preview is already set above, user can still use it
      }
    } catch (err) {
      console.warn('⚠️ Upload endpoint not available:', err.message);
      toast.info("Using local preview");
      // Preview is already set, continue using local image
    } finally {
      setUploading(false);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user"
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setCameraActive(true);
        };
      }
    } catch (err) {
      console.error("Camera access denied:", err);
      toast.error("Unable to access camera. Please grant camera permissions.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
    }
  };

  const capturePhoto = async () => {
    if (!user) {
      toast.error("Please log in to capture photos");
      return;
    }

    if (!videoRef.current || !cameraActive) {
      toast.error("Camera not ready");
      return;
    }

    try {
      const canvas = document.createElement("canvas");
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // ✅ Convert to data URL for local preview
      const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
      setPreviewUrl(dataUrl);

      canvas.toBlob(async (blob) => {
        if (!blob) {
          toast.error("Failed to capture photo");
          return;
        }

        const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
        
        setUploading(true);
        try {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("user_id", user.id);

          const res = await fetch(`${API_BASE}/users/${user.id}/upload/avatar`, {
            method: "POST",
            headers: { 
              "x-api-key": API_KEY,
              "Authorization": `Bearer ${user.id}`
            },
            body: formData
          });

          if (res.ok) {
            const data = await res.json();
            console.log('✅ Capture upload successful:', data);
            onSelectPhoto(data.url || data.avatar_url);
            toast.success("Photo captured successfully");
            stopCamera();
            onClose();
          } else {
            console.warn('⚠️ Server upload failed, using local preview');
            toast.info("Using local preview");
            // User can still use the preview
          }
        } catch (err) {
          console.warn('⚠️ Upload endpoint not available:', err.message);
          toast.info("Using local preview");
        } finally {
          setUploading(false);
        }
      }, "image/jpeg", 0.95);
    } catch (err) {
      console.error('❌ Capture error:', err);
      toast.error("Failed to capture photo");
    }
  };

  const handleClose = () => {
    stopCamera();
    setPreviewUrl(null);
    onClose();
  };

  // ✅ FIX 5: Handle "Use This Photo" button click
  const handleUsePhoto = () => {
    if (previewUrl) {
      onSelectPhoto(previewUrl);
      toast.success("Photo selected!");
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 flex items-start justify-center p-4 pt-8 pb-8" 
        style={{ zIndex: 10000, overflowY: 'auto' }}
        onClick={handleClose}
      >
        <div 
          className="bg-white rounded-xl shadow-2xl max-w-2xl w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-purple-600 to-purple-700 rounded-t-xl">
            <h2 className="text-2xl font-bold text-white">Choose Profile Picture</h2>
            <button
              onClick={handleClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
              type="button"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b">
            <button
              type="button"
              onClick={() => {
                setActiveTab("avatars");
                stopCamera();
                setPreviewUrl(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-medium transition-colors ${
                activeTab === "avatars"
                  ? "text-purple-600 border-b-2 border-purple-600 bg-purple-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <Smile className="w-5 h-5" />
              Avatars
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("upload");
                stopCamera();
              }}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-medium transition-colors ${
                activeTab === "upload"
                  ? "text-purple-600 border-b-2 border-purple-600 bg-purple-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <Upload className="w-5 h-5" />
              Upload
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("camera");
                setPreviewUrl(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-medium transition-colors ${
                activeTab === "camera"
                  ? "text-purple-600 border-b-2 border-purple-600 bg-purple-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <Camera className="w-5 h-5" />
              Camera
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 max-h-[calc(100vh-16rem)] overflow-y-auto">
            {/* Avatars Tab */}
            {activeTab === "avatars" && (
              <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                {avatarOptions.map((avatar) => (
                  <button
                    key={avatar.id}
                    type="button"
                    onClick={() => {
                      onSelectAvatar(avatar.id);
                      onClose();
                    }}
                    className={`aspect-square rounded-xl bg-gradient-to-br ${avatar.color} flex items-center justify-center text-5xl hover:scale-110 transition-transform shadow-lg hover:shadow-xl ${
                      currentPhoto === `avatar-${avatar.id}` ? "ring-4 ring-purple-600 scale-105" : ""
                    }`}
                  >
                    {avatar.icon}
                  </button>
                ))}
              </div>
            )}

            {/* Upload Tab */}
            {activeTab === "upload" && (
              <div className="text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {previewUrl ? (
                  <div className="space-y-4">
                    {/* ✅ FIX 6: Proper circular preview */}
                    <div className="flex justify-center">
                      <div className="relative w-48 h-48">
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="absolute inset-0 w-full h-full rounded-full object-cover border-4 border-purple-200 shadow-lg"
                        />
                      </div>
                    </div>
                    <div className="flex gap-3 justify-center">
                      <Button
                        type="button"
                        onClick={() => {
                          setPreviewUrl(null);
                          fileInputRef.current?.click();
                        }}
                        variant="outline"
                        disabled={uploading}
                      >
                        Choose Different Photo
                      </Button>
                      <Button 
                        type="button"
                        onClick={handleUsePhoto}
                        disabled={uploading}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        {uploading ? "Uploading..." : "Use This Photo"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-12 cursor-pointer hover:border-purple-400 transition-colors"
                  >
                    <Image className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">Click to upload a photo</p>
                    <p className="text-sm text-gray-500">PNG, JPG up to 5MB</p>
                  </div>
                )}

                {uploading && (
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-600 h-2 rounded-full animate-pulse w-3/5" />
                    </div>
                    <p className="text-sm text-gray-600 mt-2">Processing...</p>
                  </div>
                )}
              </div>
            )}

            {/* Camera Tab */}
            {activeTab === "camera" && (
              <div className="text-center space-y-4">
                {!cameraActive ? (
                  <div className="py-12">
                    <Camera className="w-24 h-24 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-6">Take a photo with your camera</p>
                    <Button 
                      type="button"
                      onClick={startCamera} 
                      className="gap-2 bg-purple-600 hover:bg-purple-700"
                    >
                      <Camera className="w-5 h-5" />
                      Open Camera
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full max-w-md aspect-video rounded-lg border-4 border-purple-200 shadow-lg object-cover"
                      />
                    </div>
                    <div className="flex gap-3 justify-center">
                      <Button
                        type="button"
                        onClick={capturePhoto}
                        disabled={uploading}
                        className="gap-2 bg-purple-600 hover:bg-purple-700"
                      >
                        <Camera className="w-5 h-5" />
                        {uploading ? "Processing..." : "Capture Photo"}
                      </Button>
                      <Button
                        type="button"
                        onClick={stopCamera}
                        variant="outline"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
