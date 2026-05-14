import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService, UpdateProfileData, ChangePasswordData } from '@/services/profile.service';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { STORAGE_KEYS } from '@/lib/config';
import { qk } from '@/lib/queryKeys';

export function useProfile() {
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // Get profile
  const { data: profile, isLoading, error } = useQuery({
    queryKey: qk.profile(user?.id),
    queryFn: () => profileService.getProfile(),
    enabled: !!user,
  });

  // Update profile
  const updateProfileMutation = useMutation({
    mutationFn: (data: UpdateProfileData) => profileService.updateProfile(data),
    onSuccess: (response) => {
      // Update cache
      queryClient.setQueryData(qk.profile(user?.id), response);
      
      // Update auth context
      if (response.user) {
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.user));
        refreshUser();
      }
      
      showToast('Profile updated successfully!', 'success');
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to update profile', 'error');
    },
  });

  // Upload avatar
  const uploadAvatarMutation = useMutation({
    mutationFn: (file: File) => profileService.uploadAvatar(file),
    onSuccess: (response) => {
      // Refresh profile
      queryClient.invalidateQueries({ queryKey: qk.profile(user?.id) });
      refreshUser();
      showToast('Avatar uploaded successfully!', 'success');
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to upload avatar', 'error');
    },
  });

  // Delete avatar
  const deleteAvatarMutation = useMutation({
    mutationFn: () => profileService.deleteAvatar(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.profile(user?.id) });
      refreshUser();
      showToast('Avatar removed successfully!', 'success');
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to remove avatar', 'error');
    },
  });

  // Change password
  const changePasswordMutation = useMutation({
    mutationFn: (data: ChangePasswordData) => profileService.changePassword(data),
    onSuccess: () => {
      showToast('Password changed successfully!', 'success');
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to change password', 'error');
    },
  });

  return {
    profile: profile?.user,
    isLoading,
    error,
    updateProfile: updateProfileMutation.mutate,
    uploadAvatar: uploadAvatarMutation.mutate,
    deleteAvatar: deleteAvatarMutation.mutate,
    changePassword: changePasswordMutation.mutate,
    isUpdating: updateProfileMutation.isPending,
    isUploadingAvatar: uploadAvatarMutation.isPending,
    isDeletingAvatar: deleteAvatarMutation.isPending,
    isChangingPassword: changePasswordMutation.isPending,
  };
}

