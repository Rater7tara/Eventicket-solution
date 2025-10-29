import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import {
  Upload,
  Trash2,
  Search,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  Plus,
  X,
  Image as ImageIcon,
  Download,
  CheckCircle,
  Info,
  Calendar,
  FileImage
} from "lucide-react";
import { AuthContext } from "../../../../providers/AuthProvider";
import { toast } from "react-toastify";
import serverURL from "../../../../ServerConfig";

// Upload Banner Modal Component
const UploadBannerModal = ({ 
  isOpen, 
  onClose, 
  onUpload, 
  isUploading 
}) => {
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [selectedSize, setSelectedSize] = useState("1200x600");

  const sizeOptions = [
    { value: "1200x600", label: "1200×600 (Recommended)" },
    { value: "1920x1080", label: "1920×1080 (Full HD)" },
    { value: "1366x768", label: "1366×768 (Standard)" },
    { value: "800x400", label: "800×400 (Compact)" }
  ];

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;

    // Validate file types
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const invalidFiles = files.filter(file => !validTypes.includes(file.type));
    
    if (invalidFiles.length > 0) {
      toast.error('Please select valid image files (JPEG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file sizes (max 5MB each)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    const oversizedFiles = files.filter(file => file.size > maxSize);
    
    if (oversizedFiles.length > 0) {
      toast.error('Each image should be less than 5MB');
      return;
    }

    setSelectedImages(files);
    
    // Create preview URLs
    const previews = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve({
          file,
          url: e.target.result,
          name: file.name,
          size: file.size
        });
        reader.readAsDataURL(file);
      });
    });

    Promise.all(previews).then(setImagePreviews);
  };

  const removeImage = (index) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setSelectedImages(newImages);
    setImagePreviews(newPreviews);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedImages.length === 0) {
      toast.error('Please select at least one image');
      return;
    }

    console.log('📤 Preparing FormData...');
    console.log('🖼️ Selected images:', selectedImages.length);
    console.log('📏 Selected size:', selectedSize);

    const formData = new FormData();
    
    // FIXED: Use "images" field name to match your upload API
    selectedImages.forEach((image, index) => {
      console.log(`📎 Appending image ${index + 1}:`, image.name, '- Size:', image.size, 'bytes');
      formData.append('images', image);
    });
    
    formData.append('size', selectedSize);
    
    console.log('📝 Using field name "images" for upload...');
    await onUpload(formData);
  };

  const resetModal = () => {
    setSelectedImages([]);
    setImagePreviews([]);
    setSelectedSize("1200x600");
    const fileInput = document.getElementById('banner-upload-input');
    if (fileInput) fileInput.value = '';
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300 ease-in-out p-4">
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-out border border-orange-500 border-opacity-30">
        {/* Header */}
        <div className="p-6 border-b border-gray-700 bg-gradient-to-r from-orange-800 to-orange-600">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Upload className="text-orange-200" size={28} />
                Upload Banner Images
              </h2>
              <p className="text-orange-200 mt-1">Add new banner images to your slider collection</p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors text-orange-200"
              disabled={isUploading}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Size Selection */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
              <Info size={16} className="text-orange-500" />
              Banner Dimensions
            </label>
            <select
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
              className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors bg-gray-700 text-white"
              disabled={isUploading}
            >
              {sizeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* File Upload */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
              <FileImage size={16} className="text-green-500" />
              Select Images
            </label>
            <div className="relative">
              <input
                type="file"
                id="banner-upload-input"
                multiple
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handleImageChange}
                className="w-full px-4 py-3 border-2 border-dashed border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-orange-500 file:text-white hover:file:bg-orange-600 bg-gray-700 text-gray-300"
                disabled={isUploading}
              />
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
              <CheckCircle size={14} className="text-green-500" />
              <span>Supported: JPEG, PNG, GIF, WebP • Max size: 5MB each • Multiple selection enabled</span>
            </div>
          </div>

          {/* Image Previews */}
          {imagePreviews.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                <Eye size={16} className="text-purple-500" />
                Preview ({imagePreviews.length} image{imagePreviews.length > 1 ? 's' : ''} selected)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <div className="relative overflow-hidden rounded-lg border-2 border-gray-600 hover:border-orange-500 transition-colors">
                      <img
                        src={preview.url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1.5 hover:bg-red-700 transition-colors duration-200 shadow-lg opacity-0 group-hover:opacity-100"
                        title="Remove image"
                        disabled={isUploading}
                      >
                        <X size={14} />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                        <div className="text-white text-xs font-medium truncate">{preview.name}</div>
                        <div className="text-white/80 text-xs">{formatFileSize(preview.size)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No images selected state */}
          {imagePreviews.length === 0 && (
            <div className="mb-6 w-full h-48 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center bg-gray-700 hover:bg-gray-650 transition-colors">
              <div className="text-center">
                <ImageIcon className="mx-auto text-gray-400 mb-3" size={48} />
                <p className="text-gray-300 font-medium">No images selected</p>
                <p className="text-gray-400 text-sm">Choose images to preview them here</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-700">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 transition-colors duration-200 font-medium"
              disabled={isUploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white rounded-lg transition-all duration-200 shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={isUploading || selectedImages.length === 0}
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Upload {selectedImages.length} Banner{selectedImages.length > 1 ? 's' : ''}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit Banner Modal Component
const EditBannerModal = ({ 
  banner, 
  isOpen, 
  onClose, 
  onUpdate, 
  isUpdating 
}) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(banner?.imageUrl || null);
  const [selectedSize, setSelectedSize] = useState(banner?.size || "1200x600");
  const [hasChanges, setHasChanges] = useState(false);

  const sizeOptions = [
    { value: "1200x600", label: "1200×600 (Recommended)" },
    { value: "1920x1080", label: "1920×1080 (Full HD)" },
    { value: "1366x768", label: "1366×768 (Standard)" },
    { value: "800x400", label: "800×400 (Compact)" }
  ];

  useEffect(() => {
    if (banner) {
      setImagePreview(banner.imageUrl);
      setSelectedSize(banner.size || "1200x600");
      setHasChanges(false);
    }
  }, [banner]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        toast.error('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
        return;
      }

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      setSelectedImage(file);
      setHasChanges(true);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('📝 Updating banner...');
    console.log('🖼️ New image selected:', !!selectedImage);
    console.log('📏 Selected size:', selectedSize);
    
    if (!selectedImage) {
      console.log('📎 No new image - sending JSON data for size update only');
      const jsonData = {
        size: selectedSize
      };
      await onUpdate(banner._id, jsonData, false);
    } else {
      console.log('📎 Appending new image:', selectedImage.name, '- Size:', selectedImage.size, 'bytes');
      const formData = new FormData();
      
      // FIXED: Use "image" field name to match your update API
      formData.append('image', selectedImage);
      formData.append('size', selectedSize);
      
      console.log('📝 Using field name "image" for update...');
      await onUpdate(banner._id, formData, true);
    }
  };

  const resetModal = () => {
    setSelectedImage(null);
    setImagePreview(banner?.imageUrl || null);
    setSelectedSize(banner?.size || "1200x600");
    setHasChanges(false);
    const fileInput = document.getElementById('banner-edit-input');
    if (fileInput) fileInput.value = '';
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen || !banner) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300 ease-in-out p-4">
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-out border border-orange-500 border-opacity-30">
        {/* Header */}
        <div className="p-6 border-b border-gray-700 bg-gradient-to-r from-purple-800 to-purple-600">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Edit className="text-purple-200" size={28} />
                Edit Banner
              </h2>
              <p className="text-purple-200 mt-1">Update banner image and settings</p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors text-purple-200"
              disabled={isUpdating}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Current/Preview Image */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
              <Eye size={16} className="text-orange-500" />
              Current Banner
            </label>
            {imagePreview ? (
              <div className="relative overflow-hidden rounded-lg border-2 border-gray-600">
                <img
                  src={imagePreview}
                  alt="Banner preview"
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-3 left-3 bg-black/80 text-white px-3 py-1 rounded-full text-sm font-medium">
                  {selectedSize}
                </div>
                {selectedImage && (
                  <div className="absolute top-3 right-3 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                    <CheckCircle size={14} />
                    New Image
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-48 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center bg-gray-700">
                <div className="text-center">
                  <ImageIcon className="mx-auto text-gray-400 mb-2" size={48} />
                  <p className="text-gray-300">No image available</p>
                </div>
              </div>
            )}
          </div>

          {/* Size Selection */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
              <Info size={16} className="text-orange-500" />
              Banner Dimensions
            </label>
            <select
              value={selectedSize}
              onChange={(e) => {
                setSelectedSize(e.target.value);
                setHasChanges(e.target.value !== (banner?.size || "1200x600") || !!selectedImage);
              }}
              className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors bg-gray-700 text-white"
              disabled={isUpdating}
            >
              {sizeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* File Upload */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
              <FileImage size={16} className="text-green-500" />
              Replace Image (Optional)
            </label>
            <input
              type="file"
              id="banner-edit-input"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={handleImageChange}
              className="w-full px-4 py-3 border-2 border-dashed border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-orange-500 file:text-white hover:file:bg-orange-600 bg-gray-700 text-gray-300"
              disabled={isUpdating}
            />
            <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
              <Info size={14} className="text-orange-500" />
              <span>Leave empty to keep current image. Supported: JPEG, PNG, GIF, WebP • Max size: 5MB</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-700">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 transition-colors duration-200 font-medium"
              disabled={isUpdating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg transition-all duration-200 shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={isUpdating || !hasChanges}
            >
              {isUpdating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Edit size={16} />
                  Update Banner
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// View Banner Modal Component
const ViewBannerModal = ({ banner, isOpen, onClose }) => {
  if (!isOpen || !banner) return null;

  const formatDate = (dateString) => {
    if (!dateString) return "Not available";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300 ease-in-out p-4">
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-out border border-orange-500 border-opacity-30">
        {/* Header */}
        <div className="p-6 border-b border-gray-700 bg-gradient-to-r from-green-800 to-green-600">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Eye className="text-green-200" size={28} />
                Banner Details
              </h2>
              <p className="text-green-200 mt-1">View comprehensive banner information</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors text-green-200"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Banner Image */}
          <div className="mb-6">
            <div className="relative overflow-hidden rounded-lg border-2 border-gray-600">
              <img
                src={banner.imageUrl}
                alt="Banner"
                className="w-full h-64 object-cover"
              />
              <div className="absolute top-3 left-3 bg-black/80 text-white px-3 py-1 rounded-full text-sm font-medium">
                {banner.size}
              </div>
            </div>
          </div>

          {/* Banner Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-700 bg-opacity-80 rounded-lg p-4 border border-gray-600">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Info className="text-orange-500" size={20} />
                Basic Information
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-1">Banner ID</p>
                  <p className="text-gray-200 font-mono text-sm bg-gray-800 p-2 rounded border border-gray-600">{banner._id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-1">Dimensions</p>
                  <p className="text-gray-200 bg-gray-800 p-2 rounded border border-gray-600 flex items-center gap-2">
                    <FileImage size={16} className="text-green-500" />
                    {banner.size}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-700 bg-opacity-80 rounded-lg p-4 border border-gray-600">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Calendar className="text-purple-500" size={20} />
                Timeline
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-1">Created</p>
                  <p className="text-gray-200 bg-gray-800 p-2 rounded border border-gray-600">{formatDate(banner.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-1">Last Updated</p>
                  <p className="text-gray-200 bg-gray-800 p-2 rounded border border-gray-600">{formatDate(banner.updatedAt)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-700 mt-6">
            <a
              href={banner.imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg transition-all duration-200 font-medium shadow-lg"
            >
              <Download size={16} />
              Download Image
            </a>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 transition-colors duration-200 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Delete Confirmation Modal
const DeleteConfirmationModal = ({ banner, isOpen, onClose, onDelete, isDeleting }) => {
  if (!isOpen || !banner) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300 ease-in-out p-4">
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-2xl transform transition-all duration-300 ease-out border border-red-500 border-opacity-50">
        <div className="flex items-center mb-4">
          <div className="p-3 bg-red-900 bg-opacity-50 rounded-full mr-3">
            <AlertCircle className="text-red-400" size={24} />
          </div>
          <h3 className="text-xl font-semibold text-white">
            Confirm Deletion
          </h3>
        </div>
        
        {/* Show banner preview */}
        <div className="mb-4 overflow-hidden rounded-lg border-2 border-red-500 border-opacity-50">
          <img
            src={banner.imageUrl}
            alt="Banner to delete"
            className="w-full h-24 object-cover"
          />
        </div>
        
        <p className="mb-6 text-gray-300">
          Are you sure you want to delete this banner image? This action cannot be undone and will permanently remove the banner from your collection.
        </p>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 transition-colors duration-200 font-medium"
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            onClick={() => onDelete(banner._id)}
            className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg transition-all duration-200 shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                Deleting...
              </>
            ) : (
              <>
                <Trash2 size={16} />
                Delete Banner
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Main ManageBanner Component
const ManageBanner = () => {
  const { user } = useContext(AuthContext);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [bannersPerPage] = useState(12);
  
  // Modal states
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState(null);
  
  // Loading states
  const [isUploading, setIsUploading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Get auth token and headers
  const getAuthToken = () => localStorage.getItem("auth-token");
  const getAuthHeaders = () => ({
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
      "Content-Type": "application/json",
    },
  });

  // Fetch banners
  const fetchBanners = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${serverURL.url}banner/banners`,
        getAuthHeaders()
      );

      if (response.data.success) {
        setBanners(response.data.banners || []);
      } else {
        setError(response.data.message || "Failed to fetch banners");
      }
    } catch (err) {
      console.error("Error fetching banners:", err);
      setError(
        err.response?.data?.message || "Failed to fetch banners. Check your admin privileges."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  // Enhanced Upload banners function
  const handleUploadBanners = async (formData) => {
    try {
      setIsUploading(true);
      
      console.log('🚀 Uploading banners...');
      console.log('📝 FormData contents:');
      for (let pair of formData.entries()) {
        console.log(`${pair[0]}:`, pair[1]);
      }
      
      const response = await axios.post(
        `${serverURL.url}banner/upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
            // Don't set Content-Type for FormData - let browser set it
          },
        }
      );

      console.log('✅ Upload response:', response.data);

      if (response.data.success) {
        toast.success("Banners uploaded successfully!");
        setIsUploadModalOpen(false);
        fetchBanners();
      } else {
        console.error('❌ Upload failed:', response.data);
        toast.error(response.data.message || "Failed to upload banners");
      }
    } catch (err) {
      console.error("❌ Error uploading banners:", err);
      
      let errorMessage = "Failed to upload banners";
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.status === 400) {
        errorMessage = "Invalid request. Check that field name is 'images' and files are valid images.";
      } else if (err.response?.status === 413) {
        errorMessage = "File too large. Please reduce file size and try again.";
      } else if (err.response?.status === 401) {
        errorMessage = "Authentication failed. Please log in again.";
      } else if (err.response?.status === 500) {
        errorMessage = "Server error. Please check that the API expects 'images' field name.";
      }
      
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  // Enhanced Update banner function
  const handleUpdateBanner = async (bannerId, data, isFormData = true) => {
    try {
      setIsUpdating(true);
      
      console.log('🔄 Updating banner...', bannerId);
      console.log('📝 Data type:', isFormData ? 'FormData' : 'JSON');
      
      if (isFormData) {
        console.log('📝 FormData contents:');
        for (let pair of data.entries()) {
          console.log(`${pair[0]}:`, pair[1]);
        }
      } else {
        console.log('📝 JSON data:', data);
      }
      
      const headers = {
        Authorization: `Bearer ${getAuthToken()}`,
      };
      
      if (!isFormData) {
        headers['Content-Type'] = 'application/json';
      }
      
      const response = await axios.put(
        `${serverURL.url}banner/update/${bannerId}`,
        data,
        { headers }
      );

      console.log('✅ Update response:', response.data);

      if (response.data.success) {
        toast.success("Banner updated successfully!");
        setIsEditModalOpen(false);
        setSelectedBanner(null);
        fetchBanners();
      } else {
        console.error('❌ Update failed:', response.data);
        toast.error(response.data.message || "Failed to update banner");
      }
    } catch (err) {
      console.error("❌ Error updating banner:", err);
      
      let errorMessage = "Failed to update banner";
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.status === 400) {
        errorMessage = "Invalid request. Check that field name is 'image' for updates.";
      } else if (err.response?.status === 404) {
        errorMessage = "Banner not found. It may have been deleted.";
      } else if (err.response?.status === 401) {
        errorMessage = "Authentication failed. Please log in again.";
      } else if (err.response?.status === 500) {
        errorMessage = "Server error. Please check that the API expects 'image' field name for updates.";
      }
      
      toast.error(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete banner
  const handleDeleteBanner = async (bannerId) => {
    try {
      setIsDeleting(true);
      
      const response = await axios.delete(
        `${serverURL.url}banner/delete/${bannerId}`,
        getAuthHeaders()
      );

      if (response.data.success) {
        toast.success("Banner deleted successfully!");
        setBanners(banners.filter(banner => banner._id !== bannerId));
        setIsDeleteModalOpen(false);
        setSelectedBanner(null);
      } else {
        toast.error(response.data.message || "Failed to delete banner");
      }
    } catch (err) {
      console.error("Error deleting banner:", err);
      toast.error(err.response?.data?.message || "Failed to delete banner");
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter banners based on search
  const filteredBanners = banners.filter((banner) => {
    return (
      banner.size?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      banner._id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Pagination
  const indexOfLastBanner = currentPage * bannersPerPage;
  const indexOfFirstBanner = indexOfLastBanner - bannersPerPage;
  const currentBanners = filteredBanners.slice(indexOfFirstBanner, indexOfLastBanner);
  const totalPages = Math.ceil(filteredBanners.length / bannersPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
            <span className="ml-3 text-lg text-gray-600">
              Loading banners...
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-red-500 p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="text-white">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  <ImageIcon size={32} />
                  Banner Management
                </h1>
                <p className="mt-2 text-orange-100">
                  Upload, edit, and manage banner images for your slider with ease
                </p>
                <div className="mt-2 text-sm text-orange-200">
                  Total banners: {banners.length}
                </div>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-xl transition-all duration-200 shadow-lg font-medium border border-white/20"
              >
                <Plus size={20} />
                Upload Banner
              </button>
            </div>
          </div>
        </div>

        {/* User role check */}
        {user?.role !== "admin" && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg mb-6">
            <div className="flex items-center">
              <AlertCircle className="mr-3 flex-shrink-0 text-yellow-600" size={20} />
              <p className="font-medium">
                You need admin privileges to manage banners. Current role:{" "}
                <span className="font-bold">{user?.role || "unknown"}</span>
              </p>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 gap-4">
            {/* Search */}
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="Search banners by ID or size..."
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-white text-gray-900 shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search
                className="absolute left-4 top-3.5 text-gray-400"
                size={20}
              />
            </div>

            {/* Stats and Refresh */}
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg shadow-sm border border-gray-200">
                Showing {filteredBanners.length} of {banners.length}
              </div>
              <button
                className="flex items-center justify-center p-3 rounded-xl hover:bg-gray-50 transition-colors shadow-sm border border-gray-200 bg-white"
                onClick={fetchBanners}
                disabled={loading}
                title="Refresh banners"
              >
                <RefreshCw
                  className={`text-gray-600 ${loading ? "animate-spin" : ""}`}
                  size={20}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-red-600" />
              {error}
            </div>
          </div>
        )}

        {/* Banner Grid */}
        <div className="space-y-6">
          {currentBanners.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-400 mb-4">
                  <ImageIcon size={32} />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-800">
                  {searchTerm ? "No banners match your search" : "No banners found"}
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm ? "Try adjusting your search criteria" : "Get started by uploading your first banner image"}
                </p>
                {!searchTerm && (
                  <button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl transition-all duration-200 shadow-lg"
                  >
                    <Plus size={20} />
                    Upload Your First Banner
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {currentBanners.map((banner) => (
                <div
                  key={banner._id}
                  className="bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden hover:shadow-lg hover:scale-105 transition-all duration-300 group"
                >
                  <div className="relative h-40 bg-gray-100 overflow-hidden">
                    <img
                      src={banner.imageUrl}
                      alt="Banner"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        console.error('Image failed to load:', banner.imageUrl);
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                      onLoad={(e) => {
                        console.log('Image loaded successfully:', banner.imageUrl);
                        e.target.nextSibling.style.display = 'none';
                      }}
                    />
                    {/* Fallback for broken images */}
                    <div 
                      className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400"
                      style={{ display: 'none' }}
                    >
                      <div className="text-center">
                        <ImageIcon size={32} className="mx-auto mb-2" />
                        <p className="text-sm">Image not available</p>
                      </div>
                    </div>
                    <div className="absolute top-3 left-3 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium">
                      {banner.size || '1200×600'}
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300"></div>
                  </div>

                  <div className="p-4">
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                        <Info size={12} />
                        Banner ID
                      </p>
                      <p className="text-sm font-mono text-gray-700 truncate bg-gray-50 p-2 rounded border border-gray-200">
                        {banner._id}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {formatDate(banner.createdAt)}
                      </span>
                    </div>

                    <div className="flex justify-center items-center">
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setSelectedBanner(banner);
                            setIsViewModalOpen(true);
                          }}
                          className="p-2 text-gray-600 hover:bg-green-50 hover:text-green-600 rounded-lg transition-all duration-200"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>

                        <button
                          onClick={() => {
                            setSelectedBanner(banner);
                            setIsEditModalOpen(true);
                          }}
                          className="p-2 text-gray-600 hover:bg-orange-50 hover:text-orange-600 rounded-lg transition-all duration-200"
                          title="Edit Banner"
                        >
                          <Edit size={16} />
                        </button>

                        <button
                          onClick={() => {
                            setSelectedBanner(banner);
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all duration-200"
                          title="Delete Banner"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {!loading && filteredBanners.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6 mt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-600">
                Showing {indexOfFirstBanner + 1} to{" "}
                {Math.min(indexOfLastBanner, filteredBanners.length)} of{" "}
                {filteredBanners.length} banners
              </div>
              <div className="flex space-x-2">
                <button
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    return (
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(page - currentPage) <= 1
                    );
                  })
                  .map((page, index, array) => {
                    const showEllipsisBefore =
                      index > 0 && array[index - 1] !== page - 1;
                    const showEllipsisAfter =
                      index < array.length - 1 && array[index + 1] !== page + 1;

                    return (
                      <React.Fragment key={page}>
                        {showEllipsisBefore && (
                          <span className="px-3 py-2 text-gray-400">...</span>
                        )}
                        <button
                          className={`px-4 py-2 rounded-lg transition-all ${
                            currentPage === page
                              ? "bg-orange-500 text-white shadow-lg"
                              : "border border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                          }`}
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </button>
                        {showEllipsisAfter && (
                          <span className="px-3 py-2 text-gray-400">...</span>
                        )}
                      </React.Fragment>
                    );
                  })}
                <button
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <UploadBannerModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleUploadBanners}
        isUploading={isUploading}
      />

      <EditBannerModal
        banner={selectedBanner}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedBanner(null);
        }}
        onUpdate={handleUpdateBanner}
        isUpdating={isUpdating}
      />

      <ViewBannerModal
        banner={selectedBanner}
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedBanner(null);
        }}
      />

      <DeleteConfirmationModal
        banner={selectedBanner}
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedBanner(null);
        }}
        onDelete={handleDeleteBanner}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default ManageBanner;