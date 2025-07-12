import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import axios from 'axios'
import toast from 'react-hot-toast'
import { 
  ThumbsUp, 
  ThumbsDown, 
  MessageSquare, 
  Eye, 
  Clock, 
  CheckCircle,
  User,
  Flag
} from 'lucide-react'

interface Answer {
  _id: string
  content: string
  answeredBy: {
    _id: string
    username: string
  }
  votes: number
  isAccepted: boolean
  createdAt: string
  userVote?: 'up' | 'down' | null
}

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
  answers: Answer[]
  views: number
  createdAt: string
  userVote?: 'up' | 'down' | null
}

const QuestionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [question, setQuestion] = useState<Question | null>(null)
  const [loading, setLoading] = useState(true)
  const [answerContent, setAnswerContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (id) {
      fetchQuestion()
    }
  }, [id])

  const fetchQuestion = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      
      const response = await axios.get(`/api/questions/${id}`, { headers })
      setQuestion(response.data.question)
    } catch (error) {
      console.error('Failed to fetch question:', error)
      toast.error('Failed to load question')
    } finally {
      setLoading(false)
    }
  }

  const handleVote = async (type: 'question' | 'answer', itemId: string, voteType: 'up' | 'down') => {
    if (!user) {
      toast.error('Please login to vote')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const endpoint = type === 'question' ? `/api/questions/${itemId}/vote` : `/api/answers/${itemId}/vote`
      
      await axios.post(endpoint, { vote: voteType }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      fetchQuestion() // Refresh to get updated votes
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to vote')
    }
  }

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!answerContent.trim()) return

    try {
      setSubmitting(true)
      const token = localStorage.getItem('token')
      await axios.post(`/api/questions/${id}/answers`, {
        content: answerContent
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setAnswerContent('')
      fetchQuestion()
      toast.success('Answer posted successfully!')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to post answer')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAcceptAnswer = async (answerId: string) => {
    try {
      const token = localStorage.getItem('token')
      await axios.patch(`/api/answers/${answerId}/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      fetchQuestion()
      toast.success('Answer accepted!')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to accept answer')
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!question) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Question not found</h3>
        <button onClick={() => navigate('/')} className="btn-primary">
          Back to Home
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex mb-8" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <button
              onClick={() => navigate('/')}
              className="text-gray-700 hover:text-primary-600"
            >
              Home
            </button>
          </li>
          <li>
            <div className="flex items-center">
              <span className="mx-2 text-gray-400">/</span>
              <span className="text-gray-500 truncate">{question.title}</span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Question */}
      <div className="card mb-8">
        <div className="flex space-x-6">
          {/* Voting */}
          <div className="flex flex-col items-center space-y-2">
            <button
              onClick={() => handleVote('question', question._id, 'up')}
              className={`p-2 rounded hover:bg-gray-100 ${
                question.userVote === 'up' ? 'text-green-600' : 'text-gray-400'
              }`}
            >
              <ThumbsUp className="h-6 w-6" />
            </button>
            <span className="text-lg font-semibold">{question.votes}</span>
            <button
              onClick={() => handleVote('question', question._id, 'down')}
              className={`p-2 rounded hover:bg-gray-100 ${
                question.userVote === 'down' ? 'text-red-600' : 'text-gray-400'
              }`}
            >
              <ThumbsDown className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{question.title}</h1>
            
            <div 
              className="prose max-w-none mb-6"
              dangerouslySetInnerHTML={{ __html: question.description }}
            />

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              {question.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Meta */}
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center space-x-4">
                <span>Asked by {question.askedBy.username}</span>
                <span>{formatDate(question.createdAt)}</span>
                <div className="flex items-center space-x-1">
                  <Eye className="h-4 w-4" />
                  <span>{question.views} views</span>
                </div>
              </div>
              {user && (
                <button className="flex items-center space-x-1 text-gray-400 hover:text-gray-600">
                  <Flag className="h-4 w-4" />
                  <span>Report</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Answers */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {question.answers.length} Answer{question.answers.length !== 1 ? 's' : ''}
        </h2>

        <div className="space-y-6">
          {question.answers.map((answer) => (
            <div key={answer._id} className="card">
              <div className="flex space-x-6">
                {/* Voting */}
                <div className="flex flex-col items-center space-y-2">
                  <button
                    onClick={() => handleVote('answer', answer._id, 'up')}
                    className={`p-2 rounded hover:bg-gray-100 ${
                      answer.userVote === 'up' ? 'text-green-600' : 'text-gray-400'
                    }`}
                  >
                    <ThumbsUp className="h-6 w-6" />
                  </button>
                  <span className="text-lg font-semibold">{answer.votes}</span>
                  <button
                    onClick={() => handleVote('answer', answer._id, 'down')}
                    className={`p-2 rounded hover:bg-gray-100 ${
                      answer.userVote === 'down' ? 'text-red-600' : 'text-gray-400'
                    }`}
                  >
                    <ThumbsDown className="h-6 w-6" />
                  </button>
                  {answer.isAccepted && (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div 
                    className="prose max-w-none mb-4"
                    dangerouslySetInnerHTML={{ __html: answer.content }}
                  />

                  {/* Meta */}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <span>Answered by {answer.answeredBy.username}</span>
                      <span>{formatDate(answer.createdAt)}</span>
                    </div>
                    {user && question.askedBy._id === user._id && !answer.isAccepted && (
                      <button
                        onClick={() => handleAcceptAnswer(answer._id)}
                        className="flex items-center space-x-1 text-green-600 hover:text-green-700"
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span>Accept</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Answer Form */}
      {user ? (
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Your Answer</h3>
          <form onSubmit={handleSubmitAnswer}>
            <div className="border border-gray-300 rounded-lg mb-4">
              <ReactQuill
                theme="snow"
                value={answerContent}
                onChange={setAnswerContent}
                placeholder="Write your answer here..."
                style={{ height: '200px' }}
              />
            </div>
            <button
              type="submit"
              disabled={submitting || !answerContent.trim()}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Posting...' : 'Post Answer'}
            </button>
          </form>
        </div>
      ) : (
        <div className="card text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Want to answer?</h3>
          <p className="text-gray-600 mb-4">Please log in to post an answer.</p>
          <button
            onClick={() => navigate('/login')}
            className="btn-primary"
          >
            Log In
          </button>
        </div>
      )}
    </div>
  )
}

export default QuestionDetail 