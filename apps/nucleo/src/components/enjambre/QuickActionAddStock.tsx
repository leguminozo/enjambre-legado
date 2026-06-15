'use client'

import { useState } from 'react'
import { PackagePlus, AlertTriangle } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, Button, Input } from '@enjambre/ui'
import { useApiFetch } from '@/hooks/use-api-fetch'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

interface Producto {
  id: string
  nombre: string
  stock: number
}

export function QuickActionAddStock() {
  const [open, setOpen] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState('')
  const [cantidad, setCantidad] = useState<number | ''>('')
  
  const apiFetch = useApiFetch()
  const queryClient = useQueryClient()

  const { data: productos, isLoading } = useQuery<Producto[]>({
    queryKey: ['productos-produccion-dashboard'],
    queryFn: async () => {
      const res = await apiFetch('/api/produccion/dashboard')
      if (!res.ok) throw new Error('Failed to fetch productos')
      const json = await res.json()
      return json.data?.productos || []
    },
    enabled: open,
  })

  const mutation = useMutation({
    mutationFn: async () => {
      if (!selectedProductId || !cantidad) throw new Error('Faltan campos')
      const res = await apiFetch('/api/produccion/add-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          producto_id: selectedProductId,
          cantidad: Number(cantidad)
        })
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || 'Error al recargar stock')
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Stock recargado con éxito')
      queryClient.invalidateQueries({ queryKey: ['productos-produccion-dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-resumen'] })
      setOpen(false)
      setSelectedProductId('')
      setCantidad('')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 bg-background">
          <PackagePlus size={16} />
          <span>Recargar Stock</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Recarga Rápida de Stock</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Producto</label>
            {isLoading ? (
              <div className="text-sm text-muted-foreground">Cargando productos...</div>
            ) : (
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
              >
                <option value="">Selecciona un producto...</option>
                {productos?.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} (Stock actual: {p.stock ?? 0})
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Cantidad a Añadir</label>
            <Input 
              type="number"
              min={1}
              placeholder="Ej: 10"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value ? Number(e.target.value) : '')}
            />
          </div>
          {productos && selectedProductId && (
            <div className="rounded-md bg-muted/50 p-3 text-sm flex gap-2">
              <AlertTriangle className="text-warning mt-0.5" size={16} />
              <span className="text-muted-foreground">
                El nuevo stock será: <strong className="text-foreground">
                  {(productos.find(p => p.id === selectedProductId)?.stock || 0) + Number(cantidad || 0)}
                </strong>
              </span>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 mt-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button 
            onClick={() => mutation.mutate()} 
            disabled={mutation.isPending || !selectedProductId || !cantidad || Number(cantidad) <= 0}
          >
            {mutation.isPending ? 'Guardando...' : 'Confirmar Recarga'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
