import { Goal, HabitMonthData, TaskItem } from '../types';

export interface AppStoredData {
  version?: string;
  lastSaved?: string;
  goals: Goal[];
  tasksByDate: Record<string, TaskItem[]>;
  habitsData: HabitMonthData;
  soundEnabled?: boolean;
}

// Fetch data from server JSON file
export async function fetchServerData(): Promise<AppStoredData | null> {
  try {
    const res = await fetch('/api/data');
    if (!res.ok) {
      return null;
    }
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('Could not fetch server data from /api/data, falling back to local storage', err);
    return null;
  }
}

// Save data directly to server JSON file
export async function saveServerData(data: AppStoredData): Promise<boolean> {
  try {
    const res = await fetch('/api/data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      throw new Error(`Server returned status ${res.status}`);
    }
    return true;
  } catch (err) {
    console.warn('Could not save data to server JSON file:', err);
    return false;
  }
}
