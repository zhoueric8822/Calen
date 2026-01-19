export type Subtask = {
  id: string;
  title: string;
  completed: boolean;
};

export type Task = {
  id: string;
  title: string;
  description?: string;
  deadline: string;
  categories: string[];
  importance: number;
  completed: boolean;
  createdAt: string;
  updatedAt?: string;
  subtasks: Subtask[];
  convexId?: string;
  syncPending?: boolean;
};

export type DaysMatterItem = {
  id: string;
  title: string;
  description?: string;
  targetDate: string;
  type: "countdown" | "countup";
  imageUrl?: string;
  createdAt: string;
  updatedAt?: string;
  convexId?: string;
  syncPending?: boolean;
};

export type UserProfile = {
  email: string;
  name?: string;
  picture?: string;
};

export type Filters = {
  category: string;
  status: "all" | "active" | "completed" | "overdue";
};


