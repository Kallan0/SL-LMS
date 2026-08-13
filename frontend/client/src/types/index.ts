// frontend/client/src/types/index.ts

export interface User {
  id: string;
  email?: string;
  username: string;
  firstName?: string;  
  lastName?: string;  
  bio?: string;        
  avatar?: string;     
  role: string;
  xp?: number;
  streak?: number;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
  expiresIn: number;
  
}