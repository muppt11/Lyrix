import {
  Instagram,
  Facebook,
  Youtube,
  Music2,
  Twitter,
  Heart,
  Gift,
  type LucideIcon,
} from 'lucide-react';
import type { CreatorPlatformId } from '@/types/creator-platform';

export const PLATFORM_ICONS: Record<CreatorPlatformId, LucideIcon> = {
  instagram: Instagram,
  facebook: Facebook,
  youtube: Youtube,
  tiktok: Music2,
  x: Twitter,
  onlyfans: Heart,
  patreon: Gift,
};
