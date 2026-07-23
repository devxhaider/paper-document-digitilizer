import { useState, createContext, useContext } from 'react'
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import {
  Activity,
  Database,
  FileText,
  Filter,
  Flag,
  FolderOpen,
  LayoutDashboard,
  MoreVertical,
  RefreshCw,
  Scale,
  Search,
  Settings,
  Trash2,
  Upload,
  UserCircle
} from 'lucide-react'

// Create React Query Client
const queryClient = new QueryClient()

interface HealthResponse {
  status: string
  database: string
  storage: string
}

// Role Context for UI propagation
const RoleContext = createContext<{ role: 'uploader' | 'admin', setRole: (v: 'uploader' | 'admin') => void }>({
  role: 'uploader',
  setRole: () => { }
})
export const useRole = () => useContext(RoleContext)

// Layout Wrapper Component
function AppLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  // Phase A: Simple Role selection
  const [role, setRole] = useState<'uploader' | 'admin'>('uploader')

  return (
    <RoleContext.Provider value={{ role, setRole }}>
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        {/* Header bar */}
        <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-indigo-600 text-white p-2 rounded-xl shadow-md shadow-indigo-100">
                <FolderOpen className="h-6 w-6" />
              </div>
              <span className="font-bold text-xl text-slate-800 tracking-tight">Antigravity DMS</span>
            </div>

            <nav className="flex items-center space-x-1 sm:space-x-2">
              <>
                <Link
                  to="/"
                  className="flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-all"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
                <Link
                  to="/upload"
                  className="flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-all"
                >
                  <Upload className="h-4 w-4" />
                  <span className="hidden sm:inline">Upload</span>
                </Link>
                <div className="flex items-center space-x-2 ml-4 pl-4 border-l border-slate-200">
                  <UserCircle className="h-5 w-5 text-slate-400" />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'uploader' | 'admin')}
                    className="bg-transparent text-sm font-medium text-slate-700 outline-none cursor-pointer"
                  >
                    <option value="uploader">Acting as: Uploader</option>
                    <option value="admin">Acting as: Admin</option>
                  </select>
                </div>
              </>
            </nav>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white py-6 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 text-sm text-slate-500">
            <div>Antigravity Document Management System — Phase 0</div>
            <div className="flex space-x-4">
              <span className="flex items-center space-x-1 text-slate-400">
                <UserCircle className="h-4 w-4" />
                <span>X-Role Header Architecture via Phase A</span>
              </span>
            </div>
          </div>
        </footer>
      </div>
    </RoleContext.Provider>
  )
}

