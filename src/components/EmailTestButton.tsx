import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const EmailTestButton = () => {
  const [isLoading, setIsLoading] = useState(false);

  const testEmail = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-email');
      
      if (error) {
        throw error;
      }
      
      console.log('Email test response:', data);
      toast.success('Test email sent successfully!');
    } catch (error: any) {
      console.error('Email test failed:', error);
      toast.error(`Email test failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={testEmail} 
      disabled={isLoading}
      variant="outline"
    >
      {isLoading ? 'Sending...' : 'Test Email'}
    </Button>
  );
};