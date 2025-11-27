import React from "react";
import { Routes, Route } from "react-router-dom";
import TopNav from "./components/TopNav";

import Dashboard from "./components/Dashboard";
import FixDetail from "./components/FixDetail";
import SubmitForm from "./components/SubmitForm";
import SolutionForm from "./components/SolutionForm";
import RelatedSolutions from "./components/RelatedSolutions";
import AISuggested from "./components/AISuggested";
import {MySolutions} from "./components/MySolutions";
import {ProfilePage} from "./components/ProfilePage";  // Correct import
// import { TestProfile } from './components/TestProfile';
import MyBugs from "./components/MyBugs"; // Add this import
import { UserProvider } from "./context/UserContext"; // Adjust path if needed
import { SolutionDetail } from "./components/SolutionDetail";
import { ActivityPage } from './pages/ActivityPage';


import AIProcessor from './pages/AIProcessor'; // or wherever you put it


export default function Private() {
  return (
    
    <UserProvider>
      <TopNav />

      {/* Main content - no sidebar */}
      <main className="content flex-1 p-6 bg-gray-50 min-h-screen max-w-7xl mx-auto">
        <Routes>
          {/* Dashboard */}
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Submission / Solution forms */}
          <Route path="/submit" element={<SubmitForm />} />
          <Route path="/post-solution" element={<SolutionForm />} />

          {/* Fix / Bug detail and related pages */}
          <Route path="/fix/:id" element={<FixDetail />} />
          <Route path="/bug/:bugId" element={<FixDetail />} />
          <Route path="/solve/:bugId" element={<SolutionForm />} />
          <Route path="/related/:bugId" element={<RelatedSolutions />} />
          <Route path="/aisuggested/:bugId" element={<AISuggested />} />
          <Route path="/ai-processor" element={<AIProcessor />} />
          <Route path="/my-bugs" element={<MyBugs />} />
            <Route path="/profile/activity" element={<ActivityPage />} />



          {/* User pages */}
          {/* Removed MyBugs route */}
          <Route path="/my-solutions" element={<MySolutions />} />
          <Route path="/profile" element={<ProfilePage />} /> Use ProfilePage component
          <Route path="/solutions/:id" element={<SolutionDetail />} />
          {/* <Route path="/profile" element={<TestProfile />} /> */}
        </Routes>
        
      </main>
      </UserProvider>
    
  );
}
