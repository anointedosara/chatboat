"use client";

import { normalizePhone } from "./phone";

/** A registered user, persisted in the browser's localStorage. */
export type User = {
  name: string;
  email: string;
  phone: string; // normalized (10 digits)
  createdAt: number;
  avatar?: string; // profile picture as a data URL
};

const KEY = "chatboat:users";
const CURRENT_KEY = "chatboat:currentPhone";

function read(): User[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as User[]) : [];
  } catch {
    return [];
  }
}

function write(users: User[]): void {
  window.localStorage.setItem(KEY, JSON.stringify(users));
}

export function getUsers(): User[] {
  return read();
}

export function findUserByPhone(phone: string): User | undefined {
  const key = normalizePhone(phone);
  return read().find((u) => u.phone === key);
}

export function findUserByEmail(email: string): User | undefined {
  const key = email.trim().toLowerCase();
  return read().find((u) => u.email.trim().toLowerCase() === key);
}

/** The phone of the currently signed-in user (set after OTP verification). */
export function setCurrentUser(phone: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CURRENT_KEY, normalizePhone(phone));
}

export function getCurrentUser(): User | undefined {
  if (typeof window === "undefined") return undefined;
  const phone = window.localStorage.getItem(CURRENT_KEY);
  return phone ? findUserByPhone(phone) : undefined;
}

export function clearCurrentUser(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CURRENT_KEY);
}

/** Update an existing user (handles a changed phone number). */
export function updateUser(
  oldPhone: string,
  input: { name: string; email: string; phone: string; avatar?: string },
): User {
  const users = read();
  const prevKey = normalizePhone(oldPhone);
  const nextKey = normalizePhone(input.phone);
  const prev = users.find((u) => u.phone === prevKey);
  const next: User = {
    name: input.name.trim(),
    email: input.email.trim(),
    phone: nextKey,
    createdAt: prev?.createdAt ?? Date.now(),
    avatar: input.avatar !== undefined ? input.avatar : prev?.avatar,
  };
  const filtered = users.filter((u) => u.phone !== prevKey && u.phone !== nextKey);
  filtered.push(next);
  write(filtered);
  setCurrentUser(nextKey);
  return next;
}

/** Set just the profile picture (data URL) for a user. */
export function setAvatar(phone: string, avatar: string): void {
  const users = read();
  const key = normalizePhone(phone);
  const idx = users.findIndex((u) => u.phone === key);
  if (idx >= 0) {
    users[idx] = { ...users[idx], avatar };
    write(users);
  }
}

/** Save (or update) a user keyed by normalized phone number. */
export function saveUser(input: { name: string; email: string; phone: string }): User {
  const users = read();
  const phone = normalizePhone(input.phone);
  const user: User = {
    name: input.name.trim(),
    email: input.email.trim(),
    phone,
    createdAt: Date.now(),
  };
  const idx = users.findIndex((u) => u.phone === phone);
  if (idx >= 0) {
    users[idx] = { ...users[idx], name: user.name, email: user.email };
  } else {
    users.push(user);
  }
  write(users);
  return user;
}
