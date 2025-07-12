import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { 
  Clock, 
  MessageSquare, 
  ThumbsUp, 
  Eye,
  Filter,
  TrendingUp,
  HelpCircle
} from 'lucide-react'

interface Question {
  _id: string
  title: string
  description: string
  tags: string[]
  askedBy: {
    _id: string
    username: string
  }
  votes: number
  answers: number
  views: number
  createdAt: string
  isAccepted: boolean
}

const Home: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filter, setFilter] = useState('newest')
  const [searchParams, setSearchParams] = useSearchParams()
  const searchQuery = searchParams.get('search') || ''

  useEffect(() => {
    fetchQuestions()
  }, [currentPage, filter, searchQuery])

  const fetchQuestions = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        filter,
        ...(searchQuery && { search: searchQuery })
      })

      const response = await axios.get(`/api/questions?${params}`)
      setQuestions(response.data.questions)
      setTotalPages(response.data.totalPages)
    } catch (error) {
      console.error('Failed to fetch questions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter)
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo(0, 0)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
    return date.toLocaleDateString()
  }

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {searchQuery ? `Search results for "${searchQuery}"` : 'All Questions'}
          </h1>
          <p className="text-gray-600">
            {questions.length} questions found
          </p>
        </div>
        <Link
          to="/ask"
          className="btn-primary flex items-center space-x-2 mt-4 sm:mt-0"
        >
          <HelpCircle className="h-4 w-4" />
          <span>Ask Question</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Filter by:</span>
          <button
            onClick={() => handleFilterChange('newest')}
            className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm ${
              filter === 'newest' 
                ? 'bg-primary-100 text-primary-700' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>Newest</span>
          </button>
          <button
            onClick={() => handleFilterChange('most-voted')}
            className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm ${
              filter === 'most-voted' 
                ? 'bg-primary-100 text-primary-700' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            <span>Most Voted</span>
          </button>
          <button
            onClick={() => handleFilterChange('unanswered')}
            className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm ${
              filter === 'unanswered' 
                ? 'bg-primary-100 text-primary-700' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>Unanswered</span>
          </button>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {questions.map((question) => (
          <div key={question._id} className="card hover:shadow-md transition-shadow">
            <div className="flex flex-col lg:flex-row lg:items-start space-y-4 lg:space-y-0 lg:space-x-6">
              {/* Stats */}
              <div className="flex lg:flex-col items-center lg:items-start space-x-4 lg:space-x-0 lg:space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <ThumbsUp className="h-4 w-4" />
                  <span>{question.votes} votes</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MessageSquare className="h-4 w-4" />
                  <span>{question.answers} answers</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Eye className="h-4 w-4" />
                  <span>{question.views} views</span>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1">
                <Link 
                  to={`/question/${question._id}`}
                  className="text-xl font-semibold text-gray-900 hover:text-primary-600 transition-colors"
                >
                  {question.title}
                </Link>
                <p className="text-gray-600 mt-2 line-clamp-2">
                  {truncateText(question.description.replace(/<[^>]*>/g, ''), 200)}
                </p>
                
                {/* Tags */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {question.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Meta */}
                <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <span>Asked by</span>
                    <span className="text-primary-600 font-medium">
                      {question.askedBy.username}
                    </span>
                    <span>{formatDate(question.createdAt)}</span>
                  </div>
                  {question.isAccepted && (
                    <div className="flex items-center space-x-1 text-green-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Accepted</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  currentPage === page
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {questions.length === 0 && (
        <div className="text-center py-12">
          <HelpCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No questions found</h3>
          <p className="text-gray-600 mb-4">
            {searchQuery 
              ? `No questions match your search for "${searchQuery}"`
              : 'Be the first to ask a question!'
            }
          </p>
          {!searchQuery && (
            <Link to="/ask" className="btn-primary">
              Ask Question
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

export default Home 