
import React, { useState } from 'react';
import { LogIn, Shield, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface AuthLoginProps {
  onLogin: (role: 'admin' | 'tester', username: string) => void;
}

const AuthLogin = ({ onLogin }: AuthLoginProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate authentication (replace with actual backend call)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock role assignment based on username
      const role = username.toLowerCase().includes('admin') ? 'admin' : 'tester';
      
      onLogin(role, username);
      
      toast({
        title: "Login Successful",
        description: `Welcome back, ${username}! Role: ${role.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "Invalid credentials. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Commusoft Automation</CardTitle>
          <p className="text-sm text-muted-foreground">by Karna</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Username</label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              <LogIn className="h-4 w-4 mr-2" />
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
          
          <div className="mt-6 pt-4 border-t">
            <p className="text-xs text-center text-muted-foreground mb-2">Demo Accounts:</p>
            <div className="flex flex-col gap-2 text-xs">
              <div className="flex items-center justify-between">
                <span>admin / admin123</span>
                <Badge variant="secondary">Admin</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>tester / test123</span>
                <Badge variant="outline">Tester</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthLogin;
