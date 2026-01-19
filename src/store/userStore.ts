import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserState {
  username: string;
  avatar: string;
  setUsername: (username: string) => void;
  setAvatar: (avatar: string) => void;
  resetUser: () => void;
}

const defaultAvatar = 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20cartoon%20avatar%20simple%20friendly%20person%20icon%20minimalist%20style&image_size=square';

export const useUserStore = create<UserState>()(persist(
  (set) => ({
    username: '用户',
    avatar: defaultAvatar,
    setUsername: (username: string) => set({ username }),
    setAvatar: (avatar: string) => set({ avatar }),
    resetUser: () => set({ username: '用户', avatar: defaultAvatar })
  }),
  {
    name: 'user-storage'
  }
));