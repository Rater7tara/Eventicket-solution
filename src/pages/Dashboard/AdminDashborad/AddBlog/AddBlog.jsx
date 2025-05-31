import React, { useState, useEffect, useContext } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Image,
  FileText,
  Tag,
  Eye,
  Calendar,
  User,
  Search,
  Filter,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { AuthContext } from "../../../../providers/AuthProvider";
import serverURL from "../../../../ServerConfig";
import axios from "axios";

const AddBlogs = () => {
  const { user } = useContext(AuthContext);
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    title: "",
    text: "",
    featureImage: "",
    metaTitle: "",
    metaDescription: "",
    category: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter and search states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categories] = useState([
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
  ]);

  // Get auth token and headers
  const getAuthToken = () => localStorage.getItem("auth-token");

  const getAuthHeaders = () => {
    const token = getAuthToken();
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };
  };

  // Fetch all blogs
  const fetchBlogs = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await axios.get(
        `${serverURL.url}blogs/blogs`,
        getAuthHeaders()
      );

      if (response.data && response.data.success) {
        setBlogs(response.data.blogs || []);
      } else {
        setBlogs([]);
      }
    } catch (error) {
      console.error("Error fetching blogs:", error);
      setErrorMessage(
        error.response?.data?.message || "Failed to load blogs."
      );
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  };

  // Load blogs on component mount
  useEffect(() => {
    fetchBlogs();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: "",
      text: "",
      featureImage: "",
      metaTitle: "",
      metaDescription: "",
      category: "",
    });
  };

  // Open create modal
  const openCreateModal = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  // Close create modal
  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    resetForm();
  };

  // Handle create blog
  const handleCreateBlog = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.title || !formData.text || !formData.category) {
      setErrorMessage("Please fill in all required fields.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");
      setSuccessMessage("");

      const response = await axios.post(
        `${serverURL.url}blogs/create-blog`,
        {
          title: formData.title,
          text: formData.text,
          featureImage: formData.featureImage,
          metaTitle: formData.metaTitle,
          metaDescription: formData.metaDescription,
          category: formData.category,
        },
        getAuthHeaders()
      );

      if (response.data.success) {
        setSuccessMessage("Blog created successfully!");
        closeCreateModal();
        fetchBlogs(); // Refresh blogs list
      } else {
        setErrorMessage(response.data.message || "Failed to create blog.");
      }
    } catch (error) {
      console.error("Error creating blog:", error);
      setErrorMessage(
        error.response?.data?.message || "Failed to create blog."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open edit modal
  const openEditModal = (blog) => {
    setEditingBlog(blog);
    setFormData({
      title: blog.title || "",
      text: blog.text || "",
      featureImage: blog.featureImage || "",
      metaTitle: blog.metaTitle || "",
      metaDescription: blog.metaDescription || "",
      category: blog.category || "",
    });
    setIsEditModalOpen(true);
    setErrorMessage("");
    setSuccessMessage("");
  };

  // Close edit modal
  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingBlog(null);
    resetForm();
  };

  // Handle update blog
  const handleUpdateBlog = async (e) => {
    e.preventDefault();

    if (!editingBlog) return;

    // Validation
    if (!formData.title || !formData.text || !formData.category) {
      setErrorMessage("Please fill in all required fields.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");
      setSuccessMessage("");

      const response = await axios.put(
        `${serverURL.url}blogs/update/${editingBlog._id}`,
        {
          title: formData.title,
          text: formData.text,
          featureImage: formData.featureImage,
          metaTitle: formData.metaTitle,
          metaDescription: formData.metaDescription,
          category: formData.category,
        },
        getAuthHeaders()
      );

      if (response.data.success) {
        setSuccessMessage("Blog updated successfully!");
        closeEditModal();
        fetchBlogs(); // Refresh blogs list
      } else {
        setErrorMessage(response.data.message || "Failed to update blog.");
      }
    } catch (error) {
      console.error("Error updating blog:", error);
      setErrorMessage(
        error.response?.data?.message || "Failed to update blog."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete blog
  const handleDeleteBlog = async (blogId) => {
    try {
      setErrorMessage("");
      setSuccessMessage("");

      const response = await axios.delete(
        `${serverURL.url}blogs/delete/${blogId}`,
        getAuthHeaders()
      );

      if (response.data.success) {
        setSuccessMessage("Blog deleted successfully!");
        setBlogs(blogs.filter((blog) => blog._id !== blogId));
      } else {
        setErrorMessage(response.data.message || "Failed to delete blog.");
      }
    } catch (error) {
      console.error("Error deleting blog:", error);
      setErrorMessage(
        error.response?.data?.message || "Failed to delete blog."
      );
    }
    setDeleteConfirmation(null);
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Truncate text
  const truncateText = (text, maxLength = 100) => {
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Blog Management</h2>
          <p className="text-gray-600 mt-1">
            Create and manage blog posts for your platform
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-lg shadow hover:shadow-lg transition-all duration-200 cursor-pointer"
        >
          <Plus size={18} />
          Create Blog Post
        </button>
      </div>

      {/* Status Messages */}
      {successMessage && (
        <div className="bg-green-100 border border-green-500 text-green-700 px-4 py-3 rounded mb-4 flex items-center">
          <CheckCircle className="h-5 w-5 mr-3" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-100 border border-red-500 text-red-700 px-4 py-3 rounded mb-4 flex items-center">
          <AlertCircle className="h-5 w-5 mr-3" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search blogs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
          <div className="md:w-64">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
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
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <FileText className="h-12 w-12 text-orange-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Blogs</p>
              <p className="text-2xl font-bold text-gray-900">{blogs.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Tag className="h-12 w-12 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Categories</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(blogs.map((blog) => blog.category)).size}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Eye className="h-12 w-12 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Published</p>
              <p className="text-2xl font-bold text-gray-900">{blogs.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* No blogs message */}
      {!loading && filteredBlogs.length === 0 && (
        <div className="bg-gray-50 rounded-xl p-8 text-center">
          <FileText size={48} className="mx-auto text-orange-500 mb-3" />
          <h3 className="text-xl font-medium text-gray-700 mb-2">
            {searchTerm || selectedCategory ? "No Blogs Found" : "No Blogs Yet"}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || selectedCategory
              ? "Try adjusting your search or filter criteria."
              : "You haven't created any blog posts yet."}
          </p>
          {!searchTerm && !selectedCategory && (
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-lg shadow hover:shadow-lg transition-all duration-200"
            >
              <Plus size={18} />
              Create Your First Blog Post
            </button>
          )}
        </div>
      )}

      {/* Blogs Grid */}
      {filteredBlogs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBlogs.map((blog) => (
            <div
              key={blog._id}
              className="bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-200"
            >
              {/* Blog Image */}
              {blog.featureImage && (
                <div className="w-full h-48 overflow-hidden rounded-t-xl">
                  <img
                    src={blog.featureImage}
                    alt={blog.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                </div>
              )}

              <div className="p-6">
                {/* Category Badge */}
                <div className="mb-3">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    <Tag size={12} />
                    {blog.category}
                  </span>
                </div>

                {/* Blog Title */}
                <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2">
                  {blog.title}
                </h3>

                {/* Blog Excerpt */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {truncateText(blog.text, 120)}
                </p>

                {/* Meta Info */}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    <span>{formatDate(blog.createdAt || blog.updatedAt)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User size={12} />
                    <span>Admin</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(blog)}
                      className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition-colors duration-200 cursor-pointer"
                      title="Edit Blog"
                    >
                      <Edit size={16} />
                    </button>

                    <button
                      onClick={() => setDeleteConfirmation(blog._id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors duration-200 cursor-pointer"
                      title="Delete Blog"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800">
                    Published
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Blog Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800">
                Create New Blog Post
              </h3>
              <button
                onClick={closeCreateModal}
                className="p-1 rounded-full hover:bg-gray-100 cursor-pointer"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleCreateBlog} className="p-6 space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-gray-700 font-medium">
                  <FileText size={18} className="text-orange-500" />
                  Blog Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter blog title"
                  required
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-gray-700 font-medium">
                  <Tag size={18} className="text-orange-500" />
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Feature Image */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-gray-700 font-medium">
                  <Image size={18} className="text-orange-500" />
                  Feature Image URL
                </label>
                <input
                  type="url"
                  name="featureImage"
                  value={formData.featureImage}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              {/* Blog Content */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-gray-700 font-medium">
                  <FileText size={18} className="text-orange-500" />
                  Blog Content *
                </label>
                <textarea
                  name="text"
                  value={formData.text}
                  onChange={handleInputChange}
                  rows="8"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Write your blog content here..."
                  required
                />
              </div>

              {/* SEO Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-gray-700 font-medium">
                    <FileText size={18} className="text-orange-500" />
                    Meta Title
                  </label>
                  <input
                    type="text"
                    name="metaTitle"
                    value={formData.metaTitle}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="SEO meta title"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-gray-700 font-medium">
                    <FileText size={18} className="text-orange-500" />
                    Meta Description
                  </label>
                  <textarea
                    name="metaDescription"
                    value={formData.metaDescription}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="SEO meta description"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-6 py-2.5 rounded-lg text-white font-medium flex items-center cursor-pointer ${
                    isSubmitting
                      ? "bg-gray-400"
                      : "bg-gradient-to-r from-orange-500 to-orange-600 hover:shadow-lg"
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save size={18} className="mr-2" />
                      Create Blog Post
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Blog Modal */}
      {isEditModalOpen && editingBlog && (
        <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800">Edit Blog Post</h3>
              <button
                onClick={closeEditModal}
                className="p-1 rounded-full hover:bg-gray-100 cursor-pointer"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleUpdateBlog} className="p-6 space-y-6">
              {/* Same form fields as create modal */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-gray-700 font-medium">
                  <FileText size={18} className="text-orange-500" />
                  Blog Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter blog title"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-gray-700 font-medium">
                  <Tag size={18} className="text-orange-500" />
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-gray-700 font-medium">
                  <Image size={18} className="text-orange-500" />
                  Feature Image URL
                </label>
                <input
                  type="url"
                  name="featureImage"
                  value={formData.featureImage}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-gray-700 font-medium">
                  <FileText size={18} className="text-orange-500" />
                  Blog Content *
                </label>
                <textarea
                  name="text"
                  value={formData.text}
                  onChange={handleInputChange}
                  rows="8"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Write your blog content here..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-gray-700 font-medium">
                    <FileText size={18} className="text-orange-500" />
                    Meta Title
                  </label>
                  <input
                    type="text"
                    name="metaTitle"
                    value={formData.metaTitle}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="SEO meta title"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-gray-700 font-medium">
                    <FileText size={18} className="text-orange-500" />
                    Meta Description
                  </label>
                  <textarea
                    name="metaDescription"
                    value={formData.metaDescription}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="SEO meta description"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-6 py-2.5 rounded-lg text-white font-medium flex items-center cursor-pointer ${
                    isSubmitting
                      ? "bg-gray-400"
                      : "bg-gradient-to-r from-orange-500 to-orange-600 hover:shadow-lg"
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save size={18} className="mr-2" />
                      Update Blog Post
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Confirm Delete
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this blog post? This action cannot be
              undone.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setDeleteConfirmation(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteBlog(deleteConfirmation)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddBlogs;