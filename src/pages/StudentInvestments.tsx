import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { mockStudentAPI } from '@/services/mockAPI';
import { 
  GraduationCap, 
  TrendingUp, 
  Lock, 
  Unlock, 
  DollarSign,
  Calendar,
  BookOpen,
  Building
} from 'lucide-react';

interface StudentProfile {
  id: number;
  student_id: string;
  university: string;
  major: string;
  graduation_year: number;
  enrollment_status: string;
  is_verified: boolean;
  created_at: string;
}

interface StudentInvestment {
  id: number;
  investment_type: string;
  amount: number;
  currency: string;
  lock_period_months: number;
  lock_start_date: string;
  lock_end_date: string;
  is_locked: boolean;
  expected_return_rate: number;
  actual_return: number;
  status: string;
  withdrawal_requested_at?: string;
  withdrawn_at?: string;
  created_at: string;
}

interface InvestmentStats {
  total_invested: number;
  total_returns: number;
  active_investments: number;
  locked_amount: number;
  available_for_withdrawal: number;
}

export default function StudentInvestments() {
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [investments, setInvestments] = useState<StudentInvestment[]>([]);
  const [stats, setStats] = useState<InvestmentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [showInvestDialog, setShowInvestDialog] = useState(false);

  // Registration form state
  const [registrationData, setRegistrationData] = useState({
    student_id: '',
    university: '',
    major: '',
    graduation_year: new Date().getFullYear() + 4
  });

  // Investment form state
  const [investmentData, setInvestmentData] = useState({
    amount: '',
    investment_type: 'savings',
    lock_period_months: 12,
    currency: 'KES'
  });

  useEffect(() => {
    loadStudentData();
  }, []);

  const loadStudentData = async () => {
    try {
      setLoading(true);
      
      // Use mock data in development
      if (process.env.NODE_ENV === 'development') {
        const profileData = await mockStudentAPI.getProfile();
        setStudentProfile(profileData.student);
        setInvestments(profileData.investments);
        
        const statsData = await mockStudentAPI.getStats();
        setStats(statsData);
      } else {
        // Load student profile
        const profileResponse = await fetch('/api/student-investments/profile', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        });
        
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          setStudentProfile(profileData.student);
          setInvestments(profileData.investments);
        } else if (profileResponse.status === 404) {
          // Student profile not found - show registration
          setStudentProfile(null);
        }
        
        // Load investment stats
        const statsResponse = await fetch('/api/student-investments/stats', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        });
        
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData);
        }
      }
      
    } catch (error) {
      console.error('Failed to load student data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load student data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStudentRegistration = async () => {
    try {
      if (process.env.NODE_ENV === 'development') {
        const data = await mockStudentAPI.register(registrationData);
        setStudentProfile(data.student);
        setShowRegisterDialog(false);
        toast({
          title: 'Success',
          description: 'Student profile created successfully! Verification pending.',
        });
      } else {
        const response = await fetch('/api/student-investments/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          },
          body: JSON.stringify(registrationData)
        });

        if (response.ok) {
          const data = await response.json();
          setStudentProfile(data.student);
          setShowRegisterDialog(false);
          toast({
            title: 'Success',
            description: 'Student profile created successfully! Verification pending.',
          });
        } else {
          const error = await response.json();
          toast({
            title: 'Error',
            description: error.error || 'Failed to create student profile',
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create student profile',
        variant: 'destructive',
      });
    }
  };

  const handleCreateInvestment = async () => {
    try {
      const response = await fetch('/api/student-investments/invest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          ...investmentData,
          amount: parseFloat(investmentData.amount)
        })
      });

      if (response.ok) {
        const data = await response.json();
        setInvestments(prev => [...prev, data.investment]);
        setShowInvestDialog(false);
        setInvestmentData({ amount: '', investment_type: 'savings', lock_period_months: 12, currency: 'KES' });
        toast({
          title: 'Success',
          description: 'Investment created successfully!',
        });
        loadStudentData(); // Refresh data
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to create investment',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create investment',
        variant: 'destructive',
      });
    }
  };

  const handleWithdrawal = async (investmentId: number) => {
    try {
      const response = await fetch(`/api/student-investments/withdraw/${investmentId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Withdrawal request submitted successfully!',
        });
        loadStudentData(); // Refresh data
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to request withdrawal',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to request withdrawal',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string, isLocked: boolean) => {
    if (status === 'withdrawn') return <Badge variant="secondary">Withdrawn</Badge>;
    if (status === 'matured') return <Badge variant="default">Ready to Withdraw</Badge>;
    if (isLocked) return <Badge variant="outline">Locked</Badge>;
    return <Badge variant="default">Active</Badge>;
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading student data...</p>
        </div>
      </div>
    );
  }

  // Show registration if no student profile
  if (!studentProfile) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-6 w-6" />
              Student Registration
            </CardTitle>
            <CardDescription>
              Register as a student to start investing with locked funds until graduation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="student_id">Student ID</Label>
                <Input
                  id="student_id"
                  value={registrationData.student_id}
                  onChange={(e) => setRegistrationData(prev => ({ ...prev, student_id: e.target.value }))}
                  placeholder="e.g., 2024/001"
                />
              </div>
              <div>
                <Label htmlFor="graduation_year">Graduation Year</Label>
                <Input
                  id="graduation_year"
                  type="number"
                  value={registrationData.graduation_year}
                  onChange={(e) => setRegistrationData(prev => ({ ...prev, graduation_year: parseInt(e.target.value) }))}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="university">University</Label>
              <Input
                id="university"
                value={registrationData.university}
                onChange={(e) => setRegistrationData(prev => ({ ...prev, university: e.target.value }))}
                placeholder="e.g., University of Nairobi"
              />
            </div>
            
            <div>
              <Label htmlFor="major">Major/Program</Label>
              <Input
                id="major"
                value={registrationData.major}
                onChange={(e) => setRegistrationData(prev => ({ ...prev, major: e.target.value }))}
                placeholder="e.g., Computer Science"
              />
            </div>
            
            <Button onClick={handleStudentRegistration} className="w-full">
              Register as Student
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Student Profile Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6" />
            Student Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{studentProfile.university}</p>
                <p className="text-xs text-muted-foreground">University</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{studentProfile.major}</p>
                <p className="text-xs text-muted-foreground">Major</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{studentProfile.graduation_year}</p>
                <p className="text-xs text-muted-foreground">Graduation Year</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={studentProfile.is_verified ? "default" : "secondary"}>
                {studentProfile.is_verified ? "Verified" : "Pending"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Investment Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(stats.total_invested, 'KES')}</p>
                  <p className="text-xs text-muted-foreground">Total Invested</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(stats.total_returns, 'KES')}</p>
                  <p className="text-xs text-muted-foreground">Total Returns</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(stats.locked_amount, 'KES')}</p>
                  <p className="text-xs text-muted-foreground">Locked Amount</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Unlock className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(stats.available_for_withdrawal, 'KES')}</p>
                  <p className="text-xs text-muted-foreground">Available</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create Investment Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Investments</h2>
        <Dialog open={showInvestDialog} onOpenChange={setShowInvestDialog}>
          <DialogTrigger asChild>
            <Button>Create Investment</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Investment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="amount">Investment Amount (KES)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={investmentData.amount}
                  onChange={(e) => setInvestmentData(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="10000"
                />
              </div>
              
              <div>
                <Label htmlFor="investment_type">Investment Type</Label>
                <Select 
                  value={investmentData.investment_type} 
                  onValueChange={(value) => setInvestmentData(prev => ({ ...prev, investment_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="savings">Savings Account</SelectItem>
                    <SelectItem value="crypto">Cryptocurrency</SelectItem>
                    <SelectItem value="stocks">Stock Market</SelectItem>
                    <SelectItem value="bonds">Government Bonds</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="lock_period">Lock Period (Months)</Label>
                <Select 
                  value={investmentData.lock_period_months.toString()} 
                  onValueChange={(value) => setInvestmentData(prev => ({ ...prev, lock_period_months: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6 Months</SelectItem>
                    <SelectItem value="12">12 Months</SelectItem>
                    <SelectItem value="24">24 Months</SelectItem>
                    <SelectItem value="36">36 Months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button onClick={handleCreateInvestment} className="w-full">
                Create Investment
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Investments List */}
      <div className="space-y-4">
        {investments.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No investments yet. Create your first investment!</p>
            </CardContent>
          </Card>
        ) : (
          investments.map((investment) => (
            <Card key={investment.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold capitalize">{investment.investment_type} Investment</h3>
                      {getStatusBadge(investment.status, investment.is_locked)}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Amount</p>
                        <p className="font-medium">{formatCurrency(investment.amount, investment.currency)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Returns</p>
                        <p className="font-medium">{formatCurrency(investment.actual_return, investment.currency)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Lock Period</p>
                        <p className="font-medium">{investment.lock_period_months} months</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">End Date</p>
                        <p className="font-medium">{formatDate(investment.lock_end_date)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {investment.status === 'matured' && (
                      <Button 
                        size="sm" 
                        onClick={() => handleWithdrawal(investment.id)}
                      >
                        Withdraw
                      </Button>
                    )}
                    {investment.is_locked && investment.status === 'active' && (
                      <Badge variant="outline">
                        {investment.get_remaining_lock_time ? `${investment.get_remaining_lock_time()} days left` : 'Locked'}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
