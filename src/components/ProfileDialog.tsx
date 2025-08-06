import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Mail, Lock, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import SavedPaymentMethods from "@/components/SavedPaymentMethods";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

// Stripe publishable key
const stripePromise = loadStripe("pk_test_51Rab7tAcy0JncB9qlWWNkyQxCYjs4RqFlY5OYSkBLfSVBqxv5q7d38jkbXVDmyE7jLxoCKxheJ95hc0f9atUVjBp00OmeyVbjo");

interface ProfileDialogProps {
  children: React.ReactNode;
  defaultTab?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showPaymentsTab?: boolean;
}

const ProfileDialog = ({ children, defaultTab = "profile", open: controlledOpen, onOpenChange, showPaymentsTab = true }: ProfileDialogProps) => {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Use controlled or internal open state
  const isOpen = controlledOpen !== undefined ? controlledOpen : open;

  // Initialize form data when profile is loaded
  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        email: profile.email || "",
        password: "",
        confirmPassword: "",
      });
    }
  }, [profile]);

  const handleOpenChange = (isOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(isOpen);
    } else {
      setOpen(isOpen);
    }
    
    // Set tab when opening
    if (isOpen && defaultTab) {
      setActiveTab(defaultTab);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      // Update profile information
      if (formData.full_name !== profile?.full_name) {
        await updateProfile.mutateAsync({
          full_name: formData.full_name,
        });
      }

      // Update email if changed
      if (formData.email !== profile?.email && formData.email) {
        const { error } = await supabase.auth.updateUser({
          email: formData.email,
        });
        if (error) throw error;
      }

      // Update password if provided
      if (formData.password) {
        if (formData.password !== formData.confirmPassword) {
          toast({
            title: "Error",
            description: "Passwords do not match.",
            variant: "destructive",
          });
          return;
        }

        const { error } = await supabase.auth.updateUser({
          password: formData.password,
        });
        if (error) throw error;
      }

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
      handleOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile.",
        variant: "destructive",
      });
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {activeTab === 'payments' && !showPaymentsTab ? (
              <>
                <CreditCard className="h-5 w-5" />
                Payment Methods
              </>
            ) : (
              <>
                <User className="h-5 w-5" />
                Profile
              </>
            )}
          </DialogTitle>
        </DialogHeader>
        
        {showPaymentsTab ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="payments" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Payments
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile" className="mt-6">
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name" className="text-sm font-medium">Full Name</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                      placeholder="Enter your full name"
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter your email"
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      New Password (optional)
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Enter new password"
                      className="h-12"
                    />
                  </div>
                  {formData.password && (
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="Confirm new password"
                        className="h-12"
                      />
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => handleOpenChange(false)} className="px-8 h-11">
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleUpdateProfile}
                    disabled={updateProfile.isPending}
                    className="px-8 h-11"
                  >
                    {updateProfile.isPending ? "Updating..." : "Update Profile"}
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="payments" className="mt-4">
              <Elements stripe={stripePromise}>
                <SavedPaymentMethods />
              </Elements>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="mt-6">
            {activeTab === 'payments' ? (
              <Elements stripe={stripePromise}>
                <SavedPaymentMethods />
              </Elements>
            ) : (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name" className="text-sm font-medium">Full Name</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                      placeholder="Enter your full name"
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter your email"
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      New Password (optional)
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Enter new password"
                      className="h-12"
                    />
                  </div>
                  {formData.password && (
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="Confirm new password"
                        className="h-12"
                      />
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => handleOpenChange(false)} className="px-8 h-11">
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleUpdateProfile}
                    disabled={updateProfile.isPending}
                    className="px-8 h-11"
                  >
                    {updateProfile.isPending ? "Updating..." : "Update Profile"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProfileDialog;