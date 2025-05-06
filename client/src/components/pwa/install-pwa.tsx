import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { checkInstallStatus, showInstallPrompt } from "@/lib/pwa";
import { toast } from "@/hooks/use-toast";
import { Download } from "lucide-react";

export function InstallPWA() {
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    // Check if the app can be installed
    const { canBeInstalled } = checkInstallStatus();
    setCanInstall(canBeInstalled);

    // Re-check on window focus (in case user installed in another tab)
    const handleFocus = () => {
      const { canBeInstalled } = checkInstallStatus();
      setCanInstall(canBeInstalled);
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const handleInstall = async () => {
    try {
      const installed = await showInstallPrompt();
      if (installed) {
        toast({
          title: "Application Installed",
          description: "HealthGuardian has been successfully installed!",
        });
        setCanInstall(false);
      }
    } catch (error) {
      console.error('Installation failed:', error);
      toast({
        title: "Installation Failed",
        description: "There was a problem installing the application.",
        variant: "destructive",
      });
    }
  };

  if (!canInstall) {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="hidden md:flex gap-1"
      onClick={handleInstall}
    >
      <Download className="h-4 w-4" />
      <span>Install App</span>
    </Button>
  );
}