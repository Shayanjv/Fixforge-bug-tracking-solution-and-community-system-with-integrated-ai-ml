import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Edit, Mail, MapPin, Calendar, Tag } from "lucide-react";
import { useUser } from '@/hooks/useUser';


export default function ProfileHeader({ onEditClick, onAvatarClick }) {
  const { user } = useUser();


  if (!user) {
    return (
      <div className="flex items-center justify-center p-6">
        <p className="text-gray-500">Loading profile...</p>
      </div>
    );
  }


  // Map ALL possible field names
  const displayName = user.display_name || user.displayName || "Unnamed User";
  const username = user.username || "user";
  const role = user.role || null;
  const bio = user.bio || null;
  const location = user.location || null;
  const email = user.email || null;
  const avatar = user.avatar_url || user.avatar || "";
  const createdAt = user.created_at || user.createdAt;
  const emailVerified = user.email_verified || user.emailVerified || false;
  const expertise = user.expertise || [];


  // ✅ Better debugging - shows actual values
  console.log('🔵 User has bio:', bio);
  console.log('🔵 User has location:', location);
  console.log('🔵 User has role:', role);
  console.log('🔵 User has expertise:', expertise);
  console.log('🔵 User emailVerified:', emailVerified);


  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "UU";


 const renderAvatar = () => {
  if (avatar && avatar.startsWith('avatar-')) {
    const avatarId = parseInt(avatar.replace('avatar-', ''));
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
      { id: 12, color: "from-rose-500 to-rose-600", icon: "🧑‍⚕️" },
    ];
    const selectedAvatar = avatarOptions.find(a => a.id === avatarId);
    if (selectedAvatar) {
      return (
        <div className={`w-full h-full bg-gradient-to-br ${selectedAvatar.color} flex items-center justify-center text-6xl`}>
          {selectedAvatar.icon}
        </div>
      );
    }
  }
  return null;
};


  const formatJoinDate = () => {
    if (!createdAt) return "Recently";
    const date = new Date(createdAt);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

return (
    <div className="flex items-start gap-6 p-6 bg-white rounded-lg">
      {/* LEFT: Avatar */}
      <div className="relative flex-shrink-0">
        <button 
          onClick={onAvatarClick}
          className="relative group cursor-pointer focus:outline-none focus:ring-4 focus:ring-purple-300 rounded-full transition-all"
          type="button"
        >
          {/* ✅ Changed from w-32 h-32 to w-24 h-24 (smaller) */}
          <Avatar className="w-24 h-24 rounded-full border-4 border-purple-100 group-hover:border-purple-300 transition-all">
            {avatar && avatar.startsWith('avatar-') ? (
              <AvatarFallback className="p-0 bg-transparent rounded-full">
                {renderAvatar()}
              </AvatarFallback>
            ) : (
              <>
                {/* ✅ CRITICAL FIX: Conditional rendering + object-cover */}
                {avatar && (
                  <AvatarImage 
                    src={avatar} 
                    alt={displayName} 
                    className="w-full h-full object-cover"  // ✅ This makes it fit!
                  />
                )}
                {/* ✅ Changed from text-3xl to text-2xl (smaller initials) */}
                <AvatarFallback className="text-2xl bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-full">
                  {initials}
                </AvatarFallback>
              </>
            )}
          </Avatar>
          {onAvatarClick && (
            <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              {/* ✅ Changed from w-8 h-8 to w-6 h-6 (smaller icon) */}
              <Edit className="w-6 h-6 text-white" />
            </div>
          )}
        </button>
      </div>

      {/* RIGHT: Profile Info */}
      <div className="flex-1 min-w-0">
        {/* TOP: Name, Badges, and Edit Button */}
        <div className="flex items-start justify-between mb-3">
          <div>
            {/* Name and Badges in same row */}
            <div className="flex items-center gap-3 flex-wrap mb-2">
              {/* ✅ Changed from text-3xl to text-2xl (smaller name) */}
              <h1 className="text-2xl font-bold text-gray-900">
                {displayName}
              </h1>
              
              {/* Role Badge */}
              {role && (
                <Badge className="bg-purple-600 text-white border-0 hover:bg-purple-700 capitalize">
                  {role}
                </Badge>
              )}
              
              {/* Verified Badge */}
              {emailVerified && (
                <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50">
                  Verified
                </Badge>
              )}
            </div>
            
            {/* Username */}
            {/* ✅ Changed from text-base to text-sm (smaller username) */}
            <p className="text-gray-600 text-sm">@{username}</p>
          </div>

          {/* Edit Profile Button - TOP RIGHT */}
          <Button 
            onClick={onEditClick}
            className="bg-purple-600 hover:bg-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all flex-shrink-0"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        </div>


        {/* Bio - ALWAYS SHOW (with placeholder if empty) */}
        <div className="mb-4">
          {bio && bio.trim() ? (
            <p className="text-gray-700 leading-relaxed">
              {bio}
            </p>
          ) : (
            <p className="text-gray-400 italic leading-relaxed">
              Add a bio to tell others about yourself
            </p>
          )}
        </div>


        {/* Meta Information - ALWAYS SHOW */}
        <div className="flex flex-wrap items-center gap-4 text-sm mb-4">
          {/* Location - ALWAYS SHOW */}
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-500" />
            {location && location.trim() ? (
              <span className="text-gray-600">{location}</span>
            ) : (
              <span className="text-gray-400 italic">Add location</span>
            )}
          </div>
          
          {/* Join Date */}
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>Joined {formatJoinDate()}</span>
          </div>
          
          {/* Email */}
          {email && (
            <div className="flex items-center gap-2 text-gray-600">
              <Mail className="w-4 h-4" />
              <span>{email}</span>
            </div>
          )}
        </div>


        {/* Expertise Tags - ALWAYS SHOW (with placeholder if empty) */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Tag className="w-4 h-4 text-purple-600" />
            <h3 className="text-sm font-semibold text-gray-900">Areas of Expertise</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {expertise && Array.isArray(expertise) && expertise.length > 0 ? (
              expertise.map((tag, index) => (
                <Badge
                  key={`${tag}-${index}`}
                  variant="outline"
                  className="border-purple-300 text-purple-700 bg-purple-50 hover:bg-purple-100"
                >
                  {tag}
                </Badge>
              ))
            ) : (
              <p className="text-gray-400 italic text-sm">
                Add your areas of expertise from Edit Profile
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
