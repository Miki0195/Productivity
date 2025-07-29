import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Shield, AlertTriangle, Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/services/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface PasswordConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  actionLabel: string
  variant?: 'default' | 'destructive'
  loading?: boolean
}

export default function PasswordConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  actionLabel,
  variant = 'default',
  loading = false,
}: PasswordConfirmationModalProps) {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState('')
  const { user } = useAuth()

  const handleConfirm = async () => {
    if (!password.trim()) {
      setError('Password is required')
      return
    }

    if (!user?.email) {
      setError('User email not found')
      return
    }

    setVerifying(true)
    setError('')

    try {
      // Verify password by attempting to sign in
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: password,
      })

      if (authError) {
        setError('Incorrect password')
        return
      }

      // Password is correct, proceed with action
      onConfirm()
      handleClose()
    } catch (err) {
      setError('Verification failed. Please try again.')
    } finally {
      setVerifying(false)
    }
  }

  const handleClose = () => {
    setPassword('')
    setShowPassword(false)
    setError('')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {variant === 'destructive' ? (
              <AlertTriangle className="w-5 h-5 text-red-600" />
            ) : (
              <Shield className="w-5 h-5 text-blue-600" />
            )}
            {title}
          </DialogTitle>
          <DialogDescription className="text-left">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="password" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Confirm Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password to continue"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError('')
                }}
                className="w-full pr-10"
                disabled={verifying || loading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleConfirm()
                  }
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                disabled={verifying || loading}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={verifying || loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={verifying || loading || !password.trim()}
            variant={variant === 'destructive' ? 'destructive' : 'default'}
          >
            {verifying ? 'Verifying...' : actionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 