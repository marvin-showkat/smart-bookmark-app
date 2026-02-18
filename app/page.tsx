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
    <div className="min-h-screen bg-gray-100 flex justify-center py-12 px-4">
      <div className="w-full max-w-2xl bg-white shadow-lg rounded-xl p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Smart Bookmarks</h1>
          <button
            onClick={signOut}
            className="text-sm text-red-500 hover:text-red-700 transition"
          >
            Sign Out
          </button>
        </div>

        {/* Add Bookmark */}
        <div className="mb-8 space-y-3">
          <input
            type="text"
            placeholder="Bookmark title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={addBookmark}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Add Bookmark
          </button>
        </div>

        {/* Bookmark List */}
        <div className="space-y-4">
          {bookmarks.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              No bookmarks yet. Add your first one 🚀
            </div>
          )}

          {bookmarks.map((bookmark) => (
            <div
              key={bookmark.id}
              className="flex justify-between items-center border border-gray-200 p-4 rounded-lg hover:shadow-md transition"
            >
              <div>
                <p className="font-semibold text-gray-800">{bookmark.title}</p>
                <a
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full border border-gray-300 p-3 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {bookmark.url}
                </a>
              </div>
              <button
                onClick={() => deleteBookmark(bookmark.id)}
                className="w-full border border-gray-300 p-3 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
