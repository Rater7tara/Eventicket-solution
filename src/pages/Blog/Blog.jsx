import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  User,
  Tag,
  Search,
  Filter,
  ArrowRight,
  Eye,
  Share2,
  BookOpen,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
} from "lucide-react";
import { Link } from "react-router-dom";
import serverURL from "../../ServerConfig";
import axios from "axios";

const Blog = () => {
  const [blogs, setBlogs] = useState([]);
  const [featuredBlog, setFeaturedBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Filter and search states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [blogsPerPage] = useState(6);

  const categories = [
    "Technology",
    "Events",
    "Entertainment",
    "Music",
    "Sports",
    "Food & Drink",
    "Business",
    "Lifestyle",
    "Travel",
    "Arts & Culture",
  ];

  // Fetch all blogs
  const fetchBlogs = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await axios.get(`${serverURL.url}blogs/blogs`);

      if (response.data && response.data.success) {
        const fetchedBlogs = response.data.blogs || [];
        setBlogs(fetchedBlogs);
        
        // Set the most recent blog as featured
        if (fetchedBlogs.length > 0) {
          const sortedBlogs = [...fetchedBlogs].sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );
          setFeaturedBlog(sortedBlogs[0]);
        }
      } else {
        setBlogs([]);
      }
    } catch (error) {
      console.error("Error fetching blogs:", error);
      setErrorMessage("Failed to load blogs.");
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  };

  // Load blogs on component mount and scroll to top
  useEffect(() => {
    // Smooth scroll to top when component mounts
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
    
    fetchBlogs();
  }, []);

  // Handle scroll to show/hide scroll to top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.pageYOffset > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  };

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

  // Truncate text
  const truncateText = (text, maxLength = 150) => {
    if (!text) return "";
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
  };

  // Filter blogs based on search and category
  const filteredBlogs = blogs.filter((blog) => {
    const matchesSearch = blog.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory
      ? blog.category === selectedCategory
      : true;
    return matchesSearch && matchesCategory;
  });

  // Pagination
  const indexOfLastBlog = currentPage * blogsPerPage;
  const indexOfFirstBlog = indexOfLastBlog - blogsPerPage;
  const currentBlogs = filteredBlogs.slice(indexOfFirstBlog, indexOfLastBlog);
  const totalPages = Math.ceil(filteredBlogs.length / blogsPerPage);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    // Smooth scroll to top of content when changing pages
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  };

  // Get popular categories
  const getPopularCategories = () => {
    const categoryCount = {};
    blogs.forEach((blog) => {
      categoryCount[blog.category] = (categoryCount[blog.category] || 0) + 1;
    });
    return Object.entries(categoryCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading articles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section - UPDATED */}
      <div className="bg-gradient-to-br from-orange-600 via-orange-500 to-red-500 text-white py-20 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Discover Amazing 
              <span className="block text-orange-200">Stories & Insights</span>
            </h1>
            <p className="text-lg md:text-xl text-orange-100 mb-10 max-w-2xl mx-auto leading-relaxed">
              Explore our collection of articles, tips, and updates from our community of experts and enthusiasts
            </p>
            
            {/* IMPROVED Search Bar */}
            <div className="max-w-xl mx-auto">
              <div className="relative group">
                <div className="absolute inset-0 bg-white rounded-2xl shadow-2xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                <div className="relative bg-white rounded-2xl shadow-xl border border-white/20 overflow-hidden">
                  <div className="flex items-center">
                    <div className="pl-6 pr-4 py-1">
                      <Search size={22} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search for articles, topics, or keywords..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1 py-4 pr-6 text-gray-900 placeholder-gray-500 bg-transparent border-none outline-none focus:ring-0 text-base"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm("")}
                        className="px-4 py-2 mr-2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Search Results Count */}
              {searchTerm && (
                <div className="mt-4 text-orange-100 text-sm">
                  {filteredBlogs.length} article{filteredBlogs.length !== 1 ? 's' : ''} found
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Featured Blog */}
        {featuredBlog && !searchTerm && !selectedCategory && (
          <div className="mb-16">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Featured Article
              </h2>
              <div className="w-20 h-1 bg-orange-500 mx-auto rounded-full"></div>
            </div>
            
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden hover:shadow-3xl transition-all duration-300">
              <div className="md:flex">
                {featuredBlog.featureImage && (
                  <div className="md:w-1/2 relative overflow-hidden">
                    <img
                      src={featuredBlog.featureImage}
                      alt={featuredBlog.title}
                      className="w-full h-64 md:h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  </div>
                )}
                <div className={`${featuredBlog.featureImage ? 'md:w-1/2' : 'w-full'} p-8 md:p-12 flex flex-col justify-center`}>
                  <div className="flex items-center gap-3 mb-6">
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-orange-100 text-orange-800 border border-orange-200">
                      <Tag size={14} />
                      {featuredBlog.category}
                    </span>
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                      <TrendingUp size={14} />
                      Featured
                    </span>
                  </div>
                  
                  <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-6 leading-tight">
                    {featuredBlog.title}
                  </h3>
                  
                  <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                    {truncateText(featuredBlog.text, 200)}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} />
                        <span>{formatDate(featuredBlog.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={16} />
                        <span>{calculateReadingTime(featuredBlog.text)} min read</span>
                      </div>
                    </div>
                    
                    <Link
                      to={`/blog/${featuredBlog._id}`}
                      className="inline-flex items-center gap-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-4 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-lg hover:shadow-xl cursor-pointer font-semibold"
                    >
                      Read Full Article
                      <ArrowRight size={18} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Main Content */}
          <div className="lg:w-2/3">
            {/* IMPROVED Filters Section */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-10">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Filter size={20} className="text-orange-500" />
                Filter & Search Articles
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Search Articles
                  </label>
                  <div className="relative">
                    <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by title or content..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm("")}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Filter by Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all appearance-none bg-white cursor-pointer"
                  >
                    <option value="">All Categories</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Active Filters */}
              {(searchTerm || selectedCategory) && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center gap-4 flex-wrap">
                    <span className="text-sm font-medium text-gray-700">Active filters:</span>
                    {searchTerm && (
                      <span className="inline-flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                        Search: "{searchTerm}"
                        <button
                          onClick={() => setSearchTerm("")}
                          className="hover:text-orange-900 transition-colors"
                        >
                          ✕
                        </button>
                      </span>
                    )}
                    {selectedCategory && (
                      <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        Category: {selectedCategory}
                        <button
                          onClick={() => setSelectedCategory("")}
                          className="hover:text-blue-900 transition-colors"
                        >
                          ✕
                        </button>
                      </span>
                    )}
                    <button
                      onClick={() => {
                        setSearchTerm("");
                        setSelectedCategory("");
                      }}
                      className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      Clear all
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-8 flex items-center gap-3">
                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                {errorMessage}
              </div>
            )}

            {/* Results Count */}
            {(searchTerm || selectedCategory) && (
              <div className="mb-8">
                <p className="text-gray-600">
                  Showing <span className="font-semibold text-gray-900">{filteredBlogs.length}</span> article{filteredBlogs.length !== 1 ? 's' : ''}
                  {searchTerm && <span> for "<span className="font-semibold">{searchTerm}</span>"</span>}
                  {selectedCategory && <span> in <span className="font-semibold">{selectedCategory}</span></span>}
                </p>
              </div>
            )}

            {/* No blogs message */}
            {filteredBlogs.length === 0 && !loading && (
              <div className="bg-white rounded-2xl p-16 text-center shadow-lg border border-gray-100">
                <BookOpen size={64} className="mx-auto text-gray-300 mb-6" />
                <h3 className="text-2xl font-bold text-gray-700 mb-4">
                  {searchTerm || selectedCategory ? "No Articles Found" : "No Articles Yet"}
                </h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
                  {searchTerm || selectedCategory
                    ? "We couldn't find any articles matching your criteria. Try adjusting your search terms or browse all articles."
                    : "Our blog is coming soon! Check back later for interesting articles and insights."}
                </p>
                {(searchTerm || selectedCategory) && (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedCategory("");
                    }}
                    className="inline-flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-xl hover:bg-orange-600 transition-colors cursor-pointer font-semibold"
                  >
                    <ArrowRight size={16} />
                    View All Articles
                  </button>
                )}
              </div>
            )}

            {/* Blog Grid */}
            {currentBlogs.length > 0 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                  {currentBlogs.map((blog) => (
                    <article
                      key={blog._id}
                      className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group cursor-pointer border border-gray-100 hover:border-orange-200"
                    >
                      <Link to={`/blog/${blog._id}`}>
                        {blog.featureImage && (
                          <div className="w-full h-52 overflow-hidden relative">
                            <img
                              src={blog.featureImage}
                              alt={blog.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              onError={(e) => {
                                e.target.style.display = "none";
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          </div>
                        )}
                        
                        <div className="p-6">
                          {/* Category Badge */}
                          <div className="mb-4">
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-200">
                              <Tag size={12} />
                              {blog.category}
                            </span>
                          </div>

                          {/* Title */}
                          <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-orange-600 transition-colors leading-tight line-clamp-2">
                            {blog.title}
                          </h3>

                          {/* Excerpt */}
                          <p className="text-gray-600 mb-6 line-clamp-3 leading-relaxed">
                            {truncateText(blog.text)}
                          </p>

                          {/* Meta Info */}
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1">
                                <Calendar size={14} />
                                <span>{formatDate(blog.createdAt || blog.updatedAt)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock size={14} />
                                <span>{calculateReadingTime(blog.text)} min read</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-orange-500">
                              <span className="text-sm font-medium">Read more</span>
                              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </div>
                          </div>
                        </div>
                      </Link>
                    </article>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-12">
                    <button
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`p-3 rounded-xl transition-all ${
                        currentPage === 1
                          ? "text-gray-400 cursor-not-allowed bg-gray-100"
                          : "text-gray-600 hover:bg-gray-100 cursor-pointer bg-white shadow-md hover:shadow-lg"
                      }`}
                    >
                      <ChevronLeft size={20} />
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (number) => (
                        <button
                          key={number}
                          onClick={() => paginate(number)}
                          className={`px-4 py-3 rounded-xl cursor-pointer transition-all font-semibold ${
                            currentPage === number
                              ? "bg-orange-500 text-white shadow-lg"
                              : "text-gray-600 hover:bg-gray-100 bg-white shadow-md hover:shadow-lg"
                          }`}
                        >
                          {number}
                        </button>
                      )
                    )}

                    <button
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`p-3 rounded-xl transition-all ${
                        currentPage === totalPages
                          ? "text-gray-400 cursor-not-allowed bg-gray-100"
                          : "text-gray-600 hover:bg-gray-100 cursor-pointer bg-white shadow-md hover:shadow-lg"
                      }`}
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:w-1/3">
            <div className="space-y-8">
              {/* Popular Categories */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <TrendingUp size={22} className="text-orange-500" />
                  Popular Categories
                </h3>
                <div className="space-y-3">
                  {getPopularCategories().map(([category, count]) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`w-full text-left px-4 py-4 rounded-xl transition-all cursor-pointer border ${
                        selectedCategory === category
                          ? "bg-orange-50 text-orange-800 border-orange-200 shadow-md"
                          : "hover:bg-gray-50 text-gray-700 border-transparent hover:border-gray-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{category}</span>
                        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-medium">
                          {count}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recent Posts */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Clock size={22} className="text-orange-500" />
                  Recent Posts
                </h3>
                <div className="space-y-6">
                  {blogs.slice(0, 5).map((blog) => (
                    <Link
                      key={blog._id}
                      to={`/blog/${blog._id}`}
                      className="block group cursor-pointer"
                    >
                      <div className="flex gap-4">
                        {blog.featureImage && (
                          <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
                            <img
                              src={blog.featureImage}
                              alt={blog.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-2 text-sm leading-tight mb-2">
                            {blog.title}
                          </h4>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Calendar size={12} />
                            {formatDate(blog.createdAt)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Newsletter Signup */}
              <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-red-500 rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                  }}></div>
                </div>
                
                <div className="relative z-10">
                  <h3 className="text-xl font-bold mb-3">Stay in the Loop!</h3>
                  <p className="text-orange-100 mb-6 text-sm leading-relaxed">
                    Get the latest articles, insights, and updates delivered straight to your inbox. Join our community today!
                  </p>
                  <div className="space-y-4">
                    <input
                      type="email"
                      placeholder="Enter your email address"
                      className="w-full px-4 py-3 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white/95 backdrop-blur-sm"
                    />
                    <button className="w-full bg-white text-orange-600 font-bold py-3 px-4 rounded-xl hover:bg-orange-50 transition-colors cursor-pointer shadow-lg hover:shadow-xl">
                      Subscribe Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 bg-orange-500 hover:bg-orange-600 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 z-50 group cursor-pointer"
          aria-label="Scroll to top"
        >
          <ChevronUp size={24} className="group-hover:-translate-y-1 transition-transform duration-200" />
        </button>
      )}
    </div>
  );
};

export default Blog;