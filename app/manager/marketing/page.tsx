'use client'

import React, { useState } from 'react'
import { ManagerHeader } from '@/components/manager/ManagerHeader'
import { useManagerStore, MarketingCampaign } from '@/lib/managerStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Megaphone, Tag, Gift, Zap, Sparkles, Loader2, Edit2 } from 'lucide-react'

export default function MarketingPage() {
  const { toast } = useToast()
  const { campaigns } = useManagerStore()

  const [campaignList, setCampaignList] = useState(campaigns)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<any | null>(null)

  // Form State
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [discount, setDiscount] = useState('10% OFF')
  const [submitting, setSubmitting] = useState(false)

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !code.trim()) return

    setSubmitting(true)
    setTimeout(() => {
      const newCamp: MarketingCampaign = {
        id: `c-${Date.now()}`,
        name: name.trim(),
        code: code.trim().toUpperCase(),
        discount,
        type: 'Promo',
        redemptions: 0,
        revenueGenerated: 0,
        status: 'active',
      }

      setCampaignList((prev) => [newCamp, ...prev])
      toast({
        title: 'Campaign Launched 🚀',
        description: `Promo code "${code.toUpperCase()}" is now active.`,
      })

      setName('')
      setCode('')
      setShowCreateModal(false)
      setSubmitting(false)
    }, 400)
  }

  const handleSaveEditRules = () => {
    if (!editingCampaign) return
    setSubmitting(true)
    setTimeout(() => {
      setCampaignList((prev) =>
        prev.map((c) => (c.id === editingCampaign.id ? { ...c, name: editingCampaign.name, discount: editingCampaign.discount } : c))
      )
      toast({
        title: 'Rules Updated ✨',
        description: `Updated campaign rules for ${editingCampaign.name}.`,
      })
      setEditingCampaign(null)
      setSubmitting(false)
    }, 300)
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-16">
      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-zinc-100 uppercase tracking-wide">Marketing & Loyalty Campaigns</h1>
            <p className="text-xs text-zinc-400 font-semibold mt-1">
              Manage promo codes, coupon redemptions, flash sales, and festival offers.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setShowCreateModal(true)}
            className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-xs rounded-xl"
          >
            <Megaphone className="mr-1.5 h-4 w-4" /> Create Campaign
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {campaignList.map((c) => (
            <Card key={c.id} className="border border-zinc-800 bg-zinc-900/80 rounded-3xl overflow-hidden shadow-lg">
              <CardHeader className="p-5 pb-3 border-b border-zinc-800 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-black text-amber-400">{c.name}</CardTitle>
                  <p className="text-xs text-zinc-400 font-mono font-bold mt-1">Code: {c.code}</p>
                </div>
                <Badge className="bg-amber-500/20 text-amber-300 text-xs font-bold">{c.discount}</Badge>
              </CardHeader>

              <CardContent className="p-5 space-y-3 text-xs">
                <div className="flex justify-between text-zinc-300">
                  <span>Total Redemptions</span>
                  <span className="font-bold text-zinc-100 font-mono">{c.redemptions}</span>
                </div>
                <div className="flex justify-between text-zinc-300">
                  <span>Revenue Generated</span>
                  <span className="font-bold text-emerald-400 font-mono">₹{c.revenueGenerated.toLocaleString('en-IN')}</span>
                </div>
                <div className="pt-2 border-t border-zinc-800 flex justify-between items-center">
                  <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px] uppercase font-bold">{c.status}</Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingCampaign({ ...c })}
                    className="border-zinc-800 text-[10px] font-bold rounded-lg hover:border-amber-500/40"
                  >
                    <Edit2 className="h-3 w-3 mr-1 text-amber-400" /> Edit Rules
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      {/* Create Campaign Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-zinc-100">
              <Megaphone className="h-5 w-5 text-amber-400" /> Create Marketing Campaign
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              Launch a new promo code or discount offer for online & walk-in guests.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateCampaign} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-300">Campaign Name</Label>
              <Input
                placeholder="e.g. Weekend Special 15%"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-zinc-900 border-zinc-800 text-xs text-zinc-100"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-300">Promo Code</Label>
              <Input
                placeholder="e.g. WEEKEND15"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                className="bg-zinc-900 border-zinc-800 text-xs font-mono uppercase text-amber-400"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-300">Discount Offer</Label>
              <select
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-zinc-100 focus:border-amber-500 focus:outline-none"
              >
                <option value="10% OFF">10% Flat Discount</option>
                <option value="15% OFF">15% Weekend Discount</option>
                <option value="20% OFF">20% Festive Special</option>
                <option value="Free Dessert">Complimentary Dessert</option>
              </select>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)} className="border-zinc-800 text-xs text-zinc-400">
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : 'Launch Campaign'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Rules Modal */}
      <Dialog open={Boolean(editingCampaign)} onOpenChange={(open) => !open && setEditingCampaign(null)}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-zinc-100">
              Edit Campaign Rules: {editingCampaign?.code}
            </DialogTitle>
          </DialogHeader>

          {editingCampaign && (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-zinc-300">Campaign Name</Label>
                <Input
                  value={editingCampaign.name}
                  onChange={(e) => setEditingCampaign({ ...editingCampaign, name: e.target.value })}
                  className="bg-zinc-900 border-zinc-800 text-xs text-zinc-100"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-zinc-300">Discount Value</Label>
                <Input
                  value={editingCampaign.discount}
                  onChange={(e) => setEditingCampaign({ ...editingCampaign, discount: e.target.value })}
                  className="bg-zinc-900 border-zinc-800 text-xs text-zinc-100"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button variant="outline" onClick={() => setEditingCampaign(null)} className="border-zinc-800 text-xs text-zinc-400">
                  Cancel
                </Button>
                <Button onClick={handleSaveEditRules} disabled={submitting} className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : 'Save Changes'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

