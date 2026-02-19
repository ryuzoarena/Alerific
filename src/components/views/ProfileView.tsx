import { useState } from 'react';
import { ArrowLeft, Settings, MoreVertical, Music, Users, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTimeTheme } from '@/hooks/useTimeTheme';
import { EditProfileView } from './EditProfileView';
import { ProfileSettingsSheet } from '@/components/ProfileSettingsSheet';

interface ProfileViewProps {
  onBack: () => void;
  userName: string;
  avatarUrl?: string | null;
  onProfileUpdate?: () => void;
}

export function ProfileView({ onBack, userName, avatarUrl, onProfileUpdate }: ProfileViewProps) {
  const timeTheme = useTimeTheme();
  const initial = userName.charAt(0).toUpperCase();
  const [showEdit, setShowEdit] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  if (showEdit) {
    return (
      <EditProfileView
        onClose={() => setShowEdit(false)}
        userName={userName}
        avatarUrl={avatarUrl}
        onProfileUpdate={onProfileUpdate}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header gradient area */}
      <div className={cn("relative pt-12 pb-8 px-5", `bg-gradient-to-b ${timeTheme.gradient}`)}>
        {/* Back button */}
        <button onClick={onBack} className="absolute top-4 left-4">
          <ArrowLeft size={24} className="text-foreground" />
        </button>

        {/* Profile info */}
        <div className="flex items-center gap-5 mt-4">
          {/* Avatar */}
          <div className="w-28 h-28 rounded-full flex-shrink-0 overflow-hidden"
            style={{ backgroundColor: 'hsl(210, 60%, 70%)' }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-4xl font-bold text-black">{initial}</span>
              </div>
            )}
          </div>

          {/* Name and stats */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-foreground truncate">{userName}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              <span className="text-foreground/60">0</span> pengikut • <span className="text-foreground/60">3</span> mengikuti
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-4 mt-5">
          <button
            onClick={() => setShowEdit(true)}
            className="px-6 py-2 rounded-full border border-muted-foreground/40 text-sm font-medium text-foreground"
          >
            Edit
          </button>
          <button onClick={() => setShowSettings(true)}>
            <Settings size={24} className="text-muted-foreground" />
          </button>
          <button>
            <MoreVertical size={24} className="text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="flex flex-col items-center px-6 py-16">
        {/* Tilted cards */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center -rotate-6">
            <Music size={28} className="text-muted-foreground" />
          </div>
          <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center">
            <Users size={28} className="text-muted-foreground" />
          </div>
          <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center rotate-6">
            <UserPlus size={28} className="text-muted-foreground" />
          </div>
        </div>

        <h2 className="text-xl font-bold text-foreground text-center mb-2">
          Bagikan yang kamu suka
        </h2>
        <p className="text-sm text-muted-foreground text-center max-w-xs mb-6">
          Aktifkan fitur berbagi playlist dan artis di profilmu agar orang lain bisa mengetahui musik yang kamu suka.
        </p>
        <button className="px-6 py-3 rounded-full bg-foreground text-background text-sm font-bold">
          Kelola pengaturan
        </button>
      </div>

      {/* Settings bottom sheet */}
      <ProfileSettingsSheet
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
}
