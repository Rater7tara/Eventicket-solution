import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  User,
  Tag,
  ArrowLeft,
  Share2,
  Eye,
  BookOpen,
  ChevronRight,
  Heart,
  MessageCircle,
  Facebook,
  Twitter,
  Linkedin,
  Copy,
  CheckCircle,
} from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import serverURL from "../../ServerConfig";
import axios from "axios";

const BlogPost = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);
  const [relatedBlogs, setRelatedBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [shareMessage, setShareMessage] = useState("");

  // Fetch single blog post
  const fetchBlog = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await axios.get(`${serverURL.url}blogs/blogs/${id}`);

      if (response.data && response.data.success) {
        setBlog(response.data.blog);
        // Fetch related blogs after getting the current blog
        fetchRelatedBlogs(response.data.blog.category);
      } else {
        setErrorMessage("Blog post not found.");
      }
    } catch (error) {
      console.error("Error fetching blog:", error);
      setErrorMessage("Failed to load blog post.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch related blogs
  const fetchRelatedBlogs = async (category) => {
    try {
      const response = await axios.get(`${serverURL.url}blogs/blogs`);
      
      if (response.data && response.data.success) {
        const allBlogs = response.data.blogs || [];
        // Get blogs from the same category, excluding current blog
        const related = allBlogs
          .filter((b) => b.category === category && b._id !== id)
          .slice(0, 3);
        setRelatedBlogs(related);
      }
    } catch (error) {
      console.error("Error fetching related blogs:", error);
    }
  };

  useEffect(() => {
    if (id) {
      fetchBlog();
    }
  }, [id]);

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Calculate reading time
  const calculateReadingTime = (text) => {
    const wordsPerMinute = 200;
    const wordCount = text.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / wordsPerMinute);
    return readingTime;
  };

  // Truncate text for related posts
  const truncateText = (text, maxLength = 100) => {
    if (!text) return "";
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
  };

  // Handle like button
  const handleLike = () => {
    setIsLiked(!isLiked);
  };

  // Share functionality
  const handleShare = async (platform) => {
    const url = window.location.href;
    const title = blog.title;
    const text = blog.metaDescription || truncateText(blog.text, 150);

    switch (platform) {
      case 'native':
        if (navigator.share) {
          try {
            await navigator.share({
              title: title,
              text: text,
              url: url,
            });
          } catch (error) {
            console.log('Error sharing:', error);
          }
        } else {
          handleShare('copy');
        }
        break;
      
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, '_blank');
        break;
      
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
        break;
      
      case 'copy':
        try {
          await navigator.clipboard.writeText(url);
          setShareMessage("Link copied to clipboard!");
          setTimeout(() => setShareMessage(""), 3000);
        } catch (error) {
          setShareMessage("Failed to copy link");
          setTimeout(() => setShareMessage(""), 3000);
        }
        break;
      
      default:
        break;
    }
  };

  // Format blog content with paragraphs
  const formatBlogContent = (text) => {
    if (!text) return "";
    
    // Split by double line breaks to create paragraphs
    const paragraphs = text.split(/\n\s*\n/);
    
    return paragraphs.map((paragraph, index) => (
      <p key={index} className="mb-6 text-gray-700 leading-relaxed text-lg">
        {paragraph.trim()}
      </p>
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading article...</p>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-red-500 mb-4">
              <BookOpen size={48} className="mx-auto" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Article Not Found
            </h2>
            <p className="text-gray-600 mb-6">{errorMessage}</p>
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors cursor-pointer"
            >
              <ArrowLeft size={16} />
              Back to Blog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!blog) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              to="/blogs"
              className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 transition-colors cursor-pointer"
            >
              <ArrowLeft size={18} />
              <span className="font-medium">Back to Blog</span>
            </Link>
            
            <div className="flex items-center gap-4">
              {/* Share Button */}
              <div className="relative">
                <button
                  onClick={() => handleShare('native')}
                  className="inline-flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors cursor-pointer"
                >
                  <Share2 size={18} />
                  <span className="hidden sm:block">Share</span>
                </button>
              </div>
              
              {/* Like Button */}
              <button
                onClick={handleLike}
                className={`inline-flex items-center gap-2 transition-colors cursor-pointer ${
                  isLiked ? 'text-red-500' : 'text-gray-600 hover:text-red-500'
                }`}
              >
                <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
                <span className="hidden sm:block">Like</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Category Badge */}
          <div className="mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
              <Tag size={14} />
              {blog.category}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            {blog.title}
          </h1>

          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-6 text-gray-600 mb-8">
            <div className="flex items-center gap-2">
              <User size={18} />
              <span className="font-medium">Admin</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={18} />
              <span>{formatDate(blog.createdAt || blog.updatedAt)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={18} />
              <span>{calculateReadingTime(blog.text)} min read</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye size={18} />
              <span>256 views</span>
            </div>
          </div>

          {/* Feature Image */}
          {blog.featureImage && (
            <div className="mb-12">
              <div className="w-full h-64 md:h-96 lg:h-[500px] rounded-2xl overflow-hidden shadow-xl">
                <img
                  src={blog.featureImage}
                  alt={blog.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.parentElement.style.display = 'none';
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
          {/* Blog Content */}
          <div className="prose prose-lg max-w-none">
            {formatBlogContent(blog.text)}
          </div>

          {/* Social Share Section */}
          <div className="border-t border-gray-200 pt-8 mt-12">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <span className="text-gray-700 font-medium">Share this article:</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleShare('facebook')}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors cursor-pointer"
                    title="Share on Facebook"
                  >
                    <Facebook size={20} />
                  </button>
                  <button
                    onClick={() => handleShare('twitter')}
                    className="p-2 text-blue-400 hover:bg-blue-50 rounded-full transition-colors cursor-pointer"
                    title="Share on Twitter"
                  >
                    <Twitter size={20} />
                  </button>
                  <button
                    onClick={() => handleShare('linkedin')}
                    className="p-2 text-blue-700 hover:bg-blue-50 rounded-full transition-colors cursor-pointer"
                    title="Share on LinkedIn"
                  >
                    <Linkedin size={20} />
                  </button>
                  <button
                    onClick={() => handleShare('copy')}
                    className="p-2 text-gray-600 hover:bg-gray-50 rounded-full transition-colors cursor-pointer"
                    title="Copy Link"
                  >
                    <Copy size={20} />
                  </button>
                </div>
              </div>
              
              <button
                onClick={handleLike}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors cursor-pointer ${
                  isLiked 
                    ? 'bg-red-50 text-red-600 border border-red-200' 
                    : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-red-50 hover:text-red-600'
                }`}
              >
                <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
                <span>{isLiked ? 'Liked' : 'Like this article'}</span>
              </button>
            </div>
            
            {/* Share Success Message */}
            {shareMessage && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
                <CheckCircle size={16} />
                <span>{shareMessage}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Related Articles */}
      {relatedBlogs.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Related Articles
            </h2>
            <p className="text-gray-600 text-lg">
              Discover more content you might enjoy
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {relatedBlogs.map((relatedBlog) => (
              <Link
                key={relatedBlog._id}
                to={`/blog/${relatedBlog._id}`}
                className="group cursor-pointer"
              >
                <article className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden">
                  {/* Related Blog Image */}
                  {relatedBlog.featureImage && (
                    <div className="w-full h-48 overflow-hidden">
                      <img
                        src={relatedBlog.featureImage}
                        alt={relatedBlog.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    </div>
                  )}
                  
                  <div className="p-6">
                    {/* Category */}
                    <div className="mb-3">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        <Tag size={10} />
                        {relatedBlog.category}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-orange-600 transition-colors line-clamp-2">
                      {relatedBlog.title}
                    </h3>

                    {/* Excerpt */}
                    <p className="text-gray-600 mb-4 text-sm line-clamp-3">
                      {truncateText(relatedBlog.text, 120)}
                    </p>

                    {/* Meta */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-2">
                        <Calendar size={12} />
                        <span>{formatDate(relatedBlog.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-orange-500 group-hover:translate-x-1 transition-transform">
                        <span>Read more</span>
                        <ChevronRight size={14} />
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>

          {/* View All Button */}
          <div className="text-center mt-12">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 bg-orange-500 text-white px-8 py-4 rounded-lg hover:bg-orange-600 transition-colors cursor-pointer text-lg font-medium"
            >
              <BookOpen size={20} />
              View All Articles
              <ChevronRight size={20} />
            </Link>
          </div>
        </div>
      )}

      {/* Newsletter Section */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl font-bold text-white mb-4">
            Stay Updated with Our Latest Articles
          </h3>
          <p className="text-orange-100 text-lg mb-8">
            Get the best content delivered straight to your inbox
          </p>
          <div className="max-w-md mx-auto flex gap-4">
            <input
              type="email"
              placeholder="Enter your email address"
              className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
            <button className="bg-white text-orange-600 font-medium px-6 py-3 rounded-lg hover:bg-orange-50 transition-colors cursor-pointer">
              Subscribe
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogPost;