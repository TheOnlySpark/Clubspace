"use client"

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, X, Check } from 'lucide-react'

type Category = {
  id: string
  name: string
}

export function ClubCategoryManager() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  
  // States for adding
  const [isAdding, setIsAdding] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  
  // States for editing
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const fetchCategories = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/admin/club-categories')
      if (res.ok) {
        const data = await res.json()
        setCategories(data)
      } else {
        throw new Error('Failed to fetch categories')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleAdd = async () => {
    if (!newCategoryName.trim()) return
    setError('')
    try {
      const res = await fetch('/api/admin/club-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName.trim() })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to add category')
      
      setCategories(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      setNewCategoryName('')
      setIsAdding(false)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return
    setError('')
    try {
      const res = await fetch(`/api/admin/club-categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim() })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update category')
      
      setCategories(prev => prev.map(c => c.id === id ? data : c).sort((a, b) => a.name.localeCompare(b.name)))
      setEditingId(null)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this category? Clubs in this category will become uncategorized.')) return
    
    setError('')
    try {
      const res = await fetch(`/api/admin/club-categories/${id}`, {
        method: 'DELETE'
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete category')
      }
      
      setCategories(prev => prev.filter(c => c.id !== id))
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 font-sans text-navy">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold">Club Categories</h2>
          <p className="text-sm text-gray-500 mt-1">Manage categories used to organize clubs.</p>
        </div>
        <button
          onClick={() => { setIsAdding(true); setNewCategoryName(''); setError('') }}
          disabled={isAdding}
          className="flex items-center px-4 py-2 bg-electric-blue text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Category
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">
          {error}
        </div>
      )}

      {isAdding && (
        <div className="flex items-center gap-2 mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <input
            type="text"
            className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-electric-blue text-sm"
            placeholder="Category Name"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd()
              if (e.key === 'Escape') setIsAdding(false)
            }}
          />
          <button onClick={handleAdd} className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors" title="Save">
            <Check className="w-5 h-5" />
          </button>
          <button onClick={() => setIsAdding(false)} className="p-2 text-gray-500 hover:bg-gray-200 rounded-md transition-colors" title="Cancel">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="py-8 text-center text-gray-500">Loading categories...</div>
      ) : categories.length === 0 && !isAdding ? (
        <div className="py-8 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <p className="text-gray-500 text-sm">No categories created yet.</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {categories.map(category => (
            <li key={category.id} className="py-3 flex items-center justify-between group">
              {editingId === category.id ? (
                <div className="flex items-center gap-2 w-full">
                  <input
                    type="text"
                    className="flex-grow px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-electric-blue text-sm"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleUpdate(category.id)
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                  />
                  <button onClick={() => handleUpdate(category.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => setEditingId(null)} className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-md transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <span className="font-medium">{category.name}</span>
                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => { setEditingId(category.id); setEditName(category.name); setError('') }}
                      className="p-2 text-gray-500 hover:text-electric-blue hover:bg-blue-50 rounded-md transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(category.id)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors ml-1"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
