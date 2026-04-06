import type { StudyLevel } from "../enums";

export type ProfilePhoto = {
  id: string;
  userId: string;
  slot: number;
  url: string;
  uploadedAt: string;
};

export type ProfileWithPhotos = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string | null;
  gender: string | null;
  birthDate: string | null;
  studyProgram: string | null;
  studyLevel: StudyLevel | null;
  bio: string | null;
  lifestyleTags: string[] | null;
  languages: string[] | null;
  preferredCity: string | null;
  vereniging: string | null;
  institutionDomain: string;
  preferredLocale: string | null;
  createdAt: string;
  photos: ProfilePhoto[];
};
