import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { 
  User, 
  Mail, 
  Calendar, 
  ThumbsUp, 
  MessageSquare, 
  Eye,
  Edit,
  Settings
} from 'lucide-react'

interface UserQuestion {
  _id: string
  title: string
  votes: number
  answers: number
  views: number
  createdAt: string
}

interface UserAnswer {
  _id: string
  content: string
  questionId: string
  questionTitle: string
  votes: number
  isAccepted: boolean
  createdAt: string
}

const Profile: React.FC = () => {
  const { user } = useAuth()
  const [questions, setQuestions] = useState<UserQuestion[]>([])
  const [answers, setAnswers] = useState<UserAnswer[]>([])
  const [stats, setStats] = useState({
    totalQuestions: 0,
    totalAnswers: 0,
    totalVotes: 0,
    totalViews: 0
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'questions' | 'answers'>('questions')

  useEffect(() => {
    if (user) {
      fetchUserData()
    }
  }, [user])

  const fetchUserData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }

      const [questionsRes, answersRes, statsRes] = await Promise.all([
        axios.get('/api/users/questions', { headers }),
        axios.get('/api/users/answers', { headers }),
        axios.get('/api/users/stats', { headers })
      ])

      setQuestions(questionsRes.data.questions)
      setAnswers(answersRes.data.answers)
      setStats(statsRes.data.stats)
    } catch (error) {
      console.error('Failed to fetch user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
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
      {/* Profile Header */}
      <div className="card mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
          <div className="flex-shrink-0">
            <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="h-12 w-12 text-primary-600" />
            </div>
          </div>
          
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {user?.username}
                </h1>
                <div className="flex items-center space-x-4 text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Mail className="h-4 w-4" />
                    <span>{user?.email}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>Member since {formatDate(user?.createdAt || new Date().toISOString())}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 md:mt-0">
                <button className="btn-secondary flex items-center space-x-2">
                  <Settings className="h-4 w-4" />
                  <span>Edit Profile</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="card text-center">
          <div className="flex items-center justify-center mb-2">
            <MessageSquare className="h-8 w-8 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.totalQuestions}</div>
          <div className="text-sm text-gray-600">Questions</div>
        </div>
        
        <div className="card text-center">
          <div className="flex items-center justify-center mb-2">
            <User className="h-8 w-8 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.totalAnswers}</div>
          <div className="text-sm text-gray-600">Answers</div>
        </div>
        
        <div className="card text-center">
          <div className="flex items-center justify-center mb-2">
            <ThumbsUp className="h-8 w-8 text-yellow-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.totalVotes}</div>
          <div className="text-sm text-gray-600">Votes</div>
        </div>
        
        <div className="card text-center">
          <div className="flex items-center justify-center mb-2">
            <Eye className="h-8 w-8 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.totalViews}</div>
          <div className="text-sm text-gray-600">Views</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('questions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'questions'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Questions ({questions.length})
          </button>
          <button
            onClick={() => setActiveTab('answers')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'answers'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Answers ({answers.length})
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'questions' ? (
        <div className="space-y-4">
          {questions.length === 0 ? (
            <div className="card text-center py-12">
              <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No questions yet</h3>
              <p className="text-gray-600 mb-4">Start asking questions to help others!</p>
              <Link to="/ask" className="btn-primary">
                Ask Your First Question
              </Link>
            </div>
          ) : (
            questions.map((question) => (
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
                    <p className="text-gray-600 mt-2">
                      Asked {formatDate(question.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {answers.length === 0 ? (
            <div className="card text-center py-12">
              <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No answers yet</h3>
              <p className="text-gray-600 mb-4">Start answering questions to help others!</p>
              <Link to="/" className="btn-primary">
                Browse Questions
              </Link>
            </div>
          ) : (
            answers.map((answer) => (
              <div key={answer._id} className="card hover:shadow-md transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-start space-y-4 lg:space-y-0 lg:space-x-6">
                  {/* Stats */}
                  <div className="flex lg:flex-col items-center lg:items-start space-x-4 lg:space-x-0 lg:space-y-2 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <ThumbsUp className="h-4 w-4" />
                      <span>{answer.votes} votes</span>
                    </div>
                    {answer.isAccepted && (
                      <div className="flex items-center space-x-1 text-green-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Accepted</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <Link 
                      to={`/question/${answer.questionId}`}
                      className="text-lg font-semibold text-gray-900 hover:text-primary-600 transition-colors"
                    >
                      {answer.questionTitle}
                    </Link>
                    <div 
                      className="prose max-w-none mt-2 text-gray-600"
                      dangerouslySetInnerHTML={{ 
                        __html: truncateText(answer.content.replace(/<[^>]*>/g, ''), 200) 
                      }}
                    />
                    <p className="text-gray-600 mt-2">
                      Answered {formatDate(answer.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default Profile 