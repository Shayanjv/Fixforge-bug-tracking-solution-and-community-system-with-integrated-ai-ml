import ProfileHeader from "./ProfileHeader";
import { ContributionStats } from "./ContributionStats";

import { ActivityFeed } from "./ActivityFeed";
import { PreferencesSection } from "./PreferencesSection";
import { SecuritySection } from "./SecuritySection";
import { ModerationSection } from "./ModerationSection";
import { DeveloperTools } from "./DeveloperTools";
import { EditProfile } from "./EditProfile";
import { PhotoSelectionModal } from "./PhotoSelectionModal";
import { useState } from "react";
import { ProfileCompletion } from '@/components/ProfileCompletion';
import { useUser } from "@/hooks/useUser";

export function ProfilePage() {
  const [activeTab, setActiveTab] = useState("activity");
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  
  const { user, loading } = useUser();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-purple-50/30">
        <div className="animate-pulse text-purple-600 text-lg">Loading profile...</div>
      </div>
    );
  }

  const handleSaveProfile = (newData) => {
    console.log("Saving profile:", newData);
    setShowEditProfile(false);
    // Optionally update user data here
  };

  return (
    <>
      {/* Edit Profile Modal - MOVED OUTSIDE main container */}
      {showEditProfile && (
        <EditProfile
          userData={user}
          onClose={() => setShowEditProfile(false)}
          onSave={handleSaveProfile}
        />
      )}

      {/* Photo Modal - MOVED OUTSIDE main container */}
      {showPhotoModal && (
        <PhotoSelectionModal
          onClose={() => setShowPhotoModal(false)}
          onSelectPhoto={(photoUrl) => {
            console.log("Photo selected:", photoUrl);
            setShowPhotoModal(false);
          }}
        />
      )}

      {/* Main Page Content */}
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50/30">
        <div className="w-full max-w-[1600px] mx-auto px-4 py-8">
          
          {/* Profile Header - FULL WIDTH */}
          <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
            <ProfileHeader
              user={user}
              onEditClick={() => setShowEditProfile(true)}
              onAvatarClick={() => setShowPhotoModal(true)}
            />
          </div>

          {/* Two Column Grid - 50/50 Split with small gap */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* LEFT - Contribution Stats (50%) */}
            <div>
              <ContributionStats />
            </div>

            {/* RIGHT - Tabbed Content (50%) */}
            <div className="flex flex-col">
              
              {/* Tab Navigation */}
              <div className="bg-white rounded-t-2xl shadow-sm border border-gray-200">
                <div className="flex w-full border-b border-gray-200">
                  <button
                    onClick={() => setActiveTab("activity")}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-3.5 text-sm font-medium transition-all ${
                      activeTab === "activity"
                        ? "text-purple-600 bg-purple-50 border-b-2 border-purple-600"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Activity
                  </button>

                  <button
                    onClick={() => setActiveTab("preferences")}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-3.5 text-sm font-medium transition-all ${
                      activeTab === "preferences"
                        ? "text-purple-600 bg-purple-50 border-b-2 border-purple-600"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                    Preferences
                  </button>

                  <button
                    onClick={() => setActiveTab("security")}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-3.5 text-sm font-medium transition-all ${
                      activeTab === "security"
                        ? "text-purple-600 bg-purple-50 border-b-2 border-purple-600"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Security
                  </button>

                  <button
                    onClick={() => setActiveTab("advanced")}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-3.5 text-sm font-medium transition-all ${
                      activeTab === "advanced"
                        ? "text-purple-600 bg-purple-50 border-b-2 border-purple-600"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Advanced
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              {/* Tab Content */} 
<div className="bg-white rounded-b-2xl shadow-sm border border-gray-200 border-t-0 p-6 min-h-[600px]">
  {/* ✅ Updated Activity Tab */}
  {activeTab === "activity" && (
    <div>
      <ProfileCompletion />
      <ActivityFeed />
    </div>
  )}
  
  {activeTab === "preferences" && <PreferencesSection user={user} />}
  {activeTab === "security" && <SecuritySection user={user} />}
  {activeTab === "advanced" && (
    <div className="space-y-6">
      {user?.role === "moderator" && <ModerationSection user={user} />}
      <DeveloperTools user={user} />
    </div>
  )}
</div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
