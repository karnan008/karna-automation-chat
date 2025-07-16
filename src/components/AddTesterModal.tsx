
import React, { useState } from 'react';
import { UserPlus, Mail, User, Key, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface NewTester {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface AddTesterModalProps {
  onTesterAdded: (tester: any) => void;
}

const AddTesterModal = ({ onTesterAdded }: AddTesterModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newTester, setNewTester] = useState<NewTester>({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const { toast } = useToast();

  const handleInputChange = (field: keyof NewTester, value: string) => {
    setNewTester(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = (): boolean => {
    if (!newTester.username.trim()) {
      toast({
        title: "Validation Error",
        description: "Username is required",
        variant: "destructive"
      });
      return false;
    }

    if (!newTester.email.trim() || !newTester.email.includes('@')) {
      toast({
        title: "Validation Error",
        description: "Valid email is required",
        variant: "destructive"
      });
      return false;
    }

    if (newTester.password.length < 6) {
      toast({
        title: "Validation Error",
        description: "Password must be at least 6 characters",
        variant: "destructive"
      });
      return false;
    }

    if (newTester.password !== newTester.confirmPassword) {
      toast({
        title: "Validation Error",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleAddTester = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // In a real implementation, this would call an API
      const testerData = {
        id: Date.now(),
        username: newTester.username,
        email: newTester.email,
        active: true,
        createdAt: new Date().toISOString()
      };

      // Save to localStorage for now (in real app, this would be a database)
      const existingTesters = JSON.parse(localStorage.getItem('testers') || '[]');
      existingTesters.push(testerData);
      localStorage.setItem('testers', JSON.stringify(existingTesters));

      onTesterAdded(testerData);
      
      toast({
        title: "Tester Added",
        description: `${newTester.username} has been added successfully`,
      });

      // Reset form and close modal
      setNewTester({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
      });
      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add tester. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
          <UserPlus className="h-4 w-4 mr-2" />
          Add New Tester
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add New Tester Account
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-2">
              <User className="h-4 w-4" />
              Username
            </label>
            <Input
              type="text"
              value={newTester.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              placeholder="Enter username"
            />
          </div>

          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-2">
              <Mail className="h-4 w-4" />
              Email Address
            </label>
            <Input
              type="email"
              value={newTester.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="tester@company.com"
            />
          </div>

          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-2">
              <Key className="h-4 w-4" />
              Password
            </label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={newTester.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="Enter password (min 6 characters)"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-2">
              <Key className="h-4 w-4" />
              Confirm Password
            </label>
            <Input
              type="password"
              value={newTester.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              placeholder="Confirm password"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddTester}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Adding...' : 'Add Tester'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddTesterModal;
