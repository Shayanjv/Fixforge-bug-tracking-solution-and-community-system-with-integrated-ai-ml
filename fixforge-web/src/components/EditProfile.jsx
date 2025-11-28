import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { PhotoSelectionModal } from "./PhotoSelectionModal";
import { X, Upload, Save, User, Mail, MapPin, Tag, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useUser } from '@/hooks/useUser';
import { toast } from "sonner";

export function EditProfile({ userData, onClose, onSave }) {
  const { user } = useUser();
  const API_BASE = import.meta.env.VITE_API_BASE || "https://shy6565-fixforge-backend.hf.space
";
  const API_KEY = import.meta.env.VITE_EXT_KEY || "";

  const [selectedTags, setSelectedTags] = useState([]);
  const [newTag, setNewTag] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [formData, setFormData] = useState({
    displayName: "",
    username: "",
    email: "",
    bio: "",
    location: "",
    role: ""
  });

  const [errors, setErrors] = useState({});

  const availableTags = [
    "React", "TypeScript", "JavaScript", "Node.js", "Python",
    "Java", "Go", "Rust", "PostgreSQL", "MongoDB",
    "AWS", "Docker", "Kubernetes", "GraphQL", "REST API"
  ];

  const roles = ["Developer", "Designer", "Manager", "Student", "Other"];

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

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  useEffect(() => {
    if (userData) {
      setFormData({
        displayName: userData.display_name || userData.displayName || "",
        username: userData.username || "",
        email: userData.email || "",
        bio: userData.bio || "",
        location: userData.location || "",
        role: userData.role || ""
      });
      setSelectedTags(userData.expertise || []);
      setAvatarPreview(userData.avatar_url || userData.avatar || "");
    }
  }, [userData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
    setSubmitError("");
  };

  const handleAddTag = (tag) => {
    if (!selectedTags.includes(tag) && selectedTags.length < 10) {
      setSelectedTags([...selectedTags, tag]);
    }
    setNewTag("");
  };

  const handleRemoveTag = (tag) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };

  const handlePhotoSelect = (photoUrl) => {
    setAvatarPreview(photoUrl);
    setShowPhotoModal(false);
  };

  const handleAvatarSelect = (avatarId) => {
    setAvatarPreview(`avatar-${avatarId}`);
    setShowPhotoModal(false);
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview("");
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.displayName.trim()) {
      newErrors.displayName = "Display name is required";
    }

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = "Username can only contain letters, numbers, and underscores";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (formData.bio && formData.bio.length > 500) {
      newErrors.bio = "Bio must be less than 500 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      setSubmitError("Please log in to save changes");
      return;
    }

    if (!validateForm()) return;

    setLoading(true);
    setSubmitError("");

    try {
      const payload = {
        display_name: formData.displayName,
        username: formData.username,
        email: formData.email,
        bio: formData.bio || null,
        location: formData.location || null,
        role: formData.role || null,
        expertise: selectedTags,
        avatar_url: avatarPreview || null
      };

      console.log('🔵 Sending update:', payload);

      const response = await fetch(`${API_BASE}/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(API_KEY ? { 'x-api-key': API_KEY } : {})
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('🔴 Update error:', errorData);
        throw new Error(errorData.detail || 'Failed to update profile');
      }

      const updatedUser = await response.json();
      console.log('🔵 Update successful:', updatedUser);
      
      toast.success("Profile updated successfully!");
      onSave(updatedUser);
      onClose();
      
    } catch (error) {
      console.error('🔴 Failed to update profile:', error);
      setSubmitError(error.message || 'Failed to update profile. Please try again.');
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const initials = formData.displayName
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  const renderAvatar = () => {
    if (avatarPreview && avatarPreview.startsWith('avatar-')) {
      const avatarId = parseInt(avatarPreview.replace('avatar-', ''));
      const avatar = avatarOptions.find(a => a.id === avatarId);

      if (avatar) {
        return (
          <div className={`w-full h-full bg-gradient-to-br ${avatar.color} flex items-center justify-center text-5xl rounded-full`}>
            {avatar.icon}
          </div>
        );
      }
    }
    return null;
  };

  if (!user) {
    return null;
  }

  return (
    <>
      {/* Photo Selection Modal */}
      {showPhotoModal && (
        <PhotoSelectionModal
          isOpen={showPhotoModal}
          onClose={() => setShowPhotoModal(false)}
          onSelectPhoto={handlePhotoSelect}
          onSelectAvatar={handleAvatarSelect}
          currentPhoto={avatarPreview}
        />
      )}

      {/* ✅ KEY FIX: Outer div with overflow-y-auto on backdrop, items-start for top alignment */}
      <div 
        className="fixed inset-0 bg-black/50 flex items-start justify-center p-4 pt-8 pb-8" 
        style={{ zIndex: 9999, overflowY: 'auto' }}
        onClick={onClose}
      >
        <div 
          className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-700 via-purple-600 to-purple-700 p-6 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl text-white font-bold">Edit Profile</h2>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                disabled={loading}
                type="button"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* ✅ KEY FIX: Form with max-height and overflow-y-auto */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(100vh-16rem)] overflow-y-auto">
            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{submitError}</p>
              </div>
            )}

            {/* Avatar Section */}
            <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
              <Label className="text-gray-900 mb-4 block font-semibold">Profile Picture</Label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <button
                  type="button"
                  onClick={() => setShowPhotoModal(true)}
                  className="relative group cursor-pointer"
                  disabled={loading}
                >
                  <Avatar className="w-24 h-24 border-4 border-purple-100 hover:border-purple-300 transition-all rounded-full">
                    {avatarPreview && avatarPreview.startsWith('avatar-') ? (
                      <AvatarFallback className="p-0 bg-transparent rounded-full">
                        {renderAvatar()}
                      </AvatarFallback>
                    ) : (
                      <>
                        {avatarPreview && <AvatarImage src={avatarPreview} alt="Avatar" className="object-cover rounded-full" />}
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-purple-600 text-white text-2xl font-bold rounded-full">
                          {initials}
                        </AvatarFallback>
                      </>
                    )}
                  </Avatar>
                  <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Upload className="w-6 h-6 text-white" />
                  </div>
                </button>
                <div className="flex-1">
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="border-purple-300 text-purple-700 hover:bg-purple-50"
                      onClick={() => setShowPhotoModal(true)}
                      disabled={loading}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {avatarPreview ? 'Change Photo' : 'Add Photo'}
                    </Button>
                    {avatarPreview && (
                      <Button
                        type="button"
                        variant="outline"
                        className="border-red-300 text-red-600 hover:bg-red-50"
                        onClick={handleRemoveAvatar}
                        disabled={loading}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Remove Photo
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    Click to choose from avatars or gallery.
                  </p>
                </div>
              </div>
            </div>

            {/* Basic Information */}
            <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
              <h3 className="text-gray-900 mb-4 flex items-center gap-2 font-semibold">
                <User className="w-5 h-5 text-purple-600" />
                Basic Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="displayName">Display Name *</Label>
                  <Input
                    id="displayName"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    className={errors.displayName ? 'border-red-500' : ''}
                    disabled={loading}
                  />
                  {errors.displayName && (
                    <p className="text-red-600 text-xs mt-1">{errors.displayName}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="username">Username *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                    <Input
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      placeholder="johndoe"
                      className={`pl-8 ${errors.username ? 'border-red-500' : ''}`}
                      disabled={loading}
                    />
                  </div>
                  {errors.username && (
                    <p className="text-red-600 text-xs mt-1">{errors.username}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email" className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    Email *
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="john@example.com"
                    className={errors.email ? 'border-red-500' : ''}
                    disabled={loading}
                  />
                  {errors.email && (
                    <p className="text-red-600 text-xs mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="location" className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    Location
                  </Label>
                  <Input
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="San Francisco, CA"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="mt-4">
                <Label htmlFor="role">Role</Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role} value={role.toLowerCase()}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="mt-4">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Tell us about yourself..."
                  rows={4}
                  className={errors.bio ? 'border-red-500' : ''}
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.bio.length}/500 characters
                </p>
                {errors.bio && (
                  <p className="text-red-600 text-xs mt-1">{errors.bio}</p>
                )}
              </div>
            </div>

            {/* Expertise Tags */}
            <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
              <h3 className="text-gray-900 mb-4 flex items-center gap-2 font-semibold">
                <Tag className="w-5 h-5 text-purple-600" />
                Areas of Expertise
              </h3>

              <div className="mb-4">
                <Label>Selected Tags ({selectedTags.length}/10)</Label>
                <div className="flex flex-wrap gap-2 min-h-[44px] p-3 bg-gray-50 rounded-lg border border-gray-200 mt-2">
                  {selectedTags.length === 0 ? (
                    <p className="text-gray-400 text-sm">No tags selected</p>
                  ) : (
                    selectedTags.map((tag) => (
                      <Badge
                        key={tag}
                        className="bg-purple-600 text-white hover:bg-purple-700 cursor-pointer"
                        onClick={() => !loading && handleRemoveTag(tag)}
                      >
                        {tag}
                        <X className="w-3 h-3 ml-1" />
                      </Badge>
                    ))
                  )}
                </div>
              </div>

              <div className="mb-4">
                <Label>Add Custom Tag</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Enter custom tag..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newTag) handleAddTag(newTag);
                      }
                    }}
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    onClick={() => newTag && handleAddTag(newTag)}
                    disabled={!newTag || selectedTags.length >= 10 || loading}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    Add
                  </Button>
                </div>
              </div>

              <div>
                <Label>Suggested Tags</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {availableTags
                    .filter(tag => !selectedTags.includes(tag))
                    .slice(0, 8)
                    .map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="border-purple-300 text-purple-700 bg-purple-50 hover:bg-purple-100 cursor-pointer"
                        onClick={() => !loading && handleAddTag(tag)}
                      >
                        + {tag}
                      </Badge>
                    ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-purple-600 hover:bg-purple-700"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
