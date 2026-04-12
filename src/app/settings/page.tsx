import { Save, User, MapPin, Bell, Globe } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 border-none bg-none">Settings</h1>
        <p className="text-slate-500 mt-1">Manage your restaurant details, notifications, and profile.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-1">
          <button className="w-full flex items-center px-3 py-2 text-sm font-medium bg-indigo-50 text-indigo-700 rounded-md">
            <User className="w-4 h-4 mr-3" /> Restaurant Profile
          </button>
          <button className="w-full flex items-center px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors">
            <Bell className="w-4 h-4 mr-3" /> Notifications
          </button>
          <button className="w-full flex items-center px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors">
            <Globe className="w-4 h-4 mr-3" /> Regional Setup
          </button>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="bg-white border text-left border-slate-200 rounded-xl shadow-sm p-6 overflow-hidden">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center"><MapPin className="w-5 h-5 mr-2 text-indigo-500" /> Restaurant Details</h2>
            
            <form className="space-y-4" onSubmit={e => e.preventDefault()}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Restaurant Name</label>
                  <input type="text" defaultValue="Smart Restaurant" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder-slate-400 text-slate-900" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Contact Email</label>
                  <input type="email" defaultValue="admin@smartrestaurant.com" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder-slate-400 text-slate-900" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-sm font-medium text-slate-700">Operating Address</label>
                  <textarea rows={3} defaultValue={"123 Market St\nSan Francisco, CA 94105"} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder-slate-400 text-slate-900 resize-none" />
                </div>
              </div>

              <div className="border-t border-slate-200 pt-5 flex justify-end">
                <button type="submit" className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg shadow-sm transition-colors" onClick={() => alert('Settings saved successfully! (Demo)')}>
                  <Save className="w-4 h-4 mr-2" /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
