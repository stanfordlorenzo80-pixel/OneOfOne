import { db } from '../lib/db';
import React from 'react';

export default async function Dashboard() {
  const videos = await db.video.findMany({
    orderBy: { createdAt: 'desc' },
  });

  const totalViews = videos.reduce((acc, v) => acc + v.views, 0);
  const totalRev = videos.reduce((acc, v) => acc + v.revenue, 0);
  const totalSubs = videos.reduce((acc, v) => acc + v.subsGained, 0);
  const totalClicks = videos.reduce((acc, v) => acc + v.promoClicks, 0);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <header className="mb-12">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
          AI Shorts Automation Engine
        </h1>
        <p className="text-gray-400 mt-2">Monitor your passive income and channel growth automatically.</p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg hover:border-gray-600 transition">
          <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Total Views</h3>
          <p className="text-4xl font-bold">{totalViews.toLocaleString()}</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg hover:border-green-600 transition">
          <h3 className="text-green-400 hover:text-green-300 text-xs font-bold uppercase tracking-widest mb-1">Est. Revenue</h3>
          <p className="text-4xl font-bold text-green-400">${totalRev.toFixed(2)}</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg hover:border-gray-600 transition">
          <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Subs Gained</h3>
          <p className="text-4xl font-bold">{totalSubs.toLocaleString()}</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg hover:border-blue-600 transition">
          <h3 className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-1">Promo Clicks (Affiliate)</h3>
          <p className="text-4xl font-bold text-blue-400">{totalClicks.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Recent Shorts</h2>
        <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium shadow transition">
          + Generate New Short
        </button>
      </div>

      <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 shadow-lg">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-900 border-b border-gray-700 text-sm tracking-wider text-gray-400 uppercase">
            <tr>
              <th className="p-4 font-medium">Video Title</th>
              <th className="p-4 font-medium">Niche</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Views</th>
              <th className="p-4 font-medium">Revenue</th>
              <th className="p-4 font-medium">Promo Clicks</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {videos.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-gray-500 italic">No videos have been generated yet. Trigger a generation via the API or button.</td></tr>
            ) : (
              videos.map(v => (
                <tr key={v.id} className="border-b border-gray-700 hover:bg-gray-750 transition">
                  <td className="p-4 font-medium text-gray-200">{v.title}</td>
                  <td className="p-4 text-gray-400">{v.niche}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      v.status === 'UPLOADED' ? 'bg-green-900/50 text-green-400 border border-green-800' : 
                      'bg-yellow-900/50 text-yellow-400 border border-yellow-800'
                    }`}>
                      {v.status}
                    </span>
                  </td>
                  <td className="p-4 text-gray-300">{v.views.toLocaleString()}</td>
                  <td className="p-4 text-green-400">${v.revenue.toFixed(2)}</td>
                  <td className="p-4 text-blue-400">{v.promoClicks.toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
