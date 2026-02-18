"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Bookmark = {
  id: string;
  title: string;
  url: string;
};

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

  // Check auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) {
        fetchBookmarks();
        subscribeToBookmarks(data.session.user.id);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (session) {
          fetchBookmarks();
          subscribeToBookmarks(session.user.id);
        }
      },
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // Fetch bookmarks
  const fetchBookmarks = async () => {
    const { data, error } = await supabase
      .from("bookmarks")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setBookmarks(data);
    }
  };

  const subscribeToBookmarks = (userId: string) => {
    supabase
      .channel("bookmarks-channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookmarks",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchBookmarks();
        },
      )
      .subscribe();
  };

  // Add bookmark
  const addBookmark = async () => {
    if (!title.trim() || !url.trim()) return;

    try {
      new URL(url); // validate URL
    } catch {
      alert("Please enter a valid URL");
      return;
    }

    await supabase.from("bookmarks").insert([
      {
        title,
        url,
        user_id: session.user.id,
      },
    ]);

    setTitle("");
    setUrl("");
  };

  // Delete bookmark
  const deleteBookmark = async (id: string) => {
    await supabase.from("bookmarks").delete().eq("id", id);
  };

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: "google" });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setBookmarks([]);
  };

  if (!session) {
    return (
      <div className="flex h-screen items-center justify-center">
        <button
          onClick={signInWithGoogle}
          className="bg-black text-white px-6 py-3 rounded-lg"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">My Bookmarks</h1>
        <button onClick={signOut} className="text-red-500">
          Sign Out
        </button>
      </div>

      {/* Add Bookmark Form */}
      <div className="mb-6 space-y-2">
        <input
          type="text"
          placeholder="Bookmark title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border p-2 rounded"
        />
        <input
          type="text"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full border p-2 rounded"
        />
        <button
          onClick={addBookmark}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Add Bookmark
        </button>
      </div>

      {/* Bookmark List */}
      <div className="space-y-4">
        {bookmarks.map((bookmark) => (
          <div
            key={bookmark.id}
            className="flex justify-between items-center border p-4 rounded"
          >
            <div>
              <p className="font-semibold">{bookmark.title}</p>
              <a
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 text-sm"
              >
                {bookmark.url}
              </a>
            </div>
            <button
              onClick={() => deleteBookmark(bookmark.id)}
              className="text-red-500"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
