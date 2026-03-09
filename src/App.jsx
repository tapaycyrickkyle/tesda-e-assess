import React from "react";

const App = () => {
  return (
    <main className="min-h-screen grid place-items-center bg-zinc-950 text-white">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-xl">
        <h1 className="text-3xl font-bold text-center">Welcome Team</h1>
        <p className="mt-2 text-white">
          This is the setup most people use now.
        </p>
        <div className="w-full h-auto flex justify-center items-center">
          <button className="mt-6 rounded-xl bg-white px-4 py-2 font-medium text-zinc-900 cursor-pointer">
            Button Desu
          </button>
        </div>
      </div>
    </main>
  );
};

export default App;
