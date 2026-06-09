'use client'
import { useState } from 'react'
import AppShell from '@/components/layout/AppShell'

export default function Settings() {
  const [org, setOrg] = useState('RaceCast Engineering')
  const [email, setEmail] = useState('engineering@racecast.dev')
  const [region, setRegion] = useState('EU West (Frankfurt)')

  return (
    <AppShell breadcrumb={['Infrastructure', 'Settings']}>
      <div className="px-8 py-8 max-w-3xl">
        <h1 className="text-[44px] font-bold tracking-tight leading-none mb-2">Settings</h1>
        <p className="text-[#9A9AA5] text-lg mb-10">Manage your account, organization, and infrastructure preferences.</p>

        {/* Profile */}
        <section className="bg-[#0d0d0d] border border-[#1C1C1C] rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-5">Organization</h2>
          <div className="space-y-4">
            <Field label="Organization Name" value={org} onChange={setOrg} />
            <Field label="Billing Email" value={email} onChange={setEmail} type="email" />
            <div>
              <label className="block text-sm text-[#9A9AA5] mb-2">Primary Region</label>
              <select value={region} onChange={e => setRegion(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#1C1C1C] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#FF5A1F]/50">
                <option>EU West (Frankfurt)</option>
                <option>US East (Virginia)</option>
                <option>Asia Pacific (Singapore)</option>
              </select>
            </div>
          </div>
          <button className="mt-6 px-5 py-2.5 bg-[#FF5A1F] hover:bg-orange-500 rounded-xl text-sm font-semibold transition-colors">Save changes</button>
        </section>

        {/* Plan */}
        <section className="bg-[#0d0d0d] border border-[#1C1C1C] rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-5">Plan & Billing</h2>
          <div className="flex items-center justify-between p-4 bg-[#0a0a0a] border border-[#1C1C1C] rounded-xl">
            <div>
              <div className="font-semibold">Enterprise</div>
              <div className="text-sm text-[#9A9AA5] mt-0.5">Unlimited requests · dedicated support · SLA</div>
            </div>
            <button className="px-4 py-2 rounded-xl border border-[#1C1C1C] text-sm hover:border-white/30 transition-colors">Manage</button>
          </div>
        </section>

        {/* Danger */}
        <section className="bg-[#0d0d0d] border border-[#EF4444]/20 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-2 text-[#EF4444]">Danger Zone</h2>
          <p className="text-sm text-[#9A9AA5] mb-4">Permanently delete your organization and all associated data. This cannot be undone.</p>
          <button className="px-4 py-2 rounded-xl border border-[#EF4444]/40 text-[#EF4444] text-sm hover:bg-[#EF4444]/10 transition-colors">Delete organization</button>
        </section>
      </div>
    </AppShell>
  )
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-sm text-[#9A9AA5] mb-2">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        className="w-full bg-[#0a0a0a] border border-[#1C1C1C] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#FF5A1F]/50 transition-colors" />
    </div>
  )
}