// Health Check Dashboard Indicator
function HealthWidget() {
  const { data, isLoading, error, refetch, isRefetching } = useQuery<HealthResponse>({
    queryKey: ['health'],
    queryFn: async () => {
      const res = await fetch('/api/health', {
        headers: { 'X-Role': 'admin' }
      })
      if (!res.ok) throw new Error('Failed to fetch health check')
      return res.json()
    },
    refetchInterval: 10000 // Automatically poll health status
  })

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-800 text-lg flex items-center space-x-2">
          <Activity className="h-5 w-5 text-indigo-600" />
          <span>System Environment Status</span>
        </h3>
        <button
          onClick={() => refetch()}
          disabled={isRefetching}
          className="text-slate-400 hover:text-indigo-600 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Backend status */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">FastAPI Backend</div>
          <div className="mt-2 flex items-center space-x-2">
            {isLoading ? (
              <span className="text-slate-500 text-sm font-medium">Checking...</span>
            ) : error ? (
              <>
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                <span className="text-rose-600 text-sm font-semibold">Offline</span>
              </>
            ) : (
              <>
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                <span className="text-emerald-700 text-sm font-semibold">Running</span>
              </>
            )}
          </div>
        </div>

        {/* Database status */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Postgres Extension (`pg_trgm`)</div>
          <div className="mt-2 flex items-center space-x-2">
            {isLoading ? (
              <span className="text-slate-500 text-sm font-medium">Checking...</span>
            ) : error || data?.database !== 'connected' ? (
              <>
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                <span className="text-rose-600 text-sm font-semibold">Database Error</span>
              </>
            ) : (
              <>
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                <span className="text-emerald-700 text-sm font-semibold">Connected</span>
              </>
            )}
          </div>
        </div>

        {/* Storage status */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Local Storage</div>
          <div className="mt-2 flex items-center space-x-2">
            {isLoading ? (
              <span className="text-slate-500 text-sm font-medium">Checking...</span>
            ) : error ? (
              <>
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500"></span>
                <span className="text-rose-600 text-sm font-semibold">Offline</span>
              </>
            ) : (
              <>
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                <span className="text-emerald-700 text-sm font-semibold">Writable</span>
              </>
            )}
          </div>
        </div>
      </div>
      {error && (
        <div className="mt-4 text-xs text-rose-500 bg-rose-50 p-3 rounded-lg border border-rose-100">
          Failed to establish socket connection with backend server. Make sure FastAPI runs natively at `http://localhost:8000`.
        </div>
      )}
    </div>
  )
}

// 1. Dashboard View (The Search & Results interface)
function DashboardView() {
  const { role } = useRole()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterDept, setFilterDept] = useState('')
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  // Mock document data for Phase B UI development
  const mockDocs = [
    { id: '1', title: 'Q3 Financial Earnings Report', department: 'Finance', type: 'Spreadsheet', date: '2026-07-20', uploader: 'Alice', flagged: false },
    { id: '2', title: 'Employee Handbook v2', department: 'HR', type: 'Policy', date: '2026-06-15', uploader: 'Bob', flagged: true },
    { id: '3', title: 'Frontend Architecture Spec', department: 'Engineering', type: 'Technical Spec', date: '2026-07-22', uploader: 'Charlie', flagged: false }
  ]

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Document Repository</h1>
          <p className="text-slate-500 mt-1">Search, filter, and manage uploaded files.</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-6 shadow-sm space-y-4 md:space-y-0 md:flex md:items-center md:space-x-4">
        {/* Core Search */}
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 sm:text-sm transition-all"
            placeholder="Search keywords, titles, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Mobile Filter Toggle */}
        <button
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="md:hidden w-full flex items-center justify-center space-x-2 py-2.5 border border-slate-200 rounded-xl text-slate-700 bg-slate-50 font-medium hover:bg-slate-100 transition"
        >
          <Filter className="h-4 w-4" />
          <span>Filters</span>
        </button>

        {/* Metadata Filter Panel (Inline on desktop, collapsible on mobile) */}
        <div className={`md:flex items-center space-y-4 md:space-y-0 md:space-x-4 ${showMobileFilters ? 'block' : 'hidden'}`}>
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="w-full md:w-48 pl-3 pr-10 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="">All Departments</option>
            <option value="Finance">Finance</option>
            <option value="HR">HR</option>
            <option value="Engineering">Engineering</option>
          </select>

          <input
            type="date"
            className="w-full md:w-auto px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Results View - Table for Desktop, Stacked Cards for Mobile */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
        {/* DESKTOP TABLE */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Document Title</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Department & Type</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Doc Date</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {mockDocs.map(doc => (
                <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-indigo-50 rounded-lg"><FileText className="h-5 w-5 text-indigo-600" /></div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{doc.title}</div>
                        <div className="text-xs text-slate-500">Uploaded by: {doc.uploader}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-900">{doc.department}</div>
                    <div className="text-xs text-slate-500">{doc.type}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {doc.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {doc.flagged ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                        Flagged
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                        Clear
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end items-center space-x-3">
                      <button className="text-indigo-600 hover:text-indigo-900 text-xs font-semibold">View</button>
                      {role === 'admin' && (
                        <>
                          <button className="text-amber-600 hover:text-amber-900"><Flag className="h-4 w-4" /></button>
                          <button className="text-rose-600 hover:text-rose-900"><Trash2 className="h-4 w-4" /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* MOBILE STACKED CARDS */}
        <div className="md:hidden divide-y divide-slate-100">
          {mockDocs.map(doc => (
            <div key={doc.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-sm font-bold text-slate-900 leading-tight">{doc.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{doc.department} • {doc.type}</div>
                </div>
                {doc.flagged && <Flag className="h-4 w-4 text-rose-500 ml-2 shrink-0" />}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>By {doc.uploader} • {doc.date}</span>
                <div className="flex space-x-2">
                  <button className="px-3 py-1 bg-indigo-50 text-indigo-700 font-semibold rounded-lg">View</button>
                  {role === 'admin' && (
                    <button className="px-3 py-1 bg-rose-50 text-rose-700 rounded-lg"><Trash2 className="h-3 w-3" /></button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

const uploadSchema = z.object({
  title: z.string().min(1, "Title is required"),
  document_type_id: z.string().min(1, "Type is required"),
  department_id: z.string().min(1, "Department is required"),
  document_date: z.string().min(1, "Date is required"),
  tags: z.string().optional()
})

type UploadFormValues = z.infer<typeof uploadSchema>

function UploadView() {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const { register, handleSubmit, formState: { errors }, reset } = useForm<UploadFormValues>({
    resolver: zodResolver(uploadSchema)
  })

  // Mock data for dropdowns (until DB returns real rows)
  const departments = [{ id: '11111111-1111-1111-1111-111111111111', name: 'Engineering' }]
  const documentTypes = [{ id: '22222222-2222-2222-2222-222222222222', name: 'Technical Spec' }]

  const onSubmit = async (data: UploadFormValues) => {
    if (!file) {
      alert("Please select a file to upload.")
      return
    }

    setIsUploading(true)
    const formData = new FormData()
    formData.append('title', data.title)
    formData.append('document_type_id', data.document_type_id)
    formData.append('department_id', data.department_id)
    formData.append('document_date', data.document_date)
    formData.append('tags', data.tags || '')
    formData.append('file', file)

    try {
      // Assuming X-Role will be pulled from context or added by an interceptor later,
      // explicitly passing it here for prototype:
      const res = await fetch('/api/documents/', {
        method: 'POST',
        headers: { 'X-Role': 'uploader' },
        body: formData
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.detail || 'Upload failed')
      }

      setUploadSuccess(true)
      reset()
      setFile(null)
      setTimeout(() => setUploadSuccess(false), 3000)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-950">Upload Document</h2>
        <p className="text-slate-500 mt-1">Upload files and fill in required metadata natively.</p>
      </div>

      {uploadSuccess && (
        <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl border border-emerald-100 font-medium">
          Document uploaded successfully!
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* File Drop Area */}
        <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center space-y-4 hover:bg-slate-50 transition relative">
          <input
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            accept=".pdf,.jpg,.jpeg,.png,.tiff"
          />
          <div className="bg-white p-3 rounded-full border border-slate-200 shadow-sm">
            <Upload className="h-8 w-8 text-indigo-500" />
          </div>
          <div className="text-center">
            {file ? (
              <span className="font-semibold text-indigo-700">{file.name}</span>
            ) : (
              <>
                <span className="font-medium text-indigo-600">Choose a file</span>
                <span className="text-slate-500"> or drag it here</span>
              </>
            )}
          </div>
          <span className="text-xs text-slate-400 max-w-xs text-center">PDF, JPG, PNG, TIFF up to 25MB</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700">Document Title *</label>
            <input type="text" {...register("title")} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" placeholder="Enter title" />
            {errors.title && <span className="text-xs text-rose-500">{errors.title.message}</span>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700">Document Date *</label>
            <input type="date" {...register("document_date")} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
            {errors.document_date && <span className="text-xs text-rose-500">{errors.document_date.message}</span>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700">Department *</label>
            <select {...register("department_id")} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white">
              <option value="">Select department...</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            {errors.department_id && <span className="text-xs text-rose-500">{errors.department_id.message}</span>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700">Document Type *</label>
            <select {...register("document_type_id")} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white">
              <option value="">Select type...</option>
              {documentTypes.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            {errors.document_type_id && <span className="text-xs text-rose-500">{errors.document_type_id.message}</span>}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-semibold text-slate-700">Tags (comma separated)</label>
          <input type="text" {...register("tags")} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" placeholder="e.g. invoice, urgent, 2026" />
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button
            type="submit"
            disabled={isUploading || !file}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-md shadow-indigo-100 disabled:opacity-50 transition-all"
          >
            <Upload className="h-4 w-4" />
            <span>{isUploading ? 'Uploading...' : 'Upload to Vault'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}



// Main root wrapper
function AppRoutes() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<DashboardView />} />
        <Route path="/upload" element={<UploadView />} />
      </Routes>
    </AppLayout>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
