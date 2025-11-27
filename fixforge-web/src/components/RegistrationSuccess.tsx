import { Card } from "./ui/card";
import { Button } from "../components/button";
import { useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";



interface SuccessScreenProps {
  email: string;
}

export function RegistrationSuccess({ email }: SuccessScreenProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="p-8 text-center">
          {/* Success Icon */}
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>

          {/* Title */}
          <h1 className="text-3xl text-white mb-3">Check your email</h1>

          {/* Message */}
          <p className="text-gray-400 mb-2">We’ve sent a verification link to</p>
          <p className="text-violet-400 mb-6">{email}</p>

          <p className="text-sm text-gray-500 mb-8">
            Click the link in the email to verify your account.  
            If you don’t see the email, check your spam folder.
          </p>

          {/* Continue Button */}
          <Button
            className="w-full bg-violet-600 hover:bg-violet-700 text-white py-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-violet-500/50"
            onClick={() => navigate("/login")}

          >
            Continue to Sign In →
          </Button>
        </div>
      </Card>
    </div>
  );
}
